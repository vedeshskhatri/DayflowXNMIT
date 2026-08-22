import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createEmployeeService,
  loginService,
  resetPasswordService,
  signupService,
} from './auth.service';
import {
  createEmployeeSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from './auth.schema';

const router = Router();

// ── POST /auth/signup ─────────────────────────────────────────────────────────
/**
 * Public route for Company + Initial Admin Registration.
 * Auto-generates Login ID: [CC][first2(fn)][first2(ln)][year][serial] (e.g. OIJODO20260001)
 * Sets httpOnly JWT cookie and logs Admin in immediately.
 */
router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const result = await signupService(res, req.body);
    return res.status(201).json({
      message: 'Company and Admin account registered successfully',
      employee: result.employee,
      loginId: result.loginId,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return res
      .status(e.status ?? 500)
      .json({ error: e.message ?? 'Registration failed' });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
/**
 * Public route. Accepts loginId (e.g. DXPRSH20260002) or email + password.
 * On success: sets httpOnly JWT cookie, returns employee profile in body.
 * On failure: 401 with a single message (no user enumeration).
 * If mustResetPwd is true: frontend should redirect to /reset-password.
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const employee = await loginService(res, req.body);
    return res.json({
      message: 'Login successful',
      employee,
      mustResetPwd: employee.mustResetPwd,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return res
      .status(e.status ?? 500)
      .json({ error: e.message ?? 'Login failed' });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
/**
 * Clears the httpOnly cookie server-side.
 * Frontend MUST call socket.disconnect() before hitting this route —
 * otherwise the socket stays alive in the company room after logout.
 * (Enforced in AGENTS.md — this comment is here so it's visible in code review)
 */
router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ message: 'Logged out successfully' });
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────
/**
 * Protected (requires a valid session cookie).
 * Called after first login when mustResetPwd is true, or any time
 * the employee wants to change their password.
 * Validates: min 8 chars, at least 1 uppercase, at least 1 number.
 */
router.post(
  '/reset-password',
  requireAuth,
  validate(resetPasswordSchema),
  async (req, res) => {
    try {
      const updated = await resetPasswordService(req.employee!.employeeId, req.body);
      return res.json({ message: 'Password updated successfully', employee: updated });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      return res
        .status(e.status ?? 500)
        .json({ error: e.message ?? 'Password reset failed' });
    }
  },
);

// ── POST /auth/employees ──────────────────────────────────────────────────────
/**
 * Admin/HR only — creates a new employee account.
 * Auto-generates: Login ID (using company code + name initials + year + serial)
 *                 Temporary password (returned in response, share with employee)
 * Sets mustResetPwd: true so the employee must change password on first login.
 * No self-registration route exists — this is the only way to create accounts.
 */
router.post(
  '/employees',
  requireAuth,
  requireRole('ADMIN', 'HR_OFFICER'),
  validate(createEmployeeSchema),
  async (req, res) => {
    try {
      const result = await createEmployeeService(
        req.employee!.companyId,
        req.body,
      );
      return res.status(201).json({
        message: 'Employee account created',
        employee: result.employee,
        credentials: {
          loginId: result.employee.loginId,
          tempPassword: result.tempPassword,
          note: 'Share these credentials with the employee. They will be forced to change their password on first login.',
        },
      });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      return res
        .status(e.status ?? 500)
        .json({ error: e.message ?? 'Failed to create employee' });
    }
  },
);

export default router;
