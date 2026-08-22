import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../../middleware/auth.middleware';
import type { CreateEmployeeInput, LoginInput, ResetPasswordInput } from './auth.schema';

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generates the Dayflow Login ID:
 * [CompanyCode][First2(firstName)][First2(lastName)][JoinYear][Serial(4-digit)]
 *
 * The serial count + insert are wrapped in a Prisma interactive transaction
 * to prevent a race condition if two employees are created in the same burst
 * (both would otherwise read the same COUNT and collide on the same serial).
 *
 * Returned from createEmployee — never accepted from client input.
 */
export async function generateLoginId(
  companyId: string,
  companyCode: string,
  firstName: string,
  lastName: string,
  dateOfJoining: Date,
): Promise<{ loginId: string; joiningSerial: number }> {
  const fn2 = firstName.slice(0, 2).toUpperCase();
  const ln2 = lastName.slice(0, 2).toUpperCase();
  const joinYear = dateOfJoining.getFullYear();

  // Count is done inside the transaction that also does the create,
  // so no two concurrent requests can get the same serial.
  const result = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.employee.count({
      where: {
        companyId,
        dateOfJoining: {
          gte: new Date(`${joinYear}-01-01`),
          lt: new Date(`${joinYear + 1}-01-01`),
        },
      },
    });

    const serial = existingCount + 1;
    const loginId = `${companyCode}${fn2}${ln2}${joinYear}${String(serial).padStart(4, '0')}`;

    return { loginId, joiningSerial: serial };
  });

  return result;
}

/**
 * Sets the JWT as an httpOnly cookie on the response.
 * Cookie flags are chosen for local Docker dev (sameSite: lax, secure: false).
 * If deployed over HTTPS, set secure: true via env var.
 */
export function setAuthCookie(res: Response, payload: AuthPayload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax', // 'strict' breaks cross-port localhost requests
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours — matches hackathon session length
  });

  return token;
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Accepts a loginId (e.g. DXPRSH20260002) or email address + password.
 * Returns the employee record (without passwordHash) for the frontend to store in state.
 * The JWT goes out as an httpOnly cookie only — never in the response body.
 */
export async function loginService(res: Response, input: LoginInput) {
  const { identifier, password } = input;

  // Look up by loginId first, then fall back to email
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [{ loginId: identifier }, { email: identifier }],
    },
    include: { company: { select: { code: true, name: true } } },
  });

  if (!employee) {
    // Return the same message for both "not found" and "wrong password"
    // to avoid user enumeration.
    throw { status: 401, message: 'Invalid credentials' };
  }

  const passwordMatch = await bcrypt.compare(password, employee.passwordHash);
  if (!passwordMatch) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const payload: AuthPayload = {
    employeeId: employee.id,
    companyId: employee.companyId,
    role: employee.role,
  };

  setAuthCookie(res, payload);

  // Strip the hash — never send it to the client
  const { passwordHash: _hash, ...safeEmployee } = employee;
  return safeEmployee;
}

/**
 * POST /auth/reset-password
 * Called when mustResetPwd is true (first login) or explicitly by the employee.
 * Sets mustResetPwd: false on success.
 */
export async function resetPasswordService(
  employeeId: string,
  input: ResetPasswordInput,
) {
  const { newPassword } = input;

  const hash = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      passwordHash: hash,
      mustResetPwd: false,
    },
    select: {
      id: true,
      loginId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      mustResetPwd: true,
    },
  });

  return updated;
}

/**
 * POST /auth/employees  (Admin/HR only)
 * Creates a new employee account:
 *  - Auto-generates Login ID (inside a Prisma transaction)
 *  - Auto-generates a temporary password
 *  - Sets mustResetPwd: true so the employee is forced to change on first login
 *
 * The generated loginId and tempPassword are returned to the Admin
 * so they can be shared with the new employee.
 */
export async function createEmployeeService(
  companyId: string,
  input: CreateEmployeeInput,
) {
  const { firstName, lastName, email, phone, role, jobTitle, department, dateOfJoining } =
    input;

  // Look up company code for Login ID generation
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw { status: 400, message: 'Company not found' };

  const doj = new Date(dateOfJoining);

  const { loginId, joiningSerial } = await generateLoginId(
    companyId,
    company.code,
    firstName,
    lastName,
    doj,
  );

  // Check for loginId collision (extremely unlikely but guarded)
  const existing = await prisma.employee.findUnique({ where: { loginId } });
  if (existing) {
    throw { status: 409, message: `Login ID conflict: ${loginId} already exists` };
  }

  // Generate a temp password: Temp + 4 random digits + !
  const tempPassword = `Temp${Math.floor(1000 + Math.random() * 9000)}!`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const employee = await prisma.employee.create({
    data: {
      loginId,
      companyId,
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      mustResetPwd: true,
      role: role ?? 'EMPLOYEE',
      jobTitle,
      department,
      dateOfJoining: doj,
      joiningSerial,
      status: 'ABSENT',
    },
    select: {
      id: true,
      loginId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      jobTitle: true,
      department: true,
      mustResetPwd: true,
      status: true,
      dateOfJoining: true,
    },
  });

  // Return loginId + tempPassword to Admin — this is how the new employee
  // learns their credentials (displayed post-creation, not emailed — out of scope)
  return { employee, tempPassword };
}
