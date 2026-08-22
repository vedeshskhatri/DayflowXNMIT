import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, AlertCircle, FileCheck } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="flex flex-col lg:flex-row items-center gap-6 max-w-4xl w-full">
        {/* ── Main Modal (Exact Wireframe Image 2: Time off Type Request) ── */}
        <div className="bg-[#242426] text-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-700/60 animate-scaleUp">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-700/50">
            <h2 className="text-lg font-heading font-semibold text-gray-100">
              Time off Type Request
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-7 space-y-6 text-sm">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 flex items-start space-x-2 text-red-200 animate-fadeIn text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Row 1: Employee */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-medium text-gray-300">Employee</span>
              <div className="col-span-8">
                <div className="px-4 py-2.5 rounded-xl bg-[#2e2e32] border border-gray-700 text-sky-400 font-mono font-medium">
                  [{user ? `${user.firstName} ${user.lastName}` : 'Employee'}]
                </div>
              </div>
            </div>

            {/* Row 2: Time off Type */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-medium text-gray-300">Time off Type</span>
              <div className="col-span-8">
                <select
                  id="typeId"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#2e2e32] border border-gray-700 text-sky-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register('typeId')}
                >
                  <option value="">[Select Time off type]</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id} className="text-white bg-[#242426]">
                      [{t.name}]
                    </option>
                  ))}
                </select>
                {errors.typeId && (
                  <p className="text-xs text-red-400 mt-1">{errors.typeId.message}</p>
                )}
              </div>
            </div>

            {/* Row 3: Validity Period */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-medium text-gray-300">Validity Period</span>
              <div className="col-span-8 flex items-center space-x-3">
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-[#2e2e32] border border-gray-700 text-sky-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register('startDate')}
                />
                <span className="text-gray-400 font-medium text-xs">To</span>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-[#2e2e32] border border-gray-700 text-sky-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  {...register('endDate')}
                />
              </div>
            </div>
            {errors.endDate && (
              <p className="text-xs text-red-400 text-right">{errors.endDate.message}</p>
            )}

            {/* Row 4: Allocation */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-medium text-gray-300">Allocation</span>
              <div className="col-span-8 flex items-center space-x-3">
                <span className="font-mono text-sky-400 font-bold text-base">
                  {formattedAllocation}
                </span>
                <span className="text-sky-400 font-medium">Days</span>
                {balance && (
                  <span className="text-xs text-gray-400 ml-auto">
                    (Avail: {balance.remaining}d)
                  </span>
                )}
              </div>
            </div>

            {/* Row 5: Attachment */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-medium text-gray-300">Attachment:</span>
              <div className="col-span-8 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Upload certificate"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-xs text-gray-400 italic">
                  {fileDisplay ? (
                    <span className="text-sky-300 font-mono flex items-center space-x-1">
                      <FileCheck className="w-4 h-4 text-emerald-400 inline mr-1" />
                      {fileDisplay}
                    </span>
                  ) : (
                    '(For sick leave certificate)'
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons (Wireframe: Submit [Purple] | Discard [Dark]) */}
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-700/50">
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSubmitting || mutation.isPending ? 'Submitting…' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#2e2e32] hover:bg-[#38383e] text-gray-200 font-medium text-sm transition-colors"
              >
                Discard
              </button>
            </div>
          </form>
        </div>

        {/* ── Side Guide Card (Wireframe Image 2 Right Box: TimeOff Types) ── */}
        <div className="bg-[#242426]/95 text-white rounded-3xl p-6 border border-gray-700/60 w-full lg:w-72 shadow-xl self-stretch flex flex-col justify-center">
          <div className="p-4 rounded-2xl border border-dashed border-gray-600 bg-[#1e1e20] space-y-3">
            <h3 className="font-heading font-bold text-lg text-amber-300 border-b border-gray-700 pb-2">
              TimeOff Types:
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 font-medium">
              <li className="flex items-center space-x-2">
                <span className="text-purple-400 font-bold">-</span>
                <span>Paid Time off</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-sky-400 font-bold">-</span>
                <span>Sick Leave</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">-</span>
                <span>Unpaid Leaves</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
