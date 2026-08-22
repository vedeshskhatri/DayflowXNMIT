import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Generic Zod validation middleware factory.
 * Usage: router.post('/route', validate(mySchema), handler)
 *
 * Validates req.body against the given schema. On failure, returns a 400
 * with a clear, field-level error list — this is what makes the inline
 * validation errors on the frontend actually meaningful, not just "Bad Request".
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
}
