import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { EmployeeCard, EmployeeStatus } from '../components/EmployeeCard';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { TeamPulseBanner } from '../components/directory/TeamPulseBanner';
import { EmployeeQuickDrawer, QuickDrawerEmployee } from '../components/directory/EmployeeQuickDrawer';
import { EmployeeTableView } from '../components/directory/EmployeeTableView';
import {
  Users,
  Search,
  UserPlus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  X,
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  loginId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string;
  bio?: string | null;
  jobLove?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  profilePicUrl?: string | null;
  status: EmployeeStatus;
  skills?: { id?: string; name: string }[];
  certifications?: { id?: string; name: string }[];
  gamificationPoints?: { streak: number; total: number } | null;
}

type ViewMode = 'grid' | 'table';
type SortOption = 'name_asc' | 'name_desc' | 'streak' | 'present_first' | 'dept';

export const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [previewEmployee, setPreviewEmployee] = useState<QuickDrawerEmployee | null>(null);

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

  // Unique departments list
  const departments = useMemo(() => {
    if (!employees) return [];
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Filtered & Sorted employees
  const processedEmployees = useMemo(() => {
    let list = (employees || []).filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        fullName.includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        (emp.loginId && emp.loginId.toLowerCase().includes(query)) ||
        (emp.department && emp.department.toLowerCase().includes(query)) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'name_asc') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortBy === 'name_desc') {
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      }
      if (sortBy === 'streak') {
        const streakA = a.gamificationPoints?.streak ?? 0;
        const streakB = b.gamificationPoints?.streak ?? 0;
        return streakB - streakA;
      }
      if (sortBy === 'present_first') {
        const score = (status: EmployeeStatus) => (status === 'PRESENT' ? 2 : status === 'ON_LEAVE' ? 1 : 0);
        return score(b.status) - score(a.status);
      }
      if (sortBy === 'dept') {
        return (a.department || '').localeCompare(b.department || '');
      }
      return 0;
    });

    return list;
  }, [employees, searchTerm, statusFilter, departmentFilter, sortBy]);

  const presentCount = (employees || []).filter((e) => e.status === 'PRESENT').length;
  const onLeaveCount = (employees || []).filter((e) => e.status === 'ON_LEAVE').length;
  const absentCount = (employees || []).filter((e) => e.status === 'ABSENT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Header with Title & Add Employee Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-blue-grey/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary flex items-center space-x-3 tracking-tight">
            <span>Employee Directory</span>
            <span className="text-xs sm:text-sm font-sans font-medium text-text-muted bg-white px-2.5 py-0.5 rounded-full border border-blue-grey/20 shadow-sm">
              {employees?.length || 0} total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">
            Real-time team presence, interactive profiles, and attendance tracking.
          </p>
        </div>

        {/* Header Action & Add Employee */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {(user?.role === 'ADMIN' || user?.role === 'HR_OFFICER') && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center space-x-2 shadow-sm border border-slate-brand/30 text-slate-brand hover:bg-slate-brand/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Company Attendance Pulse Banner (Option 2) */}
      {!isLoading && employees && employees.length > 0 && (
        <TeamPulseBanner
          employees={employees}
          selectedDepartment={departmentFilter}
          onSelectDepartment={(dept) => setDepartmentFilter(dept)}
        />
      )}

      {/* Interactive Controls Toolbar (Filters, Search, Sort & View Mode) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/60 p-3 rounded-2xl border border-blue-grey/20 shadow-sm backdrop-blur-sm">
        {/* Left: Presence Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
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
            <span className="w-2 h-2 rounded-full bg-[#BDCFAA]" />
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
            <span className="w-2 h-2 rounded-full bg-[#8E9E83]" />
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
            <span className="w-2 h-2 rounded-full bg-[#C97B63]" />
            <span>Absent ({absentCount})</span>
          </button>

          {/* Department Filter Select */}
          {departments.length > 0 && (
            <div className="relative inline-block ml-1">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-white border border-blue-grey/25 text-text-primary text-xs rounded-xl px-3 py-1.5 appearance-none pr-7 shadow-xs cursor-pointer focus:outline-none focus:border-slate-brand"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-blue-grey absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right: Search, Sort & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search directory..."
              className="input pl-8.5 py-1.5 text-xs bg-white w-full pr-7"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-grey hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative inline-block">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-blue-grey/25 text-text-primary text-xs rounded-xl pl-2.5 pr-7 py-1.5 appearance-none shadow-xs cursor-pointer focus:outline-none focus:border-slate-brand"
            >
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="name_desc">Sort: Name (Z-A)</option>
              <option value="streak">Sort: Highest Streak</option>
              <option value="present_first">Sort: Present First</option>
              <option value="dept">Sort: Department</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-blue-grey absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grid vs Table View Mode Switcher (Option 3) */}
          <div className="flex items-center bg-white border border-blue-grey/25 rounded-xl p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-cream'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-cream'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
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
      ) : processedEmployees.length === 0 ? (
        <div className="card p-12 text-center text-text-muted bg-white border border-blue-grey/20 space-y-2">
          <Users className="w-10 h-10 mx-auto text-blue-grey" />
          <p className="font-heading font-semibold text-base text-text-primary">No employees found</p>
          <p className="text-xs text-text-muted">
            {searchTerm || departmentFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your search filters.'
              : 'No employee records are available.'}
          </p>
          {(searchTerm || departmentFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="mt-2 text-xs font-semibold text-slate-brand hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Responsive Employee Card Grid (1 col mobile, 2 col md, 3 col lg, gap-4) */
        <div data-testid="employee-card-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              id={emp.id}
              loginId={emp.loginId}
              firstName={emp.firstName}
              lastName={emp.lastName}
              email={emp.email}
              role={emp.role}
              jobTitle={emp.jobTitle}
              department={emp.department}
              profilePicUrl={emp.profilePicUrl}
              status={emp.status}
              skills={emp.skills}
              gamificationPoints={emp.gamificationPoints}
              onPreview={() => setPreviewEmployee(emp)}
            />
          ))}
        </div>
      ) : (
        /* Table / List View */
        <EmployeeTableView
          employees={processedEmployees}
          onPreview={(emp) => setPreviewEmployee(emp)}
        />
      )}

      {/* Quick-View Slide-Over Drawer (Option 4) */}
      <EmployeeQuickDrawer
        employee={previewEmployee}
        onClose={() => setPreviewEmployee(null)}
      />

      {/* Add Employee Modal (Admin/HR Only) */}
      <AddEmployeeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
};
