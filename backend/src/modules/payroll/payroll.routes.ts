import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upsertSalarySchema } from './payroll.schema';
import { handleGetSalary, handleUpsertSalary } from './payroll.controller';

const router = Router();

router.get('/employees/:id/salary', requireAuth, handleGetSalary);
router.patch(
  '/employees/:id/salary',
  requireAuth,
  requireRole('ADMIN'),
  validate(upsertSalarySchema),
  handleUpsertSalary
);

export default router;
