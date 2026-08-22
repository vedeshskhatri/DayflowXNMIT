import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeesPage } from './EmployeesPage';
import { EmployeeCard, StatusDot } from '../components/EmployeeCard';
import { api } from '../lib/api';

// Socket event listeners map for mocking
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

const mockLoggedInUser = {
  id: 'emp-own',
  loginId: 'DXOW0001',
  companyId: 'company-dx',
  firstName: 'Own',
  lastName: 'User',
  email: 'own@dayflow.internal',
  role: 'EMPLOYEE' as const,
  status: 'PRESENT' as const,
  dateOfJoining: '2026-01-01',
  joiningSerial: 1,
  mustResetPwd: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockLoggedInUser,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

describe('Employees Dashboard & Cards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(socketListeners).forEach((k) => delete socketListeners[k]);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders 1/2/3 columns responsive grid classes on container (mobile 1 col, md 2 col, lg 3 col)', async () => {
    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/employees') {
        return Promise.resolve({
          data: [
            {
              id: 'emp-1',
              firstName: 'Sarah',
              lastName: 'Connor',
              email: 'sarah@dx.com',
              jobTitle: 'Security',
              department: 'Ops',
              profilePicUrl: null,
              status: 'PRESENT',
            },
          ],
        });
      }
      return Promise.resolve({ data: null });
    });

    renderWithProviders(<EmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    });

    const grid = screen.getByTestId('employee-card-grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
  });

  it('each status value renders the correct dot color and data-status attribute', () => {
    // 1. PRESENT -> Light Sage #BDCFAA
    const { unmount: unmount1 } = render(<StatusDot status="PRESENT" />);
    const presentDot = screen.getByTestId('status-dot');
    expect(presentDot).toHaveAttribute('data-status', 'PRESENT');
    expect(presentDot).toHaveStyle({ backgroundColor: '#BDCFAA' });
    unmount1();

    // 2. ON_LEAVE -> Deep Sage #8E9E83
    const { unmount: unmount2 } = render(<StatusDot status="ON_LEAVE" />);
    const leaveDot = screen.getByTestId('status-dot');
    expect(leaveDot).toHaveAttribute('data-status', 'ON_LEAVE');
    expect(leaveDot).toHaveStyle({ backgroundColor: '#8E9E83' });
    unmount2();

    // 3. ABSENT -> Terracotta #C97B63
    render(<StatusDot status="ABSENT" />);
    const absentDot = screen.getByTestId('status-dot');
    expect(absentDot).toHaveAttribute('data-status', 'ABSENT');
    expect(absentDot).toHaveStyle({ backgroundColor: '#C97B63' });
  });

  it('clicking an employee card navigates to /employees/:id', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/employees']}>
        <Routes>
          <Route
            path="/employees"
            element={
              <EmployeeCard
                id="emp-123"
                firstName="John"
                lastName="Doe"
                jobTitle="Developer"
                department="Engineering"
                status="PRESENT"
              />
            }
          />
          <Route path="/employees/:id" element={<div data-testid="profile-view">Profile Details for emp-123</div>} />
        </Routes>
      </MemoryRouter>
    );

    const cardLink = screen.getByRole('link');
    expect(cardLink).toHaveAttribute('href', '/employees/emp-123');

    await user.click(cardLink);

    expect(screen.getByTestId('profile-view')).toBeInTheDocument();
  });

  it("a presence:update socket event for another employee updates that employee's dot without a refetch", async () => {
    const mockEmployees = [
      {
        id: 'emp-other',
        firstName: 'Alice',
        lastName: 'Wonder',
        email: 'alice@dx.com',
        jobTitle: 'Designer',
        department: 'Product',
        profilePicUrl: null,
        status: 'ABSENT',
      },
    ];

    let employeesCallCount = 0;
    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/employees') {
        employeesCallCount++;
        return Promise.resolve({ data: mockEmployees });
      }
      return Promise.resolve({ data: null });
    });

    renderWithProviders(<EmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Wonder')).toBeInTheDocument();
    });

    const dots = screen.getAllByTestId('status-dot');
    expect(dots[0]).toHaveAttribute('data-status', 'ABSENT');

    // Simulate presence:update socket broadcast from server for Alice
    const presenceCallbacks = socketListeners['presence:update'] || [];
    expect(presenceCallbacks.length).toBeGreaterThan(0);

    // Call the callback with PRESENT
    act(() => {
      presenceCallbacks.forEach((cb) =>
        cb({
          employeeId: 'emp-other',
          status: 'PRESENT',
          name: 'Alice Wonder',
        })
      );
    });

    await waitFor(() => {
      const updatedDots = screen.getAllByTestId('status-dot');
      expect(updatedDots[0]).toHaveAttribute('data-status', 'PRESENT');
    });

    // Verify it did not trigger an extra API refetch
    expect(employeesCallCount).toBe(1);
  });

  it("a presence:update socket event where employeeId matches current user's own id is ignored", async () => {
    const mockEmployees = [
      {
        id: 'emp-own', // Same as logged in user id
        firstName: 'Own',
        lastName: 'User',
        email: 'own@dayflow.internal',
        jobTitle: 'Developer',
        department: 'Tech',
        profilePicUrl: null,
        status: 'PRESENT',
      },
    ];

    vi.spyOn(api, 'get').mockImplementation((url: string) => {
      if (url === '/employees') {
        return Promise.resolve({ data: mockEmployees });
      }
      return Promise.resolve({ data: null });
    });

    renderWithProviders(<EmployeesPage />);

    await waitFor(() => {
      expect(screen.getByText('Own User')).toBeInTheDocument();
    });

    const dots = screen.getAllByTestId('status-dot');
    expect(dots[0]).toHaveAttribute('data-status', 'PRESENT');

    // Simulate incoming presence:update socket event with status: 'ABSENT' for own id
    const presenceCallbacks = socketListeners['presence:update'] || [];
    act(() => {
      presenceCallbacks.forEach((cb) =>
        cb({
          employeeId: 'emp-own',
          status: 'ABSENT',
          name: 'Own User',
        })
      );
    });

    // Assert that the dot was NOT changed to ABSENT (ignored to prevent race condition)
    const currentDots = screen.getAllByTestId('status-dot');
    expect(currentDots[0]).toHaveAttribute('data-status', 'PRESENT');
  });
});
