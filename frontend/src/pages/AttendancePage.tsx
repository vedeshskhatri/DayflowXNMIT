import React from 'react';
import { Clock } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Attendance Logs & Time Tracking
          </h1>
          <p className="text-sm text-text-muted">
            Daily check-in / check-out with automatic hour calculation.
          </p>
        </div>
      </div>

      <div className="card border border-blue-grey/20 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-sage-light/30 text-sage-deep mx-auto flex items-center justify-center">
          <Clock className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Aryan's Module Slot (<code className="text-slate-brand font-mono text-sm">feat/attendance</code>)
          </h3>
          <p className="text-xs text-text-muted">
            Connects to <code className="bg-cream px-1.5 py-0.5 rounded font-mono">POST /attendance/checkin</code>, <code className="bg-cream px-1.5 py-0.5 rounded font-mono">POST /attendance/checkout</code>, and emits Socket.IO event.
          </p>
        </div>
      </div>
    </div>
  );
};
