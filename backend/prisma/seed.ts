/**
 * Seed script — runs via: docker compose exec backend npm run prisma:seed
 *
 * Creates:
 *  - 1 Company (code: "DX")
 *  - 1 Admin employee (DXADAD20260001 / Admin@123, mustResetPwd: false)
 *  - 6 Employees with realistic names, mix of PRESENT/ON_LEAVE/ABSENT
 *  - 3 TimeOffTypes with per-employee allocations
 *  - 1 PRESENT employee with today's check-in already seeded
 *  - 2 PENDING TimeOffRequests ready to approve live during demo
 */

import { CompositionType, PrismaClient, RequestStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Company ─────────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { code: 'DX' },
    update: {},
    create: {
      name: 'Dayflow x NMIT',
      code: 'DX',
    },
  });
  console.log(`✅ Company: ${company.name} (${company.code})`);

  // ── Passwords ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const empHash = await bcrypt.hash('Dayflow@123', 10);

  const year = 2026;
  const validFrom = new Date(`${year}-01-01`);
  const validTo = new Date(`${year}-12-31`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Admin ────────────────────────────────────────────────────────────────────
  // loginId: DX + AD(Admin) + AD(Administrator first2 of last) + 2026 + 0001
  const admin = await prisma.employee.upsert({
    where: { loginId: 'DXADMI20260001' },
    update: {},
    create: {
      loginId: 'DXADMI20260001',
      companyId: company.id,
      firstName: 'Admin',
      lastName: 'Mishra',
      email: 'admin@dayflow.dev',
      phone: '9876543210',
      passwordHash: adminHash,
      mustResetPwd: false,
      role: 'ADMIN',
      jobTitle: 'HR Administrator',
      department: 'Human Resources',
      dateOfJoining: new Date(`${year}-01-15`),
      joiningSerial: 1,
      status: 'PRESENT',
    },
  });
  console.log(`✅ Admin: ${admin.loginId} (${admin.firstName} ${admin.lastName})`);

  // ── Employees ─────────────────────────────────────────────────────────────────
  const employeeData = [
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@dayflow.dev',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      status: 'PRESENT' as const,
      serial: 2,
      doj: new Date(`${year}-02-01`),
    },
    {
      firstName: 'Rahul',
      lastName: 'Nair',
      email: 'rahul.nair@dayflow.dev',
      jobTitle: 'UI/UX Designer',
      department: 'Design',
      status: 'ABSENT' as const,
      serial: 3,
      doj: new Date(`${year}-02-10`),
    },
    {
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      email: 'sneha.kulkarni@dayflow.dev',
      jobTitle: 'Product Manager',
      department: 'Product',
      status: 'ON_LEAVE' as const,
      serial: 4,
      doj: new Date(`${year}-03-01`),
    },
    {
      firstName: 'Arjun',
      lastName: 'Mehta',
      email: 'arjun.mehta@dayflow.dev',
      jobTitle: 'Backend Developer',
      department: 'Engineering',
      status: 'PRESENT' as const,
      serial: 5,
      doj: new Date(`${year}-03-15`),
    },
    {
      firstName: 'Divya',
      lastName: 'Reddy',
      email: 'divya.reddy@dayflow.dev',
      jobTitle: 'QA Engineer',
      department: 'Quality Assurance',
      status: 'ABSENT' as const,
      serial: 6,
      doj: new Date(`${year}-04-01`),
    },
    {
      firstName: 'Kiran',
      lastName: 'Joshi',
      email: 'kiran.joshi@dayflow.dev',
      jobTitle: 'DevOps Engineer',
      department: 'Engineering',
      status: 'PRESENT' as const,
      serial: 7,
      doj: new Date(`${year}-04-15`),
    },
  ];

  const employees = [];
  for (const emp of employeeData) {
    const fn2 = emp.firstName.slice(0, 2).toUpperCase();
    const ln2 = emp.lastName.slice(0, 2).toUpperCase();
    const loginId = `DX${fn2}${ln2}${year}${String(emp.serial).padStart(4, '0')}`;

    const created = await prisma.employee.upsert({
      where: { loginId },
      update: {},
      create: {
        loginId,
        companyId: company.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: `98765432${emp.serial.toString().padStart(2, '0')}`,
        passwordHash: empHash,
        mustResetPwd: false, // false for demo convenience — real flow would be true
        role: 'EMPLOYEE',
        jobTitle: emp.jobTitle,
        department: emp.department,
        dateOfJoining: emp.doj,
        joiningSerial: emp.serial,
        status: emp.status,
        bio: `${emp.firstName} is a passionate ${emp.jobTitle} at Dayflow x NMIT.`,
        interests: 'Technology, Innovation, Open Source',
      },
    });

    employees.push(created);
    console.log(`✅ Employee: ${loginId} — ${emp.firstName} ${emp.lastName} (${emp.status})`);
  }

  // ── TimeOffTypes ──────────────────────────────────────────────────────────────
  const paidLeave = await prisma.timeOffType.upsert({
    where: { id: 'pto-type-001' },
    update: {},
    create: {
      id: 'pto-type-001',
      name: 'Paid Time Off',
      requiresProof: false,
    },
  });

  const sickLeave = await prisma.timeOffType.upsert({
    where: { id: 'sick-type-001' },
    update: {},
    create: {
      id: 'sick-type-001',
      name: 'Sick Leave',
      requiresProof: true,
    },
  });

  const unpaidLeave = await prisma.timeOffType.upsert({
    where: { id: 'unpaid-type-001' },
    update: {},
    create: {
      id: 'unpaid-type-001',
      name: 'Unpaid Leave',
      requiresProof: false,
    },
  });

  console.log('✅ TimeOffTypes: Paid Time Off, Sick Leave, Unpaid Leave');

  // ── Allocations (for all employees + admin) ────────────────────────────────────
  const allPeople = [admin, ...employees];
  for (const person of allPeople) {
    await prisma.timeOffAllocation.createMany({
      skipDuplicates: true,
      data: [
        {
          employeeId: person.id,
          typeId: paidLeave.id,
          daysAllocated: 12,
          daysUsed: 0,
          validFrom,
          validTo,
        },
        {
          employeeId: person.id,
          typeId: sickLeave.id,
          daysAllocated: 8,
          daysUsed: 0,
          validFrom,
          validTo,
        },
        {
          employeeId: person.id,
          typeId: unpaidLeave.id,
          daysAllocated: 5,
          daysUsed: 0,
          validFrom,
          validTo,
        },
      ],
    });
  }
  console.log('✅ TimeOffAllocations: 3 types × all employees');

  // ── PENDING TimeOffRequests — ready to approve live in demo ───────────────────
  // Sneha (ON_LEAVE status) has an approved leave this week
  const sneha = employees.find((e) => e.firstName === 'Sneha')!;
  const snehaStartDate = new Date(today);
  snehaStartDate.setDate(today.getDate() - 1); // started yesterday
  const snehaEndDate = new Date(today);
  snehaEndDate.setDate(today.getDate() + 1); // ends tomorrow

  await prisma.timeOffRequest.create({
    data: {
      employeeId: sneha.id,
      typeId: paidLeave.id,
      startDate: snehaStartDate,
      endDate: snehaEndDate,
      daysCount: 3,
      remarks: 'Family function out of town',
      status: RequestStatus.APPROVED,
      reviewedById: admin.id,
      reviewedAt: new Date(today.getTime() - 86400000 * 2),
    },
  });
  console.log(`✅ Approved leave for ${sneha.firstName} (ON_LEAVE status makes sense now)`);

  // Divya has a PENDING leave request — ready to approve live in demo
  const divya = employees.find((e) => e.firstName === 'Divya')!;
  const divyaStart = new Date(today);
  divyaStart.setDate(today.getDate() + 1);
  const divyaEnd = new Date(today);
  divyaEnd.setDate(today.getDate() + 2);

  await prisma.timeOffRequest.create({
    data: {
      employeeId: divya.id,
      typeId: paidLeave.id,
      startDate: divyaStart,
      endDate: divyaEnd,
      daysCount: 2,
      remarks: 'Doctor appointment and personal errands',
      status: RequestStatus.PENDING,
    },
  });
  console.log(`✅ PENDING leave request from ${divya.firstName} (demo: approve this live!)`);

  // Rahul has a PENDING sick leave — requires proof in demo
  const rahul = employees.find((e) => e.firstName === 'Rahul')!;
  const rahulStart = new Date(today);
  rahulStart.setDate(today.getDate() + 3);
  const rahulEnd = new Date(today);
  rahulEnd.setDate(today.getDate() + 4);

  await prisma.timeOffRequest.create({
    data: {
      employeeId: rahul.id,
      typeId: sickLeave.id,
      startDate: rahulStart,
      endDate: rahulEnd,
      daysCount: 2,
      remarks: 'Feeling unwell, doctor visit scheduled',
      status: RequestStatus.PENDING,
    },
  });
  console.log(`✅ PENDING sick leave from ${rahul.firstName} (demo: reject or approve!)`);

  // ── Today's attendance for PRESENT employees ──────────────────────────────────
  const presentEmployees = employees.filter((e) => e.status === 'PRESENT');
  for (const emp of presentEmployees) {
    const checkInTime = new Date(today);
    checkInTime.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00–9:30 AM

    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
      update: {},
      create: {
        employeeId: emp.id,
        date: today,
        checkIn: checkInTime,
      },
    });
  }
  // Admin also checked in
  const adminCheckIn = new Date(today);
  adminCheckIn.setHours(8, 45, 0, 0);
  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: admin.id, date: today } },
    update: {},
    create: { employeeId: admin.id, date: today, checkIn: adminCheckIn },
  });
  console.log(`✅ Today's attendance: checked in ${presentEmployees.length + 1} PRESENT employees`);

  // ── Salary structures for all employees ───────────────────────────────────────
  const wages: Record<string, number> = {
    'Admin Mishra': 80000,
    'Priya Sharma': 65000,
    'Rahul Nair': 60000,
    'Sneha Kulkarni': 75000,
    'Arjun Mehta': 68000,
    'Divya Reddy': 55000,
    'Kiran Joshi': 70000,
  };

  for (const person of allPeople) {
    const key = `${person.firstName} ${person.lastName}`;
    const monthlyWage = wages[key] ?? 50000;
    const basic = Math.round(monthlyWage * 0.4);
    const hra = Math.round(basic * 0.5);
    const travel = 2000;
    const special = monthlyWage - basic - hra - travel;

    const existing = await prisma.salaryStructure.findUnique({
      where: { employeeId: person.id },
    });
    if (existing) continue;

    await prisma.salaryStructure.create({
      data: {
        employeeId: person.id,
        monthlyWage,
        compositionType: CompositionType.PERCENTAGE,
        workingDaysPerWeek: 5,
        pfPercent: 12,
        professionalTax: 200,
        components: {
          create: [
            {
              name: 'Basic',
              valueType: CompositionType.PERCENTAGE,
              value: 40,
              computedAmount: basic,
            },
            {
              name: 'HRA',
              valueType: CompositionType.PERCENTAGE,
              value: 20,
              computedAmount: hra,
            },
            {
              name: 'Travel Allowance',
              valueType: CompositionType.FIXED,
              value: travel,
              computedAmount: travel,
            },
            {
              name: 'Special Allowance',
              valueType: CompositionType.FIXED,
              value: special,
              computedAmount: special,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Salary structures created for all employees');

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete! Summary:');
  console.log(`   Company   : ${company.name} (${company.code})`);
  console.log(`   Admin     : ${admin.loginId}  password: Admin@123`);
  console.log(`   Employees : ${employees.length}  password: Dayflow@123`);
  console.log(`   Status mix: ${employees.filter((e) => e.status === 'PRESENT').length} PRESENT, ${employees.filter((e) => e.status === 'ON_LEAVE').length} ON_LEAVE, ${employees.filter((e) => e.status === 'ABSENT').length} ABSENT`);
  console.log('   Demo tip  : Approve Divya or Rahul\'s PENDING leave request live!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
