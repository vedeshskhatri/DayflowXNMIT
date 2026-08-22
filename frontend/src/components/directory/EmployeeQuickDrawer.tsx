import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Briefcase,
  ShieldCheck,
  Heart,
  Sparkles,
} from 'lucide-react';
import { EmployeeStatus, StatusDot } from '../EmployeeCard';

export interface QuickDrawerEmployee {
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

interface EmployeeQuickDrawerProps {
  employee: QuickDrawerEmployee | null;
  onClose: () => void;
}

export const EmployeeQuickDrawer: React.FC<EmployeeQuickDrawerProps> = ({ employee, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (employee) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [employee, onClose]);

  if (!employee) return null;

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const streak = employee.gamificationPoints?.streak ?? 0;
  const points = employee.gamificationPoints?.total ?? 0;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Dimmed Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-text-primary/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-blue-grey/20 flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Top Bar Header */}
          <div className="p-5 border-b border-blue-grey/20 flex items-center justify-between bg-cream/40">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Quick Member Preview
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-cream transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Profile Overview Card */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-blue-grey/15 relative">
              {/* Avatar with live status badge */}
              <div className="relative mb-3">
                {employee.profilePicUrl ? (
                  <img
                    src={employee.profilePicUrl}
                    alt={fullName}
                    className={`w-20 h-20 rounded-full object-cover ring-4 ${
                      employee.status === 'PRESENT' ? 'ring-sage-light shadow-[0_0_15px_rgba(189,207,170,0.5)]' : 'ring-blue-grey/20'
                    } shadow-md`}
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold text-2xl flex items-center justify-center ring-4 ${
                      employee.status === 'PRESENT' ? 'ring-sage-light shadow-[0_0_15px_rgba(189,207,170,0.5)]' : 'ring-blue-grey/20'
                    } shadow-md`}
                  >
                    {initials}
                  </div>
                )}
                {/* Live Status indicator */}
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                  <StatusDot status={employee.status} className="w-3.5 h-3.5" />
                </div>
              </div>

              <h2 className="text-xl font-heading font-bold text-text-primary flex items-center space-x-2">
                <span>{fullName}</span>
                {employee.role && employee.role !== 'EMPLOYEE' && (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-brand/15 text-slate-brand border border-slate-brand/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {employee.role}
                  </span>
                )}
              </h2>

              <p className="text-sm text-text-muted mt-0.5">{employee.jobTitle || 'Team Member'}</p>

              {employee.department && (
                <span className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-cream text-text-primary border border-blue-grey/25">
                  {employee.department}
                </span>
              )}

              {/* Status pill & Login ID */}
              <div className="mt-3 flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-white border border-blue-grey/20 font-mono text-[11px] text-text-muted shadow-sm">
                  ID: {employee.loginId || 'N/A'}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full font-semibold text-[11px] border ${
                    employee.status === 'PRESENT'
                      ? 'bg-sage-light/30 text-text-primary border-sage-deep/40'
                      : employee.status === 'ON_LEAVE'
                      ? 'bg-sage-deep/20 text-sage-deep border-sage-deep/30'
                      : 'bg-terracotta/15 text-terracotta border-terracotta/30'
                  }`}
                >
                  {employee.status === 'PRESENT' ? '🟢 Present' : employee.status === 'ON_LEAVE' ? '🟡 On Leave' : '🔴 Absent'}
                </span>
              </div>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`mailto:${employee.email}`}
                className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm hover:bg-slate-brand/10 hover:text-slate-brand transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>

              <button
                type="button"
                onClick={() => copyToClipboard(employee.email, 'email')}
                className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm hover:bg-slate-brand/10 hover:text-slate-brand transition-colors"
              >
                {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-sage-deep" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'email' ? 'Copied!' : 'Copy Email'}</span>
              </button>

              {employee.phone && (
                <a
                  href={`tel:${employee.phone}`}
                  className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm hover:bg-slate-brand/10 hover:text-slate-brand transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Phone</span>
                </a>
              )}

              {employee.loginId && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(employee.loginId!, 'id')}
                  className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm hover:bg-slate-brand/10 hover:text-slate-brand transition-colors"
                >
                  {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-sage-deep" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'id' ? 'Copied!' : 'Copy Login ID'}</span>
                </button>
              )}
            </div>

            {/* Streak & Rewards Card */}
            <div className="bg-gradient-to-r from-cream to-white border border-blue-grey/25 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold text-text-primary flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Gamification & Rewards</span>
                </span>
                <Link
                  to="/rewards"
                  className="text-[11px] font-semibold text-slate-brand hover:underline"
                >
                  Leaderboard &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/90 border border-blue-grey/20 rounded-xl p-2.5 flex items-center space-x-2.5 shadow-sm">
                  <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-text-muted'}`} />
                  <div>
                    <div className="font-mono font-bold text-sm text-text-primary">{streak} Days</div>
                    <div className="text-[10px] text-text-muted">Active Streak</div>
                  </div>
                </div>

                <div className="bg-white/90 border border-blue-grey/20 rounded-xl p-2.5 flex items-center space-x-2.5 shadow-sm">
                  <span className="text-lg">🪙</span>
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-brand">{points.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted">Total Points</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio section if available */}
            {employee.bio && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-heading font-bold text-text-primary flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-terracotta" />
                  <span>About</span>
                </h3>
                <p className="text-xs text-text-muted bg-cream/50 p-3 rounded-xl border border-blue-grey/15 leading-relaxed">
                  {employee.bio}
                </p>
              </div>
            )}

            {/* Skills & Expertise */}
            {employee.skills && employee.skills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-heading font-bold text-text-primary flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-brand" />
                  <span>Skills & Expertise</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills.map((skill, idx) => (
                    <span
                      key={skill.id || idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-brand/10 text-slate-brand border border-slate-brand/20"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer with Full Profile Link */}
          <div className="p-5 border-t border-blue-grey/20 bg-cream/30 flex items-center justify-between">
            <button
              onClick={onClose}
              className="btn-secondary py-2 px-4 text-xs font-semibold"
            >
              Close
            </button>

            <Link
              to={`/employees/${employee.id}`}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center space-x-1.5 shadow-sm hover:scale-[1.02] transition-transform"
            >
              <span>View Full Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
