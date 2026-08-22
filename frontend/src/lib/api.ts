import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

/**
 * Axios instance configured for Dayflow HRMS.
 * 
 * CRITICAL RULE:
 * `withCredentials: true` is required so that the httpOnly JWT cookie
 * is sent with every request and received properly across origins.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : 'http://localhost:4000');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export interface EmployeeProfile {
  id: string;
  loginId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: 'EMPLOYEE' | 'ADMIN' | 'HR_OFFICER';
  profilePicUrl?: string | null;
  bio?: string | null;
  jobLove?: string | null;
  interests?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  personalEmail?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  managerId?: string | null;
  dateOfJoining: string;
  joiningSerial: number;
  status: 'PRESENT' | 'ON_LEAVE' | 'ABSENT';
  mustResetPwd: boolean;
  company?: {
    name: string;
    code: string;
  };
}

export interface LoginResponse {
  message: string;
  employee: EmployeeProfile;
  mustResetPwd: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  employee: Partial<EmployeeProfile>;
}
