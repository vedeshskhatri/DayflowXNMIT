import type { Request, Response } from 'express';
import { getSalary, upsertSalary, getPayableDays } from './payroll.service';

export async function handleGetSalary(req: Request, res: Response) {
  try {
    const requestingEmployeeId = req.employee!.employeeId;
    const requestingRole = req.employee!.role;
    const targetEmployeeId = req.params.id;

    const result = await getSalary(requestingEmployeeId, requestingRole, targetEmployeeId);
    if (!result) {
      return res.status(404).json({ error: 'No salary structure found' });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleUpsertSalary(req: Request, res: Response) {
  try {
    const adminEmployeeId = req.employee!.employeeId;
    const targetEmployeeId = req.params.id;

    const result = await upsertSalary(adminEmployeeId, targetEmployeeId, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetPayableDays(req: Request, res: Response) {
  try {
    const requestingEmployeeId = req.employee!.employeeId;
    const requestingRole = req.employee!.role;
    const targetEmployeeId = req.params.id;
    const { from, to } = req.query;

    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({ error: 'from and to query params are required' });
    }

    const result = await getPayableDays(
      requestingEmployeeId,
      requestingRole,
      targetEmployeeId,
      from,
      to
    );
    return res.status(200).json(result);
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
