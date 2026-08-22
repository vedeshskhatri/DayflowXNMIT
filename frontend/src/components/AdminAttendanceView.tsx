import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Users, 
  Sparkles
} from 'lucide-react';

interface AdminAttendanceItem {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicUrl?: string | null;
    jobTitle?: string | null;
    department?: string | null;
  };
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
}

export const AdminAttendanceView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 300ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: logs, isLoading, isError } = useQuery<AdminAttendanceItem[]>({
    queryKey: ['attendance', 'all', selectedDate, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (debouncedSearch) params.append('search', debouncedSearch);
      const res = await api.get<AdminAttendanceItem[]>(`/attendance/all?${params.toString()}`);
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  // Socket listener to update rows live
  useEffect(() => {
    const socket = getSocket();

    const handleCheckin = () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'all'] });
    };

    const handleCheckout = () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'all'] });
    };

    socket.on('attendance:checkin', handleCheckin);
    socket.on('attendance:checkout', handleCheckout);

    return () => {
      socket.off('attendance:checkin', handleCheckin);
      socket.off('attendance:checkout', handleCheckout);
    };
  }, [queryClient]);

  const changeDateByDays = (days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isSelectedToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const checkedInCount = (logs || []).filter((l) => Boolean(l.checkIn)).length;
  const completedCount = (logs || []).filter((l) => Boolean(l.checkIn && l.checkOut)).length;

  return (
    <div className="space-y-6">
      {/* Date Navigation & Search Header */}
      <div className="card border border-navy/10 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white shadow-sm">
        {/* Left: Date Navigation & Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-cream/70 px-2 py-1 rounded-xl border border-navy/10">
            <button
              data-testid="btn-prev-day"
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-navy-dark cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span data-testid="admin-date-display" className="font-heading font-bold text-sm px-2 text-navy-dark min-w-[130px] text-center">
              {formatDisplayDate(selectedDate)}
            </span>

            <button
              data-testid="btn-next-day"
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-navy-dark cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Native Date Picker */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input py-1.5 px-3 text-xs bg-white w-36 font-mono font-bold"
            />
          </div>

          {!isSelectedToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center space-x-1 font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-copper" />
              <span>Jump to Today</span>
            </button>
          )}
        </div>

        {/* Right: Debounced Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            data-testid="admin-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search employee name..."
            className="input pl-10 py-2 text-sm bg-white w-full"
          />
        </div>
      </div>

      {/* Overview Stats for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        <div className="card p-5 border border-navy/10 bg-white shadow-sm">
          <span className="text-xs font-bold text-text-muted uppercase font-mono">Total Headcount</span>
          <p className="text-2xl font-heading font-bold text-navy-dark mt-1">
            {logs?.length ?? 0}
          </p>
        </div>
        <div className="card p-5 border border-navy/10 bg-white shadow-sm">
          <span className="text-xs font-bold text-navy-dark uppercase font-mono">Present / Checked In</span>
          <p className="text-2xl font-heading font-bold text-navy mt-1">
            {checkedInCount}
          </p>
        </div>
        <div className="card p-5 border border-navy/10 bg-white col-span-2 sm:col-span-1 shadow-sm">
          <span className="text-xs font-bold text-copper uppercase font-mono">Completed Shifts</span>
          <p className="text-2xl font-heading font-bold text-copper mt-1">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Table for Desktop */}
      <div data-testid="desktop-admin-table" className="hidden md:block card border border-navy/10 overflow-hidden p-0 bg-white shadow-elevated rounded-3xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream/80 border-b border-navy/10 text-xs font-bold text-navy-dark uppercase tracking-wider font-mono">
            <tr>
              <th className="py-4 px-6">Employee</th>
              <th className="py-4 px-6">Check In</th>
              <th className="py-4 px-6">Check Out</th>
              <th className="py-4 px-6">Work Hours</th>
              <th className="py-4 px-6">Extra Hours</th>
              <th className="py-4 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted">
                  <div className="inline-block w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin mr-2" />
                  Loading company attendance logs...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-terracotta">
                  Failed to load employee attendance records.
                </td>
              </tr>
            ) : (logs || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted space-y-1">
                  <Users className="w-8 h-8 mx-auto text-navy/30 mb-2" />
                  <p className="font-heading font-bold text-navy-dark">No employee logs found</p>
                  <p className="text-xs">No records match the current filter and date.</p>
                </td>
              </tr>
            ) : (
              logs?.map((item) => {
                const isPresent = Boolean(item.checkIn);
                const fullName = `${item.employee.firstName} ${item.employee.lastName}`;
                const initials = `${item.employee.firstName[0]}${item.employee.lastName[0]}`.toUpperCase();

                return (
                  <tr key={item.employee.id} className="hover:bg-cream/40 transition-colors">
                    {/* Employee avatar + name */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        {item.employee.profilePicUrl ? (
                          <img
                            src={item.employee.profilePicUrl}
                            alt={fullName}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-navy/10 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-navy text-white font-heading font-bold text-xs flex items-center justify-center ring-2 ring-navy/10 shadow-sm">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-heading font-bold text-sm text-navy-dark">
                            {fullName}
                          </p>
                          <p className="text-xs text-text-muted font-medium">
                            {item.employee.jobTitle || item.employee.department || 'Team Member'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Check In */}
                    <td className="py-3.5 px-6 font-mono text-xs text-text-primary">
                      {formatTime(item.checkIn)}
                    </td>

                    {/* Check Out */}
                    <td className="py-3.5 px-6 font-mono text-xs text-text-primary">
                      {formatTime(item.checkOut)}
                    </td>

                    {/* Work Hours */}
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-navy">
                      {item.workHours !== null ? `${item.workHours} hrs` : '—'}
                    </td>

                    {/* Extra Hours */}
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {item.extraHours && item.extraHours > 0 ? (
                        <span className="text-copper font-bold">
                          +{item.extraHours} hrs
                        </span>
                      ) : (
                        <span className="text-text-muted">0 hrs</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-6">
                      {isPresent ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sage-light text-navy-dark border border-sage-deep/30 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-sage-deep" />
                          <span>{item.checkOut ? 'Completed' : 'Present'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-terracotta-light text-terracotta border border-terracotta/30 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                          <span>Not Logged</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stacked Cards for Mobile */}
      <div data-testid="mobile-admin-cards" className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="card p-8 text-center text-xs text-text-muted">Loading logs...</div>
        ) : (logs || []).length === 0 ? (
          <div className="card p-8 text-center text-xs text-text-muted">No attendance logs found.</div>
        ) : (
          logs?.map((item) => {
            const isPresent = Boolean(item.checkIn);
            const fullName = `${item.employee.firstName} ${item.employee.lastName}`;
            const initials = `${item.employee.firstName[0]}${item.employee.lastName[0]}`.toUpperCase();

            return (
              <div key={item.employee.id} className="card p-4 border border-navy/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {item.employee.profilePicUrl ? (
                      <img
                        src={item.employee.profilePicUrl}
                        alt={fullName}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-navy text-white font-heading font-bold text-xs flex items-center justify-center">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="font-heading font-bold text-sm text-navy-dark">{fullName}</p>
                      <p className="text-[11px] text-text-muted">{item.employee.jobTitle || 'Team Member'}</p>
                    </div>
                  </div>

                  {isPresent ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sage-light text-navy-dark font-mono">
                      {item.checkOut ? 'Done' : 'Present'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-terracotta-light text-terracotta font-mono">
                      Off
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-navy/10 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-text-muted block">In</span>
                    <span className="font-bold text-navy-dark">{formatTime(item.checkIn)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Out</span>
                    <span className="font-bold text-navy-dark">{formatTime(item.checkOut)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Hours</span>
                    <span className="font-bold text-navy">
                      {item.workHours !== null ? `${item.workHours}h` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">OT</span>
                    <span className="font-bold text-copper">
                      {item.extraHours && item.extraHours > 0 ? `+${item.extraHours}h` : '0h'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
