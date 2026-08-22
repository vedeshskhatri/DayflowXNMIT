import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Calendar,
  Sparkles,
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

  // Fetch all attendance for selected date & search term
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

    const handleCheckin = (payload: { employeeId: string; checkInTime?: string }) => {
      console.log('⚡ AdminAttendanceView: received attendance:checkin', payload);
      queryClient.invalidateQueries({ queryKey: ['attendance', 'all'] });
    };

    const handleCheckout = (payload: { employeeId: string; checkOutTime?: string; workHours?: number }) => {
      console.log('⚡ AdminAttendanceView: received attendance:checkout', payload);
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

  // Formats time into 24-hour HH:mm matching wireframe (e.g. 10:00, 19:00)
  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '—';
    }
  };

  // Formats decimal hours into HH:mm (e.g. 9 -> 09:00, 1 -> 01:00)
  const formatDuration = (hoursNum?: number | null) => {
    if (hoursNum === null || hoursNum === undefined || isNaN(hoursNum)) return '—';
    const totalMinutes = Math.round(hoursNum * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Format header date: e.g. "22, October 2025" matching wireframe exactly
  const formatWireframeDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${day}, ${month} ${year}`;
  };

  const checkedInCount = (logs || []).filter((l) => Boolean(l.checkIn)).length;

  return (
    <div className="space-y-6">
      {/* ── Top Header Row: Attendance Title + Centered Search Bar (Wireframe Master) ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Attendance Title */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
            Attendance
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Admin/HR live attendance logs &amp; day-wise presence records
          </p>
        </div>

        {/* Center/Right: Centered Search Bar */}
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="w-4 h-4 text-blue-grey absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            data-testid="admin-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search employee..."
            className="input pl-10 py-2 text-xs sm:text-sm bg-white w-full rounded-xl border-blue-grey/30 shadow-xs focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20 transition-all"
          />
        </div>
      </div>

      {/* ── Controls Row: [ < ] [ > ] [ Date v ] [ Day ] (Wireframe Master) ── */}
      <div className="card border border-blue-grey/25 p-3.5 bg-white shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Stepper Buttons: < and > */}
          <div className="flex items-center space-x-1 bg-cream/70 p-1 rounded-xl border border-blue-grey/20">
            <button
              data-testid="btn-prev-day"
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-primary"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              data-testid="btn-next-day"
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-primary"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Date Picker Button with Dropdown look: [ Date v ] */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input py-1.5 pl-8 pr-3 text-xs bg-white border-blue-grey/25 rounded-xl font-mono text-text-primary shadow-xs cursor-pointer"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-brand absolute left-2.5 pointer-events-none" />
          </div>

          {/* View Mode Tag: [ Day ] */}
          <div className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-slate-brand text-white shadow-xs">
            <span>Day</span>
          </div>

          {!isSelectedToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center space-x-1 rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-brand" />
              <span>Today</span>
            </button>
          )}
        </div>

        {/* Selected Date Indicator (Hidden on small, prominent on desktop) */}
        <div className="text-right">
          <span
            data-testid="admin-date-display"
            className="text-xs font-heading font-bold text-text-primary px-3 py-1 bg-cream/60 rounded-lg border border-blue-grey/20"
          >
            {formatWireframeDate(selectedDate)}
          </span>
        </div>
      </div>

      {/* ── Table / Cards Container matching Wireframe ── */}
      <div className="card border border-blue-grey/25 overflow-hidden p-0 bg-white shadow-sm rounded-2xl">
        {/* Table Sub-header Banner: e.g. "22, October 2025" */}
        <div className="bg-cream/90 px-6 py-3 border-b border-blue-grey/20 flex items-center justify-between">
          <span className="font-heading font-bold text-sm text-text-primary">
            {formatWireframeDate(selectedDate)}
          </span>
          <span className="text-xs text-text-muted font-medium">
            {checkedInCount} Present • {logs?.length ?? 0} Total Tracked
          </span>
        </div>

        {/* Desktop Table (>= md) */}
        <div data-testid="desktop-admin-table" className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-blue-grey/20 text-xs font-heading font-bold text-text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Emp</th>
                <th className="py-3.5 px-6">Check In</th>
                <th className="py-3.5 px-6">Check Out</th>
                <th className="py-3.5 px-6">work hours</th>
                <th className="py-3.5 px-6">Extra hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-grey/15">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    <div className="inline-block w-5 h-5 border-2 border-slate-brand border-t-transparent rounded-full animate-spin mr-2" />
                    Loading employee attendance records...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-terracotta">
                    Failed to load employee attendance records.
                  </td>
                </tr>
              ) : (logs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted space-y-1">
                    <Users className="w-8 h-8 mx-auto text-blue-grey mb-2" />
                    <p className="font-semibold text-text-primary">No employee logs found</p>
                    <p className="text-xs">No records match the current filter and date.</p>
                  </td>
                </tr>
              ) : (
                logs?.map((item) => {
                  const fullName = `${item.employee.firstName} ${item.employee.lastName}`;
                  const initials = `${item.employee.firstName[0]}${item.employee.lastName[0]}`.toUpperCase();

                  return (
                    <tr key={item.employee.id} className="hover:bg-cream/30 transition-colors">
                      {/* Emp Column */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-3">
                          {item.employee.profilePicUrl ? (
                            <img
                              src={item.employee.profilePicUrl}
                              alt={fullName}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-blue-grey/30"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-brand/10 text-slate-brand font-heading font-bold text-xs flex items-center justify-center ring-1 ring-blue-grey/20">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-heading font-bold text-xs text-text-primary">
                              {fullName}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {item.employee.jobTitle || item.employee.department || 'Team Member'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Check In Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-medium">
                        {formatTime(item.checkIn)}
                      </td>

                      {/* Check Out Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-medium">
                        {formatTime(item.checkOut)}
                      </td>

                      {/* Work Hours Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-bold">
                        {formatDuration(item.workHours)}
                      </td>

                      {/* Extra Hours Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-medium">
                        {formatDuration(item.extraHours)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (< md) */}
        <div data-testid="mobile-admin-cards" className="block md:hidden p-4 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-text-muted">Loading logs...</div>
          ) : (logs || []).length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">No attendance logs found.</div>
          ) : (
            logs?.map((item) => {
              const fullName = `${item.employee.firstName} ${item.employee.lastName}`;
              const initials = `${item.employee.firstName[0]}${item.employee.lastName[0]}`.toUpperCase();

              return (
                <div key={item.employee.id} className="p-4 rounded-xl border border-blue-grey/20 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {item.employee.profilePicUrl ? (
                        <img
                          src={item.employee.profilePicUrl}
                          alt={fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-brand/10 text-slate-brand font-heading font-bold text-xs flex items-center justify-center">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="font-heading font-bold text-xs text-text-primary">{fullName}</p>
                        <p className="text-[10px] text-text-muted">{item.employee.jobTitle || 'Team Member'}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream text-slate-brand border border-blue-grey/20">
                      {item.checkIn ? 'Logged' : 'Off'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-grey/15 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-text-muted block">In</span>
                      <span>{formatTime(item.checkIn)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Out</span>
                      <span>{formatTime(item.checkOut)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Work</span>
                      <span className="font-bold">{formatDuration(item.workHours)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Extra</span>
                      <span>{formatDuration(item.extraHours)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
