import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import {
  getLeaderboard,
  getMyStats,
  getRewardCatalogue,
  redeemReward,
  listPendingRedemptions,
  reviewRedemption,
  adminAwardPoints,
  triggerEasterEgg,
  seedDefaultData,
} from './rewards.service';

const router = Router();
router.use(requireAuth);

/**
 * GET /rewards/leaderboard
 * Company-visible leaderboard ordered by total points.
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.employee!;
    const data = await getLeaderboard(companyId);
    return res.json(data);
  } catch (err: any) {
    console.error('[rewards] leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /rewards/me
 * My points, streak, badges, and redemption history.
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.employee!;
    const data = await getMyStats(employeeId);
    return res.json(data);
  } catch (err: any) {
    console.error('[rewards] me error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /rewards/catalogue
 * All active rewards in the store.
 */
router.get('/catalogue', async (req: Request, res: Response) => {
  try {
    const data = await getRewardCatalogue();
    return res.json(data);
  } catch (err: any) {
    console.error('[rewards] catalogue error:', err);
    return res.status(500).json({ error: 'Failed to fetch catalogue' });
  }
});

/**
 * POST /rewards/redeem
 * Body: { rewardId: string }
 * Deducts points; auto-approved ≤ 500 pts, else PENDING_HR.
 */
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { employeeId, companyId } = req.employee!;
    const { rewardId } = req.body;
    if (!rewardId) return res.status(400).json({ error: 'rewardId is required' });
    const data = await redeemReward(employeeId, companyId, rewardId);
    return res.json(data);
  } catch (err: any) {
    console.error('[rewards] redeem error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /rewards/easter-egg
 * One-time +50 pts Easter Egg trigger per employee.
 */
router.post('/easter-egg', async (req: Request, res: Response) => {
  try {
    const { employeeId, companyId } = req.employee!;
    const data = await triggerEasterEgg(employeeId, companyId);
    return res.json(data);
  } catch (err: any) {
    console.error('[rewards] easter-egg error:', err);
    return res.status(500).json({ error: 'Easter egg trigger failed' });
  }
});

/**
 * GET /rewards/redemptions
 * HR/Admin: list all PENDING_HR redemptions across the company.
 */
router.get(
  '/redemptions',
  requireRole('ADMIN', 'HR_OFFICER'),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.employee!;
      const data = await listPendingRedemptions(companyId);
      return res.json(data);
    } catch (err: any) {
      console.error('[rewards] redemptions error:', err);
      return res.status(500).json({ error: 'Failed to fetch redemptions' });
    }
  }
);

/**
 * PUT /rewards/redemptions/:id
 * HR/Admin: approve or reject a pending redemption.
 * Body: { action: 'approve' | 'reject', notes?: string }
 */
router.put(
  '/redemptions/:id',
  requireRole('ADMIN', 'HR_OFFICER'),
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.employee!;
      const { id } = req.params;
      const { action, notes } = req.body;
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be approve or reject' });
      }
      const data = await reviewRedemption(id, employeeId, action, notes);
      return res.json(data);
    } catch (err: any) {
      console.error('[rewards] review error:', err);
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /rewards/admin/award
 * HR/Admin: manually award points to any employee.
 * Body: { employeeId: string, amount: number, reason: string }
 */
router.post(
  '/admin/award',
  requireRole('ADMIN', 'HR_OFFICER'),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.employee!;
      const { employeeId, amount, reason } = req.body;
      if (!employeeId || !amount || !reason) {
        return res.status(400).json({ error: 'employeeId, amount, and reason are required' });
      }
      const data = await adminAwardPoints(employeeId, companyId, Number(amount), reason);
      return res.json(data);
    } catch (err: any) {
      console.error('[rewards] admin award error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;
