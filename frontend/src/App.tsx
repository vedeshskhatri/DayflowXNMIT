import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AppBackground } from './components/AppBackground';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ResetPassword } from './pages/ResetPassword';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { ProfilePage } from './pages/ProfilePage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { SalaryPage } from './pages/SalaryPage';

// Protected layout wrapper
const ProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center relative overflow-hidden">
        <AppBackground />
        <div className="flex flex-col items-center space-y-3 relative z-10">
          <div className="w-8 h-8 border-3 border-slate-brand/20 border-t-slate-brand rounded-full animate-spin" />
          <span className="text-sm text-text-muted font-medium">Loading Dayflow...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustResetPwd) {
    return <Navigate to="/reset-password" replace />;
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-x-hidden">
      <AppBackground />
      <Navbar />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

// Reset Password protection wrapper
const ResetPasswordGuard: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <ResetPassword />;
};

// Admin Salary route guard
const AdminSalaryGuard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN' && user?.role !== 'HR_OFFICER') {
    return <Navigate to="/salary" replace />;
  }
  return <SalaryPage />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPasswordGuard />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<EmployeesPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/timeoff" element={<TimeOffPage />} />
              <Route path="/salary" element={<SalaryPage />} />
              <Route path="/salary/:employeeId" element={<AdminSalaryGuard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
