import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import prisma from '../../lib/prisma';
import { emitToCompany } from '../../sockets';

// Mock prisma client
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    employee: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock socket emit helper
jest.mock('../../sockets', () => ({
  emitToCompany: jest.fn(),
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function createAuthCookie(payload: { employeeId: string; companyId: string; role: string }) {
  const token = jwt.sign(payload, JWT_SECRET);
  return `token=${token}`;
}

describe('Attendance Check-In & Check-Out API', () => {
  const companyId = 'company-dx';
  const employeeId = 'emp-123';
  const authCookie = createAuthCookie({
    employeeId,
    companyId,
    role: 'EMPLOYEE',
  });

  const mockEmployee = {
    id: employeeId,
    companyId,
    firstName: 'Rahul',
    lastName: 'Verma',
    role: 'EMPLOYEE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployee);
  });

  describe('POST /attendance/checkin', () => {
    it('first checkin of the day: 200, row created with checkIn set', async () => {
      // No existing attendance row today
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.create as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'att-1',
          ...data,
        })
      );

      const res = await request(app)
        .post('/attendance/checkin')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/checked in successfully/i);
      expect(res.body.attendance.checkIn).toBeDefined();
      expect(prisma.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId,
            checkIn: expect.any(Date),
          }),
        })
      );
    });

    it('second checkin same day without a checkout in between: 400', async () => {
      // Existing row with checkIn set, checkOut is null
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: new Date(Date.now() - 3600000), // 1 hour ago
        checkOut: null,
      });

      const res = await request(app)
        .post('/attendance/checkin')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already checked in/i);
      expect(prisma.attendance.create).not.toHaveBeenCalled();
      expect(prisma.attendance.update).not.toHaveBeenCalled();
    });

    it('checkin does not write to any persistent status field on Employee', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.create as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: new Date(),
      });

      await request(app)
        .post('/attendance/checkin')
        .set('Cookie', [authCookie]);

      // Employee table is never updated directly
      expect(prisma.employee.update).not.toHaveBeenCalled();
    });

    it('successful checkin emits attendance:checkin and presence:update via emitToCompany', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.create as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: new Date(),
      });

      await request(app)
        .post('/attendance/checkin')
        .set('Cookie', [authCookie]);

      expect(emitToCompany).toHaveBeenCalledWith(
        companyId,
        'attendance:checkin',
        expect.objectContaining({
          employeeId,
          name: 'Rahul Verma',
          checkIn: expect.any(String),
        })
      );

      expect(emitToCompany).toHaveBeenCalledWith(
        companyId,
        'presence:update',
        expect.objectContaining({
          employeeId,
          status: 'PRESENT',
          name: 'Rahul Verma',
        })
      );
    });
  });

  describe('POST /attendance/checkout', () => {
    it('checkout with no prior checkin today: 400', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/attendance/checkout')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/without a prior check-in/i);
      expect(prisma.attendance.update).not.toHaveBeenCalled();
    });

    it('checkout when checkout is already set: 400', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: new Date(Date.now() - 36000000),
        checkOut: new Date(Date.now() - 3600000),
      });

      const res = await request(app)
        .post('/attendance/checkout')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already checked out/i);
      expect(prisma.attendance.update).not.toHaveBeenCalled();
    });

    it('checkout after a valid checkin: 200, checkOut set, workHours and extraHours computed correctly', async () => {
      const checkInDate = new Date(Date.now() - 9.5 * 3600 * 1000); // 9.5 hours ago
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: checkInDate,
        checkOut: null,
      });

      (prisma.attendance.update as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'att-1',
          employeeId,
          checkIn: checkInDate,
          ...data,
        })
      );

      const res = await request(app)
        .post('/attendance/checkout')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/checked out successfully/i);

      // Verify work hours ~9.5h and extra hours (workHours - 8 standardHours) ~1.5h
      expect(prisma.attendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'att-1' },
          data: expect.objectContaining({
            checkOut: expect.any(Date),
            workHours: expect.closeTo(9.5, 0.1),
            extraHours: expect.closeTo(1.5, 0.1),
          }),
        })
      );
    });

    it('checkout does not write to any persistent status field on Employee', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: new Date(Date.now() - 8 * 3600 * 1000),
        checkOut: null,
      });
      (prisma.attendance.update as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkOut: new Date(),
      });

      await request(app)
        .post('/attendance/checkout')
        .set('Cookie', [authCookie]);

      expect(prisma.employee.update).not.toHaveBeenCalled();
    });

    it('successful checkout emits attendance:checkout only, not presence:update', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkIn: new Date(Date.now() - 8 * 3600 * 1000),
        checkOut: null,
      });
      (prisma.attendance.update as jest.Mock).mockResolvedValue({
        id: 'att-1',
        employeeId,
        checkOut: new Date(),
      });

      await request(app)
        .post('/attendance/checkout')
        .set('Cookie', [authCookie]);

      // Emits attendance:checkout
      expect(emitToCompany).toHaveBeenCalledWith(
        companyId,
        'attendance:checkout',
        expect.objectContaining({
          employeeId,
          name: 'Rahul Verma',
          checkOut: expect.any(String),
          workHours: expect.any(Number),
        })
      );

      // Does NOT emit presence:update
      expect(emitToCompany).not.toHaveBeenCalledWith(
        companyId,
        'presence:update',
        expect.anything()
      );
    });
  });
});
