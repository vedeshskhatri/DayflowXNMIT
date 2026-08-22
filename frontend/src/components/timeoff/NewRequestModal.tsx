import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Loader2, Paperclip, X, XCircle } from 'lucide-react';
import { api } from '../../lib/api';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    typeId: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewRequestModal({ isOpen, onClose }: NewRequestModalProps) {
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

  // Reset state when modal opens/closes
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
      if (requiresProof && !fileState.current) {
        throw new Error('Attachment required for Sick Leave.');
      }
      const fd = new FormData();
      fd.append('typeId', values.typeId);
      fd.append('startDate', new Date(values.startDate).toISOString());
      fd.append('endDate', new Date(values.endDate).toISOString());
      if (values.remarks) fd.append('remarks', values.remarks);
      if (fileState.current) fd.append('attachment', fileState.current);

      const res = await api.post('/timeoff/requests', fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff-balances'] });
      qc.invalidateQueries({ queryKey: ['timeoff-my-requests'] });
      qc.invalidateQueries({ queryKey: ['timeoff', 'balances'] });
      qc.invalidateQueries({ queryKey: ['timeoff', 'mine'] });
      onClose();
    },
    onError: (err: unknown) => {
      const apiMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const clientMsg = (err as Error)?.message;
      setServerError(apiMsg ?? clientMsg ?? 'Something went wrong. Please try again.');
    },
  });

  function onSubmit(values: FormValues) {
    setServerError('');
    mutation.mutate(values);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-6 border-b border-blue-grey/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              New Time-Off Request
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-cream rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

          {/* Leave type */}
          <div>
            <label className="label" htmlFor="typeId">Leave Type</label>
            <select id="typeId" className={`input ${errors.typeId ? 'input-error' : ''}`} {...register('typeId')}>
              <option value="">Select a leave type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.requiresProof ? ' (attachment required)' : ''}
                </option>
              ))}
            </select>
            {errors.typeId && <p className="error-text">{errors.typeId.message}</p>}
          </div>

          {/* Balance info */}
          {balance && (
            <div className="flex items-center space-x-2 bg-cream rounded-xl px-4 py-2.5 text-sm text-text-muted border border-blue-grey/20">
              <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
              <span>
                Balance:{' '}
                <strong className="text-text-primary">
                  {balance.remaining} / {balance.daysAllocated} days remaining
                </strong>
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                className={`input ${errors.startDate ? 'input-error' : ''}`}
                {...register('startDate')}
              />
              {errors.startDate && <p className="error-text">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                className={`input ${errors.endDate ? 'input-error' : ''}`}
                min={watchedStart}
                {...register('endDate')}
              />
              {errors.endDate && <p className="error-text">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Day count */}
          {daysCount > 0 && (
            <p className="text-sm text-text-muted">
              Duration:{' '}
              <strong className="text-slate-brand">
                {daysCount} day{daysCount !== 1 ? 's' : ''}
              </strong>
            </p>
          )}

          {/* Remarks */}
          <div>
            <label className="label" htmlFor="remarks">Remarks (optional)</label>
            <textarea
              id="remarks"
              className="input resize-none h-20"
              placeholder="Add a note for your manager…"
              {...register('remarks')}
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="label">
              Attachment{requiresProof ? ' (required)' : ' (optional)'}
            </label>
            <div
              className={`flex items-center justify-between border rounded-xl px-4 py-2.5 cursor-pointer transition-colors
                ${requiresProof && !fileState.current ? 'border-terracotta/50' : 'border-blue-grey'}
                hover:border-slate-brand bg-white`}
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex items-center space-x-2 text-sm text-text-muted">
                <Paperclip className="w-4 h-4" />
                <span>{fileDisplay || 'Choose file…'}</span>
              </div>
              {fileState.current && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileState.current = null;
                    setFileDisplay('');
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="text-terracotta hover:opacity-80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                fileState.current = f;
                setFileDisplay(f?.name ?? '');
              }}
            />
            {requiresProof && !fileState.current && (
              <p className="error-text">Sick Leave requires an attachment.</p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-center space-x-2 bg-terracotta/10 border border-terracotta/30 rounded-xl px-4 py-3 text-sm text-terracotta">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="btn-primary text-sm flex items-center space-x-2"
            >
              {(isSubmitting || mutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>
                {isSubmitting || mutation.isPending ? 'Submitting…' : 'Submit Request'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
