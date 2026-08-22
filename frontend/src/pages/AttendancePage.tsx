import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeAttendanceView } from '../components/EmployeeAttendanceView';
import { AdminAttendanceView } from '../components/AdminAttendanceView';
import { AttendanceControl } from '../components/AttendanceControl';
import { ShieldCheck, User } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';
  const [adminTab, setAdminTab] = useState<'company' | 'mine'>('company');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-navy/10">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-heading font-bold text-navy-dark">
              Attendance Tracking
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-copper-muted text-copper-dark border border-copper/30 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / HR View</span>
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Live check-in/out logs, working hours, and real-time company synchronization.
          </p>
        </div>

        {/* Live Check In / Out Action Widget */}
        <div className="flex-shrink-0">
          <AttendanceControl />
        </div>
      </div>

      {/* Admin View Switcher */}
      {isAdmin && (
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-navy/10 w-fit shadow-sm">
          <button
            onClick={() => setAdminTab('company')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              adminTab === 'company'
                ? 'bg-navy text-white shadow-sm'
                : 'text-text-muted hover:text-navy-dark hover:bg-cream'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-copper-bright" />
            <span>Company Daily Logs</span>
          </button>
          <button
            onClick={() => setAdminTab('mine')}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              adminTab === 'mine'
                ? 'bg-navy text-white shadow-sm'
                : 'text-text-muted hover:text-navy-dark hover:bg-cream'
            }`}
          >
            <User className="w-3.5 h-3.5 text-copper-bright" />
            <span>My Attendance Records</span>
          </button>
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
