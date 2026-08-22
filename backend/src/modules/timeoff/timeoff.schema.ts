import { z } from 'zod';

export const createTimeOffRequestSchema = z
  .object({
    typeId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    remarks: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });
