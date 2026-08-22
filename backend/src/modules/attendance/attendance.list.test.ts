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

describe('Attendance List Views API (GET /attendance and GET /attendance/all)', () => {
  const companyId = 'company-dx';
  const employeeId = 'emp-123';

  const employeeCookie = createAuthCookie({
    employeeId,
    companyId,
    role: 'EMPLOYEE',
  });

  const adminCookie = createAuthCookie({
    employeeId: 'emp-admin',
    companyId,
    role: 'ADMIN',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /attendance (Own weekly records)', () => {
    it("with no query params defaults to the current week (Mon-Sun of today's week)", async () => {
      const now = new Date();
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const expectedMonday = new Date(now);
      expectedMonday.setDate(now.getDate() + diffToMon);
      expectedMonday.setHours(0, 0, 0, 0);

      const expectedSunday = new Date(expectedMonday);
      expectedSunday.setDate(expectedMonday.getDate() + 6);
      expectedSunday.setHours(23, 59, 59, 999);

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'att-1',
          employeeId,
          date: expectedMonday,
          checkIn: new Date(expectedMonday.getTime() + 9 * 3600000),
          checkOut: new Date(expectedMonday.getTime() + 17.5 * 3600000),
          workHours: 8.5,
          extraHours: 0.5,
        },
      ]);
      (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/attendance')
        .set('Cookie', [employeeCookie]);

      expect(res.status).toBe(200);
      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId,
            date: expect.objectContaining({
              gte: expectedMonday,
              lte: expectedSunday,
            }),
          }),
        })
      );
      expect(res.body.records).toHaveLength(1);
      expect(res.body.records[0].date).toBe(expectedMonday.toISOString().split('T')[0]);
    });

    it('with from/to returns only rows in that specified range', async () => {
      const from = '2026-08-01';
      const to = '2026-08-07';

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'att-1',
          employeeId,
          date: new Date('2026-08-03T00:00:00'),
          checkIn: new Date('2026-08-03T09:00:00'),
          checkOut: new Date('2026-08-03T17:00:00'),
          workHours: 8.0,
          extraHours: 0,
        },
      ]);
      (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get(`/attendance?from=${from}&to=${to}`)
        .set('Cookie', [employeeCookie]);

      expect(res.status).toBe(200);
      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId,
            date: expect.objectContaining({
              gte: new Date(`${from}T00:00:00`),
              lte: new Date(`${to}T23:59:59.999`),
            }),
          }),
        })
      );
      expect(res.body.records).toHaveLength(1);
    });

    it("summary object's daysPresent, leavesTaken, totalWorkingDays are numerically correct against fixture data", async () => {
      const from = '2026-08-17'; // Monday
      const to = '2026-08-23';   // Sunday (5 working days: Mon-Fri)

      // 3 days attended
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'a1',
          employeeId,
          date: new Date('2026-08-17'),
          checkIn: new Date('2026-08-17T09:00:00'),
          checkOut: new Date('2026-08-17T17:00:00'),
          workHours: 8.0,
        },
        {
          id: 'a2',
          employeeId,
          date: new Date('2026-08-18'),
          checkIn: new Date('2026-08-18T09:00:00'),
          checkOut: new Date('2026-08-18T17:00:00'),
          workHours: 8.0,
        },
        {
          id: 'a3',
          employeeId,
          date: new Date('2026-08-19'),
          checkIn: new Date('2026-08-19T09:00:00'),
          checkOut: new Date('2026-08-19T17:00:00'),
          workHours: 8.0,
        },
      ]);

      // 2 days approved leave
      (prisma.timeOffRequest.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'to1',
          employeeId,
          daysCount: 2,
          status: 'APPROVED',
        },
      ]);

      const res = await request(app)
        .get(`/attendance?from=${from}&to=${to}`)
        .set('Cookie', [employeeCookie]);

      expect(res.status).toBe(200);
      expect(res.body.summary).toEqual({
        daysPresent: 3,
        leavesTaken: 2,
        totalWorkingDays: 5,
      });
    });
  });

  describe('GET /attendance/all (Admin daily view)', () => {
    it('GET /attendance/all as a non-Admin returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/attendance/all')
        .set('Cookie', [employeeCookie]);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /attendance/all with ?search=<partial name> returns only matching employees case-insensitively', async () => {
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'emp-1',
          firstName: 'Swapnil',
          lastName: 'Khatri',
          profilePicUrl: null,
          jobTitle: 'Developer',
          department: 'Tech',
        },
      ]);
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/attendance/all?search=swap')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
            OR: expect.arrayContaining([
              { firstName: { contains: 'swap', mode: 'insensitive' } },
              { lastName: { contains: 'swap', mode: 'insensitive' } },
            ]),
          }),
        })
      );
      expect(res.body).toHaveLength(1);
      expect(res.body[0].employee.firstName).toBe('Swapnil');
    });

    it('GET /attendance/all with no ?date= defaults to today', async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      (prisma.employee.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'emp-1',
          firstName: 'Swapnil',
          lastName: 'Khatri',
          profilePicUrl: null,
        },
      ]);
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'att-1',
          employeeId: 'emp-1',
          checkIn: new Date(),
          checkOut: null,
          workHours: null,
          extraHours: null,
        },
      ]);

      const res = await request(app)
        .get('/attendance/all')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employee: { companyId },
            date: expect.objectContaining({
              gte: todayStart,
              lte: todayEnd,
            }),
          }),
        })
      );
      expect(res.body).toHaveLength(1);
      expect(res.body[0].checkIn).toBeDefined();
    });
  });
});
