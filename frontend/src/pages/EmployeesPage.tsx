import React from 'react';
import { Users } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Employee Directory
          </h1>
          <p className="text-sm text-text-muted">
            All registered employees with real-time status dots.
          </p>
        </div>
      </div>

      <div className="card border border-blue-grey/20 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-brand/10 text-slate-brand mx-auto flex items-center justify-center">
          <Users className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Aryan's Module Slot (<code className="text-slate-brand font-mono text-sm">feat/profile</code>)
          </h3>
          <p className="text-xs text-text-muted">
            Connects to <code className="bg-cream px-1.5 py-0.5 rounded font-mono">GET /employees</code> with 3-column card grid, search bar, and profile modal.
          </p>
        </div>
      </div>
    </div>
  );
};
