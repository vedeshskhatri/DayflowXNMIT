import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Mail, Copy, Check, Eye, Flame, ShieldCheck } from 'lucide-react';

export type EmployeeStatus = 'PRESENT' | 'ON_LEAVE' | 'ABSENT';

export interface EmployeeCardProps {
  id: string;
  loginId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  jobTitle?: string | null;
  department?: string | null;
  profilePicUrl?: string | null;
  status: EmployeeStatus;
  skills?: { id?: string; name: string }[];
  gamificationPoints?: { streak: number; total: number } | null;
  onPreview?: (e: React.MouseEvent) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  id,
  loginId,
  firstName,
  lastName,
  email,
  role,
  jobTitle,
  department,
  profilePicUrl,
  status,
  skills,
  gamificationPoints,
  onPreview,
}) => {
  const [copied, setCopied] = useState(false);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;
  const streak = gamificationPoints?.streak ?? 0;

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loginId || email) {
      navigator.clipboard.writeText(loginId || email || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    if (onPreview) {
      e.preventDefault();
      e.stopPropagation();
      onPreview(e);
    }
  };

  return (
    <Link
      to={`/employees/${id}`}
      className="group relative bg-white rounded-3xl shadow-card p-5 border border-navy/10 flex flex-col items-center text-center hover:shadow-elevated hover:border-copper/40 transition-all duration-300 overflow-hidden block"
    >
      {/* Top Subtle Copper Accent line on hover */}
      <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-copper transition-colors duration-300" />

      {/* Top Badges Bar: Streak & Presence Status */}
      <div className="w-full flex items-center justify-between mb-2">
        {streak > 0 ? (
          <span
            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-copper-muted text-copper-dark border border-copper/30 text-[10px] font-mono font-bold shadow-xs"
            title={`${streak}-day active check-in streak`}
          >
            <Flame className="w-3 h-3 text-copper fill-copper animate-pulse" />
            <span>{streak}d</span>
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center space-x-1.5" title={`Status: ${status}`}>
          <StatusDot status={status} />
          <span className="text-[10px] font-bold text-text-muted capitalize font-mono">
            {status === 'PRESENT' ? 'Present' : status === 'ON_LEAVE' ? 'On Leave' : 'Absent'}
          </span>
        </div>
      </div>

      {/* Avatar */}
      <div className="relative mb-3 mt-1">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={fullName}
            className={`w-18 h-18 rounded-2xl object-cover ring-2 ${
              status === 'PRESENT'
                ? 'ring-[#BDCFAA] shadow-[0_0_12px_rgba(189,207,170,0.6)]'
                : 'ring-navy/10 shadow-sm'
            } group-hover:scale-105 transition-transform duration-300`}
          />
        ) : (
          <div
            className={`w-18 h-18 rounded-2xl bg-navy text-white flex items-center justify-center ring-2 ${
              status === 'PRESENT'
                ? 'ring-[#BDCFAA] shadow-[0_0_12px_rgba(189,207,170,0.6)]'
                : 'ring-navy/10 shadow-sm'
            } font-heading font-bold text-lg group-hover:scale-105 transition-transform duration-300`}
          >
            {initials || 'EM'}
          </div>
        )}
      </div>

      {/* Name & Role */}
      <h3 className="font-heading font-bold text-sm text-navy-dark group-hover:text-navy transition-colors flex items-center justify-center space-x-1.5">
        <span>{fullName}</span>
        {role && role !== 'EMPLOYEE' && (
          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-copper-muted text-copper-dark font-mono border border-copper/30">
            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
            {role === 'HR_OFFICER' ? 'HR' : role}
          </span>
        )}
      </h3>

      <p className="text-xs text-text-muted mt-0.5 truncate max-w-[180px] font-medium">
        {jobTitle || 'Team Member'}
      </p>

      {department && (
        <span className="mt-2 inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-cream text-navy-dark border border-navy/10 font-mono">
          {department}
        </span>
      )}

      {/* Skills Preview Chips */}
      {skills && skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap justify-center gap-1 max-w-[200px]">
          {skills.slice(0, 2).map((skill, idx) => (
            <span
              key={skill.id || idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cream-light text-navy border border-navy/10 truncate max-w-[90px]"
            >
              {skill.name}
            </span>
          ))}
          {skills.length > 2 && (
            <span className="text-[10px] text-text-muted self-center font-mono">+{skills.length - 2}</span>
          )}
        </div>
      )}

      {/* Hover Quick Action Buttons */}
      <div className="mt-3 pt-3 border-t border-navy/10 w-full flex items-center justify-center space-x-2">
        {email && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `mailto:${email}`;
            }}
            className="p-1.5 rounded-xl bg-cream hover:bg-cream-light text-text-muted hover:text-navy border border-navy/10 transition-all text-xs cursor-pointer"
            title={`Send email to ${email}`}
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        )}

        {(loginId || email) && (
          <button
            type="button"
            onClick={handleCopyId}
            className="p-1.5 rounded-xl bg-cream hover:bg-cream-light text-text-muted hover:text-navy border border-navy/10 transition-all text-xs flex items-center space-x-1 cursor-pointer"
            title="Copy Login ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-sage-deep" /> : <Copy className="w-3.5 h-3.5" />}
            {copied && <span className="text-[10px] text-sage-deep font-bold font-mono">Copied!</span>}
          </button>
        )}

        {onPreview && (
          <button
            type="button"
            onClick={handlePreviewClick}
            className="p-1.5 rounded-xl bg-cream hover:bg-cream-light text-text-muted hover:text-navy border border-navy/10 transition-all text-xs cursor-pointer"
            title="Quick Preview Panel"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Link>
  );
};

export const StatusDot: React.FC<{ status: EmployeeStatus; className?: string }> = ({ status, className = '' }) => {
  if (status === 'PRESENT') {
    return (
      <span
        data-testid="status-dot"
        data-status="PRESENT"
        className={`inline-block w-2.5 h-2.5 rounded-full bg-[#BDCFAA] shadow-[0_0_6px_rgba(189,207,170,0.8)] ${className}`}
        style={{ backgroundColor: '#BDCFAA' }}
        title="Present (in office)"
      />
    );
  }

  if (status === 'ON_LEAVE') {
    return (
      <span
        data-testid="status-dot"
        data-status="ON_LEAVE"
        className={`inline-flex items-center justify-center text-white rounded-full p-0.5 shadow-[0_0_6px_rgba(142,158,131,0.8)] ${className}`}
        style={{ backgroundColor: '#8E9E83' }}
        title="On Leave"
      >
        <Plane className="w-3 h-3 transform -rotate-45" />
      </span>
    );
  }

  // ABSENT
  return (
    <span
      data-testid="status-dot"
      data-status="ABSENT"
      className={`inline-block w-2.5 h-2.5 rounded-full bg-[#C97B63] shadow-[0_0_6px_rgba(201,123,99,0.8)] ${className}`}
      style={{ backgroundColor: '#C97B63' }}
      title="Absent (no time off applied)"
    />
  );
};
