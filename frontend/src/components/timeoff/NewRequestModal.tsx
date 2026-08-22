import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, AlertCircle, FileCheck, Calendar } from 'lucide-react';
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
  defaultStartDate?: string;
}

export function NewRequestModal({ isOpen, onClose, defaultStartDate }: NewRequestModalProps) {
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
    setValue,
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
  const rawDays =
    watchedStart && watchedEnd && new Date(watchedEnd) >= new Date(watchedStart)
      ? Math.round(
          (new Date(watchedEnd).getTime() - new Date(watchedStart).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const formattedAllocation = String(rawDays).padStart(2, '0') + '.00';

  useEffect(() => {
    if (isOpen) {
      if (defaultStartDate) {
        setValue('startDate', defaultStartDate);
        setValue('endDate', defaultStartDate);
      }
    } else {
      reset();
      fileState.current = null;
      setFileDisplay('');
      setServerError('');
    }
  }, [isOpen, defaultStartDate, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      formData.append('typeId', values.typeId);

      const startDateIso = new Date(values.startDate).toISOString();
      const endDateIso = new Date(values.endDate).toISOString();
      formData.append('startDate', startDateIso);
      formData.append('endDate', endDateIso);

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
      const data = (err as { response?: { data?: { error?: string; details?: { field: string; message: string }[] } } })?.response?.data;
      let msg = data?.error || 'Failed to submit request. Please verify your leave balance.';
      if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
        msg = data.details.map((d) => d.message || `${d.field}: invalid`).join('; ');
      }
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
    if (balance && rawDays > balance.remaining) {
      setServerError(`Requested duration (${rawDays} days) exceeds available balance (${balance.remaining} days).`);
      return;
    }
    mutation.mutate(values);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-6 max-w-4xl w-full">
        {/* ── Main Modal ── */}
        <div className="bg-white text-text-primary rounded-3xl shadow-modal w-full max-w-xl overflow-hidden border border-blue-grey/20 animate-scaleUp flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-blue-grey/15 bg-cream/30">
            <h2 className="text-lg font-heading font-bold text-text-primary flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-slate-brand" />
              <span>Time off Type Request</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-cream rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-7 space-y-5 text-sm flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {serverError && (
                <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/30 flex items-start space-x-2 text-terracotta animate-fadeIn text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Row 1: Employee */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-4 font-semibold text-text-primary">Employee</span>
                <div className="col-span-8">
                  <div className="px-4 py-2.5 rounded-xl bg-cream border border-blue-grey/25 text-slate-brand font-mono font-bold text-sm shadow-xs">
                    [{user ? `${user.firstName} ${user.lastName}` : 'Employee'}]
                  </div>
                </div>
              </div>

              {/* Row 2: Time off Type */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-4 font-semibold text-text-primary">Time off Type</span>
                <div className="col-span-8">
                  <select
                    id="typeId"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-blue-grey/25 text-text-primary font-mono text-xs focus:outline-none focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20 shadow-xs cursor-pointer"
                    {...register('typeId')}
                  >
                    <option value="">[Select Time off type]</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.name}]
                      </option>
                    ))}
                  </select>
                  {errors.typeId && (
                    <p className="text-xs text-terracotta mt-1">{errors.typeId.message}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Validity Period */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-4 font-semibold text-text-primary">Validity Period</span>
                <div className="col-span-8 flex items-center space-x-2">
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-blue-grey/25 text-text-primary font-mono text-xs focus:outline-none focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20 shadow-xs"
                    {...register('startDate')}
                  />
                  <span className="text-text-muted font-bold text-xs px-1">To</span>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-blue-grey/25 text-text-primary font-mono text-xs focus:outline-none focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20 shadow-xs"
                    {...register('endDate')}
                  />
                </div>
              </div>
              {errors.endDate && (
                <p className="text-xs text-terracotta text-right">{errors.endDate.message}</p>
              )}

              {/* Row 4: Allocation */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-4 font-semibold text-text-primary">Allocation</span>
                <div className="col-span-8 flex items-center space-x-3">
                  <span className="font-mono text-slate-brand font-bold text-base">
                    {formattedAllocation}
                  </span>
                  <span className="text-text-muted font-semibold">Days</span>
                  {balance && (
                    <span className="text-xs text-text-muted ml-auto font-mono bg-cream px-2 py-0.5 rounded-lg border border-blue-grey/20">
                      (Avail: {balance.remaining}d)
                    </span>
                  )}
                </div>
              </div>

              {/* Row 5: Attachment */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-4 font-semibold text-text-primary">Attachment:</span>
                <div className="col-span-8 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-9 h-9 rounded-xl bg-slate-brand hover:bg-slate-brand/90 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    title="Upload certificate"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-xs text-text-muted">
                    {fileDisplay ? (
                      <span className="text-slate-brand font-mono font-semibold flex items-center space-x-1">
                        <FileCheck className="w-4 h-4 text-sage-deep inline mr-1" />
                        {fileDisplay}
                      </span>
                    ) : (
                      <span className="italic text-text-muted">(For sick leave certificate)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-5 border-t border-blue-grey/15 mt-4">
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="btn-primary py-2.5 px-6 text-sm font-semibold shadow-sm cursor-pointer"
              >
                {isSubmitting || mutation.isPending ? 'Submitting…' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2.5 px-6 text-sm font-semibold cursor-pointer"
              >
                Discard
              </button>
            </div>
          </form>
        </div>

        {/* ── Side Guide Card ── */}
        <div className="bg-white text-text-primary rounded-3xl p-6 border border-blue-grey/20 w-full lg:w-72 shadow-card flex flex-col justify-center">
          <div className="p-4 rounded-2xl border border-dashed border-blue-grey/30 bg-cream/40 space-y-3">
            <h3 className="font-heading font-bold text-base text-slate-brand border-b border-blue-grey/20 pb-2">
              TimeOff Types:
            </h3>
            <ul className="space-y-2.5 text-xs text-text-primary font-medium">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-slate-brand" />
                <span>Paid Time off</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#8E9E83]" />
                <span>Sick Leave</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#C97B63]" />
                <span>Unpaid Leaves</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
