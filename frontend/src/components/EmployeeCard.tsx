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
      className="group relative bg-white rounded-3xl shadow-card p-6 border border-navy/10 flex flex-col items-center text-center hover:shadow-elevated hover:border-copper/30 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle top copper accent bar on hover */}
      <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-copper transition-colors duration-300" />

      {/* Live Status Indicator in top-right corner */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5" title={`Status: ${status}`}>
        <StatusDot status={status} />
        <span className="text-[11px] font-bold text-text-muted capitalize font-mono">
          {status === 'PRESENT' ? 'Present' : status === 'ON_LEAVE' ? 'On Leave' : 'Absent'}
        </span>
      </div>

      {/* Avatar with luxury border */}
      <div className="relative mb-4 mt-2">
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={fullName}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-navy/10 shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-navy text-white flex items-center justify-center ring-2 ring-navy/10 font-heading font-bold text-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
            {initials || 'EM'}
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-heading font-bold text-base text-navy-dark group-hover:text-navy transition-colors">
        {fullName}
      </h3>
      <p className="text-xs text-text-muted mt-0.5 font-medium">
        {jobTitle || 'Team Member'}
      </p>
      {department && (
        <span className="mt-3 inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-cream text-navy-dark border border-navy/10 font-mono">
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
        className={`inline-block w-2.5 h-2.5 rounded-full bg-sage-light shadow-[0_0_6px_rgba(200,214,175,0.9)] ${className}`}
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
        className={`inline-flex items-center justify-center text-white rounded-full p-0.5 shadow-[0_0_6px_rgba(184,115,51,0.8)] ${className}`}
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
      title="Absent (not checked in)"
    />
  );
};
