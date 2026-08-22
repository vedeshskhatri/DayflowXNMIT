import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeAttendanceView } from '../components/EmployeeAttendanceView';
import { AdminAttendanceView } from '../components/AdminAttendanceView';
import { ShieldCheck, User } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';
  const [adminTab, setAdminTab] = useState<'company' | 'mine'>('company');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn font-sans">
      {/* Admin View Mode Switcher */}
      {isAdmin && (
        <div className="flex items-center justify-between pb-2 border-b border-blue-grey/15">
          <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-blue-grey/25 shadow-xs">
            <button
              onClick={() => setAdminTab('company')}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center space-x-2 ${
                adminTab === 'company'
                  ? 'bg-slate-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-cream'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Company Attendance (Admin View)</span>
            </button>
            <button
              onClick={() => setAdminTab('mine')}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center space-x-2 ${
                adminTab === 'mine'
                  ? 'bg-slate-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-cream'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Attendance (Personal View)</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-sage-light" />
            <span>Role: <strong className="text-text-primary">{user.role}</strong></span>
          </span>
        </div>
      )}

      {/* Main View Area */}
      {isAdmin ? (
        adminTab === 'company' ? (
          <AdminAttendanceView />
        ) : (
          <EmployeeAttendanceView />
        )
      ) : (
        <EmployeeAttendanceView />
      )}
    </div>
  );
};
