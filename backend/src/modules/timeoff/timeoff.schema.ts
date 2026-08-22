import { z } from 'zod';

const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Must be a valid date string',
});

export const createTimeOffRequestSchema = z
  .object({
    typeId: z.string().uuid(),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    remarks: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });
