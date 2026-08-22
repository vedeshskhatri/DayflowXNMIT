import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { checkIn, checkOut, getTodayAttendance } from './attendance.service';

const router = Router();
router.use(requireAuth);

/**
 * GET /attendance/today
 * Returns today's attendance record for the logged-in user.
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const employeeId = req.employee!.employeeId;
    const record = await getTodayAttendance(employeeId);
    return res.json(record || null);
  } catch (err: any) {
    console.error('[attendance] getToday error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch today attendance' });
  }
});

/**
 * POST /attendance/checkin
 * Checks in the logged in user, upserting today's record and emitting socket events.
 */
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const { employeeId, companyId } = req.employee!;
    const record = await checkIn(employeeId, companyId);
    return res.json({ message: 'Checked in successfully', attendance: record });
  } catch (err: any) {
    console.error('[attendance] checkIn error:', err);
    return res.status(err.statusCode || 400).json({ error: err.message || 'Failed to check in' });
  }
});

/**
 * POST /attendance/checkout
 * Checks out the logged in user, calculating work hours and emitting socket event.
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { employeeId, companyId } = req.employee!;
    const record = await checkOut(employeeId, companyId);
    return res.json({ message: 'Checked out successfully', attendance: record });
  } catch (err: any) {
    console.error('[attendance] checkOut error:', err);
    return res.status(err.statusCode || 400).json({ error: err.message || 'Failed to check out' });
  }
});

export default router;
