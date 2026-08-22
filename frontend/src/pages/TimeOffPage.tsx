import React from 'react';
import { CalendarDays } from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Time Off & Leave Management
          </h1>
          <p className="text-sm text-text-muted">
            Request time off, view balances, and approve pending requests.
          </p>
        </div>
      </div>

      <div className="card border border-blue-grey/20 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-grey/20 text-slate-brand mx-auto flex items-center justify-center">
          <CalendarDays className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Swapnil's Module Slot (<code className="text-slate-brand font-mono text-sm">feat/timeoff</code>)
          </h3>
          <p className="text-xs text-text-muted">
            Connects to <code className="bg-cream px-1.5 py-0.5 rounded font-mono">GET /timeoff/allocations</code>, <code className="bg-cream px-1.5 py-0.5 rounded font-mono">POST /timeoff/requests</code>, and approval endpoints.
          </p>
        </div>
      </div>
    </div>
  );
};
