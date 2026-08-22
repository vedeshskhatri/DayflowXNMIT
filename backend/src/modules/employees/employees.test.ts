import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import prisma from '../../lib/prisma';

// Mock prisma client
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    employee: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    timeOffRequest: {
      findMany: jest.fn(),
    },
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function createAuthCookie(payload: { employeeId: string; companyId: string; role: string }) {
  const token = jwt.sign(payload, JWT_SECRET);
  return `token=${token}`;
}

describe('GET /employees', () => {
  const companyId = 'company-dx';
  const otherCompanyId = 'company-other';
  const authCookie = createAuthCookie({
    employeeId: 'emp-admin',
    companyId,
    role: 'ADMIN',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app).get('/employees');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it("should return only employees in requester's companyId, never another company's", async () => {
    (prisma.employee.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'emp-1',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@dx.com',
        jobTitle: 'Developer',
        department: 'Tech',
        profilePicUrl: null,
      },
    ]);
    (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/employees')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId },
      })
    );
    expect(prisma.employee.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: otherCompanyId },
      })
    );
    expect(res.body).toHaveLength(1);
    expect(res.body[0].firstName).toBe('Alice');
  });

  it('response objects must never contain salary, passwordHash, or personalEmail fields', async () => {
    (prisma.employee.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'emp-1',
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@dx.com',
        jobTitle: 'HR',
        department: 'People',
        profilePicUrl: null,
      },
    ]);
    (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/employees')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const emp = res.body[0];
    expect(emp.salary).toBeUndefined();
    expect(emp.passwordHash).toBeUndefined();
    expect(emp.personalEmail).toBeUndefined();
  });

  it('an employee with no Attendance row today has status ABSENT', async () => {
    (prisma.employee.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'emp-absent',
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie@dx.com',
        jobTitle: 'QA',
        department: 'Tech',
        profilePicUrl: null,
      },
    ]);
    (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/employees')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('emp-absent');
    expect(res.body[0].status).toBe('ABSENT');
  });

  it('an employee with today checkIn set and checkOut null has status PRESENT', async () => {
    (prisma.employee.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'emp-present',
        firstName: 'Dana',
        lastName: 'Scully',
        email: 'dana@dx.com',
        jobTitle: 'Investigator',
        department: 'Ops',
        profilePicUrl: null,
      },
    ]);
    (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
      {
        employeeId: 'emp-present',
        checkIn: new Date(),
        checkOut: null,
      },
    ]);
    (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/employees')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('emp-present');
    expect(res.body[0].status).toBe('PRESENT');
  });

  it('an employee with an approved TimeOff record covering today has status ON_LEAVE, even if they also checked in', async () => {
    (prisma.employee.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'emp-leave',
        firstName: 'Fox',
        lastName: 'Mulder',
        email: 'fox@dx.com',
        jobTitle: 'Agent',
        department: 'Ops',
        profilePicUrl: null,
      },
    ]);
    // Even if attendance has checkIn set
    (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
      {
        employeeId: 'emp-leave',
        checkIn: new Date(),
        checkOut: null,
      },
    ]);
    // Approved TimeOff request is present
    (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([
      {
        employeeId: 'emp-leave',
      },
    ]);

    const res = await request(app)
      .get('/employees')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('emp-leave');
    expect(res.body[0].status).toBe('ON_LEAVE');
  });
});
