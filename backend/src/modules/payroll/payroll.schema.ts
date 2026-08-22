import { z } from 'zod';

export const salaryComponentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  valueType: z.enum(['FIXED', 'PERCENTAGE']),
  value: z.number().positive('Value must be greater than 0'),
});

export const upsertSalarySchema = z.object({
  monthlyWage: z.number().positive('Monthly wage must be greater than 0'),
  workingDaysPerWeek: z.number().int().min(1).max(7),
  pfPercent: z.number().min(0, 'PF percent must be at least 0'),
  professionalTax: z.number().min(0, 'Professional tax must be at least 0'),
  components: z.array(salaryComponentSchema).min(1, 'At least one component is required'),
});

export type SalaryComponentInput = z.infer<typeof salaryComponentSchema>;
export type UpsertSalaryInput = z.infer<typeof upsertSalarySchema>;
