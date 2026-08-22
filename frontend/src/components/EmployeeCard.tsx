import React from 'react';
import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';

export type EmployeeStatus = 'PRESENT' | 'ON_LEAVE' | 'ABSENT';

interface EmployeeCardProps {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  department?: string | null;
  profilePicUrl?: string | null;
  status: EmployeeStatus;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  id,
  firstName,
  lastName,
  jobTitle,
  department,
  profilePicUrl,
  status,
}) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;

  return (
    <Link
      to={`/employees/${id}`}
      className="group relative bg-white rounded-2xl shadow-card p-6 border border-blue-grey/20 flex flex-col items-center text-center hover:shadow-modal transition-all duration-200"
    >
      {/* Live Status Indicator in top-right corner */}
      <div className="absolute top-4 right-4 flex items-center space-x-1.5" title={`Status: ${status}`}>
        <StatusDot status={status} />
        <span className="text-[11px] font-medium text-text-muted capitalize">
          {status === 'PRESENT' ? 'Present' : status === 'ON_LEAVE' ? 'On Leave' : 'Absent'}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative mb-4 mt-2">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={fullName}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-grey/20 shadow-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-slate-brand/10 text-slate-brand flex items-center justify-center ring-2 ring-blue-grey/20 font-heading font-bold text-xl shadow-sm">
            {initials || 'EM'}
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-heading font-semibold text-base text-text-primary group-hover:text-slate-brand transition-colors">
        {fullName}
      </h3>
      <p className="text-xs text-text-muted mt-0.5">
        {jobTitle || 'Team Member'}
      </p>
      {department && (
        <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cream text-text-muted border border-blue-grey/20">
          {department}
        </span>
      )}
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

  // ABSENT: 🟡 Yellow dot: Employee is absent. (Employee has not applied time off and is absent.)
  return (
    <span
      data-testid="status-dot"
      data-status="ABSENT"
      className={`inline-block w-2.5 h-2.5 rounded-full bg-[#EAB308] shadow-[0_0_6px_rgba(234,179,8,0.8)] ${className}`}
      style={{ backgroundColor: '#EAB308' }}
      title="Absent (no time off applied)"
    />
  );
};
