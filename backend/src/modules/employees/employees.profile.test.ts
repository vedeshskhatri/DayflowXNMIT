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
      update: jest.fn(),
    },
    skill: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    certification: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    timeOffRequest: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) =>
      callback({
        employee: { update: jest.fn() },
        skill: { deleteMany: jest.fn(), createMany: jest.fn() },
        certification: { deleteMany: jest.fn(), createMany: jest.fn() },
      })
    ),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function createAuthCookie(payload: { employeeId: string; companyId: string; role: string }) {
  const token = jwt.sign(payload, JWT_SECRET);
  return `token=${token}`;
}

describe('Employee Profile API (GET/PATCH /employees/:id)', () => {
  const companyId = 'company-dx';
  const ownEmployeeId = 'emp-self';
  const otherEmployeeId = 'emp-other';

  const employeeCookie = createAuthCookie({
    employeeId: ownEmployeeId,
    companyId,
    role: 'EMPLOYEE',
  });

  const adminCookie = createAuthCookie({
    employeeId: 'emp-admin',
    companyId,
    role: 'ADMIN',
  });

  const mockEmployeeRecord = {
    id: ownEmployeeId,
    loginId: 'DXSE20260001',
    companyId,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@dx.com',
    phone: '9876543210',
    role: 'EMPLOYEE',
    profilePicUrl: null,
    bio: 'Software Engineer',
    jobLove: 'Building products',
    interests: 'Open source',
    dateOfBirth: new Date('1995-05-15'),
    address: '123 Main St',
    personalEmail: 'jane.personal@gmail.com',
    gender: 'Female',
    maritalStatus: 'Single',
    jobTitle: 'Senior Dev',
    department: 'Engineering',
    dateOfJoining: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    skills: [{ id: 's1', name: 'TypeScript' }],
    certifications: [{ id: 'c1', name: 'AWS' }],
    salary: {
      monthlyWage: 100000,
      compositionType: 'PERCENTAGE',
      workingDaysPerWeek: 5,
      pfPercent: 12,
      professionalTax: 200,
      components: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /employees/:id', () => {
    it('GET as a non-Admin: response has no salary fields', async () => {
      // For non-admin, salary selection is false in Prisma
      const recordWithoutSalary = { ...mockEmployeeRecord, salary: undefined };
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(recordWithoutSalary);

      const res = await request(app)
        .get(`/employees/${ownEmployeeId}`)
        .set('Cookie', [employeeCookie]);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ownEmployeeId);
      expect(res.body.salary).toBeUndefined();
    });

    it('GET as Admin: response includes salary fields', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployeeRecord);

      const res = await request(app)
        .get(`/employees/${ownEmployeeId}`)
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.salary).toBeDefined();
      expect(res.body.salary.monthlyWage).toBe(100000);
    });
  });

  describe('PATCH /employees/:id', () => {
    it('PATCH own record with an allowed field (e.g. bio): 200, field updates', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployeeRecord);

      const res = await request(app)
        .patch(`/employees/${ownEmployeeId}`)
        .set('Cookie', [employeeCookie])
        .send({
          bio: 'Updated bio by self',
        });

      expect(res.status).toBe(200);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('PATCH own record with a disallowed field (e.g. email): 403, field unchanged', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployeeRecord);

      const res = await request(app)
        .patch(`/employees/${ownEmployeeId}`)
        .set('Cookie', [employeeCookie])
        .send({
          email: 'newemail@hacked.com',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Field\(s\) not allowed: email/i);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("PATCH another employee's record as a non-Admin: 403", async () => {
      const res = await request(app)
        .patch(`/employees/${otherEmployeeId}`)
        .set('Cookie', [employeeCookie])
        .send({
          bio: 'Trying to update someone else',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/only edit your own profile/i);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('PATCH any field on any employee as Admin: 200', async () => {
      (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
        ...mockEmployeeRecord,
        id: otherEmployeeId,
      });

      const res = await request(app)
        .patch(`/employees/${otherEmployeeId}`)
        .set('Cookie', [adminCookie])
        .send({
          department: 'Executive',
          jobTitle: 'VP Engineering',
          phone: '9876543210',
        });

      expect(res.status).toBe(200);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    describe('Zod validation rules', () => {
      it('phone with != 10 digits is rejected with 400', async () => {
        (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployeeRecord);

        const res = await request(app)
          .patch(`/employees/${ownEmployeeId}`)
          .set('Cookie', [employeeCookie])
          .send({
            phone: '12345', // only 5 digits
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(JSON.stringify(res.body.details)).toMatch(/10 digits/);
      });

      it('dateOfBirth in the future is rejected with 400', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);

        const res = await request(app)
          .patch(`/employees/${otherEmployeeId}`)
          .set('Cookie', [adminCookie])
          .send({
            dateOfBirth: futureDate.toISOString().split('T')[0],
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(JSON.stringify(res.body.details)).toMatch(/past/i);
      });

      it('dateOfBirth that makes employee < 18 at dateOfJoining is rejected with 400', async () => {
        const res = await request(app)
          .patch(`/employees/${otherEmployeeId}`)
          .set('Cookie', [adminCookie])
          .send({
            dateOfBirth: '2010-01-01',
            dateOfJoining: '2024-01-01', // age 14 at joining (< 18)
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(JSON.stringify(res.body.details)).toMatch(/18 years old at date of joining/i);
      });

      it('dateOfJoining in the future is rejected with 400', async () => {
        const futureJoinDate = new Date();
        futureJoinDate.setFullYear(futureJoinDate.getFullYear() + 1);

        const res = await request(app)
          .patch(`/employees/${otherEmployeeId}`)
          .set('Cookie', [adminCookie])
          .send({
            dateOfJoining: futureJoinDate.toISOString().split('T')[0],
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(JSON.stringify(res.body.details)).toMatch(/future/i);
      });
    });
  });
});
