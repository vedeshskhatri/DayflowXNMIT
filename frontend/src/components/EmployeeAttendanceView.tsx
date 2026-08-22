import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  summary: {
    daysPresent: number;
    leavesTaken: number;
    totalWorkingDays: number;
  };
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const EmployeeAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  // Compute start and end date for the selected month
  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

  const fromStr = startOfMonth.toISOString().split('T')[0];
  const toStr = endOfMonth.toISOString().split('T')[0];

  // Fetch own attendance records for the month
  const { data, isLoading, isError } = useQuery<AttendanceResponse>({
    queryKey: ['attendance', 'mine', fromStr, toStr],
    queryFn: async () => {
      const res = await api.get<AttendanceResponse>(`/attendance?from=${fromStr}&to=${toStr}`);
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  // Socket listener for live attendance events
  useEffect(() => {
    const socket = getSocket();

    const handleCheckin = (payload: { employeeId: string }) => {
      if (payload.employeeId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['attendance', 'mine'] });
      }
    };

    const handleCheckout = (payload: { employeeId: string }) => {
      if (payload.employeeId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['attendance', 'mine'] });
      }
    };

    socket.on('attendance:checkin', handleCheckin);
    socket.on('attendance:checkout', handleCheckout);

    return () => {
      socket.off('attendance:checkin', handleCheckin);
      socket.off('attendance:checkout', handleCheckout);
    };
  }, [user?.id, queryClient]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedYear(newDate.getFullYear());
    setSelectedMonth(newDate.getMonth());
  };

  // Generate day-wise rows for the full month in descending order (most recent dates first, matching wireframe: 25/10/2025, 24/10/2025...)
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const dayNumber = totalDaysInMonth - i;
    const d = new Date(selectedYear, selectedMonth, dayNumber);
    const dateStr = d.toISOString().split('T')[0];
    const match = data?.records?.find((r) => r.date === dateStr);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isPastOrToday = d <= new Date();

    const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;

    return {
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr,
      formattedDate,
      isWeekend,
      isToday,
      isPastOrToday,
      record: match,
    };
  });

  // Formats time into 24-hour HH:mm (e.g. 10:00, 19:00)
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

  const todayFormattedHeading = `${now.getDate()}, ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* ── Top Header Row: Attendance Title (Left) + Wireframe Summary Metric Chips (Right) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Attendance Title */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
            Attendance
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Day-wise personal attendance logs &amp; monthly working hours breakdown
          </p>
        </div>

        {/* Right: Summary Metric Boxes matching Wireframe */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* [ Oct v ] Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none bg-white border border-blue-grey/30 rounded-xl px-3 py-1.5 pr-7 text-xs font-heading font-semibold text-text-primary shadow-xs cursor-pointer hover:border-slate-brand transition-colors"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name.slice(0, 3)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-blue-grey absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* [ Count of days present ] */}
          <div className="bg-white border border-blue-grey/25 rounded-xl px-3 py-1.5 shadow-xs flex items-center space-x-2">
            <span className="text-[11px] text-text-muted font-medium">Count of days present:</span>
            <span data-testid="summary-days-present" className="font-heading font-bold text-xs text-text-primary">
              {data?.summary.daysPresent ?? 0}
            </span>
          </div>

          {/* [ Leaves count ] */}
          <div className="bg-white border border-blue-grey/25 rounded-xl px-3 py-1.5 shadow-xs flex items-center space-x-2">
            <span className="text-[11px] text-text-muted font-medium">Leaves count:</span>
            <span data-testid="summary-leaves-taken" className="font-heading font-bold text-xs text-terracotta">
              {data?.summary.leavesTaken ?? 0}
            </span>
          </div>

          {/* [ Total working days ] */}
          <div className="bg-white border border-blue-grey/25 rounded-xl px-3 py-1.5 shadow-xs flex items-center space-x-2">
            <span className="text-[11px] text-text-muted font-medium">Total working days:</span>
            <span data-testid="summary-total-working-days" className="font-heading font-bold text-xs text-text-primary">
              {data?.summary.totalWorkingDays ?? totalDaysInMonth}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Row: [ < ] [ > ] [ 22, October 2025 ] (Wireframe Master) ── */}
      <div className="card border border-blue-grey/25 p-3.5 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Stepper Buttons: < and > */}
          <div className="flex items-center space-x-1 bg-cream/70 p-1 rounded-xl border border-blue-grey/20">
            <button
              data-testid="btn-prev-week"
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-primary"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              data-testid="btn-next-week"
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-primary"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Date / Month Display: e.g. "22, October 2025" */}
          <span className="font-heading font-bold text-xs sm:text-sm text-text-primary">
            {todayFormattedHeading}
          </span>
        </div>

        <span className="text-xs font-mono text-text-muted hidden sm:inline">
          {monthDays.length} Days in Month
        </span>
      </div>

      {/* ── Table Container matching Wireframe Columns: Date | Check In | Check Out | work hours | Extra hours ── */}
      <div className="card border border-blue-grey/25 overflow-hidden p-0 bg-white shadow-sm rounded-2xl">
        {/* Table Header Band: e.g. "22, October 2025" */}
        <div className="bg-cream/90 px-6 py-3 border-b border-blue-grey/20 flex items-center justify-between">
          <span className="font-heading font-bold text-sm text-text-primary">
            {todayFormattedHeading}
          </span>
          <span className="text-xs text-text-muted font-medium">
            {data?.summary.daysPresent ?? 0} Days Logged
          </span>
        </div>

        {/* Desktop Table (>= md) */}
        <div data-testid="desktop-attendance-table" className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-blue-grey/20 text-xs font-heading font-bold text-text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Date</th>
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
                    Loading monthly attendance records...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-terracotta">
                    Failed to load attendance records.
                  </td>
                </tr>
              ) : (
                monthDays.map((item, idx) => {
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-cream/30 transition-colors ${
                        item.isToday
                          ? 'bg-sage-light/20 font-semibold'
                          : item.isWeekend
                          ? 'bg-cream/20 opacity-70'
                          : ''
                      }`}
                    >
                      {/* Date Column (DD/MM/YYYY) */}
                      <td className="py-3.5 px-6 font-mono text-xs font-bold text-text-primary">
                        {item.formattedDate}
                        {item.isToday && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-brand text-white font-bold uppercase">
                            Today
                          </span>
                        )}
                      </td>

                      {/* Check In Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-medium">
                        {formatTime(item.record?.checkIn)}
                      </td>

                      {/* Check Out Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-medium">
                        {formatTime(item.record?.checkOut)}
                      </td>

                      {/* Work Hours Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-bold">
                        {formatDuration(item.record?.workHours)}
                      </td>

                      {/* Extra Hours Column */}
                      <td className="py-3.5 px-6 font-mono text-xs text-text-primary font-medium">
                        {formatDuration(item.record?.extraHours)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (< md) */}
        <div data-testid="mobile-attendance-cards" className="block md:hidden p-4 space-y-3">
          {monthDays
            .filter((d) => d.isPastOrToday || d.isToday)
            .slice(0, 15)
            .map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border border-blue-grey/20 ${
                  item.isToday ? 'bg-sage-light/20 border-sage-deep/30' : 'bg-white'
                } shadow-xs space-y-2`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-blue-grey/15">
                  <span className="font-mono font-bold text-xs text-text-primary">
                    {item.formattedDate}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream text-slate-brand border border-blue-grey/20">
                    {item.record?.checkIn ? 'Logged' : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono pt-1">
                  <div>
                    <span className="text-[10px] text-text-muted block">In</span>
                    <span>{formatTime(item.record?.checkIn)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Out</span>
                    <span>{formatTime(item.record?.checkOut)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Work</span>
                    <span className="font-bold">{formatDuration(item.record?.workHours)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Extra</span>
                    <span>{formatDuration(item.record?.extraHours)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
