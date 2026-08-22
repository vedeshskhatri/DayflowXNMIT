import prisma from '../../lib/prisma';
import type { SalaryComponentInput, UpsertSalaryInput } from './payroll.schema';

export async function computeComponents(
  monthlyWage: number,
  components: SalaryComponentInput[]
) {
  const computedComponents = components.map((comp) => {
    let computedAmount: number;
    if (comp.valueType === 'FIXED') {
      computedAmount = comp.value;
    } else {
      computedAmount = (comp.value / 100) * monthlyWage;
    }
    return {
      name: comp.name,
      valueType: comp.valueType,
      value: comp.value,
      computedAmount,
    };
  });

  const sum = computedComponents.reduce((acc, curr) => acc + curr.computedAmount, 0);

  if (sum > monthlyWage) {
    throw { status: 400, message: 'Sum of salary components exceeds monthly wage' };
  }

  return computedComponents;
}

export async function getSalary(
  requestingEmployeeId: string,
  requestingRole: string,
  targetEmployeeId: string
) {
  const targetEmployee = await prisma.employee.findFirst({
    where: {
      OR: [{ id: targetEmployeeId }, { loginId: targetEmployeeId }],
    },
    select: { id: true, loginId: true },
  });

  const resolvedTargetId = targetEmployee ? targetEmployee.id : targetEmployeeId;

  if (
    requestingRole !== 'ADMIN' &&
    requestingRole !== 'HR_OFFICER' &&
    requestingEmployeeId !== resolvedTargetId &&
    requestingEmployeeId !== targetEmployeeId
  ) {
    throw { status: 403, message: 'Access denied: You can only view your own salary information' };
  }

  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { employeeId: resolvedTargetId },
    include: { components: true },
  });

  if (!salaryStructure) {
    return null;
  }

  return salaryStructure;
}

export async function upsertSalary(
  _adminEmployeeId: string,
  targetEmployeeId: string,
  body: UpsertSalaryInput
) {
  const targetEmployee = await prisma.employee.findFirst({
    where: {
      OR: [{ id: targetEmployeeId }, { loginId: targetEmployeeId }],
    },
    select: { id: true },
  });

  const resolvedTargetId = targetEmployee ? targetEmployee.id : targetEmployeeId;
  const computed = await computeComponents(body.monthlyWage, body.components);

  return await prisma.$transaction(async (tx) => {
    const salaryStructure = await tx.salaryStructure.upsert({
      where: { employeeId: resolvedTargetId },
      update: {
        monthlyWage: body.monthlyWage,
        workingDaysPerWeek: body.workingDaysPerWeek,
        pfPercent: body.pfPercent,
        professionalTax: body.professionalTax,
      },
      create: {
        employeeId: resolvedTargetId,
        monthlyWage: body.monthlyWage,
        workingDaysPerWeek: body.workingDaysPerWeek,
        pfPercent: body.pfPercent,
        professionalTax: body.professionalTax,
      },
    });

    await tx.salaryComponent.deleteMany({
      where: { salaryStructureId: salaryStructure.id },
    });

    await tx.salaryComponent.createMany({
      data: computed.map((c) => ({
        salaryStructureId: salaryStructure.id,
        name: c.name,
        valueType: c.valueType,
        value: c.value,
        computedAmount: c.computedAmount,
      })),
    });

    return await tx.salaryStructure.findUnique({
      where: { id: salaryStructure.id },
      include: { components: true },
    });
  });
}

export async function getPayableDays(
  requestingEmployeeId: string,
  requestingRole: string,
  targetEmployeeId: string,
  from: string,
  to: string
) {
  const targetEmployee = await prisma.employee.findFirst({
    where: {
      OR: [{ id: targetEmployeeId }, { loginId: targetEmployeeId }],
    },
    select: { id: true },
  });

  const resolvedTargetId = targetEmployee ? targetEmployee.id : targetEmployeeId;

  if (
    requestingRole !== 'ADMIN' &&
    requestingRole !== 'HR_OFFICER' &&
    requestingEmployeeId !== resolvedTargetId &&
    requestingEmployeeId !== targetEmployeeId
  ) {
    throw { status: 403, message: 'Access denied' };
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
    throw { status: 400, message: 'Invalid date range' };
  }

  // Calculate totalWorkingDays (Mon-Fri) inclusive
  let totalWorkingDays = 0;
  const cur = new Date(fromDate);
  while (cur <= toDate) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      totalWorkingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Query approved unpaid leave overlapping from-to
  const unpaidLeaves = await prisma.timeOffRequest.findMany({
    where: {
      employeeId: targetEmployeeId,
      status: 'APPROVED',
      type: { name: 'Unpaid Leave' },
      startDate: { lte: toDate },
      endDate: { gte: fromDate },
    },
    select: {
      daysCount: true,
    },
  });

  const unpaidLeaveDays = unpaidLeaves.reduce((sum, req) => sum + req.daysCount, 0);

  // Query unaccounted absences (attendance records in range with checkIn null)
  const unaccountedAbsences = await prisma.attendance.count({
    where: {
      employeeId: targetEmployeeId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
      checkIn: null,
    },
  });

  const payableDays = totalWorkingDays - unpaidLeaveDays - unaccountedAbsences;

  return {
    totalWorkingDays,
    unpaidLeaveDays,
    unaccountedAbsences,
    payableDays,
    from,
    to,
  };
}
