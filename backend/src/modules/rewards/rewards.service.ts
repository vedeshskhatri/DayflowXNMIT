import prisma from '../../lib/prisma';
import { emitToCompany } from '../../sockets';

// ─── Default Rewards Catalogue ─────────────────────────────────────────────

const DEFAULT_REWARDS = [
  { name: 'Coffee & Snack Voucher', description: 'A free coffee and snack at the office cafeteria', emoji: '☕', pointCost: 200, category: 'Physical', stockCount: -1 },
  { name: 'WFH Half-Day Pass', description: 'Work from home for half a day — your choice of AM or PM', emoji: '🏠', pointCost: 500, category: 'Digital', stockCount: -1 },
  { name: 'Company Merch Bundle', description: 'Exclusive Dayflow t-shirt, mug, and sticker pack', emoji: '🛍️', pointCost: 1000, category: 'Physical', stockCount: 50 },
  { name: 'Extra Casual Leave Day', description: 'One bonus casual leave day added to your balance', emoji: '🌴', pointCost: 2000, category: 'Leave', stockCount: -1 },
  { name: 'Movie Ticket (2 persons)', description: 'Two movie tickets at any PVR/INOX theatre', emoji: '🎬', pointCost: 800, category: 'Physical', stockCount: 20 },
  { name: 'Lunch with CEO', description: 'Exclusive lunch with the company CEO or leadership team', emoji: '👑', pointCost: 5000, category: 'Digital', stockCount: 4 },
];

const DEFAULT_BADGES = [
  { key: 'early_bird', label: 'Early Bird', emoji: '🌅', description: 'Checked in before 9 AM 5 times' },
  { key: 'streak_7', label: '7-Day Warrior', emoji: '🔥', description: '7 consecutive days of attendance' },
  { key: 'streak_30', label: 'Month Champion', emoji: '⚡', description: '30 consecutive days of attendance' },
  { key: 'streak_90', label: 'Iron Employee', emoji: '🦁', description: '90 consecutive days of attendance' },
  { key: 'profile_complete', label: 'All In', emoji: '✅', description: 'Profile 100% completed' },
  { key: 'first_redeem', label: 'Big Spender', emoji: '💸', description: 'First reward redeemed' },
  { key: 'easter_egg', label: 'Dayflow Legend', emoji: '🥚', description: 'Found the hidden easter egg' },
  { key: 'top_earner', label: 'Point Royalty', emoji: '💎', description: 'Reached 2000+ total points' },
];

const STREAK_MILESTONES: { days: number; reason: string; points: number; badge?: string }[] = [
  { days: 7,  reason: 'STREAK_7',  points: 50,  badge: 'streak_7' },
  { days: 30, reason: 'STREAK_30', points: 200, badge: 'streak_30' },
  { days: 90, reason: 'STREAK_90', points: 500, badge: 'streak_90' },
];

// ─── Seed helpers ───────────────────────────────────────────────────────────

export async function seedDefaultData() {
  // Seed badges (idempotent)
  for (const b of DEFAULT_BADGES) {
    await prisma.badge.upsert({ where: { key: b.key }, update: {}, create: b });
  }

  // Seed rewards (idempotent)
  for (const r of DEFAULT_REWARDS) {
    await prisma.reward.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
}


// ─── Get or create EmployeePoints record ────────────────────────────────────

async function getOrCreatePoints(employeeId: string) {
  return prisma.employeePoints.upsert({
    where: { employeeId },
    update: {},
    create: { employeeId },
    include: { badges: true },
  });
}

// ─── Award Points ────────────────────────────────────────────────────────────

export async function awardPoints(
  employeeId: string,
  companyId: string,
  reason: string,
  amount?: number,
  description?: string
) {
  const AMOUNTS: Record<string, number> = {
    DAILY_CHECKIN: 10,
    EARLY_CHECKIN: 5,
    FULL_DAY_WORK: 10,
    STREAK_7: 50,
    STREAK_30: 200,
    STREAK_90: 500,
    PROFILE_COMPLETE: 100,
    EARLY_LEAVE_REQUEST: 15,
    ADMIN_AWARD: amount ?? 50,
    ADMIN_DEDUCT: -(amount ?? 10),
    EASTER_EGG: 50,
  };

  const pts = AMOUNTS[reason] ?? (amount ?? 10);
  const rec = await getOrCreatePoints(employeeId);

  const newTotal = Math.max(0, rec.total + pts);

  await prisma.$transaction([
    prisma.pointTransaction.create({
      data: {
        pointsId: rec.id,
        reason: reason as any,
        amount: pts,
        description: description ?? null,
      },
    }),
    prisma.employeePoints.update({
      where: { id: rec.id },
      data: { total: newTotal },
    }),
  ]);

  // Check top earner badge (2000+ pts)
  if (newTotal >= 2000 && !rec.badges.some((b) => b.badgeKey === 'top_earner')) {
    await unlockBadge(rec.id, 'top_earner', employeeId, companyId);
  }

  // Emit to company room
  emitToCompany(companyId, 'gamification:points', {
    employeeId,
    reason,
    amount: pts,
    total: newTotal,
  });

  return { total: newTotal, earned: pts };
}

// ─── Badge unlock ────────────────────────────────────────────────────────────

async function unlockBadge(pointsId: string, badgeKey: string, employeeId: string, companyId: string) {
  try {
    await prisma.employeeBadge.create({
      data: { pointsId, badgeKey },
    });
    const badge = await prisma.badge.findUnique({ where: { key: badgeKey } });
    emitToCompany(companyId, 'gamification:badge', { employeeId, badge });
  } catch {
    // already has badge — ignore unique constraint
  }
}

// ─── Streak Recalculation ─────────────────────────────────────────────────────

export async function recalcStreak(employeeId: string, companyId: string) {
  const rec = await getOrCreatePoints(employeeId);

  // Count consecutive working days backwards from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Walk back up to 120 days
  for (let i = 0; i < 120; i++) {
    const dayOfWeek = checkDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend — skip but don't break streak
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check approved leave (doesn't break streak)
    const approvedLeave = await prisma.timeOffRequest.findFirst({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: dayEnd },
        endDate: { gte: checkDate },
      },
    });

    if (approvedLeave) {
      // Approved leave day — counts as streaked day
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    // Check actual attendance
    const att = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: checkDate, lte: dayEnd },
        checkIn: { not: null },
      },
    });

    if (att) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const prevStreak = rec.streak;
  const newMax = Math.max(rec.maxStreak, streak);

  await prisma.employeePoints.update({
    where: { id: rec.id },
    data: {
      streak,
      maxStreak: newMax,
      lastCheckInDate: today,
    },
  });

  // Check streak milestones
  for (const milestone of STREAK_MILESTONES) {
    const crossedNow = streak >= milestone.days;
    const crossedBefore = prevStreak >= milestone.days;

    if (crossedNow && !crossedBefore) {
      // Just hit the milestone — award points + badge
      await awardPoints(employeeId, companyId, milestone.reason);

      if (milestone.badge) {
        const updatedRec = await getOrCreatePoints(employeeId);
        await unlockBadge(updatedRec.id, milestone.badge, employeeId, companyId);
      }

      emitToCompany(companyId, 'gamification:streak', {
        employeeId,
        streak,
        milestone: milestone.days,
      });
    }
  }

  return { streak, maxStreak: newMax };
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(companyId: string, limit = 20) {
  await seedDefaultData();

  const employees = await prisma.employee.findMany({
    where: { companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      profilePicUrl: true,
      gamificationPoints: {
        include: {
          badges: { include: { badge: true } },
        },
      },
    },
  });

  const withPoints = employees
    .map((e) => ({
      employeeId: e.id,
      name: `${e.firstName} ${e.lastName}`,
      jobTitle: e.jobTitle ?? null,
      profilePicUrl: e.profilePicUrl ?? null,
      total: e.gamificationPoints?.total ?? 0,
      streak: e.gamificationPoints?.streak ?? 0,
      maxStreak: e.gamificationPoints?.maxStreak ?? 0,
      badges: (e.gamificationPoints?.badges ?? []).map((b) => ({
        key: b.badgeKey,
        label: b.badge.label,
        emoji: b.badge.emoji,
        earnedAt: b.earnedAt,
      })),
    }))
    .sort((a, b) => b.total - a.total || b.streak - a.streak)
    .slice(0, limit)
    .map((e, idx) => ({ ...e, rank: idx + 1 }));

  return withPoints;
}

// ─── My Stats ────────────────────────────────────────────────────────────────

export async function getMyStats(employeeId: string) {
  await seedDefaultData();

  const rec = await prisma.employeePoints.findUnique({
    where: { employeeId },
    include: {
      badges: { include: { badge: true } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      redemptions: {
        include: { reward: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!rec) {
    return {
      total: 0,
      streak: 0,
      maxStreak: 0,
      easterEggUsed: false,
      badges: [],
      recentTransactions: [],
      redemptions: [],
    };
  }

  return {
    total: rec.total,
    streak: rec.streak,
    maxStreak: rec.maxStreak,
    easterEggUsed: rec.easterEggUsed,
    badges: rec.badges.map((b) => ({
      key: b.badgeKey,
      label: b.badge.label,
      emoji: b.badge.emoji,
      description: b.badge.description,
      earnedAt: b.earnedAt,
    })),
    recentTransactions: rec.transactions.map((t) => ({
      reason: t.reason,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt,
    })),
    redemptions: rec.redemptions.map((r) => ({
      id: r.id,
      reward: { name: r.reward.name, emoji: r.reward.emoji },
      pointCost: r.pointCost,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

// ─── Reward Catalogue ────────────────────────────────────────────────────────

export async function getRewardCatalogue() {
  await seedDefaultData();
  return prisma.reward.findMany({
    where: { isActive: true },
    orderBy: { pointCost: 'asc' },
  });
}

// ─── Redeem Reward ───────────────────────────────────────────────────────────

export async function redeemReward(employeeId: string, companyId: string, rewardId: string) {
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.isActive) throw Object.assign(new Error('Reward not found or inactive'), { statusCode: 404 });

  if (reward.stockCount === 0) throw Object.assign(new Error('This reward is out of stock'), { statusCode: 409 });

  const rec = await getOrCreatePoints(employeeId);

  if (rec.total < reward.pointCost) {
    throw Object.assign(
      new Error(`Insufficient points. You have ${rec.total} pts, need ${reward.pointCost} pts`),
      { statusCode: 400 }
    );
  }

  const AUTO_APPROVE_THRESHOLD = 500;
  const status = reward.pointCost <= AUTO_APPROVE_THRESHOLD ? 'APPROVED' : 'PENDING_HR';

  const [, , redemption] = await prisma.$transaction([
    prisma.employeePoints.update({
      where: { id: rec.id },
      data: { total: { decrement: reward.pointCost } },
    }),
    prisma.pointTransaction.create({
      data: {
        pointsId: rec.id,
        reason: 'ADMIN_DEDUCT',
        amount: -reward.pointCost,
        description: `Redeemed: ${reward.name}`,
      },
    }),
    prisma.rewardRedemption.create({
      data: {
        pointsId: rec.id,
        rewardId,
        pointCost: reward.pointCost,
        status: status as any,
      },
    }),
    // Decrement stock if limited
    ...(reward.stockCount > 0
      ? [prisma.reward.update({ where: { id: rewardId }, data: { stockCount: { decrement: 1 } } })]
      : []),
  ]);

  // First redemption badge
  const redemptionCount = await prisma.rewardRedemption.count({ where: { pointsId: rec.id } });
  if (redemptionCount === 1) {
    await unlockBadge(rec.id, 'first_redeem', employeeId, companyId);
  }

  if (status === 'APPROVED') {
    emitToCompany(companyId, 'gamification:redeemed', {
      employeeId,
      rewardName: reward.name,
      rewardEmoji: reward.emoji,
    });
  }

  return { redemption, status };
}

// ─── Easter Egg ───────────────────────────────────────────────────────────────

export async function triggerEasterEgg(employeeId: string, companyId: string) {
  const rec = await getOrCreatePoints(employeeId);

  if (rec.easterEggUsed) {
    return { alreadyFound: true, message: "🥚 You're already a Dayflow Legend!" };
  }

  await prisma.employeePoints.update({
    where: { id: rec.id },
    data: { easterEggUsed: true },
  });

  const result = await awardPoints(employeeId, companyId, 'EASTER_EGG', 50, 'Found the Easter Egg!');
  await unlockBadge(rec.id, 'easter_egg', employeeId, companyId);

  emitToCompany(companyId, 'gamification:easter_egg', { employeeId });

  return { alreadyFound: false, earned: result.earned, total: result.total };
}

// ─── HR: List Pending Redemptions ────────────────────────────────────────────

export async function listPendingRedemptions(companyId: string) {
  return prisma.rewardRedemption.findMany({
    where: {
      status: 'PENDING_HR',
      points: { employee: { companyId } },
    },
    include: {
      reward: true,
      points: {
        include: {
          employee: { select: { firstName: true, lastName: true, jobTitle: true, profilePicUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── HR: Review Redemption ────────────────────────────────────────────────────

export async function reviewRedemption(
  redemptionId: string,
  reviewerId: string,
  action: 'approve' | 'reject',
  notes?: string
) {
  const redemption = await prisma.rewardRedemption.findUnique({
    where: { id: redemptionId },
    include: { points: true, reward: true },
  });

  if (!redemption) throw Object.assign(new Error('Redemption not found'), { statusCode: 404 });
  if (redemption.status !== 'PENDING_HR') throw Object.assign(new Error('Redemption already reviewed'), { statusCode: 400 });

  if (action === 'reject') {
    // Refund the points
    await prisma.$transaction([
      prisma.rewardRedemption.update({
        where: { id: redemptionId },
        data: { status: 'REJECTED', reviewedById: reviewerId, reviewNotes: notes ?? null, reviewedAt: new Date() },
      }),
      prisma.employeePoints.update({
        where: { id: redemption.pointsId },
        data: { total: { increment: redemption.pointCost } },
      }),
      prisma.pointTransaction.create({
        data: {
          pointsId: redemption.pointsId,
          reason: 'ADMIN_AWARD',
          amount: redemption.pointCost,
          description: `Refund: rejected redemption of ${redemption.reward.name}`,
        },
      }),
    ]);
  } else {
    await prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status: 'APPROVED', reviewedById: reviewerId, reviewNotes: notes ?? null, reviewedAt: new Date() },
    });
  }

  return { action, redemptionId };
}

// ─── Admin: Award Points ──────────────────────────────────────────────────────

export async function adminAwardPoints(
  targetEmployeeId: string,
  companyId: string,
  amount: number,
  reason: string
) {
  return awardPoints(targetEmployeeId, companyId, 'ADMIN_AWARD', amount, reason);
}
