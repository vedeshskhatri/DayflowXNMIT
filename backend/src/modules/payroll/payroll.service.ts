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
  if (requestingRole !== 'ADMIN' && requestingEmployeeId !== targetEmployeeId) {
    throw { status: 403, message: 'Access denied' };
  }

  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { employeeId: targetEmployeeId },
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
  const computed = await computeComponents(body.monthlyWage, body.components);

  return await prisma.$transaction(async (tx) => {
    const salaryStructure = await tx.salaryStructure.upsert({
      where: { employeeId: targetEmployeeId },
      update: {
        monthlyWage: body.monthlyWage,
        workingDaysPerWeek: body.workingDaysPerWeek,
        pfPercent: body.pfPercent,
        professionalTax: body.professionalTax,
      },
      create: {
        employeeId: targetEmployeeId,
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
