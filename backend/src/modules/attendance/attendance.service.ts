import prisma from '../../lib/prisma';
import { emitToCompany } from '../../sockets';

function getTodayDateRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
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

  return attendanceRecord;
}
