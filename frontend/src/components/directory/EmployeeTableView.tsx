import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Eye, Flame, ShieldCheck, ChevronRight } from 'lucide-react';
import { EmployeeStatus, StatusDot } from '../EmployeeCard';

export interface TableEmployeeItem {
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

interface EmployeeTableViewProps {
  employees: TableEmployeeItem[];
  onPreview: (employee: TableEmployeeItem) => void;
}

export const EmployeeTableView: React.FC<EmployeeTableViewProps> = ({ employees, onPreview }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, empId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(empId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-grey/25 shadow-sm overflow-hidden animate-fadeIn">
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-blue-grey/20 bg-cream/50 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="py-3.5 pl-6 pr-4">Employee</th>
              <th className="py-3.5 px-4">Department & Role</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Streak</th>
              <th className="py-3.5 px-4">Skills</th>
              <th className="py-3.5 pr-6 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-grey/15 text-xs">
            {employees.map((emp) => {
              const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
              const fullName = `${emp.firstName} ${emp.lastName}`;
              const streak = emp.gamificationPoints?.streak ?? 0;

              return (
                <tr
                  key={emp.id}
                  onClick={() => onPreview(emp)}
                  className="hover:bg-cream/40 transition-colors cursor-pointer group"
                >
                  {/* Avatar & Name */}
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        {emp.profilePicUrl ? (
                          <img
                            src={emp.profilePicUrl}
                            alt={fullName}
                            className={`w-9 h-9 rounded-full object-cover ring-2 ${
                              emp.status === 'PRESENT' ? 'ring-sage-light shadow-[0_0_8px_rgba(189,207,170,0.6)]' : 'ring-blue-grey/20'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold text-xs flex items-center justify-center ring-2 ${
                              emp.status === 'PRESENT' ? 'ring-sage-light shadow-[0_0_8px_rgba(189,207,170,0.6)]' : 'ring-blue-grey/20'
                            }`}
                          >
                            {initials}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            emp.status === 'PRESENT'
                              ? 'bg-[#BDCFAA] animate-pulse'
                              : emp.status === 'ON_LEAVE'
                              ? 'bg-[#8E9E83]'
                              : 'bg-[#C97B63]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="font-heading font-semibold text-text-primary group-hover:text-slate-brand transition-colors flex items-center space-x-1.5 truncate">
                          <span>{fullName}</span>
                          {emp.role && emp.role !== 'EMPLOYEE' && (
                            <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-brand/15 text-slate-brand">
                              <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                              {emp.role}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-muted flex items-center space-x-2">
                          <span>{emp.email}</span>
                          {emp.loginId && (
                            <button
                              type="button"
                              onClick={(e) => handleCopy(emp.loginId!, emp.id, e)}
                              className="font-mono text-[10px] text-blue-grey hover:text-slate-brand hover:underline"
                              title="Click to copy Login ID"
                            >
                              {copiedId === emp.id ? '✓ Copied' : `#${emp.loginId}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dept & Job Title */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-text-primary">{emp.jobTitle || 'Team Member'}</div>
                    <div className="text-[11px] text-text-muted">{emp.department || 'General'}</div>
                  </td>

                  {/* Presence Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        emp.status === 'PRESENT'
                          ? 'bg-sage-light/30 text-text-primary border-sage-deep/40'
                          : emp.status === 'ON_LEAVE'
                          ? 'bg-sage-deep/20 text-sage-deep border-sage-deep/30'
                          : 'bg-terracotta/15 text-terracotta border-terracotta/30'
                      }`}
                    >
                      <StatusDot status={emp.status} className="w-2 h-2" />
                      <span>{emp.status === 'PRESENT' ? 'Present' : emp.status === 'ON_LEAVE' ? 'On Leave' : 'Absent'}</span>
                    </span>
                  </td>

                  {/* Streak & Points */}
                  <td className="py-3.5 px-4 text-center">
                    {streak > 0 ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-mono font-bold">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        <span>{streak}d</span>
                      </span>
                    ) : (
                      <span className="text-text-muted text-[11px] font-mono">0d</span>
                    )}
                  </td>

                  {/* Skills tags */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {emp.skills && emp.skills.length > 0 ? (
                        emp.skills.slice(0, 2).map((s, idx) => (
                          <span
                            key={s.id || idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cream text-text-muted border border-blue-grey/20 truncate"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-text-muted text-[11px] italic">No skills listed</span>
                      )}
                      {emp.skills && emp.skills.length > 2 && (
                        <span className="text-[10px] text-text-muted">+{emp.skills.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 pr-6 pl-4 text-right">
                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`mailto:${emp.email}`}
                        className="p-1.5 rounded-lg text-text-muted hover:text-slate-brand hover:bg-cream border border-transparent hover:border-blue-grey/20 transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onPreview(emp)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-slate-brand hover:bg-cream border border-transparent hover:border-blue-grey/20 transition-colors"
                        title="Quick Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        to={`/employees/${emp.id}`}
                        className="p-1.5 rounded-lg text-text-muted hover:text-slate-brand hover:bg-cream border border-transparent hover:border-blue-grey/20 transition-colors"
                        title="Full Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
