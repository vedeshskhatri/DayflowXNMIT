import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Loader2, Upload, X, AlertCircle, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    typeId: z.string().min(1, 'Please select a time off type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    remarks: z.string().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveType {
  id: string;
  name: string;
  requiresProof: boolean;
}

interface Balance {
  typeId: string;
  name: string;
  requiresProof: boolean;
  daysAllocated: number;
  daysUsed: number;
  remaining: number;
}

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewRequestModal({ isOpen, onClose }: NewRequestModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileState = React.useRef<File | null>(null);
  const [fileDisplay, setFileDisplay] = React.useState<string>('');
  const [serverError, setServerError] = React.useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { typeId: '', startDate: '', endDate: '', remarks: '' },
  });

  const watchedTypeId = watch('typeId');
  const watchedStart = watch('startDate');
  const watchedEnd = watch('endDate');

  const { data: types = [] } = useQuery<LeaveType[]>({
    queryKey: ['timeoff', 'types'],
    queryFn: async () => (await api.get('/timeoff/types')).data,
    enabled: isOpen,
  });

  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
    enabled: isOpen,
  });

  const selectedType = types.find((t) => t.id === watchedTypeId);
  const requiresProof = selectedType?.requiresProof ?? false;
  const balance = balances.find((b) => b.typeId === watchedTypeId);

  // Inclusive day count
  const daysCount =
    watchedStart && watchedEnd && new Date(watchedEnd) >= new Date(watchedStart)
      ? Math.round(
          (new Date(watchedEnd).getTime() - new Date(watchedStart).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  useEffect(() => {
    if (!isOpen) {
      reset();
      fileState.current = null;
      setFileDisplay('');
      setServerError('');
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      formData.append('typeId', values.typeId);
      formData.append('startDate', values.startDate);
      formData.append('endDate', values.endDate);
      if (values.remarks) formData.append('remarks', values.remarks);
      if (fileState.current) formData.append('attachment', fileState.current);

      const res = await api.post('/timeoff/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff', 'mine'] });
      qc.invalidateQueries({ queryKey: ['timeoff', 'balances'] });
      qc.invalidateQueries({ queryKey: ['timeoff', 'all'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to submit request. Please verify your leave balance.';
      setServerError(msg);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileState.current = file;
      setFileDisplay(file.name);
    }
  };

  const onSubmit = (values: FormValues) => {
    setServerError('');
    if (requiresProof && !fileState.current) {
      setServerError('This leave type requires a medical certificate or supporting document.');
      return;
    }
    mutation.mutate(values);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-grey/20 animate-scaleUp">
        {/* ── Header (Wireframe: Time off Type Request) ──────────────────── */}
        <div className="flex items-center justify-between p-6 border-b border-blue-grey/15 bg-cream/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-brand/10 text-slate-brand flex items-center justify-center border border-slate-brand/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary">
                Time off Type Request
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Submit a new leave application for approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-cream rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-start space-x-2 text-terracotta animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Employee Name (Wireframe: Employee :- [Employee]) */}
          <div className="p-3 rounded-xl bg-cream/40 border border-blue-grey/15 flex items-center justify-between">
            <span className="font-semibold text-text-muted uppercase tracking-wider text-[11px]">
              Employee :-
            </span>
            <span className="font-heading font-bold text-sm text-text-primary">
              {user ? `${user.firstName} ${user.lastName}` : 'Current Employee'}
            </span>
          </div>

          {/* Time off Type (Wireframe: Time off Type :- [Paid time off]) */}
          <div>
            <label className="label text-[11px] font-bold" htmlFor="typeId">
              Time off Type :- *
            </label>
            <select
              id="typeId"
              className={`input py-2.5 text-xs bg-cream/30 ${errors.typeId ? 'input-error' : ''}`}
              {...register('typeId')}
            >
              <option value="">Select Time Off Type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.typeId && <p className="error-text">{errors.typeId.message}</p>}
          </div>

          {/* Balance info badge */}
          {balance && (
            <div className="flex items-center space-x-2 bg-sage-light/30 rounded-xl px-3.5 py-2 text-xs text-text-primary border border-sage-light">
              <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
              <span>
                Available Balance:{' '}
                <strong className="text-sage-deep font-bold font-mono">
                  {balance.remaining} / {balance.daysAllocated} Days
                </strong>
              </span>
            </div>
          )}

          {/* Validity Period (Wireframe: Validity Period :- May 13 To May 14) */}
          <div>
            <label className="label text-[11px] font-bold">Validity Period :- *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[10px] text-text-muted block mb-1">From Date:</span>
                <input
                  id="startDate"
                  type="date"
                  className={`input py-2 text-xs bg-cream/30 ${errors.startDate ? 'input-error' : ''}`}
                  {...register('startDate')}
                />
                {errors.startDate && <p className="error-text">{errors.startDate.message}</p>}
              </div>

              <div>
                <span className="text-[10px] text-text-muted block mb-1">To Date:</span>
                <input
                  id="endDate"
                  type="date"
                  className={`input py-2 text-xs bg-cream/30 ${errors.endDate ? 'input-error' : ''}`}
                  min={watchedStart}
                  {...register('endDate')}
                />
                {errors.endDate && <p className="error-text">{errors.endDate.message}</p>}
              </div>
            </div>
          </div>

          {/* Allocation / Duration Display (Wireframe: Allocation :- 01.00 Days) */}
          <div className="p-3 rounded-xl bg-cream/50 border border-blue-grey/20 flex items-center justify-between">
            <span className="font-semibold text-text-muted text-[11px]">Allocation / Duration :-</span>
            <span className="font-mono font-bold text-sm text-slate-brand">
              {daysCount > 0 ? `${String(daysCount).padStart(2, '0')}.00 Days` : '00.00 Days'}
            </span>
          </div>

          {/* Attachment (Wireframe: Attachment: [Icon] (For sick leave certificate)) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0 text-[11px] font-bold">Attachment :-</label>
              <span className="text-[11px] text-text-muted italic">
                (For sick leave certificate)
              </span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />

            {fileDisplay ? (
              <div className="flex items-center justify-between p-2.5 bg-cream rounded-xl border border-blue-grey/20">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-4 h-4 text-slate-brand flex-shrink-0" />
                  <span className="truncate text-xs font-medium text-text-primary">{fileDisplay}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fileState.current = null;
                    setFileDisplay('');
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="p-1 text-text-muted hover:text-terracotta"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 py-2.5 border-2 border-dashed border-blue-grey/30 hover:border-slate-brand/50 rounded-xl bg-cream/20 hover:bg-cream/40 transition-all text-xs text-text-muted hover:text-slate-brand font-semibold"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Certificate / Medical Proof</span>
              </button>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="label text-[11px]" htmlFor="remarks">
              Remarks (Optional) :-
            </label>
            <textarea
              id="remarks"
              className="input resize-none h-16 text-xs bg-cream/30"
              placeholder="Add any specific context for HR / Approver…"
              {...register('remarks')}
            />
          </div>

          {/* ── Footer Actions (Wireframe: Submit & Discard buttons) ──── */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-blue-grey/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-blue-grey/20 hover:bg-cream text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center space-x-2 shadow-sm"
            >
              {isSubmitting || mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
