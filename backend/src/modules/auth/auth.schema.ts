import { z } from 'zod';

/**
 * Zod validation schemas for all auth routes.
 * These are the server-side schemas — the frontend mirrors them
 * via React Hook Form + @hookform/resolvers/zod.
 */

// ── POST /auth/login ─────────────────────────────────────────────────────────
export const loginSchema = z.object({
  // Accept either a loginId (e.g. DXPRSH20260002) or an email address
  identifier: z
    .string({ required_error: 'Login ID or email is required' })
    .min(1, 'Login ID or email is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── POST /auth/reset-password ─────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ── POST /auth/employees (Admin/HR creates a new employee) ────────────────────
export const createEmployeeSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name is required')
    .max(50),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name is required')
    .max(50),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .optional(),
  role: z.enum(['EMPLOYEE', 'ADMIN', 'HR_OFFICER']).default('EMPLOYEE'),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  dateOfJoining: z
    .string({ required_error: 'Date of joining is required' })
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid date')
    .refine(
      (d) => new Date(d) <= new Date(),
      'Date of joining cannot be in the future',
    ),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// ── POST /auth/signup (Initial Company + Admin Registration) ───────────────────
export const signupSchema = z
  .object({
    companyName: z
      .string({ required_error: 'Company name is required' })
      .min(2, 'Company name must be at least 2 characters')
      .max(100),
    companyLogoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    name: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Full name must be at least 2 characters')
      .max(100),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Must be a valid email address'),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone must be exactly 10 digits')
      .optional()
      .or(z.literal('')),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

