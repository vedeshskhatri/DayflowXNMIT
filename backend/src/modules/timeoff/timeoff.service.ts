import { PrismaClient } from '@prisma/client';
import { emitToCompany } from '../../sockets/index';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// getBalances
// ---------------------------------------------------------------------------
export async function getBalances(employeeId: string) {
  const today = new Date();

  const allocations = await prisma.timeOffAllocation.findMany({
    where: {
      employeeId,
      validFrom: { lte: today },
      validTo: { gte: today },
    },
    include: {
      type: true,
    },
  });

  return allocations.map((alloc) => ({
    typeId: alloc.typeId,
    name: alloc.type.name,
    requiresProof: alloc.type.requiresProof,
    daysAllocated: alloc.daysAllocated,
    daysUsed: alloc.daysUsed,
    remaining: alloc.daysAllocated - alloc.daysUsed,
  }));
}

// ---------------------------------------------------------------------------
// getMyRequests
// ---------------------------------------------------------------------------
export async function getMyRequests(employeeId: string) {
  const requests = await prisma.timeOffRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
    include: {
      type: true,
    },
  });

  return requests;
}

// ---------------------------------------------------------------------------
// getAllTimeOffTypes
// ---------------------------------------------------------------------------
export async function getAllTimeOffTypes() {
  const types = await prisma.timeOffType.findMany();

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    requiresProof: t.requiresProof,
  }));
}

// ---------------------------------------------------------------------------
// createTimeOffRequest
// ---------------------------------------------------------------------------
export async function createTimeOffRequest(
  employeeId: string,
  companyId: string,
  body: { typeId: string; startDate: string; endDate: string; remarks?: string },
  filePath?: string
) {
  const { typeId, startDate, endDate, remarks } = body;

  // Step 1: load TimeOffType
  const leaveType = await prisma.timeOffType.findUnique({ where: { id: typeId } });
  if (!leaveType) {
    throw { status: 400, message: 'Invalid leave type' };
  }

  // Step 2: proof required check
  if (leaveType.requiresProof && filePath === undefined) {
    throw { status: 400, message: 'Attachment required for Sick Leave' };
  }

  // Step 3: calculate daysCount (inclusive calendar days)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysCount = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;

  // Step 4: load active allocation
  const today = new Date();
  const allocation = await prisma.timeOffAllocation.findFirst({
    where: {
      employeeId,
      typeId,
      validFrom: { lte: today },
      validTo: { gte: today },
    },
  });
  if (!allocation) {
    throw { status: 400, message: 'No active allocation for this leave type' };
  }

  // Step 5: balance check
  const remaining = allocation.daysAllocated - allocation.daysUsed;
  if (daysCount > remaining) {
    throw { status: 400, message: 'Insufficient leave balance' };
  }

  // Step 6: overlap check — any PENDING or APPROVED request that intersects
  const overlap = await prisma.timeOffRequest.findFirst({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      NOT: {
        OR: [
          { endDate: { lt: start } },
          { startDate: { gt: end } },
        ],
      },
    },
  });
  if (overlap) {
    throw { status: 409, message: 'Overlapping request exists' };
  }

  // Step 7: create the request
  const created = await prisma.timeOffRequest.create({
    data: {
      employeeId,
      typeId,
      startDate: start,
      endDate: end,
      daysCount,
      remarks: remarks ?? null,
      attachmentUrl: filePath ?? null,
      status: 'PENDING',
    },
  });

  // Step 8: emit socket event to the company room
  emitToCompany(companyId, 'timeoff:requested', {
    requestId: created.id,
    employeeId,
    typeId,
    startDate,
    endDate,
    daysCount,
  });

  // Step 9: return created record
  return created;
}

// ---------------------------------------------------------------------------
// getAllRequests  (Admin / HR_OFFICER)
// ---------------------------------------------------------------------------
export async function getAllRequests(companyId: string) {
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      employee: { companyId },
    },
    include: {
      employee: {
        select: { firstName: true, lastName: true },
      },
      type: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests;
}

// ---------------------------------------------------------------------------
// reviewRequest  (Admin / HR_OFFICER)
// ---------------------------------------------------------------------------
export async function reviewRequest(
  requestId: string,
  reviewerId: string,
  companyId: string,
  action: 'APPROVE' | 'REJECT'
) {
  // Load request
  const request = await prisma.timeOffRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) {
    throw { status: 404, message: 'Request not found' };
  }

  // Guard: only PENDING requests can be reviewed
  if (request.status !== 'PENDING') {
    throw { status: 400, message: 'Only pending requests can be reviewed' };
  }

  // On approval: increment daysUsed on the active allocation
  if (action === 'APPROVE') {
    const today = new Date();
    const allocation = await prisma.timeOffAllocation.findFirst({
      where: {
        employeeId: request.employeeId,
        typeId: request.typeId,
        validFrom: { lte: today },
        validTo: { gte: today },
      },
    });
    if (allocation) {
      await prisma.timeOffAllocation.update({
        where: { id: allocation.id },
        data: { daysUsed: { increment: request.daysCount } },
      });
    }
  }

  // Update the request record
  const updated = await prisma.timeOffRequest.update({
    where: { id: requestId },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  // Emit real-time event so the employee's screen updates live
  emitToCompany(companyId, 'timeoff:statusChanged', {
    requestId,
    employeeId: request.employeeId,
    status: updated.status,
    reviewedBy: reviewerId,
  });

  return updated;
}
