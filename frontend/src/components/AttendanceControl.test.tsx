import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AttendanceControl } from './AttendanceControl';
import { api } from '../lib/api';

const mockUser = {
  id: 'emp-1',
  loginId: 'DXRA20260001',
  companyId: 'company-dx',
  firstName: 'Rahul',
  lastName: 'Verma',
  email: 'rahul@dayflow.internal',
  role: 'EMPLOYEE' as const,
  status: 'ABSENT' as const,
  dateOfJoining: '2026-01-01',
  joiningSerial: 1,
  mustResetPwd: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    updateUser: vi.fn(),
  }),
}));

describe('AttendanceControl (Check In / Check Out UI)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AttendanceControl />
      </QueryClientProvider>
    );
  };

  it('on mount, if no attendance row today, Check In button renders and Check Out does not', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: null });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('checkin-button')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('checkout-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completed-badge')).not.toBeInTheDocument();
  });

  it('after a successful Check In click, UI switches to showing Check Out immediately without waiting for a socket event', async () => {
    const user = userEvent.setup();

    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: null });
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        message: 'Checked in successfully',
        attendance: {
          checkIn: new Date().toISOString(),
          checkOut: null,
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('checkin-button')).toBeInTheDocument();
    });

    const checkInBtn = screen.getByTestId('checkin-button');
    await user.click(checkInBtn);

    // Optimistic / immediate swap
    await waitFor(() => {
      expect(screen.getByTestId('checkout-button')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('checkin-button')).not.toBeInTheDocument();
    expect(postSpy).toHaveBeenCalledWith('/attendance/checkin');
  });

  it('Check In button is hidden/not shown if checkIn is already set for today', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        checkIn: new Date().toISOString(),
        checkOut: null,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('checkout-button')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('checkin-button')).not.toBeInTheDocument();
  });

  it('Check Out button is hidden and Completed state shown if checkOut is already set for today', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        checkIn: new Date(Date.now() - 8 * 3600000).toISOString(),
        checkOut: new Date().toISOString(),
        workHours: 8.0,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('completed-badge')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('checkin-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checkout-button')).not.toBeInTheDocument();
    expect(screen.getByText(/Done today/i)).toBeInTheDocument();
  });

  it('a failed checkin API call (400) shows an error message and does not swap the button', async () => {
    const user = userEvent.setup();

    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: null });
    vi.spyOn(api, 'post').mockRejectedValueOnce({
      response: {
        data: {
          error: 'You are already checked in. Please check out before checking in again.',
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('checkin-button')).toBeInTheDocument();
    });

    const checkInBtn = screen.getByTestId('checkin-button');
    await user.click(checkInBtn);

    await waitFor(() => {
      expect(screen.getByTestId('attendance-error')).toBeInTheDocument();
      expect(screen.getByTestId('attendance-error')).toHaveTextContent(/already checked in/i);
    });

    // Check In button remains / is restored
    expect(screen.getByTestId('checkin-button')).toBeInTheDocument();
  });
});
