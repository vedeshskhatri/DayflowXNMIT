import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase
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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EmployeeAttendanceView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute Monday to Sunday for the current weekOffset
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const fromStr = monday.toISOString().split('T')[0];
    const toStr = sunday.toISOString().split('T')[0];

    return { monday, sunday, fromStr, toStr };
  };

  const { monday, sunday, fromStr, toStr } = getWeekDates(weekOffset);

  // Fetch own attendance records
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

  // Generate full 7-day rows (Mon to Sun)
  const fullWeekDays = DAYS_OF_WEEK.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];

    const match = data?.records.find((r) => r.date === dateStr);
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isWeekend = idx === 5 || idx === 6;

    return {
      dayName,
      date: dateStr,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday,
      isWeekend,
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

  const formatHeaderRange = () => {
    const mStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${mStr} – ${sStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Days Present - Sage Green */}
        <div className="card p-5 border border-sage-light bg-sage-light/20 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Days Present</p>
            <p className="text-2xl font-heading font-bold text-text-primary mt-1">
              {data?.summary.daysPresent ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#BDCFAA]/40 text-text-primary flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-text-primary" />
          </div>
        </div>

        {/* Leaves Taken - Terracotta */}
        <div className="card p-5 border border-terracotta/30 bg-terracotta/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-terracotta uppercase tracking-wider">Leaves Taken</p>
            <p className="text-2xl font-heading font-bold text-terracotta mt-1">
              {data?.summary.leavesTaken ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-terracotta/20 text-terracotta flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Working Days - Neutral */}
        <div className="card p-5 border border-blue-grey/30 bg-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Working Days</p>
            <p className="text-2xl font-heading font-bold text-text-primary mt-1">
              {data?.summary.totalWorkingDays ?? 5}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cream text-slate-brand flex items-center justify-center border border-blue-grey/20">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Week Navigation Controls */}
      <div className="card border border-blue-grey/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-slate-brand" />
          <h2 className="text-base font-heading font-semibold text-text-primary">
            {formatHeaderRange()}
          </h2>
          {weekOffset === 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-brand/10 text-slate-brand">
              Current Week
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-2 rounded-xl border border-blue-grey/30 bg-white hover:bg-cream transition-colors text-text-primary"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-xl border border-blue-grey/30 bg-white hover:bg-cream text-xs font-medium text-text-muted"
            >
              This Week
            </button>
          )}

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-xl border border-blue-grey/30 bg-white hover:bg-cream transition-colors text-text-primary"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table on Desktop (>= md) */}
      <div className="hidden md:block card border border-blue-grey/20 overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream/80 border-b border-blue-grey/20 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Day</th>
              <th className="py-3.5 px-6">Date</th>
              <th className="py-3.5 px-6">Check In</th>
              <th className="py-3.5 px-6">Check Out</th>
              <th className="py-3.5 px-6">Work Hours</th>
              <th className="py-3.5 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-grey/15">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted">
                  <div className="inline-block w-5 h-5 border-2 border-slate-brand border-t-transparent rounded-full animate-spin mr-2" />
                  Loading weekly attendance...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-terracotta">
                  Failed to load attendance logs.
                </td>
              </tr>
            ) : (
              fullWeekDays.map((item) => {
                const isPresent = Boolean(item.record?.checkIn);
                return (
                  <tr
                    key={item.date}
                    className={`transition-colors ${
                      item.isToday ? 'bg-slate-brand/5 font-medium' : 'hover:bg-cream/40'
                    }`}
                  >
                    <td className="py-4 px-6 flex items-center space-x-2">
                      <span>{item.dayName}</span>
                      {item.isToday && (
                        <span className="text-[10px] bg-slate-brand text-white px-1.5 py-0.5 rounded font-mono">
                          TODAY
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-text-muted font-mono text-xs">{item.displayDate}</td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {formatTime(item.record?.checkIn)}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {formatTime(item.record?.checkOut)}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {item.record?.workHours !== null && item.record?.workHours !== undefined ? (
                        <span className="font-semibold text-text-primary">
                          {item.record.workHours} hrs
                          {item.record.extraHours ? (
                            <span className="text-sage-deep text-[11px] ml-1">
                              (+{item.record.extraHours} OT)
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {isPresent ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sage-light/40 text-text-primary border border-sage-light">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#BDCFAA]" />
                          <span>Present</span>
                        </span>
                      ) : item.isWeekend ? (
                        <span className="text-xs text-text-muted bg-cream px-2 py-0.5 rounded">
                          Weekend
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta/15 text-terracotta border border-terracotta/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C97B63]" />
                          <span>Absent / Off</span>
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

      {/* Stacked Cards on Mobile (< md) — No horizontal scroll */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="card p-8 text-center text-text-muted text-xs">Loading attendance...</div>
        ) : (
          fullWeekDays.map((item) => {
            const isPresent = Boolean(item.record?.checkIn);
            return (
              <div
                key={item.date}
                className={`card p-4 border border-blue-grey/20 space-y-3 ${
                  item.isToday ? 'ring-2 ring-slate-brand/30 bg-slate-brand/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-semibold text-sm text-text-primary">
                      {item.dayName}
                    </span>
                    <span className="text-xs text-text-muted font-mono">{item.displayDate}</span>
                    {item.isToday && (
                      <span className="text-[10px] bg-slate-brand text-white px-1.5 py-0.5 rounded font-mono">
                        TODAY
                      </span>
                    )}
                  </div>
                  {isPresent ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sage-light/40 text-text-primary border border-sage-light">
                      Present
                    </span>
                  ) : item.isWeekend ? (
                    <span className="text-xs text-text-muted bg-cream px-2 py-0.5 rounded">
                      Weekend
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-terracotta/15 text-terracotta border border-terracotta/30">
                      Absent
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-grey/15 text-xs">
                  <div>
                    <span className="text-[11px] text-text-muted block">Check In</span>
                    <span className="font-mono font-medium">{formatTime(item.record?.checkIn)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Check Out</span>
                    <span className="font-mono font-medium">{formatTime(item.record?.checkOut)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Duration</span>
                    <span className="font-mono font-medium">
                      {item.record?.workHours !== null && item.record?.workHours !== undefined
                        ? `${item.record.workHours}h`
                        : '—'}
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
