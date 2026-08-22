import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getEmployeeList } from './employees.service';

const router = Router();
router.use(requireAuth);

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

export default router;
