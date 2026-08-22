/**
 * Comprehensive Seed script for Dayflow HRMS
 * 
 * Creates:
 *  - 1 Company (code: "DX")
 *  - 1 Admin employee (Admin Mishra: DXADMI20260001 / Admin@123)
 *  - 9 Realistic Employees with avatars, bios, skills, certifications, and presence statuses
 *  - TimeOffTypes + full allocations + approved & pending leave requests
 *  - Past 30 days attendance history + today's check-ins
 *  - Gamification Points, Streaks, Badges, and Point Transactions for everyone
 *  - Salary structures with detailed percentage and fixed components
 */

import { CompositionType, PrismaClient, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

const DEFAULT_REWARDS = [
  { name: 'Coffee & Snack Voucher', description: 'A free coffee and snack at the office cafeteria', emoji: '☕', pointCost: 200, category: 'Physical', stockCount: -1 },
  { name: 'WFH Half-Day Pass', description: 'Work from home for half a day — your choice of AM or PM', emoji: '🏠', pointCost: 500, category: 'Digital', stockCount: -1 },
  { name: 'Movie Ticket (2 persons)', description: 'Two movie tickets at any PVR/INOX theatre', emoji: '🎬', pointCost: 800, category: 'Physical', stockCount: 20 },
  { name: 'Company Merch Bundle', description: 'Exclusive Dayflow t-shirt, mug, and sticker pack', emoji: '🛍️', pointCost: 1000, category: 'Physical', stockCount: 50 },
  { name: 'Extra Casual Leave Day', description: 'One bonus casual leave day added to your balance', emoji: '🌴', pointCost: 2000, category: 'Leave', stockCount: -1 },
  { name: 'Lunch with CEO', description: 'Exclusive lunch with the company CEO or leadership team', emoji: '👑', pointCost: 5000, category: 'Digital', stockCount: 4 },
];

async function main() {
  console.log('🌱 Starting comprehensive database seed for Dayflow HRMS...');

  // ── 1. Company ─────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { code: 'DX' },
    update: {},
    create: {
      name: 'Dayflow Technologies',
      code: 'DX',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
  });
  console.log(`✅ Company: ${company.name} (${company.code})`);

  // ── 2. Badges & Rewards ────────────────────────────────────────────────────
  for (const b of DEFAULT_BADGES) {
    await prisma.badge.upsert({ where: { key: b.key }, update: {}, create: b });
  }
  for (const r of DEFAULT_REWARDS) {
    await prisma.reward.upsert({ where: { name: r.name }, update: {}, create: r });
  }
  console.log('✅ Badges & Rewards catalogues seeded');

  // ── 3. Passwords & Dates ───────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const empHash = await bcrypt.hash('Dayflow@123', 10);

  const year = 2026;
  const validFrom = new Date(`${year}-01-01`);
  const validTo = new Date(`${year}-12-31`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── 4. Admin Account ───────────────────────────────────────────────────────
  const admin = await prisma.employee.upsert({
    where: { loginId: 'DXADMI20260001' },
    update: {
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'VP of People & Culture. Dedicated to building vibrant, productive, and inclusive workplaces.',
      jobLove: 'Empowering team members to do their best work while creating joyful daily workplace experiences.',
      interests: 'Organizational Psychology, Leadership, Trail Running, Chess',
      address: '42 Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
      personalEmail: 'admin.mishra.personal@gmail.com',
      gender: 'Female',
      maritalStatus: 'Married',
      dateOfBirth: new Date('1990-05-14'),
    },
    create: {
      loginId: 'DXADMI20260001',
      companyId: company.id,
      firstName: 'Admin',
      lastName: 'Mishra',
      email: 'admin@dayflow.dev',
      personalEmail: 'admin.mishra.personal@gmail.com',
      phone: '9876543210',
      passwordHash: adminHash,
      mustResetPwd: false,
      role: 'ADMIN',
      jobTitle: 'VP of People & Culture',
      department: 'Human Resources',
      dateOfJoining: new Date(`${year}-01-10`),
      joiningSerial: 1,
      status: 'PRESENT',
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'VP of People & Culture with 10+ years of HR leadership experience. Dedicated to building vibrant, productive, and inclusive workplaces.',
      jobLove: 'Empowering team members to do their best work while creating joyful daily workplace experiences.',
      interests: 'Organizational Psychology, Leadership, Trail Running, Chess',
      address: '42 Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
      gender: 'Female',
      maritalStatus: 'Married',
      dateOfBirth: new Date('1990-05-14'),
    },
  });

  // Admin Skills & Certifications
  await prisma.skill.deleteMany({ where: { employeeId: admin.id } });
  await prisma.skill.createMany({
    data: [
      { employeeId: admin.id, name: 'HR Strategy' },
      { employeeId: admin.id, name: 'Talent Management' },
      { employeeId: admin.id, name: 'Organizational Development' },
      { employeeId: admin.id, name: 'Performance Management' },
      { employeeId: admin.id, name: 'Leadership Coaching' },
    ],
  });

  await prisma.certification.deleteMany({ where: { employeeId: admin.id } });
  await prisma.certification.createMany({
    data: [
      { employeeId: admin.id, name: 'SHRM Senior Certified Professional (SHRM-SCP)' },
      { employeeId: admin.id, name: 'Senior Professional in Human Resources (SPHR)' },
      { employeeId: admin.id, name: 'ICF Certified Leadership Coach' },
    ],
  });

  // ── 5. Detailed Employees Mock List ─────────────────────────────────────────
  const mockEmployeesData = [
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@dayflow.dev',
      personalEmail: 'priya.sharma95@gmail.com',
      phone: '9876543202',
      jobTitle: 'Principal Frontend Architect',
      department: 'Engineering',
      status: 'PRESENT' as const,
      serial: 2,
      doj: new Date(`${year}-01-15`),
      dob: new Date('1994-08-22'),
      gender: 'Female',
      maritalStatus: 'Single',
      address: '108 Palm Meadows, Whitefield, Bengaluru, KA 560066',
      profilePicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      bio: 'React enthusiast & web performance specialist. Building responsive, accessible, and delightful design systems.',
      jobLove: 'Translating complex user workflows into fluid, intuitive, and beautifully animated browser experiences.',
      interests: 'React 19, Micro-frontends, Specialty Coffee, Watercolour Painting',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Web Performance', 'GraphQL'],
      certs: ['Meta Certified Front-End Developer', 'AWS Certified Cloud Practitioner'],
      points: 2150,
      streak: 18,
      maxStreak: 25,
      badges: ['early_bird', 'streak_7', 'profile_complete', 'top_earner'],
    },
    {
      firstName: 'Rahul',
      lastName: 'Nair',
      email: 'rahul.nair@dayflow.dev',
      personalEmail: 'rahul.nair.design@gmail.com',
      phone: '9876543203',
      jobTitle: 'Lead Product Designer',
      department: 'Design',
      status: 'PRESENT' as const,
      serial: 3,
      doj: new Date(`${year}-01-20`),
      dob: new Date('1992-11-03'),
      gender: 'Male',
      maritalStatus: 'Married',
      address: '74 Koramangala 4th Block, Bengaluru, KA 560034',
      profilePicUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Human-centered designer focusing on craft, typography, and micro-interactions.',
      jobLove: 'Turning dry enterprise tools into engaging products that users genuinely look forward to opening every morning.',
      interests: 'Figma Tokens, Design Systems, Typography, Mechanical Keyboards, Cycling',
      skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping', 'Interaction Design'],
      certs: ['Nielsen Norman UX Master Certified', 'Interaction Design Foundation Lead'],
      points: 1780,
      streak: 12,
      maxStreak: 16,
      badges: ['streak_7', 'profile_complete'],
    },
    {
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      email: 'sneha.kulkarni@dayflow.dev',
      personalEmail: 'sneha.kulkarni@outlook.com',
      phone: '9876543204',
      jobTitle: 'Senior Product Manager',
      department: 'Product',
      status: 'ON_LEAVE' as const,
      serial: 4,
      doj: new Date(`${year}-02-01`),
      dob: new Date('1993-04-18'),
      gender: 'Female',
      maritalStatus: 'Married',
      address: '22 HSR Layout Sector 2, Bengaluru, KA 560102',
      profilePicUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      bio: 'Product strategist focused on developer velocity, operational telemetry, and customer feedback loops.',
      jobLove: 'Bridging engineering excellence with real customer outcomes and celebrating sprint milestones.',
      interests: 'Data Analytics, Agile Methodologies, Sci-Fi Novels, Trekking',
      skills: ['Product Strategy', 'Roadmapping', 'Agile/Scrum', 'Data Analytics', 'User Story Mapping'],
      certs: ['Certified Scrum Product Owner (CSPO)', 'Pragmatic Institute Certified'],
      points: 1420,
      streak: 15,
      maxStreak: 21,
      badges: ['streak_7', 'profile_complete'],
    },
    {
      firstName: 'Arjun',
      lastName: 'Mehta',
      email: 'arjun.mehta@dayflow.dev',
      personalEmail: 'arjun.mehta.code@gmail.com',
      phone: '9876543205',
      jobTitle: 'Staff Backend Engineer',
      department: 'Engineering',
      status: 'PRESENT' as const,
      serial: 5,
      doj: new Date(`${year}-02-15`),
      dob: new Date('1991-09-29'),
      gender: 'Male',
      maritalStatus: 'Single',
      address: '51 Lavelle Road, Shanthala Nagar, Bengaluru, KA 560001',
      profilePicUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'Distributed systems engineer. Obsessed with low latency, database query plans, and concurrency.',
      jobLove: 'Solving thorny architectural bottlenecks and seeing sub-10ms API responses under heavy load.',
      interests: 'PostgreSQL Internals, Rust, Kafka, Marathon Running, Chess',
      skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Redis', 'Docker', 'System Design'],
      certs: ['AWS Certified Solutions Architect - Professional', 'PostgreSQL Certified DBA'],
      points: 2450,
      streak: 22,
      maxStreak: 30,
      badges: ['early_bird', 'streak_7', 'streak_30', 'profile_complete', 'top_earner'],
    },
    {
      firstName: 'Divya',
      lastName: 'Reddy',
      email: 'divya.reddy@dayflow.dev',
      personalEmail: 'divya.reddy.qa@gmail.com',
      phone: '9876543206',
      jobTitle: 'Quality Assurance Lead',
      department: 'Quality Assurance',
      status: 'ABSENT' as const,
      serial: 6,
      doj: new Date(`${year}-03-01`),
      dob: new Date('1996-01-12'),
      gender: 'Female',
      maritalStatus: 'Single',
      address: '33 Sarjapur Road, Bellandur, Bengaluru, KA 560103',
      profilePicUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      bio: 'Test automation advocate ensuring bulletproof reliability across web and mobile services.',
      jobLove: 'Catching subtle edge cases and ensuring our customers always get a seamless experience.',
      interests: 'Playwright, End-to-End Testing, CI/CD, Badminton, Astronomy',
      skills: ['Playwright', 'Vitest', 'Jest', 'CI/CD Automation', 'API Testing', 'Performance Testing'],
      certs: ['ISTQB Advanced Level Test Automation Engineer', 'Certified Agile Tester'],
      points: 890,
      streak: 4,
      maxStreak: 11,
      badges: ['streak_7', 'profile_complete'],
    },
    {
      firstName: 'Kiran',
      lastName: 'Joshi',
      email: 'kiran.joshi@dayflow.dev',
      personalEmail: 'kiran.joshi.infra@gmail.com',
      phone: '9876543207',
      jobTitle: 'DevOps & SRE Specialist',
      department: 'Engineering',
      status: 'PRESENT' as const,
      serial: 7,
      doj: new Date(`${year}-03-10`),
      dob: new Date('1993-07-05'),
      gender: 'Male',
      maritalStatus: 'Single',
      address: '15 Bannerghatta Main Road, Bengaluru, KA 560076',
      profilePicUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      bio: 'Cloud infrastructure architect & Kubernetes whisperer. Making deployments boring, fast, and secure.',
      jobLove: 'Zero-downtime rolling updates and automated recovery pipelines that just work.',
      interests: 'Kubernetes, Terraform, Linux Kernels, Open Source, Rock Climbing',
      skills: ['Kubernetes', 'Docker', 'Terraform', 'Prometheus', 'Grafana', 'Linux', 'AWS'],
      certs: ['Certified Kubernetes Administrator (CKA)', 'HashiCorp Certified Terraform Associate'],
      points: 1650,
      streak: 14,
      maxStreak: 18,
      badges: ['early_bird', 'streak_7', 'profile_complete'],
    },
    {
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      email: 'ananya.deshmukh@dayflow.dev',
      personalEmail: 'ananya.d@gmail.com',
      phone: '9876543208',
      jobTitle: 'Talent Acquisition Partner',
      department: 'Human Resources',
      status: 'PRESENT' as const,
      serial: 8,
      doj: new Date(`${year}-03-15`),
      dob: new Date('1995-12-19'),
      gender: 'Female',
      maritalStatus: 'Single',
      address: '88 Domlur Layout, Bengaluru, KA 560071',
      profilePicUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      bio: 'Connecting brilliant minds with transformative tech challenges and shaping company culture.',
      jobLove: 'Witnessing candidate growth from the very first outreach email all the way to team leadership.',
      interests: 'Employer Branding, Community Building, Coffee Cupping, Podcast Production',
      skills: ['Talent Sourcing', 'Interviewing', 'Employer Branding', 'Candidate Experience', 'HR Analytics'],
      certs: ['SHRM Certified Professional (SHRM-CP)', 'LinkedIn Certified Recruiter'],
      points: 1250,
      streak: 9,
      maxStreak: 14,
      badges: ['streak_7', 'profile_complete'],
    },
    {
      firstName: 'Vikram',
      lastName: 'Singhania',
      email: 'vikram.singhania@dayflow.dev',
      personalEmail: 'vikram.singhania@gmail.com',
      phone: '9876543209',
      jobTitle: 'Growth & Business Lead',
      department: 'Business Operations',
      status: 'PRESENT' as const,
      serial: 9,
      doj: new Date(`${year}-03-20`),
      dob: new Date('1990-03-25'),
      gender: 'Male',
      maritalStatus: 'Married',
      address: '12 Benson Town, Bengaluru, KA 560046',
      profilePicUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      bio: 'Scaling high-growth SaaS initiatives, partnerships, and revenue operations.',
      jobLove: 'Building sustainable customer relationships and unlocking new market opportunities.',
      interests: 'SaaS Metrics, B2B Enterprise Growth, Squash, Angel Investing',
      skills: ['Revenue Operations', 'SaaS Growth', 'B2B Sales', 'Partnerships', 'Financial Modeling'],
      certs: ['Reforge Growth Series', 'HubSpot Inbound Certified'],
      points: 1980,
      streak: 16,
      maxStreak: 20,
      badges: ['early_bird', 'streak_7', 'profile_complete'],
    },
  ];

  const employees = [];
  for (const emp of mockEmployeesData) {
    const fn2 = emp.firstName.slice(0, 2).toUpperCase();
    const ln2 = emp.lastName.slice(0, 2).toUpperCase();
    const loginId = `DX${fn2}${ln2}${year}${String(emp.serial).padStart(4, '0')}`;

    const created = await prisma.employee.upsert({
      where: { loginId },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        personalEmail: emp.personalEmail,
        phone: emp.phone,
        jobTitle: emp.jobTitle,
        department: emp.department,
        status: emp.status,
        profilePicUrl: emp.profilePicUrl,
        bio: emp.bio,
        jobLove: emp.jobLove,
        interests: emp.interests,
        address: emp.address,
        gender: emp.gender,
        maritalStatus: emp.maritalStatus,
        dateOfBirth: emp.dob,
        dateOfJoining: emp.doj,
      },
      create: {
        loginId,
        companyId: company.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        personalEmail: emp.personalEmail,
        phone: emp.phone,
        passwordHash: empHash,
        mustResetPwd: false,
        role: 'EMPLOYEE',
        jobTitle: emp.jobTitle,
        department: emp.department,
        dateOfJoining: emp.doj,
        joiningSerial: emp.serial,
        status: emp.status,
        profilePicUrl: emp.profilePicUrl,
        bio: emp.bio,
        jobLove: emp.jobLove,
        interests: emp.interests,
        address: emp.address,
        gender: emp.gender,
        maritalStatus: emp.maritalStatus,
        dateOfBirth: emp.dob,
      },
    });

    // ── Skills & Certifications ──
    await prisma.skill.deleteMany({ where: { employeeId: created.id } });
    await prisma.skill.createMany({
      data: emp.skills.map((name) => ({ employeeId: created.id, name })),
    });

    await prisma.certification.deleteMany({ where: { employeeId: created.id } });
    await prisma.certification.createMany({
      data: emp.certs.map((name) => ({ employeeId: created.id, name })),
    });

    // ── Gamification Points, Streaks & Badges ──
    const pts = await prisma.employeePoints.upsert({
      where: { employeeId: created.id },
      update: {
        total: emp.points,
        streak: emp.streak,
        maxStreak: emp.maxStreak,
        lastCheckInDate: today,
      },
      create: {
        employeeId: created.id,
        total: emp.points,
        streak: emp.streak,
        maxStreak: emp.maxStreak,
        lastCheckInDate: today,
      },
    });

    // Seed Badges for employee
    for (const bKey of emp.badges) {
      await prisma.employeeBadge.upsert({
        where: { pointsId_badgeKey: { pointsId: pts.id, badgeKey: bKey } },
        update: {},
        create: { pointsId: pts.id, badgeKey: bKey },
      });
    }

    // Seed Point Transactions history
    await prisma.pointTransaction.deleteMany({ where: { pointsId: pts.id } });
    await prisma.pointTransaction.createMany({
      data: [
        { pointsId: pts.id, reason: 'PROFILE_COMPLETE', amount: 100, description: 'Completed 100% of employee profile' },
        { pointsId: pts.id, reason: 'STREAK_7', amount: 50, description: 'Unlocked 7-day attendance streak milestone' },
        { pointsId: pts.id, reason: 'DAILY_CHECKIN', amount: 10, description: 'On-time daily attendance check-in' },
        { pointsId: pts.id, reason: 'EARLY_CHECKIN', amount: 5, description: 'Early bird check-in before 9:00 AM' },
        { pointsId: pts.id, reason: 'FULL_DAY_WORK', amount: 10, description: 'Completed full 8-hour workday' },
      ],
    });

    employees.push(created);
    console.log(`✅ Employee seeded: ${loginId} — ${emp.firstName} ${emp.lastName} (${emp.jobTitle})`);
  }

  // Admin Gamification points
  const adminPts = await prisma.employeePoints.upsert({
    where: { employeeId: admin.id },
    update: { total: 10000, streak: 28, maxStreak: 35, lastCheckInDate: today },
    create: { employeeId: admin.id, total: 10000, streak: 28, maxStreak: 35, lastCheckInDate: today },
  });
  for (const bKey of ['early_bird', 'streak_7', 'streak_30', 'profile_complete', 'top_earner']) {
    await prisma.employeeBadge.upsert({
      where: { pointsId_badgeKey: { pointsId: adminPts.id, badgeKey: bKey } },
      update: {},
      create: { pointsId: adminPts.id, badgeKey: bKey },
    });
  }

  // ── 6. Time Off Types & Allocations ─────────────────────────────────────────
  const paidLeave = await prisma.timeOffType.upsert({
    where: { id: 'pto-type-001' },
    update: {},
    create: { id: 'pto-type-001', name: 'Paid Time Off', requiresProof: false },
  });
  const sickLeave = await prisma.timeOffType.upsert({
    where: { id: 'sick-type-001' },
    update: {},
    create: { id: 'sick-type-001', name: 'Sick Leave', requiresProof: true },
  });
  const unpaidLeave = await prisma.timeOffType.upsert({
    where: { id: 'unpaid-type-001' },
    update: {},
    create: { id: 'unpaid-type-001', name: 'Unpaid Leave', requiresProof: false },
  });

  const allPeople = [admin, ...employees];
  for (const person of allPeople) {
    await prisma.timeOffAllocation.createMany({
      skipDuplicates: true,
      data: [
        { employeeId: person.id, typeId: paidLeave.id, daysAllocated: 24, daysUsed: 3, validFrom, validTo },
        { employeeId: person.id, typeId: sickLeave.id, daysAllocated: 12, daysUsed: 1, validFrom, validTo },
        { employeeId: person.id, typeId: unpaidLeave.id, daysAllocated: 5, daysUsed: 0, validFrom, validTo },
      ],
    });
  }
  console.log('✅ Time Off Allocations configured for all employees');

  // ── 7. Leave Requests (Approved & Pending) ───────────────────────────────────
  const sneha = employees.find((e) => e.firstName === 'Sneha')!;
  const snehaStart = new Date(today);
  snehaStart.setDate(today.getDate() - 1);
  const snehaEnd = new Date(today);
  snehaEnd.setDate(today.getDate() + 2);

  await prisma.timeOffRequest.create({
    data: {
      employeeId: sneha.id,
      typeId: paidLeave.id,
      startDate: snehaStart,
      endDate: snehaEnd,
      daysCount: 4,
      remarks: 'Attending annual family gathering and personal vacation.',
      status: RequestStatus.APPROVED,
      reviewedById: admin.id,
      reviewedAt: new Date(today.getTime() - 86400000 * 2),
    },
  });

  const divya = employees.find((e) => e.firstName === 'Divya')!;
  const divyaStart = new Date(today);
  divyaStart.setDate(today.getDate() + 2);
  const divyaEnd = new Date(today);
  divyaEnd.setDate(today.getDate() + 3);

  await prisma.timeOffRequest.create({
    data: {
      employeeId: divya.id,
      typeId: paidLeave.id,
      startDate: divyaStart,
      endDate: divyaEnd,
      daysCount: 2,
      remarks: 'Attending tech conference and personal errands.',
      status: RequestStatus.PENDING,
    },
  });

  const rahul = employees.find((e) => e.firstName === 'Rahul')!;
  const rahulStart = new Date(today);
  rahulStart.setDate(today.getDate() + 4);
  const rahulEnd = new Date(today);
  rahulEnd.setDate(today.getDate() + 5);

  await prisma.timeOffRequest.create({
    data: {
      employeeId: rahul.id,
      typeId: sickLeave.id,
      startDate: rahulStart,
      endDate: rahulEnd,
      daysCount: 2,
      remarks: 'Scheduled medical consultation and rest.',
      status: RequestStatus.PENDING,
    },
  });
  console.log('✅ Leave requests (Approved & Pending for live demo) seeded');

  // ── 8. Past 20 Days Attendance Records + Today Check-in ─────────────────────
  console.log('⏳ Generating realistic past attendance logs for all team members...');
  for (let d = 20; d >= 0; d--) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - d);
    const dayOfWeek = logDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    for (const person of allPeople) {
      if (person.status === 'ON_LEAVE' && d <= 2) continue; // On leave currently
      if (person.status === 'ABSENT' && d === 0) continue; // Today absent

      const checkInHour = 8 + (person.firstName === 'Admin' ? 0.75 : Math.random() < 0.7 ? 0.8 : 1.2);
      const checkInDate = new Date(logDate);
      checkInDate.setHours(Math.floor(checkInHour), Math.floor((checkInHour % 1) * 60), 0, 0);

      const checkOutDate = new Date(logDate);
      checkOutDate.setHours(17, Math.floor(Math.random() * 45), 0, 0);

      const workHours = d === 0 ? null : 8.5;

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: person.id, date: logDate } },
        update: {
          checkIn: checkInDate,
          checkOut: d === 0 ? null : checkOutDate,
          workHours,
        },
        create: {
          employeeId: person.id,
          date: logDate,
          checkIn: checkInDate,
          checkOut: d === 0 ? null : checkOutDate,
          workHours,
        },
      });
    }
  }
  console.log('✅ Past 20 working days attendance records seeded');

  // ── 9. Salary Structures ───────────────────────────────────────────────────
  const wages: Record<string, number> = {
    'Admin Mishra': 120000,
    'Priya Sharma': 110000,
    'Rahul Nair': 95000,
    'Sneha Kulkarni': 105000,
    'Arjun Mehta': 115000,
    'Divya Reddy': 85000,
    'Kiran Joshi': 98000,
    'Ananya Deshmukh': 82000,
    'Vikram Singhania': 108000,
  };

  for (const person of allPeople) {
    const key = `${person.firstName} ${person.lastName}`;
    const monthlyWage = wages[key] ?? 75000;
    const basic = Math.round(monthlyWage * 0.45);
    const hra = Math.round(basic * 0.5);
    const travel = 3000;
    const special = monthlyWage - basic - hra - travel;

    await prisma.salaryStructure.upsert({
      where: { employeeId: person.id },
      update: { monthlyWage },
      create: {
        employeeId: person.id,
        monthlyWage,
        compositionType: CompositionType.PERCENTAGE,
        workingDaysPerWeek: 5,
        pfPercent: 12,
        professionalTax: 200,
        components: {
          create: [
            { name: 'Basic', valueType: CompositionType.PERCENTAGE, value: 45, computedAmount: basic },
            { name: 'HRA', valueType: CompositionType.PERCENTAGE, value: 22.5, computedAmount: hra },
            { name: 'Travel Allowance', valueType: CompositionType.FIXED, value: travel, computedAmount: travel },
            { name: 'Performance Allowance', valueType: CompositionType.FIXED, value: special, computedAmount: special },
          ],
        },
      },
    });
  }
  console.log('✅ Salary structures & component breakdowns configured');

  // ── 10. Sample Store Redemptions ───────────────────────────────────────────
  const coffeeReward = await prisma.reward.findUnique({ where: { name: 'Coffee & Snack Voucher' } });
  const wfhReward = await prisma.reward.findUnique({ where: { name: 'WFH Half-Day Pass' } });

  if (coffeeReward) {
    const arjun = employees.find((e) => e.firstName === 'Arjun')!;
    const arjunPts = await prisma.employeePoints.findUnique({ where: { employeeId: arjun.id } });
    if (arjunPts) {
      await prisma.rewardRedemption.create({
        data: {
          pointsId: arjunPts.id,
          rewardId: coffeeReward.id,
          pointCost: coffeeReward.pointCost,
          status: 'APPROVED',
        },
      });
    }
  }

  if (wfhReward) {
    const priya = employees.find((e) => e.firstName === 'Priya')!;
    const priyaPts = await prisma.employeePoints.findUnique({ where: { employeeId: priya.id } });
    if (priyaPts) {
      await prisma.rewardRedemption.create({
        data: {
          pointsId: priyaPts.id,
          rewardId: wfhReward.id,
          pointCost: wfhReward.pointCost,
          status: 'APPROVED',
        },
      });
    }
  }

  console.log('\n🎉 Comprehensive Seed Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏢 Company    : ${company.name} (${company.code})`);
  console.log(`👤 Admin      : ${admin.loginId} (Admin Mishra)  Password: Admin@123`);
  console.log(`👥 Employees  : ${employees.length} full employee profiles  Password: Dayflow@123`);
  console.log('🏆 Gamification: Full points, streaks, badges, and past 20-day attendance history populated.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
