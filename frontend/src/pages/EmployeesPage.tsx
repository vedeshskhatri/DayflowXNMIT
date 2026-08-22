import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { EmployeeCard, EmployeeStatus } from '../components/EmployeeCard';
import { AttendanceControl } from '../components/AttendanceControl';
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
      if (data.employeeId === user?.id) {
        return;
      }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-navy/10">
        <div>
          <h1 className="text-3xl font-heading font-bold text-navy-dark flex items-center space-x-3">
            <span>Employee Directory</span>
            <span className="text-xs font-bold text-copper-dark bg-copper-muted px-3 py-1 rounded-full border border-copper/30 font-mono">
              {employees?.length || 0} Members
            </span>
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Real-time team presence, profiles, and attendance tracking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {(user?.role === 'ADMIN' || user?.role === 'HR_OFFICER') && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-navy py-2.5 px-4 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-copper-bright" />
              <span>Add Employee</span>
            </button>
          )}
          <AttendanceControl />
        </div>
      </div>

      {/* Quick Status Stats & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Count Badges */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
              statusFilter === 'ALL'
                ? 'bg-navy text-white border-navy shadow-sm'
                : 'bg-white text-text-muted border-navy/15 hover:bg-cream'
            }`}
          >
            All ({employees?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('PRESENT')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer font-bold ${
              statusFilter === 'PRESENT'
                ? 'bg-sage-light text-navy-dark border-sage-deep/40 shadow-sm'
                : 'bg-white text-text-muted border-navy/15 hover:bg-cream'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sage-light shadow-[0_0_6px_rgba(200,214,175,0.9)]" />
            <span>Present ({presentCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('ON_LEAVE')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer font-bold ${
              statusFilter === 'ON_LEAVE'
                ? 'bg-copper-muted text-copper-dark border-copper/40 shadow-sm'
                : 'bg-white text-text-muted border-navy/15 hover:bg-cream'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-copper shadow-[0_0_6px_rgba(184,115,51,0.8)]" />
            <span>On Leave ({onLeaveCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('ABSENT')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer font-bold ${
              statusFilter === 'ABSENT'
                ? 'bg-terracotta-light text-terracotta border-terracotta/40 shadow-sm'
                : 'bg-white text-text-muted border-navy/15 hover:bg-cream'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#EAB308] shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
            <span>Absent ({absentCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, role, dept..."
            className="input pl-10 py-2 text-sm bg-white"
          />
        </div>
      </div>

      {/* Responsive Employee Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-52 animate-pulse bg-white border border-navy/10" />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-12 text-center text-terracotta bg-white border border-terracotta/20">
          <p className="font-heading font-bold text-base">Failed to load employee directory</p>
          <p className="text-xs text-text-muted mt-1">Please make sure the server is reachable.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="card p-12 text-center text-text-muted bg-white border border-navy/10 space-y-2">
          <Users className="w-10 h-10 mx-auto text-navy/30" />
          <p className="font-heading font-bold text-base text-navy-dark">No employees found</p>
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
