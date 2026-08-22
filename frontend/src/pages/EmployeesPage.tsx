import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { EmployeeCard, EmployeeStatus } from '../components/EmployeeCard';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { Users, Search, UserPlus } from 'lucide-react';

interface EmployeeItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string | null;
  department?: string | null;
  profilePicUrl?: string | null;
  status: EmployeeStatus;
}

export const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch employees list
  const { data: employees, isLoading, isError } = useQuery<EmployeeItem[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get<EmployeeItem[]>('/employees');
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  // Socket subscription for live presence updates
  const handlePresenceUpdate = useCallback(
    (data: { employeeId: string; status: EmployeeStatus; name?: string }) => {
      // RULE: Skip any event where employeeId matches own id to avoid race with optimistic update
      if (data.employeeId === user?.id) {
        return;
      }

      console.log('⚡ EmployeesPage: updating presence dot for', data.employeeId, data.status);
      queryClient.setQueryData<EmployeeItem[]>(['employees'], (prev) => {
        if (!prev) return prev;
        return prev.map((emp) =>
          emp.id === data.employeeId ? { ...emp, status: data.status } : emp
        );
      });
    },
    [user?.id, queryClient]
  );

  useEffect(() => {
    const socket = getSocket();
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [handlePresenceUpdate]);

  const filteredEmployees = (employees || []).filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.department && emp.department.toLowerCase().includes(query)) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const presentCount = (employees || []).filter((e) => e.status === 'PRESENT').length;
  const onLeaveCount = (employees || []).filter((e) => e.status === 'ON_LEAVE').length;
  const absentCount = (employees || []).filter((e) => e.status === 'ABSENT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Header with Title & Add Employee Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-blue-grey/20">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center space-x-3">
            <span>Employee Directory</span>
            <span className="text-sm font-normal text-text-muted bg-white px-2.5 py-0.5 rounded-full border border-blue-grey/20 shadow-sm">
              {employees?.length || 0} total
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time team presence, profiles, and attendance tracking.
          </p>
        </div>

        {/* Add Employee Action (Admin/HR Only) */}
        {(user?.role === 'ADMIN' || user?.role === 'HR_OFFICER') && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-secondary py-2.5 px-4 text-sm font-semibold flex items-center space-x-2 shadow-sm border border-slate-brand/30 text-slate-brand hover:bg-slate-brand/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary Strip */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white border border-blue-grey/20 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-sage-light flex-shrink-0" />
          <span className="text-xs font-semibold text-text-primary">{presentCount}</span>
          <span className="text-xs text-text-muted">Present</span>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-blue-grey/20 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-sage-deep flex-shrink-0" />
          <span className="text-xs font-semibold text-text-primary">{onLeaveCount}</span>
          <span className="text-xs text-text-muted">On Leave</span>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-blue-grey/20 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-terracotta flex-shrink-0" />
          <span className="text-xs font-semibold text-text-primary">{absentCount}</span>
          <span className="text-xs text-text-muted">Absent</span>
        </div>
      </div>

      {/* Quick Status Stats & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Count Badges */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-brand text-white border-slate-brand font-semibold shadow-sm'
                : 'bg-white text-text-muted border-blue-grey/20 hover:bg-cream'
            }`}
          >
            All ({employees?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('PRESENT')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
              statusFilter === 'PRESENT'
                ? 'bg-sage-light text-text-primary border-sage-deep/40 font-semibold shadow-sm'
                : 'bg-white text-text-muted border-blue-grey/20 hover:bg-cream'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#BDCFAA]" />
            <span>Present ({presentCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('ON_LEAVE')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
              statusFilter === 'ON_LEAVE'
                ? 'bg-sage-deep/30 text-sage-deep border-sage-deep font-semibold shadow-sm'
                : 'bg-white text-text-muted border-blue-grey/20 hover:bg-cream'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#8E9E83]" />
            <span>On Leave ({onLeaveCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('ABSENT')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
              statusFilter === 'ABSENT'
                ? 'bg-terracotta/20 text-terracotta border-terracotta font-semibold shadow-sm'
                : 'bg-white text-text-muted border-blue-grey/20 hover:bg-cream'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#C97B63]" />
            <span>Absent ({absentCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-blue-grey absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, role, dept..."
            className="input pl-10 py-2 text-sm bg-white"
          />
        </div>
      </div>

      {/* Responsive Employee Card Grid (1 col mobile, 2 col md, 3 col lg, gap-4) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-52 animate-pulse bg-white/60 border border-blue-grey/10" />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-12 text-center text-terracotta bg-white border border-terracotta/20">
          <p className="font-heading font-semibold text-base">Failed to load employee directory</p>
          <p className="text-xs text-text-muted mt-1">Please make sure the server is reachable.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="card p-12 text-center text-text-muted bg-white border border-blue-grey/20 space-y-2">
          <Users className="w-10 h-10 mx-auto text-blue-grey" />
          <p className="font-heading font-semibold text-base text-text-primary">No employees found</p>
          <p className="text-xs text-text-muted">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No employee records are available.'}
          </p>
        </div>
      ) : (
        <div data-testid="employee-card-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              id={emp.id}
              firstName={emp.firstName}
              lastName={emp.lastName}
              jobTitle={emp.jobTitle}
              department={emp.department}
              profilePicUrl={emp.profilePicUrl}
              status={emp.status}
            />
          ))}
        </div>
      )}

      {/* Add Employee Modal (Admin/HR Only) */}
      <AddEmployeeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
};
