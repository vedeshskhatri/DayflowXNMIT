import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getOwnAttendance,
  getAllAttendance,
} from './attendance.service';

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
 * GET /attendance/all
 * Admin/HR only.
 * Returns attendance logs for all employees on a given date (default today), filterable by name search.
 */
router.get('/all', requireRole('ADMIN', 'HR_OFFICER'), async (req: Request, res: Response) => {
  try {
    const companyId = req.employee!.companyId;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const data = await getAllAttendance(companyId, date, search);
    return res.json(data);
  } catch (err: any) {
    console.error('[attendance] getAll error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch all attendance' });
  }
});

/**
 * GET /attendance
 * Returns requester's own attendance records in a date range (?from=YYYY-MM-DD&to=YYYY-MM-DD)
 * plus summary stats (daysPresent, leavesTaken, totalWorkingDays).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const employeeId = req.employee!.employeeId;
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;

    const data = await getOwnAttendance(employeeId, from, to);
    return res.json(data);
  } catch (err: any) {
    console.error('[attendance] getOwn error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch attendance history' });
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
