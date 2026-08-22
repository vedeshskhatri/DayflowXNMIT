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
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

  const fromStr = startOfMonth.toISOString().split('T')[0];
  const toStr = endOfMonth.toISOString().split('T')[0];

  const { data, isLoading, isError } = useQuery<AttendanceResponse>({
    queryKey: ['attendance', 'mine', fromStr, toStr],
    queryFn: async () => {
      const res = await api.get<AttendanceResponse>(`/attendance?from=${fromStr}&to=${toStr}`);
      return res.data;
    },
    staleTime: 1000 * 30,
  });

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
      {/* ── Summary Metrics Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Days Present */}
        <div className="card p-6 border border-navy/10 bg-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-navy-dark uppercase tracking-wider font-mono">
              Count of Days Present
            </p>
            <p data-testid="summary-days-present" className="text-3xl font-heading font-bold text-navy-dark mt-1">
              {data?.summary.daysPresent ?? 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sage-light/40 text-sage-deep flex items-center justify-center border border-sage-deep/20 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Leaves Taken */}
        <div className="card p-6 border border-navy/10 bg-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-copper uppercase tracking-wider font-mono">
              Leaves Taken
            </p>
            <p data-testid="summary-leaves-taken" className="text-3xl font-heading font-bold text-copper mt-1">
              {data?.summary.leavesTaken ?? 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-copper-muted text-copper-dark flex items-center justify-center border border-copper/30 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Working Days */}
        <div className="card p-6 border border-navy/10 bg-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
              Total Working Days
            </p>
            <p data-testid="summary-total-working-days" className="text-3xl font-heading font-bold text-navy-dark mt-1">
              {data?.summary.totalWorkingDays ?? totalDaysInMonth}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-sm">
            <Briefcase className="w-6 h-6 text-copper-bright" />
          </div>
        </div>
      </div>

      {/* ── Month Navigation Controls ──────────────────────────────────── */}
      <div className="card border border-navy/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-cream/70 px-2 py-1 rounded-xl border border-navy/10">
            <button
              data-testid="btn-prev-week"
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-navy-dark cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-heading font-bold text-sm px-2 text-navy-dark min-w-[130px] text-center">
              {activeMonthLabel}
            </span>

            <button
              data-testid="btn-next-week"
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors text-navy-dark cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Dropdown Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input py-1.5 px-3 text-xs bg-white w-36 font-bold font-mono"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>
                {name.slice(0, 3)}
              </option>
            ))}
          </select>

          <span className="text-xs text-text-muted hidden md:inline font-mono">
            Today: <span className="font-bold text-navy-dark">{todayFormattedHeading}</span>
          </span>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Showing <span className="font-bold text-navy">{monthDays.length}</span> day-wise logs
        </span>
      </div>

      {/* ── Desktop Attendance Table ───────────────────────────────────── */}
      <div data-testid="desktop-attendance-table" className="hidden md:block card border border-navy/10 overflow-hidden p-0 bg-white shadow-elevated rounded-3xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream/80 border-b border-navy/10 text-xs font-bold text-navy-dark uppercase tracking-wider font-mono">
            <tr>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Day</th>
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
                <td colSpan={7} className="py-12 text-center text-text-muted">
                  <div className="inline-block w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin mr-2" />
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
                    {/* Date */}
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-navy-dark">
                      {item.formattedDate}
                    </td>

                    {/* Day */}
                    <td className="py-3.5 px-6 text-xs text-text-muted font-medium">
                      {item.dayName}
                      {item.isToday && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-navy text-white font-bold font-mono">
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
                        <span className="font-bold text-navy">
                          {item.record.workHours.toFixed(1)} hrs
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Extra Hours */}
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {item.record?.extraHours && item.record.extraHours > 0 ? (
                        <span className="font-bold text-copper">
                          +{item.record.extraHours.toFixed(1)} hrs
                        </span>
                      ) : (
                        '00:00'
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6 text-xs">
                      {item.isWeekend ? (
                        <span className="text-text-muted font-mono">Weekend</span>
                      ) : isPresent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sage-light text-navy-dark border border-sage-deep/30 font-mono">
                          Present
                        </span>
                      ) : item.isPastOrToday ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-light text-terracotta border border-terracotta/30 font-mono">
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

      {/* ── Mobile Attendance Cards ────────────────────────────────────── */}
      <div data-testid="mobile-attendance-cards" className="block md:hidden space-y-3">
        {monthDays
          .filter((d) => d.isPastOrToday || d.isToday)
          .slice(0, 10)
          .map((item, idx) => (
            <div
              key={idx}
              className={`card p-4 border border-navy/10 ${
                item.isToday ? 'bg-sage-light/20 border-sage-deep/30' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-navy/10">
                <span className="font-mono font-bold text-xs text-navy-dark">
                  {item.formattedDate} ({item.dayName})
                </span>
                {item.record?.checkIn ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage-light text-navy-dark font-mono">
                    Present
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-light text-terracotta font-mono">
                    Absent
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 font-mono">
                <div>
                  <span className="text-text-muted text-[11px] block">Check In:</span>
                  <span className="text-navy-dark font-bold">{formatTime(item.record?.checkIn)}</span>
                </div>
                <div>
                  <span className="text-text-muted text-[11px] block">Check Out:</span>
                  <span className="text-navy-dark font-bold">{formatTime(item.record?.checkOut)}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
