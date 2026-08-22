import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

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
    staleTime: 1000 * 60,
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

      if (user) {
        updateUser({ ...user, status: 'PRESENT' });
      }

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
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-cream/70 rounded-xl border border-navy/10 text-xs text-text-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-navy" />
        <span>Syncing…</span>
      </div>
    );
  }

  const isCheckedIn = Boolean(todayAttendance?.checkIn && !todayAttendance?.checkOut);
  const isCompleted = Boolean(todayAttendance?.checkIn && todayAttendance?.checkOut);

  return (
    <div className="flex items-center space-x-2 whitespace-nowrap">
      {/* State 1: Not checked in yet */}
      {!isCheckedIn && !isCompleted && (
        <button
          onClick={() => checkInMutation.mutate()}
          disabled={checkInMutation.isPending}
          data-testid="checkin-button"
          className="btn-navy py-2 px-4 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
        >
          {checkInMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-copper-bright" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 text-copper-bright" />
          )}
          <span>{checkInMutation.isPending ? 'Checking In…' : 'Check IN'}</span>
        </button>
      )}

      {/* State 2: Currently checked in */}
      {isCheckedIn && (
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-sage-light/40 border border-sage-deep/30 text-xs font-mono font-bold text-navy-dark flex items-center space-x-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sage-deep animate-pulse" />
            <span>IN: {formatTime(todayAttendance?.checkIn)}</span>
          </div>

          <button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            data-testid="checkout-button"
            className="px-3.5 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            {checkOutMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            <span>{checkOutMutation.isPending ? 'Checking Out…' : 'Check OUT'}</span>
          </button>
        </div>
      )}

      {/* State 3: Completed for today */}
      {isCompleted && (
        <div
          data-testid="completed-badge"
          className="px-3.5 py-1.5 rounded-xl bg-cream border border-navy/10 text-xs font-mono font-bold text-navy-dark flex items-center space-x-1.5 shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-sage-deep" />
          <span>Done today ({todayAttendance?.workHours?.toFixed(1) || '8'}h)</span>
        </div>
      )}

      {actionError && (
        <span data-testid="attendance-error" className="text-[11px] text-terracotta font-medium ml-2 font-mono">
          {actionError}
        </span>
      )}
    </div>
  );
};
