import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upsertSalarySchema } from './payroll.schema';
import {
  handleGetSalary,
  handleUpsertSalary,
  handleGetPayableDays,
} from './payroll.controller';

const router = Router();

router.get('/:id/salary', requireAuth, handleGetSalary);
router.patch(
  '/:id/salary',
  requireAuth,
  requireRole('ADMIN'),
  validate(upsertSalarySchema),
  handleUpsertSalary
);
router.get('/:id/payable-days', requireAuth, handleGetPayableDays);

export default router;
