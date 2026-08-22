import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeAttendanceView } from '../components/EmployeeAttendanceView';
import { AdminAttendanceView } from '../components/AdminAttendanceView';
import { api } from '../lib/api';

// Socket event listener store
const socketListeners: Record<string, Function[]> = {};

vi.mock('../lib/socket', () => ({
  getSocket: () => ({
    on: (event: string, callback: Function) => {
      if (!socketListeners[event]) socketListeners[event] = [];
      socketListeners[event].push(callback);
    },
    off: (event: string, callback: Function) => {
      if (socketListeners[event]) {
        socketListeners[event] = socketListeners[event].filter((cb) => cb !== callback);
      }
    },
    emit: vi.fn(),
  }),
}));

const mockUser = {
  id: 'emp-1',
  loginId: 'DXRA20260001',
  companyId: 'company-dx',
  firstName: 'Rahul',
  lastName: 'Verma',
  email: 'rahul@dayflow.internal',
  role: 'ADMIN' as const,
  status: 'PRESENT' as const,
  dateOfJoining: '2026-01-01',
  joiningSerial: 1,
  mustResetPwd: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
  }),
}));

describe('Attendance List Views (Frontend)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(socketListeners).forEach((k) => delete socketListeners[k]);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });
  });

  const renderWithQuery = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('EmployeeAttendanceView', () => {
    const mockEmployeeData = {
      records: [
        {
          date: new Date().toISOString().split('T')[0],
          checkIn: '2026-08-18T09:00:00.000Z',
          checkOut: '2026-08-18T17:30:00.000Z',
          workHours: 8.5,
          extraHours: 0.5,
        },
      ],
      summary: {
        daysPresent: 4,
        leavesTaken: 1,
        totalWorkingDays: 5,
      },
    };

    it('summary bar renders daysPresent, leavesTaken, totalWorkingDays from the API response', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: mockEmployeeData });

      renderWithQuery(<EmployeeAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('summary-days-present')).toHaveTextContent('4');
        expect(screen.getByTestId('summary-leaves-taken')).toHaveTextContent('1');
        expect(screen.getByTestId('summary-total-working-days')).toHaveTextContent('5');
      });
    });

    it('prev/next week buttons change the fetched date range', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: mockEmployeeData });

      renderWithQuery(<EmployeeAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('summary-days-present')).toBeInTheDocument();
      });

      // Click Previous Week
      const prevBtn = screen.getByTestId('btn-prev-week');
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledTimes(2);
      });

      // Click Previous Week again
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledTimes(3);
      });
    });

    it('replaces table with stacked cards layout below md breakpoint', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: mockEmployeeData });

      renderWithQuery(<EmployeeAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop-attendance-table')).toBeInTheDocument();
      });

      const desktopTable = screen.getByTestId('desktop-attendance-table');
      const mobileCards = screen.getByTestId('mobile-attendance-cards');

      // Desktop table is hidden on mobile via hidden md:block
      expect(desktopTable).toHaveClass('hidden');
      expect(desktopTable).toHaveClass('md:block');

      // Mobile cards are shown on mobile and hidden on md+ via block md:hidden
      expect(mobileCards).toHaveClass('block');
      expect(mobileCards).toHaveClass('md:hidden');
    });

    it('attendance:checkin socket event updates row without full refetch', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: mockEmployeeData });

      renderWithQuery(<EmployeeAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('summary-days-present')).toBeInTheDocument();
      });

      expect(getSpy).toHaveBeenCalledTimes(1);

      // Simulate socket event for current user
      const checkinCallbacks = socketListeners['attendance:checkin'] || [];
      act(() => {
        checkinCallbacks.forEach((cb) => cb({ employeeId: 'emp-1' }));
      });

      // Query invalidation triggers cache sync
      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('AdminAttendanceView', () => {
    const mockAdminData = [
      {
        employee: {
          id: 'emp-1',
          firstName: 'Priya',
          lastName: 'Sharma',
          profilePicUrl: null,
          jobTitle: 'Lead Designer',
          department: 'Design',
        },
        checkIn: '2026-08-18T09:15:00.000Z',
        checkOut: null,
        workHours: null,
        extraHours: null,
      },
    ];

    it('typing in the search bar debounces before firing the API call', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: mockAdminData });

      renderWithQuery(<AdminAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-search-input')).toBeInTheDocument();
      });

      // Initial call on mount
      expect(getSpy).toHaveBeenCalledTimes(1);

      const searchInput = screen.getByTestId('admin-search-input');

      // Type multiple characters in rapid succession
      fireEvent.change(searchInput, { target: { value: 'P' } });
      fireEvent.change(searchInput, { target: { value: 'Pr' } });
      fireEvent.change(searchInput, { target: { value: 'Priya' } });

      // Before debounce time elapses, no extra API calls fired immediately
      expect(getSpy).toHaveBeenCalledTimes(1);

      // Wait for debounce window (300ms)
      await waitFor(
        () => {
          expect(getSpy).toHaveBeenCalledTimes(2);
          expect(getSpy).toHaveBeenLastCalledWith(expect.stringContaining('search=Priya'));
        },
        { timeout: 1500 }
      );
    });

    it('prev/next date buttons update the fetched date', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: mockAdminData });

      renderWithQuery(<AdminAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-date-display')).toBeInTheDocument();
      });

      // Click Previous Day
      const prevBtn = screen.getByTestId('btn-prev-day');
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledTimes(2);
      });

      // Click Previous Day again
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledTimes(3);
      });
    });

    it('replaces table with stacked cards layout below md breakpoint in admin view', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: mockAdminData });

      renderWithQuery(<AdminAttendanceView />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop-admin-table')).toBeInTheDocument();
      });

      const desktopTable = screen.getByTestId('desktop-admin-table');
      const mobileCards = screen.getByTestId('mobile-admin-cards');

      expect(desktopTable).toHaveClass('hidden');
      expect(desktopTable).toHaveClass('md:block');

      expect(mobileCards).toHaveClass('block');
      expect(mobileCards).toHaveClass('md:hidden');
    });
  });
});
