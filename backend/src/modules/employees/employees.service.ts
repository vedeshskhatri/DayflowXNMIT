import prisma from '../../lib/prisma';
import type {
  AdminEmployeeUpdateInput,
  EmployeeSelfUpdateInput,
} from './employees.schema';

export type DerivedStatus = 'PRESENT' | 'ON_LEAVE' | 'ABSENT';

export interface EmployeeListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  profilePicUrl: string | null;
  status: DerivedStatus;
}

export interface EmployeeFullRecord {
  id: string;
  loginId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  profilePicUrl: string | null;
  bio: string | null;
  jobLove: string | null;
  interests: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  personalEmail: string | null;
  gender: string | null;
  maritalStatus: string | null;
  jobTitle: string | null;
  department: string | null;
  dateOfJoining: Date;
  createdAt: Date;
  skills: { id?: string; name: string }[];
  certifications: { id?: string; name: string }[];
  salary?: unknown;
}

function getStartAndEndOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function deriveStatus(
  employeeId: string,
  todayAttendance: { employeeId: string; checkIn: Date | null; checkOut: Date | null }[],
  todayTimeOff: { employeeId: string }[]
): DerivedStatus {
  const onLeave = todayTimeOff.some((t) => t.employeeId === employeeId);
  if (onLeave) return 'ON_LEAVE';

  const att = todayAttendance.find((a) => a.employeeId === employeeId);
  if (att && att.checkIn && !att.checkOut) return 'PRESENT';

  return 'ABSENT';
}

export async function getEmployeeList(companyId: string): Promise<EmployeeListItem[]> {
  const { start: todayStart, end: todayEnd } = getStartAndEndOfToday();

  const [employees, todayAttendance, todayTimeOff] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        department: true,
        profilePicUrl: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),

    prisma.attendance.findMany({
      where: {
        employee: { companyId },
        date: { gte: todayStart, lte: todayEnd },
      },
      select: {
        employeeId: true,
        checkIn: true,
        checkOut: true,
      },
    }),

    prisma.timeOffRequest.findMany({
      where: {
        employee: { companyId },
        status: 'APPROVED',
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
      select: {
        employeeId: true,
      },
    }),
  ]);

  return employees.map((emp) => ({
    ...emp,
    status: deriveStatus(emp.id, todayAttendance, todayTimeOff),
  }));
}

export async function getEmployeeById(
  id: string,
  includeSalary: boolean
): Promise<EmployeeFullRecord | null> {
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      loginId: true,
      companyId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      profilePicUrl: true,
      bio: true,
      jobLove: true,
      interests: true,
      dateOfBirth: true,
      address: true,
      personalEmail: true,
      gender: true,
      maritalStatus: true,
      jobTitle: true,
      department: true,
      dateOfJoining: true,
      createdAt: true,
      skills: { select: { id: true, name: true } },
      certifications: { select: { id: true, name: true } },
      salary: includeSalary
        ? {
            select: {
              monthlyWage: true,
              compositionType: true,
              workingDaysPerWeek: true,
              pfPercent: true,
              professionalTax: true,
              components: {
                select: {
                  id: true,
                  name: true,
                  valueType: true,
                  value: true,
                  computedAmount: true,
                },
              },
            },
          }
        : false,
    },
  });

  return employee as EmployeeFullRecord | null;
}

export async function updateEmployee(
  id: string,
  data: EmployeeSelfUpdateInput | AdminEmployeeUpdateInput
): Promise<EmployeeFullRecord | null> {
  const { skills, certifications, ...scalarFields } = data as AdminEmployeeUpdateInput;

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id },
      data: scalarFields,
    });

    if (skills !== undefined) {
      await tx.skill.deleteMany({ where: { employeeId: id } });
      if (skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((s) => ({ employeeId: id, name: s.name })),
        });
      }
    }

    if (certifications !== undefined) {
      await tx.certification.deleteMany({ where: { employeeId: id } });
      if (certifications.length > 0) {
        await tx.certification.createMany({
          data: certifications.map((c) => ({ employeeId: id, name: c.name })),
        });
      }
    }
  });

  return getEmployeeById(id, true);
}
