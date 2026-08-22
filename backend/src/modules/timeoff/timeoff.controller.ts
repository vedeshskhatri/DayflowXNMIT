import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createTimeOffRequestSchema } from './timeoff.schema';
import {
  createTimeOffRequest,
  getAllRequests,
  getAllTimeOffTypes,
  getBalances,
  getMyRequests,
  reviewRequest,
} from './timeoff.service';

// ---------------------------------------------------------------------------
// Multer — disk storage, destination: backend/uploads
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../../uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ---------------------------------------------------------------------------
// Employee-side handlers
// ---------------------------------------------------------------------------

/**
 * GET /timeoff/balances
 * Returns the calling employee's active leave balances.
 */
export async function handleGetBalances(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    requireAuth(req, res, async () => {
      const result = await getBalances(req.employee!.employeeId);
      res.status(200).json(result);
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /timeoff/requests/mine
 * Returns the calling employee's own requests, newest first.
 */
export async function handleGetMyRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    requireAuth(req, res, async () => {
      const result = await getMyRequests(req.employee!.employeeId);
      res.status(200).json(result);
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /timeoff/types
 * Returns all available leave types.
 */
export async function handleGetTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    requireAuth(req, res, async () => {
      const result = await getAllTimeOffTypes();
      res.status(200).json(result);
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /timeoff/requests
 * Runs multer upload, then Zod validation, then the service.
 * Service errors with a `status` field are returned verbatim.
 */
export function handleCreateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    upload.single('attachment')(req, res, (multerErr) => {
      if (multerErr) {
        res.status(500).json({ error: 'File upload failed', detail: multerErr.message });
        return;
      }

      validate(createTimeOffRequestSchema)(req, res, async () => {
        try {
          const filePath = req.file?.path;
          const created = await createTimeOffRequest(
            req.employee!.employeeId,
            req.employee!.companyId,
            req.body,
            filePath
          );
          res.status(201).json(created);
        } catch (err: unknown) {
          const serviceErr = err as { status?: number; message?: string };
          if (serviceErr.status && serviceErr.message) {
            res.status(serviceErr.status).json({ error: serviceErr.message });
            return;
          }
          next(err);
        }
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Admin / HR_OFFICER handlers
// ---------------------------------------------------------------------------

/**
 * GET /timeoff/requests
 * Admin/HR: returns every request in the company, newest first.
 */
export function handleGetAllRequests(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    requireRole('ADMIN', 'HR_OFFICER')(req, res, async () => {
      try {
        const result = await getAllRequests(req.employee!.companyId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    });
  });
}

/**
 * PATCH /timeoff/requests/:id
 * Admin/HR: approve or reject a pending request.
 * Body: { action: 'APPROVE' | 'REJECT' }
 */
export function handleReviewRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    requireRole('ADMIN', 'HR_OFFICER')(req, res, async () => {
      // Inline Zod safeParse — body schema is intentionally small and self-contained here
      const bodySchema = z.object({
        action: z.enum(['APPROVE', 'REJECT']),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }

      try {
        const updated = await reviewRequest(
          req.params.id,
          req.employee!.employeeId,
          req.employee!.companyId,
          parsed.data.action
        );
        res.status(200).json(updated);
      } catch (err: unknown) {
        const serviceErr = err as { status?: number; message?: string };
        if (serviceErr.status && serviceErr.message) {
          res.status(serviceErr.status).json({ error: serviceErr.message });
          return;
        }
        next(err);
      }
    });
  });
}
