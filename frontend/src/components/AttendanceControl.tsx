import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface AttendanceRecord {
  id?: string;
  employeeId?: string;
  date?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workHours?: number | null;
  extraHours?: number | null;
}

export const AttendanceControl: React.FC<{ compact?: boolean }> = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch today's attendance record
  const { data: todayAttendance, isLoading } = useQuery<AttendanceRecord | null>({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await api.get<AttendanceRecord | null>('/attendance/today');
      return res.data;
    },
    staleTime: 1000 * 60, // 1 min
  });

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/checkin');
      return res.data;
    },
    onMutate: async () => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today'] });
      const previous = queryClient.getQueryData<AttendanceRecord | null>(['attendance', 'today']);

      const now = new Date().toISOString();
      const optimisticData: AttendanceRecord = {
        checkIn: now,
        checkOut: null,
      };

      queryClient.setQueryData(['attendance', 'today'], optimisticData);

      // Optimistically update own status in user context to PRESENT (green)
      if (user) {
        updateUser({ ...user, status: 'PRESENT' });
      }

      // Optimistically update own employee in employees list
      queryClient.setQueryData<any[]>(['employees'], (prev) => {
        if (!prev) return prev;
        return prev.map((emp) =>
          emp.id === user?.id ? { ...emp, status: 'PRESENT' } : emp
        );
      });

      return { previous };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['attendance', 'today'], context.previous);
      }
      const msg = err?.response?.data?.error || err?.message || 'Failed to check in';
      setActionError(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/checkout');
      return res.data;
    },
    onMutate: async () => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today'] });
      const previous = queryClient.getQueryData<AttendanceRecord | null>(['attendance', 'today']);

      const now = new Date().toISOString();
      const optimisticData: AttendanceRecord = {
        ...previous,
        checkOut: now,
      };

      queryClient.setQueryData(['attendance', 'today'], optimisticData);

      return { previous };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['attendance', 'today'], context.previous);
      }
      const msg = err?.response?.data?.error || err?.message || 'Failed to check out';
      setActionError(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const formatTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-cream/60 rounded-xl border border-blue-grey/20 text-xs text-text-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-brand" />
        <span>Syncing…</span>
      </div>
    );
  }

  const isCheckedIn = Boolean(todayAttendance?.checkIn && !todayAttendance?.checkOut);
  const isCompleted = Boolean(todayAttendance?.checkIn && todayAttendance?.checkOut);

  return (
    <div className="flex items-center space-x-2.5">
      {/* State 1: Not checked in yet (Wireframe: [ Check IN -> ]) */}
      {!isCheckedIn && !isCompleted && (
        <button
          data-testid="checkin-button"
          onClick={() => checkInMutation.mutate()}
          disabled={checkInMutation.isPending}
          className="btn-primary py-1.5 px-4 text-xs font-semibold flex items-center space-x-1.5 shadow-sm hover:scale-[1.02] transition-transform"
        >
          {checkInMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Checking In…</span>
            </>
          ) : (
            <>
              <span>Check IN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}

      {/* State 2: Checked in (Wireframe: Since HH:MM PM [ Check Out -> ]) */}
      {isCheckedIn && (
        <div className="flex items-center space-x-2 bg-cream/70 border border-blue-grey/20 rounded-xl px-2.5 py-1">
          <div className="flex items-center space-x-1 text-xs text-text-muted font-mono">
            <Clock className="w-3 h-3 text-sage-deep" />
            <span>Since {formatTime(todayAttendance?.checkIn)}</span>
          </div>
          <button
            data-testid="checkout-button"
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            className="bg-terracotta text-white font-semibold py-1 px-3 rounded-lg text-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center space-x-1 shadow-sm"
          >
            {checkOutMutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Out…</span>
              </>
            ) : (
              <>
                <span>Check Out</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* State 3: Both checked in and checked out (completed for today) */}
      {isCompleted && (
        <div data-testid="completed-badge" className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sage-light/30 text-text-primary border border-sage-light text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-sage-deep" />
          <span className="font-mono text-[11px]">
            Done today &bull; Out at {formatTime(todayAttendance?.checkOut)}
            {todayAttendance?.workHours ? ` (${todayAttendance.workHours}h)` : ''}
          </span>
        </div>
      )}

      {actionError && (
        <span data-testid="attendance-error" className="text-[10px] text-terracotta font-medium ml-1">
          {actionError}
        </span>
      )}
    </div>
  );
};
