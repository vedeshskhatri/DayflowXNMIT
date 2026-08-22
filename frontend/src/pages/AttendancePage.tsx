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
      {/* Top Banner with Title, Role Indicator & Live Check In / Out Control */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-blue-grey/20">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-heading font-bold text-text-primary">
              Attendance Tracking
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-brand/10 text-slate-brand border border-slate-brand/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / HR View</span>
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            Live check-in/out logs, working hours, and real-time company synchronization.
          </p>
        </div>

        {/* Live Check In / Out Action Widget */}
        <div className="flex-shrink-0">
          <AttendanceControl />
        </div>
      </div>

      {/* Admin View Switcher (Company Overview vs My Records) */}
      {isAdmin && (
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-blue-grey/20 w-fit shadow-sm">
          <button
            onClick={() => setAdminTab('company')}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-semibold transition-all flex items-center space-x-2 ${
              adminTab === 'company'
                ? 'bg-slate-brand text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-cream'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Company Daily Logs</span>
          </button>
          <button
            onClick={() => setAdminTab('mine')}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-semibold transition-all flex items-center space-x-2 ${
              adminTab === 'mine'
                ? 'bg-slate-brand text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-cream'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Weekly Logs</span>
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
