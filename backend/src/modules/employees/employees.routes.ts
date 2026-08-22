import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  getEmployeeList,
  getEmployeeById,
  updateEmployee,
} from './employees.service';
import {
  employeeSelfUpdateSchema,
  adminEmployeeUpdateSchema,
} from './employees.schema';

const router = Router();
router.use(requireAuth);

/**
 * GET /employees
 * Returns company-scoped employee list with derived status.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = req.employee!.companyId;
    const employees = await getEmployeeList(companyId);
    return res.json(employees);
  } catch (err) {
    console.error('[employees] list error:', err);
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * GET /employees/:id
 * Returns the full employee record. Salary fields stripped unless requester is Admin.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requester = req.employee!;
    const isAdmin = requester.role === 'ADMIN' || requester.role === 'HR_OFFICER';

    const employee = await getEmployeeById(id, isAdmin);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.companyId !== requester.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(employee);
  } catch (err) {
    console.error('[employees] getById error:', err);
    return res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/**
 * PATCH /employees/:id
 * Enforces field-level permissions:
 * - Employee editing self: only address, phone, profilePicUrl, bio, jobLove, interests, skills, certifications allowed. Disallowed key -> 403.
 * - Admin/HR: any field permitted.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requester = req.employee!;
    const isAdmin = requester.role === 'ADMIN' || requester.role === 'HR_OFFICER';

    // Non-admin trying to patch someone else's record
    if (!isAdmin && requester.employeeId !== id) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    // Strict check for non-admin self-edit: any disallowed field in body -> 403
    if (!isAdmin) {
      const ALLOWED_SELF_FIELDS = new Set([
        'address',
        'phone',
        'profilePicUrl',
        'bio',
        'jobLove',
        'interests',
        'skills',
        'certifications',
      ]);

      const forbiddenKeys = Object.keys(req.body).filter(
        (k) => !ALLOWED_SELF_FIELDS.has(k)
      );

      if (forbiddenKeys.length > 0) {
        return res.status(403).json({
          error: `Field(s) not allowed: ${forbiddenKeys.join(', ')}`,
        });
      }
    }

    // Select and run appropriate Zod schema
    const schema = isAdmin ? adminEmployeeUpdateSchema : employeeSelfUpdateSchema;
    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // Ensure target employee exists in same company
    const existing = await getEmployeeById(id, false);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    if (existing.companyId !== requester.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await updateEmployee(id, parseResult.data);
    return res.json(updated);
  } catch (err) {
    console.error('[employees] patch error:', err);
    return res.status(500).json({ error: 'Failed to update employee' });
  }
});

export default router;
