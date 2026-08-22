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
}

export const TimeOffCalendar: React.FC<TimeOffCalendarProps> = ({ requests }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('year');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

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

  // Header Title based on View Mode
  const getHeaderTitle = () => {
    if (viewMode === 'year') {
      return `Leave Calendar Overview (${currentDate.getFullYear()})`;
    }
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm space-y-5">
      {/* ── Top Bar: Header Title, Navigation, View Mode Toggles ─────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-grey/15">
        {/* Left: Title & Nav Arrows */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-brand/10 text-slate-brand flex items-center justify-center border border-slate-brand/15">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary">
              {getHeaderTitle()}
            </h3>
            <p className="text-[11px] text-text-muted">
              Track approved and pending leave schedule
            </p>
          </div>
        </div>

        {/* Right: Controls & Mode Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Nav Buttons */}
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

          {/* View Mode Toggle: [Year] [Month] [Week] [Day] */}
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

      {/* ── Legend Bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-cream/40 px-3.5 py-2 rounded-xl border border-blue-grey/15">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-brand text-white text-[9px] flex items-center justify-center font-bold">
              ★
            </span>
            <span className="font-bold text-slate-brand">
              Today: {today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-deep" />
            <span className="text-text-muted">Approved Leave</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
            <span className="text-text-muted">Pending Request</span>
          </span>
        </div>
        <span className="text-[11px] text-text-muted italic">
          Click &lsquo;Today&rsquo; anytime to center on current date
        </span>
      </div>

      {/* ── VIEW 1: Yearly View (12-Month Matrix) ──────────────────── */}
      {viewMode === 'year' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs animate-fadeIn">
          {Array.from({ length: 12 }, (_, m) => {
            const year = currentDate.getFullYear();
            const firstDay = new Date(year, m, 1).getDay();
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            const monthName = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' });
            const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m;

            return (
              <div
                key={m}
                className={`p-3 rounded-2xl border transition-all ${
                  isCurrentMonth
                    ? 'bg-slate-brand/5 border-slate-brand/30 ring-1 ring-slate-brand/20'
                    : 'bg-cream/30 border-blue-grey/15'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    {monthName}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-[9px] font-bold text-slate-brand uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-brand/10">
                      Current
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center font-mono">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                    <span key={idx} className="text-text-muted font-bold pb-1">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: firstDay }, (_, i) => (
                    <span key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const leave = leaveMap.get(dateStr);
                    const isToday = dateStr === todayDateStr;

                    let cellClasses = 'text-text-primary hover:bg-cream';
                    if (leave?.status === 'APPROVED') {
                      cellClasses = 'bg-sage-deep text-white font-bold shadow-sm';
                    } else if (leave?.status === 'PENDING') {
                      cellClasses = 'bg-terracotta text-white font-bold shadow-sm';
                    } else if (isToday) {
                      cellClasses = 'bg-slate-brand text-white font-bold shadow-md ring-2 ring-slate-brand/40';
                    }

                    return (
                      <span
                        key={dayNum}
                        className={`h-5 w-5 flex items-center justify-center rounded-md font-medium transition-all ${cellClasses} ${
                          isToday && leave ? 'ring-2 ring-slate-brand ring-offset-1 font-bold' : ''
                        }`}
                        title={
                          isToday
                            ? `Today (${dayNum} ${monthName})${leave ? ` • ${leave.type} (${leave.status})` : ''}`
                            : leave
                            ? `${leave.type} (${leave.status})`
                            : undefined
                        }
                      >
                        {dayNum}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW 2: Monthly View (Full Grid) ───────────────────────── */}
      {viewMode === 'month' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-heading font-bold text-text-muted py-2 bg-cream/50 rounded-xl">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Month Day Cells */}
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

                cells.push(
                  <div
                    key={dayNum}
                    className={`min-h-[90px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isToday
                        ? 'bg-slate-brand/10 border-slate-brand ring-2 ring-slate-brand/30 shadow-md'
                        : 'bg-white border-blue-grey/20 hover:border-slate-brand/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                          isToday
                            ? 'bg-slate-brand text-white'
                            : 'text-text-primary'
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

                    {leave ? (
                      <div
                        className={`p-1.5 rounded-lg text-[10px] font-semibold truncate ${
                          leave.status === 'APPROVED'
                            ? 'bg-sage-deep text-white'
                            : 'bg-terracotta text-white'
                        }`}
                        title={`${leave.type} (${leave.status})`}
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

      {/* ── VIEW 3: Weekly View (7 Days) ───────────────────────────── */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 text-xs animate-fadeIn">
          {Array.from({ length: 7 }, (_, i) => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + i);
            const dateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
            const leave = leaveMap.get(dateStr);
            const isToday = dateStr === todayDateStr;
            const dayName = startOfWeek.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all ${
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

                {leave ? (
                  <div
                    className={`p-2 rounded-xl text-[11px] font-semibold mt-3 ${
                      leave.status === 'APPROVED'
                        ? 'bg-sage-deep text-white'
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

      {/* ── VIEW 4: Daily View (Single Day) ────────────────────────── */}
      {viewMode === 'day' && (
        <div className="p-6 rounded-2xl bg-cream/30 border border-blue-grey/20 space-y-4 animate-fadeIn">
          {(() => {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const leave = leaveMap.get(dateStr);
            const isToday = dateStr === todayDateStr;

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
                  <p className="text-xs text-text-muted">
                    Detailed daily leave and presence breakdown
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {leave ? (
                    <div className="p-4 rounded-xl bg-white border border-blue-grey/20 shadow-sm flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                          leave.status === 'APPROVED' ? 'bg-sage-deep' : 'bg-terracotta'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">
                          {leave.type}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            leave.status === 'APPROVED' ? 'text-sage-deep' : 'text-terracotta'
                          }`}
                        >
                          Status: {leave.status}
                        </span>
                        {leave.remarks && (
                          <p className="text-[11px] text-text-muted mt-0.5 italic">
                            &ldquo;{leave.remarks}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-blue-grey/20 shadow-sm flex items-center space-x-2.5 text-xs text-text-primary">
                      <Sparkles className="w-4 h-4 text-sage-deep" />
                      <span>Regular Working Day &bull; No active leave requests</span>
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
