import React from 'react';
import { Link } from 'react-router-dom';

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
      className="group relative bg-white rounded-xl shadow-card p-6 border border-blue-grey/20 flex flex-col items-center text-center hover:shadow-modal transition-all duration-200 block"
    >
      {/* Live Status Dot in top right */}
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
        className={`inline-block w-2.5 h-2.5 rounded-full bg-[#BDCFAA] shadow-[0_0_6px_rgba(189,207,170,0.8)] ${className}`}
        title="Present"
      />
    );
  }

  if (status === 'ON_LEAVE') {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full bg-[#8E9E83] relative overflow-hidden shadow-[0_0_6px_rgba(142,158,131,0.8)] ${className}`}
        title="On Leave"
      >
        <span className="absolute top-0 right-0 w-1/2 h-full bg-white opacity-60" />
      </span>
    );
  }

  // ABSENT
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full bg-[#C97B63] shadow-[0_0_6px_rgba(201,123,99,0.8)] ${className}`}
      title="Absent"
    />
  );
};
