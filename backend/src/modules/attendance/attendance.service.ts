import prisma from '../../lib/prisma';
import { emitToCompany } from '../../sockets';
import { awardPoints, recalcStreak } from '../rewards/rewards.service';

function getTodayDateRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseDateRange(fromStr?: string, toStr?: string) {
  if (fromStr && toStr) {
    const fromDate = new Date(`${fromStr}T00:00:00`);
    const toDate = new Date(`${toStr}T23:59:59.999`);
    return { fromDate, toDate };
  }

  // Default to current week (Monday to Sunday)
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday ...
  const diffToMon = day === 0 ? -6 : 1 - day;

  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() + diffToMon);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(fromDate);
  toDate.setDate(fromDate.getDate() + 6);
  toDate.setHours(23, 59, 59, 999);

  return { fromDate, toDate };
}

function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function getTodayAttendance(employeeId: string) {
  const { start, end } = getTodayDateRange();

  const record = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return record;
}

export async function getOwnAttendance(employeeId: string, fromStr?: string, toStr?: string) {
  const { fromDate, toDate } = parseDateRange(fromStr, toStr);

  const [records, approvedTimeOffs] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.timeOffRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: toDate },
        endDate: { gte: fromDate },
      },
    }),
  ]);

  const daysPresent = records.filter((r) => r.checkIn !== null).length;
  const leavesTaken = approvedTimeOffs.reduce((acc, req) => acc + (req.daysCount || 1), 0);
  const totalWorkingDays = countWorkingDays(fromDate, toDate);

  const formattedRecords = records.map((r) => ({
    date: r.date.toISOString().split('T')[0],
    checkIn: r.checkIn ? r.checkIn.toISOString() : null,
    checkOut: r.checkOut ? r.checkOut.toISOString() : null,
    workHours: r.workHours,
    extraHours: r.extraHours,
  }));

  return {
    records: formattedRecords,
    summary: {
      daysPresent,
      leavesTaken,
      totalWorkingDays,
    },
  };
}

export async function getAllAttendance(companyId: string, dateStr?: string, search?: string) {
  let targetStart: Date;
  let targetEnd: Date;

  if (dateStr) {
    targetStart = new Date(`${dateStr}T00:00:00`);
    targetEnd = new Date(`${dateStr}T23:59:59.999`);
  } else {
    const today = getTodayDateRange();
    targetStart = today.start;
    targetEnd = today.end;
  }

  const searchTrim = search?.trim();

  const [employees, attendances] = await Promise.all([
    prisma.employee.findMany({
      where: {
        companyId,
        ...(searchTrim
          ? {
              OR: [
                { firstName: { contains: searchTrim, mode: 'insensitive' } },
                { lastName: { contains: searchTrim, mode: 'insensitive' } },
                { email: { contains: searchTrim, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePicUrl: true,
        jobTitle: true,
        department: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.attendance.findMany({
      where: {
        employee: { companyId },
        date: {
          gte: targetStart,
          lte: targetEnd,
        },
      },
    }),
  ]);

  return employees.map((emp) => {
    const att = attendances.find((a) => a.employeeId === emp.id);
    return {
      employee: emp,
      checkIn: att?.checkIn ? att.checkIn.toISOString() : null,
      checkOut: att?.checkOut ? att.checkOut.toISOString() : null,
      workHours: att?.workHours ?? null,
      extraHours: att?.extraHours ?? null,
    };
  });
}

export async function checkIn(employeeId: string, companyId: string) {
  const { start, end } = getTodayDateRange();

  const existing = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  // Reject if today's row already has a checkIn without a checkOut
  if (existing && existing.checkIn && !existing.checkOut) {
    const error: any = new Error('You are already checked in. Please check out before checking in again.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  let attendanceRecord;
  if (existing) {
    attendanceRecord = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkIn: now,
        checkOut: null,
        workHours: null,
        extraHours: null,
      },
    });
  } else {
    attendanceRecord = await prisma.attendance.create({
      data: {
        employeeId,
        date: start,
        checkIn: now,
      },
    });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true },
  });

  const empName = employee ? `${employee.firstName} ${employee.lastName}` : 'Employee';

  // Emit socket events to company room
  emitToCompany(companyId, 'attendance:checkin', {
    employeeId,
    name: empName,
    checkInTime: now.toISOString(),
    checkIn: now.toISOString(),
  });

  emitToCompany(companyId, 'presence:update', {
    employeeId,
    status: 'PRESENT',
    name: empName,
  });

  // Gamification: award points and recalc streak (fire-and-forget, never fail the checkin)
  setImmediate(async () => {
    try {
      await awardPoints(employeeId, companyId, 'DAILY_CHECKIN');
      if (now.getHours() < 9) {
        await awardPoints(employeeId, companyId, 'EARLY_CHECKIN', 5, 'Early bird check-in before 9 AM');
      }
      await recalcStreak(employeeId, companyId);
    } catch (e) {
      console.error('[gamification] checkIn award error:', e);
    }
  });

  return attendanceRecord;
}

export async function checkOut(employeeId: string, companyId: string) {
  const { start, end } = getTodayDateRange();

  const existing = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  // Reject if there is no checkIn today or checkOut is already set
  if (!existing || !existing.checkIn) {
    const error: any = new Error('Cannot check out without a prior check-in today.');
    error.statusCode = 400;
    throw error;
  }

  if (existing.checkOut) {
    const error: any = new Error('You have already checked out for today.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const checkInTime = new Date(existing.checkIn);

  if (now.getTime() < checkInTime.getTime()) {
    const error: any = new Error('Check-out time must be after check-in time.');
    error.statusCode = 400;
    throw error;
  }

  const diffHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
  const workHours = Number(diffHours.toFixed(2));
  const standardHours = 8.0;
  const extraHours = Math.max(0, Number((workHours - standardHours).toFixed(2)));

  const attendanceRecord = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      workHours,
      extraHours,
    },
  });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true },
  });

  const empName = employee ? `${employee.firstName} ${employee.lastName}` : 'Employee';

  // Emit socket event to company room
  emitToCompany(companyId, 'attendance:checkout', {
    employeeId,
    name: empName,
    checkOutTime: now.toISOString(),
    checkOut: now.toISOString(),
    workHours,
    extraHours,
  });

  // Gamification: award full-day bonus if worked ≥ 8h (fire-and-forget)
  if (workHours >= 8) {
    setImmediate(async () => {
      try {
        await awardPoints(employeeId, companyId, 'FULL_DAY_WORK', 10, `Completed a full ${workHours}h day`);
      } catch (e) {
        console.error('[gamification] checkOut award error:', e);
      }
    });
  }

  return attendanceRecord;
}
