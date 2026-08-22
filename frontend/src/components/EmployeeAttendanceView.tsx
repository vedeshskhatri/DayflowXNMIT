import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
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

  // Generate day-wise rows for the full month
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth, i + 1);
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
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isWeekend,
      isToday,
      isPastOrToday,
      record: match,
    };
  });

  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const activeMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  const todayFormattedHeading = `${now.getDate()}, ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* ── Summary Metrics Bar (Wireframe: Count of days present | Leaves count | Total working days) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Days Present */}
        <div className="card p-5 border border-sage-light bg-sage-light/20 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Count of days present
            </p>
            <p data-testid="summary-days-present" className="text-2xl font-heading font-bold text-text-primary mt-1">
              {data?.summary.daysPresent ?? 0}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sage-light/50 text-sage-deep flex items-center justify-center border border-sage-deep/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Leaves Taken */}
        <div className="card p-5 border border-terracotta/30 bg-terracotta/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-terracotta uppercase tracking-wider">
              Leaves count
            </p>
            <p data-testid="summary-leaves-taken" className="text-2xl font-heading font-bold text-terracotta mt-1">
              {data?.summary.leavesTaken ?? 0}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-terracotta/20 text-terracotta flex items-center justify-center border border-terracotta/30">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Working Days */}
        <div className="card p-5 border border-blue-grey/30 bg-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total working days
            </p>
            <p data-testid="summary-total-working-days" className="text-2xl font-heading font-bold text-text-primary mt-1">
              {data?.summary.totalWorkingDays ?? totalDaysInMonth}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cream text-slate-brand flex items-center justify-center border border-blue-grey/20">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Month Navigation Controls (Wireframe: [ < ] [ > ] [ Oct v ]) ── */}
      <div className="card border border-blue-grey/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-cream px-2 py-1 rounded-xl border border-blue-grey/20">
            <button
              data-testid="btn-prev-week"
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-primary"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-heading font-semibold text-sm px-2 text-text-primary min-w-[130px] text-center">
              {activeMonthLabel}
            </span>

            <button
              data-testid="btn-next-week"
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-primary"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Dropdown Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input py-1.5 px-3 text-xs bg-white w-36 font-semibold"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>
                {name.slice(0, 3)}
              </option>
            ))}
          </select>

          {/* Today Indicator */}
          <span className="text-xs text-text-muted hidden md:inline">
            Today: <span className="font-semibold text-text-primary">{todayFormattedHeading}</span>
          </span>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Showing <span className="font-bold text-slate-brand">{monthDays.length}</span> day-wise logs
        </span>
      </div>

      {/* ── Desktop Attendance Table (Wireframe Columns: Date | Check In | Check Out | Work Hours | Extra hours) ── */}
      <div data-testid="desktop-attendance-table" className="hidden md:block card border border-blue-grey/20 overflow-hidden p-0 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream/80 border-b border-blue-grey/20 text-xs font-bold text-text-muted uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Date</th>
              <th className="py-3.5 px-6">Day</th>
              <th className="py-3.5 px-6">Check In</th>
              <th className="py-3.5 px-6">Check Out</th>
              <th className="py-3.5 px-6">Work Hours</th>
              <th className="py-3.5 px-6">Extra hours</th>
              <th className="py-3.5 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-grey/15">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-text-muted">
                  <div className="inline-block w-5 h-5 border-2 border-slate-brand border-t-transparent rounded-full animate-spin mr-2" />
                  Loading monthly attendance records...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-terracotta">
                  Failed to load attendance logs.
                </td>
              </tr>
            ) : (
              monthDays.map((item, idx) => {
                const isPresent = Boolean(item.record?.checkIn);

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-cream/40 transition-colors ${
                      item.isToday
                        ? 'bg-sage-light/20 font-semibold'
                        : item.isWeekend
                        ? 'bg-cream/20 opacity-70'
                        : ''
                    }`}
                  >
                    {/* Date (DD/MM/YYYY) */}
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-text-primary">
                      {item.formattedDate}
                    </td>

                    {/* Day */}
                    <td className="py-3.5 px-6 text-xs text-text-muted font-medium">
                      {item.dayName}
                      {item.isToday && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-brand text-white font-bold">
                          Today
                        </span>
                      )}
                    </td>

                    {/* Check In */}
                    <td className="py-3.5 px-6 font-mono text-xs text-text-primary">
                      {formatTime(item.record?.checkIn)}
                    </td>

                    {/* Check Out */}
                    <td className="py-3.5 px-6 font-mono text-xs text-text-primary">
                      {formatTime(item.record?.checkOut)}
                    </td>

                    {/* Work Hours */}
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {item.record?.workHours ? (
                        <span className="font-bold text-slate-brand">
                          {item.record.workHours.toFixed(1)} hrs
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Extra Hours */}
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {item.record?.extraHours && item.record.extraHours > 0 ? (
                        <span className="font-bold text-sage-deep">
                          +{item.record.extraHours.toFixed(1)} hrs
                        </span>
                      ) : (
                        '00:00'
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6 text-xs">
                      {item.isWeekend ? (
                        <span className="text-text-muted">Weekend</span>
                      ) : isPresent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage-light text-text-primary">
                          Present
                        </span>
                      ) : item.isPastOrToday ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta/20 text-terracotta">
                          Absent
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Attendance Cards (< md) ── */}
      <div data-testid="mobile-attendance-cards" className="block md:hidden space-y-3">
        {monthDays
          .filter((d) => d.isPastOrToday || d.isToday)
          .slice(0, 10)
          .map((item, idx) => (
            <div
              key={idx}
              className={`card p-4 border border-blue-grey/20 ${
                item.isToday ? 'bg-sage-light/20 border-sage-deep/30' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-blue-grey/15">
                <span className="font-mono font-bold text-xs text-text-primary">
                  {item.formattedDate} ({item.dayName})
                </span>
                {item.record?.checkIn ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage-light text-text-primary">
                    Present
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta/20 text-terracotta">
                    Absent
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 font-mono">
                <div>
                  <span className="text-text-muted text-[11px] block">Check In:</span>
                  <span>{formatTime(item.record?.checkIn)}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Check Out:</span>
                  <span>{formatTime(item.record?.checkOut)}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
