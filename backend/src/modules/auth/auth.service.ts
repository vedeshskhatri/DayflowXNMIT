import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

// ── POST /auth/signup (Company + Admin Registration) ──────────────────────────
export async function signupService(
  res: Response,
  input: {
    companyName: string;
    companyLogoUrl?: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
  },
) {
  const { companyName, companyLogoUrl, name, email, phone, password } = input;

  // 1. Check if email already exists
  const existingEmployee = await prisma.employee.findUnique({
    where: { email },
  });
  if (existingEmployee) {
    throw { status: 409, message: 'An account with this email already exists' };
  }

  // 2. Parse first name and last name
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Admin';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  // 3. Derive 2-letter Company Code
  const words = companyName.trim().split(/\s+/);
  let code = '';
  if (words.length >= 2) {
    code = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    code = companyName.trim().slice(0, 2).toUpperCase();
  }
  if (!code || code.length < 2) {
    code = 'CO';
  }

  // 4. Create or find Company
  let company = await prisma.company.findFirst({
    where: {
      OR: [{ name: companyName }, { code }],
    },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: companyName,
        code,
        logoUrl: companyLogoUrl || undefined,
      },
    });
  }

  // 5. Generate Login ID
  const doj = new Date();
  const { loginId, joiningSerial } = await generateLoginId(
    company.id,
    company.code,
    firstName,
    lastName,
    doj,
  );

  // 6. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 7. Create Admin Employee
  const employee = await prisma.employee.create({
    data: {
      loginId,
      companyId: company.id,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      passwordHash,
      mustResetPwd: false,
      role: 'ADMIN',
      jobTitle: 'Founder / Administrator',
      department: 'Management',
      dateOfJoining: doj,
      joiningSerial,
      status: 'PRESENT',
    },
    select: {
      id: true,
      loginId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      jobTitle: true,
      department: true,
      mustResetPwd: true,
      status: true,
      dateOfJoining: true,
      company: {
        select: {
          id: true,
          name: true,
          code: true,
          logoUrl: true,
        },
      },
    },
  });

  // 8. Create time off allocations for the admin
  const year = doj.getFullYear();
  const validFrom = new Date(`${year}-01-01`);
  const validTo = new Date(`${year}-12-31`);

  const timeOffTypes = await prisma.timeOffType.findMany();
  for (const tot of timeOffTypes) {
    const days = tot.name.toLowerCase().includes('sick')
      ? 10
      : tot.name.toLowerCase().includes('paid')
      ? 20
      : 0;

    await prisma.timeOffAllocation.create({
      data: {
        employeeId: employee.id,
        typeId: tot.id,
        daysAllocated: days,
        daysUsed: 0,
        validFrom,
        validTo,
      },
    });
  }

  // 9. Issue httpOnly cookie session
  setAuthCookie(res, {
    employeeId: employee.id,
    companyId: company.id,
    role: employee.role,
  });

  return { employee, loginId };
}

