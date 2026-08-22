import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  employeeId: string;
  companyId: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'HR_OFFICER';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      employee?: AuthPayload;
    }
  }
}

/**
 * Reads the JWT from the httpOnly cookie set at login (see auth.service.ts).
 * NOT from an Authorization header — that's a deliberate choice, see
 * docs/VEDESH-IMPLEMENTATION-PLAN-v2.md §0 for why.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.employee = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/**
 * Role gate — use after requireAuth.
 * Usage: router.post('/route', requireAuth, requireRole('ADMIN', 'HR_OFFICER'), handler)
 */
export function requireRole(...roles: AuthPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.employee || !roles.includes(req.employee.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
