import prisma from '../../lib/prisma';

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
