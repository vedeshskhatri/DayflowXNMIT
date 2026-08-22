import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeProfileView } from '../components/EmployeeProfileView';
import { TagInput } from '../components/TagInput';
import { api } from '../lib/api';

// Dynamic mock auth user
let currentAuthUser = {
  id: 'emp-123',
  role: 'EMPLOYEE' as 'EMPLOYEE' | 'ADMIN' | 'HR_OFFICER',
  companyId: 'company-dx',
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: currentAuthUser,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

const mockProfileData = {
  id: 'emp-123',
  loginId: 'DXPR20260001',
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@dayflow.internal',
  phone: '9876543210',
  role: 'EMPLOYEE',
  profilePicUrl: null,
  bio: 'Product Designer with 5 years experience',
  jobLove: 'Designing intuitive user interfaces',
  interests: 'Painting and photography',
  dateOfBirth: '1996-08-15',
  dateOfJoining: '2024-01-10',
  address: '42 MG Road, Bangalore',
  personalEmail: 'priya.personal@gmail.com',
  gender: 'Female',
  maritalStatus: 'Single',
  jobTitle: 'Lead Designer',
  department: 'Design',
  skills: [{ id: 's1', name: 'Figma' }, { id: 's2', name: 'UI/UX' }],
  certifications: [{ id: 'c1', name: 'Nielsen Norman UX' }],
  salary: {
    monthlyWage: 95000,
    compositionType: 'PERCENTAGE',
  },
};

describe('Employee Profile Module (Frontend)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthUser = {
      id: 'emp-123',
      role: 'EMPLOYEE',
      companyId: 'company-dx',
    };
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

  it('/profile renders in editable mode with form inputs for About and Private Info', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockProfileData });

    renderWithProviders(<EmployeeProfileView employeeId="emp-123" editable={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Priya Sharma');
    });

    // Editable form is present
    expect(screen.getByTestId('profile-editable-form')).toBeInTheDocument();

    // About tab inputs
    expect(screen.getByTestId('input-bio')).toBeInTheDocument();
    expect(screen.getByTestId('input-joblove')).toBeInTheDocument();
    expect(screen.getByTestId('input-interests')).toBeInTheDocument();

    // Switch to Private Info tab
    const privateTabBtn = screen.getByTestId('tab-button-private');
    fireEvent.click(privateTabBtn);

    // Private Info inputs
    expect(screen.getByTestId('input-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-address')).toBeInTheDocument();
    expect(screen.getByTestId('input-photo-file')).toBeInTheDocument();
  });

  it('/profile does NOT render or fetch the Salary Info tab when the logged-in user is not Admin', async () => {
    currentAuthUser.role = 'EMPLOYEE';
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockProfileData });

    renderWithProviders(<EmployeeProfileView employeeId="emp-123" editable={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toBeInTheDocument();
    });

    // Salary Info tab button must NOT exist
    expect(screen.queryByTestId('tab-button-salary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('salary-info-tab')).not.toBeInTheDocument();
  });

  it('/profile renders and fetches the Salary Info tab when the logged-in user is Admin', async () => {
    currentAuthUser.role = 'ADMIN';
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockProfileData });

    renderWithProviders(<EmployeeProfileView employeeId="emp-123" editable={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toBeInTheDocument();
    });

    // Salary Info tab button MUST exist
    const salaryTabBtn = screen.getByTestId('tab-button-salary');
    expect(salaryTabBtn).toBeInTheDocument();

    // Click Salary Info tab
    fireEvent.click(salaryTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('salary-info-tab')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Salary Info/i })).toBeInTheDocument();
    });
  });

  it('/employees/:id renders every tab as read-only plain text with zero form inputs present', async () => {
    // Both for Admin or non-Admin
    currentAuthUser.role = 'ADMIN';
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockProfileData });

    renderWithProviders(<EmployeeProfileView employeeId="emp-123" editable={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toBeInTheDocument();
    });

    // Form should NOT be present
    expect(screen.queryByTestId('profile-editable-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-readonly-view')).toBeInTheDocument();

    // Zero input/textarea elements in About tab
    expect(screen.queryByTestId('input-bio')).not.toBeInTheDocument();
    expect(screen.queryByTestId('input-phone')).not.toBeInTheDocument();
    expect(screen.getByText('Product Designer with 5 years experience')).toBeInTheDocument();

    // Switch to Private tab in read-only mode
    const privateTabBtn = screen.getByTestId('tab-button-private');
    fireEvent.click(privateTabBtn);

    expect(screen.queryByTestId('input-address')).not.toBeInTheDocument();
    expect(screen.getByText('42 MG Road, Bangalore')).toBeInTheDocument();
  });

  describe('TagInput component', () => {
    it('typing text + Enter adds a chip; Backspace on empty input removes the last chip; clicking × removes a specific chip', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          label="Skills"
          value={['React', 'TypeScript']}
          onChange={onChange}
        />
      );

      expect(screen.getByTestId('tag-chip-React')).toBeInTheDocument();
      expect(screen.getByTestId('tag-chip-TypeScript')).toBeInTheDocument();

      const input = screen.getByTestId('tag-text-input-skills');

      // 1. Typing text + Enter adds a chip
      await user.type(input, 'GraphQL{enter}');
      expect(onChange).toHaveBeenCalledWith(['React', 'TypeScript', 'GraphQL']);

      // 2. Backspace on empty input removes last chip
      await user.keyboard('{backspace}');
      expect(onChange).toHaveBeenCalledWith(['React']);

      // 3. Clicking × removes specific chip
      const removeReactBtn = screen.getByTestId('remove-tag-React');
      await user.click(removeReactBtn);
      expect(onChange).toHaveBeenCalledWith(['TypeScript']);
    });
  });

  it('submitting the form with an invalid phone shows an inline Zod error and does not fire the PATCH request', async () => {
    const user = userEvent.setup();
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValue({ data: mockProfileData });
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockProfileData });

    renderWithProviders(<EmployeeProfileView employeeId="emp-123" editable={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toBeInTheDocument();
    });

    // Go to Private Info tab to access phone input
    const privateTabBtn = screen.getByTestId('tab-button-private');
    await user.click(privateTabBtn);

    const phoneInput = screen.getByTestId('input-phone');
    await user.clear(phoneInput);
    await user.type(phoneInput, '12345'); // invalid: 5 digits instead of 10

    const saveBtn = screen.getByTestId('save-profile-button');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('error-phone')).toHaveTextContent(/Phone must be exactly 10 digits/i);
    });

    expect(patchSpy).not.toHaveBeenCalled();
  });
});
