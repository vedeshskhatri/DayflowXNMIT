import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone must be exactly 10 digits');

const pastDateSchema = z.coerce.date().refine(
  (d) => d < new Date(),
  { message: 'Date must be in the past' }
);

const notFutureDateSchema = z.coerce.date().refine(
  (d) => d <= new Date(),
  { message: 'Date cannot be in the future' }
);

const tagArraySchema = z
  .array(z.object({ name: z.string().min(1).max(100) }))
  .optional();

// Employee self-update schema (only allowed fields)
export const employeeSelfUpdateSchema = z.object({
  address:        z.string().max(500).optional(),
  phone:          phoneSchema.optional(),
  profilePicUrl:  z.string().max(10000000).optional().or(z.literal('')),
  bio:            z.string().max(2000).optional(),
  jobLove:        z.string().max(1000).optional(),
  interests:      z.string().max(1000).optional(),
  skills:         tagArraySchema,
  certifications: tagArraySchema,
});

export type EmployeeSelfUpdateInput = z.infer<typeof employeeSelfUpdateSchema>;

// Admin update schema (any employee, full fields)
export const adminEmployeeUpdateSchema = z.object({
  firstName:      z.string().min(1).max(100).optional(),
  lastName:       z.string().min(1).max(100).optional(),
  email:          z.string().email().optional(),
  phone:          phoneSchema.optional(),
  address:        z.string().max(500).optional(),
  profilePicUrl:  z.string().max(10000000).optional().or(z.literal('')),
  bio:            z.string().max(2000).optional(),
  jobLove:        z.string().max(1000).optional(),
  interests:      z.string().max(1000).optional(),
  skills:         tagArraySchema,
  certifications: tagArraySchema,
  jobTitle:       z.string().max(200).optional(),
  department:     z.string().max(200).optional(),
  gender:         z.string().max(50).optional(),
  maritalStatus:  z.string().max(50).optional(),
  personalEmail:  z.string().email().optional().or(z.literal('')),
  dateOfBirth:    pastDateSchema.optional(),
  dateOfJoining:  notFutureDateSchema.optional(),
  role:           z.enum(['EMPLOYEE', 'ADMIN', 'HR_OFFICER']).optional(),
}).superRefine((data, ctx) => {
  // If both dateOfBirth and dateOfJoining are provided, enforce age >= 18 at dateOfJoining
  if (data.dateOfBirth && data.dateOfJoining) {
    const minBirthDate = new Date(data.dateOfJoining);
    minBirthDate.setFullYear(minBirthDate.getFullYear() - 18);
    if (data.dateOfBirth > minBirthDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: 'Employee must be at least 18 years old at date of joining',
      });
    }
  }
});

export type AdminEmployeeUpdateInput = z.infer<typeof adminEmployeeUpdateSchema>;
