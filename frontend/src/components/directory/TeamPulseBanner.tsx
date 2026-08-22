import React, { useMemo } from 'react';
import { Sparkles, Flame, Users } from 'lucide-react';
import { EmployeeStatus } from '../EmployeeCard';

interface EmployeeItem {
  id: string;
  loginId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string;
  bio?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  profilePicUrl?: string | null;
  status: EmployeeStatus;
  skills?: { id?: string; name: string }[];
  gamificationPoints?: { streak: number; total: number } | null;
}

interface TeamPulseBannerProps {
  employees: EmployeeItem[];
  onSelectDepartment?: (dept: string) => void;
  selectedDepartment?: string;
}

export const TeamPulseBanner: React.FC<TeamPulseBannerProps> = ({
  employees,
  onSelectDepartment,
  selectedDepartment = 'ALL',
}) => {
  const total = employees.length;
  const presentCount = employees.filter((e) => e.status === 'PRESENT').length;
  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;
  const absentCount = employees.filter((e) => e.status === 'ABSENT').length;

  const attendancePercent = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Department breakdown
  const departmentStats = useMemo(() => {
    const map = new Map<string, { total: number; present: number }>();
    employees.forEach((emp) => {
      const dept = emp.department || 'Other';
      const current = map.get(dept) || { total: 0, present: 0 };
      current.total += 1;
      if (emp.status === 'PRESENT') {
        current.present += 1;
      }
      map.set(dept, current);
    });
    return Array.from(map.entries()).map(([dept, stats]) => ({
      dept,
      total: stats.total,
      present: stats.present,
      percent: Math.round((stats.present / stats.total) * 100),
    }));
  }, [employees]);

  // Top streak leader
  const topStreakLeader = useMemo(() => {
    const withStreak = employees.filter((e) => (e.gamificationPoints?.streak ?? 0) > 0);
    if (withStreak.length === 0) return null;
    return withStreak.reduce((max, cur) =>
      (cur.gamificationPoints?.streak ?? 0) > (max.gamificationPoints?.streak ?? 0) ? cur : max
    );
  }, [employees]);

  return (
    <div className="bg-gradient-to-br from-white/90 via-white/80 to-cream/70 rounded-2xl border border-blue-grey/25 shadow-sm p-5 md:p-6 backdrop-blur-md relative overflow-hidden">
      {/* Background ambient decorative shapes */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-sage-light/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-slate-brand/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Row: Title & Top Streak Spotlight */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-text-primary flex items-center space-x-2">
                <span>Today's Company <span className="font-script text-slate-brand text-xl font-normal">Pulse</span></span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sage-light/40 text-text-primary border border-sage-deep/30 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BDCFAA] mr-1.5 animate-pulse" />
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-text-muted font-sans">Real-time attendance & team momentum across departments</p>
            </div>
          </div>

          {/* Streak Leader spotlight chip */}
          {topStreakLeader && (
            <div className="inline-flex items-center space-x-2 bg-white/90 border border-blue-grey/25 rounded-full px-3.5 py-1.5 text-xs shadow-sm self-start md:self-auto">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
              <span className="text-text-muted">Streak Leader:</span>
              <span className="font-semibold text-text-primary">
                {topStreakLeader.firstName} {topStreakLeader.lastName}
              </span>
              <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                {topStreakLeader.gamificationPoints?.streak}d
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar & Key Numbers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Main Attendance Progress Gauge */}
          <div className="lg:col-span-6 bg-white/80 border border-blue-grey/20 rounded-xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-text-primary flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-brand" />
                <span>Attendance Rate Today</span>
              </span>
              <span className="font-mono font-bold text-slate-brand text-sm">{attendancePercent}%</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-cream rounded-full h-2.5 overflow-hidden flex border border-blue-grey/15">
              <div
                className="bg-[#BDCFAA] h-full transition-all duration-500 rounded-full"
                style={{ width: `${attendancePercent}%` }}
                title={`${presentCount} present (${attendancePercent}%)`}
              />
              <div
                className="bg-[#8E9E83] h-full transition-all duration-500"
                style={{ width: `${total > 0 ? (onLeaveCount / total) * 100 : 0}%` }}
                title={`${onLeaveCount} on leave`}
              />
              <div
                className="bg-[#C97B63]/40 h-full transition-all duration-500"
                style={{ width: `${total > 0 ? (absentCount / total) * 100 : 0}%` }}
                title={`${absentCount} absent`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#BDCFAA]" />
                <span>{presentCount} Present</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#8E9E83]" />
                <span>{onLeaveCount} On Leave</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#C97B63]" />
                <span>{absentCount} Absent</span>
              </span>
            </div>
          </div>

          {/* Department Breakdown Mini-Chips */}
          <div className="lg:col-span-6 flex flex-wrap gap-2 items-center">
            {departmentStats.map((item) => {
              const isSelected = selectedDepartment === item.dept;
              return (
                <button
                  key={item.dept}
                  type="button"
                  onClick={() => onSelectDepartment && onSelectDepartment(isSelected ? 'ALL' : item.dept)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs border transition-all ${
                    isSelected
                      ? 'bg-slate-brand text-white border-slate-brand shadow-sm font-semibold'
                      : 'bg-white/80 hover:bg-white text-text-primary border-blue-grey/25 shadow-sm'
                  }`}
                >
                  <span className="font-medium">{item.dept}</span>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-cream text-text-muted font-bold'
                    }`}
                  >
                    {item.present}/{item.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
