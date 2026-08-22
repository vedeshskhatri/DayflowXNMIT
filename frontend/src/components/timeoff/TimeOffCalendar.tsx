import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

type CalendarViewMode = 'year' | 'month' | 'week' | 'day';

interface TimeOffRequest {
  id: string;
  typeId: string;
  type: { name: string };
  startDate: string;
  endDate: string;
  daysCount: number;
  remarks: string | null;
  attachmentUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface TimeOffCalendarProps {
  requests: TimeOffRequest[];
  onDateClick?: (dateStr: string) => void;
}

// Public Holidays per Image 1 Wireframe
const PUBLIC_HOLIDAYS_2026: { date: string; name: string }[] = [
  { date: '2026-01-14', name: 'Kite Festival' },
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-04', name: 'Dhuleti' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-08-28', name: 'Rakhi' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-11-10', name: 'New Year' },
  { date: '2026-11-11', name: 'Bhai Duj' },
];

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const TimeOffCalendar: React.FC<TimeOffCalendarProps> = ({
  requests,
  onDateClick,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('year');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 22)); // August 2026 default

  const today = new Date();
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Map of date strings -> leave objects
  const leaveMap = useMemo(() => {
    const map = new Map<string, { status: string; type: string; remarks?: string | null }>();
    requests.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        map.set(cur.toISOString().split('T')[0], {
          status: r.status,
          type: r.type?.name || 'Leave',
          remarks: r.remarks,
        });
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [requests]);

  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>();
    PUBLIC_HOLIDAYS_2026.forEach((h) => map.set(h.date, h.name));
    return map;
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-blue-grey/20 shadow-sm space-y-6">
      {/* ── Top Bar: Header Title, Navigation, View Mode Toggles ─────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-grey/15">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-brand/10 text-slate-brand flex items-center justify-center border border-slate-brand/15">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary">
              {viewMode === 'year'
                ? `Yearly Time Off Calendar (${currentDate.getFullYear()})`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-xs text-text-muted">
              Master annual calendar matrix with public holidays & statutory leave schedules
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-cream/70 p-1 rounded-xl border border-blue-grey/20">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white text-text-muted hover:text-text-primary transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-brand hover:bg-white transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white text-text-muted hover:text-text-primary transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-cream/70 p-1 rounded-xl border border-blue-grey/20">
            {(['year', 'month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-slate-brand text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── VIEW 1: Yearly View with 12 Month Matrix + Legend & Public Holidays Sidebar (Exact Wireframe Image 1) ── */}
      {viewMode === 'year' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* 12-Month Matrix (4 Columns on Desktop) */}
          <div className="xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, m) => {
              const year = currentDate.getFullYear();
              const firstDayOfMonth = new Date(year, m, 1).getDay();
              const daysInMonth = new Date(year, m + 1, 0).getDate();
              const monthName = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'long' });
              const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m;

              return (
                <div
                  key={m}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrentMonth
                      ? 'bg-slate-brand/5 border-slate-brand/30 ring-1 ring-slate-brand/20'
                      : 'bg-white border-blue-grey/20 shadow-xs'
                  }`}
                >
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-bold text-xs text-text-primary">
                      {monthName} {year}
                    </span>
                    {isCurrentMonth && (
                      <span className="text-[8px] font-bold text-slate-brand uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-brand/10">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Day Table: Week No + S M T W T F S */}
                  <table className="w-full text-center text-[10px] font-mono border-collapse">
                    <thead>
                      <tr className="text-text-muted border-b border-blue-grey/15">
                        <th className="pb-1 text-[9px] font-normal text-text-muted/70 w-5">#</th>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                          <th key={idx} className="pb-1 font-bold">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows = [];
                        let dayCount = 1;
                        let weekCount = 0;

                        while (dayCount <= daysInMonth && weekCount < 6) {
                          const weekDate = new Date(year, m, dayCount);
                          const weekNum = getWeekNumber(weekDate);
                          const cells = [];

                          // Week number column on left
                          cells.push(
                            <td key={`wk-${weekCount}`} className="text-[8px] text-text-muted/60 font-sans py-0.5">
                              {weekNum}
                            </td>
                          );

                          for (let d = 0; d < 7; d++) {
                            if ((weekCount === 0 && d < firstDayOfMonth) || dayCount > daysInMonth) {
                              cells.push(<td key={`empty-${weekCount}-${d}`} className="py-0.5" />);
                            } else {
                              const currentDay = dayCount;
                              const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
                              const leave = leaveMap.get(dateStr);
                              const isToday = dateStr === todayDateStr;
                              const holiday = holidaysMap.get(dateStr);

                              // Visual classes per wireframe legend:
                              // Validated = Purple, To Approve = Amber/Striped, Refused = Line/Terracotta, Today = Red circle
                              let bgClass = 'text-text-primary hover:bg-cream cursor-pointer';
                              if (leave?.status === 'APPROVED') {
                                bgClass = 'bg-[#9333ea] text-white font-bold rounded-md shadow-xs';
                              } else if (leave?.status === 'PENDING') {
                                bgClass = 'bg-amber-400 text-slate-900 font-bold rounded-md shadow-xs';
                              } else if (leave?.status === 'REJECTED') {
                                bgClass = 'text-terracotta line-through font-bold';
                              } else if (holiday) {
                                bgClass = 'bg-sage-light text-sage-deep font-bold rounded-md';
                              } else if (isToday) {
                                bgClass = 'bg-red-500 text-white font-bold rounded-full shadow-sm ring-2 ring-red-300';
                              }

                              cells.push(
                                <td key={`day-${currentDay}`} className="py-0.5 px-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onDateClick && onDateClick(dateStr)}
                                    className={`w-5 h-5 flex items-center justify-center mx-auto text-[9.5px] transition-transform hover:scale-110 ${bgClass}`}
                                    title={
                                      isToday
                                        ? `Today (${currentDay} ${monthName})`
                                        : holiday
                                        ? `Holiday: ${holiday}`
                                        : leave
                                        ? `${leave.type} (${leave.status})`
                                        : `${currentDay} ${monthName}`
                                    }
                                  >
                                    {currentDay}
                                  </button>
                                </td>
                              );
                              dayCount++;
                            }
                          }
                          rows.push(<tr key={`row-${weekCount}`}>{cells}</tr>);
                          weekCount++;
                        }
                        return rows;
                      })()}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* ── Right Sidebar: Legend & Public Holidays (Exact Wireframe Image 1) ── */}
          <div className="xl:col-span-3 space-y-6 bg-cream/40 p-5 rounded-3xl border border-blue-grey/20">
            {/* Legend Box */}
            <div className="space-y-3 pb-5 border-b border-blue-grey/20">
              <h4 className="font-heading font-bold text-xs text-text-primary uppercase tracking-wider">
                Legend
              </h4>
              <div className="space-y-2 text-xs">
                {/* Validated */}
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded-md bg-[#9333ea] flex-shrink-0 shadow-xs" />
                  <span className="font-medium text-text-primary">Validated</span>
                </div>
                {/* To Approve */}
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded-md bg-amber-400 flex-shrink-0 shadow-xs" />
                  <span className="font-medium text-text-primary">To Approve</span>
                </div>
                {/* Refused */}
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 flex items-center justify-center font-bold text-terracotta text-sm">
                    —
                  </span>
                  <span className="font-medium text-text-primary">Refused</span>
                </div>
              </div>
            </div>

            {/* Public Holidays Box */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-xs text-text-primary uppercase tracking-wider">
                Public Holidays (2026)
              </h4>
              <div className="space-y-2 text-xs">
                {PUBLIC_HOLIDAYS_2026.map((h, idx) => (
                  <div key={idx} className="flex flex-col py-1 border-b border-blue-grey/15 last:border-0">
                    <span className="font-semibold text-text-primary">
                      {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}:
                    </span>
                    <span className="text-slate-brand text-[11px] font-medium">{h.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 2: Monthly View ───────────────────────────────────── */}
      {viewMode === 'month' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-heading font-bold text-text-muted py-2 bg-cream/50 rounded-xl">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs">
            {(() => {
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();

              const cells = [];
              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} className="min-h-[90px] rounded-2xl bg-cream/10 border border-transparent" />);
              }
              for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const leave = leaveMap.get(dateStr);
                const isToday = dateStr === todayDateStr;
                const holiday = holidaysMap.get(dateStr);

                cells.push(
                  <div
                    key={dayNum}
                    onClick={() => onDateClick && onDateClick(dateStr)}
                    className={`min-h-[90px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isToday
                        ? 'bg-slate-brand/10 border-slate-brand ring-2 ring-slate-brand/30 shadow-md'
                        : 'bg-white border-blue-grey/20 hover:border-slate-brand/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                          isToday ? 'bg-slate-brand text-white' : 'text-text-primary'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-heading font-bold text-slate-brand uppercase tracking-wider bg-white px-1.5 py-0.5 rounded-md border border-slate-brand/30 shadow-xs">
                          Today
                        </span>
                      )}
                    </div>

                    {holiday ? (
                      <div className="p-1 rounded bg-sage-light text-sage-deep text-[10px] font-semibold truncate">
                        {holiday}
                      </div>
                    ) : leave ? (
                      <div
                        className={`p-1.5 rounded-lg text-[10px] font-semibold truncate ${
                          leave.status === 'APPROVED'
                            ? 'bg-[#9333ea] text-white'
                            : leave.status === 'PENDING'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-terracotta text-white line-through'
                        }`}
                      >
                        {leave.type}
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted font-mono self-end">—</span>
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* ── VIEW 3: Weekly View ────────────────────────────────────── */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 text-xs animate-fadeIn">
          {Array.from({ length: 7 }, (_, i) => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + i);
            const dateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
            const leave = leaveMap.get(dateStr);
            const isToday = dateStr === todayDateStr;
            const holiday = holidaysMap.get(dateStr);
            const dayName = startOfWeek.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            return (
              <div
                key={i}
                onClick={() => onDateClick && onDateClick(dateStr)}
                className={`p-4 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  isToday
                    ? 'bg-slate-brand/10 border-slate-brand ring-2 ring-slate-brand/30 shadow-md'
                    : 'bg-white border-blue-grey/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-blue-grey/15">
                    <span className="font-heading font-bold text-xs text-text-primary uppercase">
                      {dayName}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold bg-slate-brand text-white px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="font-mono font-bold text-sm text-slate-brand mt-1.5">
                    {formattedDate}
                  </p>
                </div>

                {holiday ? (
                  <div className="p-2 rounded-xl bg-sage-light text-sage-deep text-[11px] font-semibold mt-3">
                    {holiday}
                  </div>
                ) : leave ? (
                  <div
                    className={`p-2 rounded-xl text-[11px] font-semibold mt-3 ${
                      leave.status === 'APPROVED'
                        ? 'bg-[#9333ea] text-white'
                        : leave.status === 'PENDING'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-terracotta text-white'
                    }`}
                  >
                    <p className="truncate font-bold">{leave.type}</p>
                    <p className="text-[9px] opacity-90">{leave.status}</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-[10px] text-text-muted mt-3">
                    <Sparkles className="w-3 h-3 text-sage-deep" />
                    <span>Working Day</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW 4: Daily View ─────────────────────────────────────── */}
      {viewMode === 'day' && (
        <div className="p-6 rounded-2xl bg-cream/30 border border-blue-grey/20 space-y-4 animate-fadeIn">
          {(() => {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const leave = leaveMap.get(dateStr);
            const isToday = dateStr === todayDateStr;
            const holiday = holidaysMap.get(dateStr);

            return (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-bold text-lg text-text-primary">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {isToday && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-brand text-white">
                        Today
                      </span>
                    )}
                  </div>
                  {holiday && (
                    <p className="text-xs font-bold text-sage-deep">
                      Public Holiday: {holiday}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {leave ? (
                    <div className="p-4 rounded-xl bg-white border border-blue-grey/20 shadow-sm flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                          leave.status === 'APPROVED' ? 'bg-[#9333ea]' : 'bg-amber-400 text-slate-900'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">
                          {leave.type}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Status: {leave.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-blue-grey/20 shadow-sm flex items-center space-x-2.5 text-xs text-text-primary">
                      <Sparkles className="w-4 h-4 text-sage-deep" />
                      <span>Regular Working Day</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

