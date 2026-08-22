import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, AlertCircle, FileCheck, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

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
      <div className="flex flex-col lg:flex-row items-center gap-6 max-w-4xl w-full">
        {/* Main Modal */}
        <div className="bg-white rounded-3xl shadow-modal w-full max-w-xl overflow-hidden border border-navy/10 animate-scaleUp">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-navy/10 bg-cream/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-navy text-white flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-copper-bright" />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy-dark">
                Apply for Time Off
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-navy/40 hover:text-navy-dark rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 text-sm">
            {serverError && (
              <div className="p-3.5 rounded-2xl bg-terracotta-light border border-terracotta/30 flex items-start space-x-2 text-terracotta animate-fadeIn text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Row 1: Employee */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-bold text-navy-dark font-mono text-xs uppercase">Employee</span>
              <div className="col-span-8">
                <div className="px-4 py-2.5 rounded-2xl bg-cream-light border border-navy/10 text-navy-dark font-mono font-bold text-xs">
                  {user ? `${user.firstName} ${user.lastName}` : 'Employee'}
                </div>
              </div>
            </div>

            {/* Row 2: Time off Type */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-bold text-navy-dark font-mono text-xs uppercase">Leave Type</span>
              <div className="col-span-8">
                <select
                  id="typeId"
                  className="input py-2.5 text-xs font-bold font-mono w-full"
                  {...register('typeId')}
                >
                  <option value="">Select Leave Type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
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
              <span className="col-span-4 font-bold text-navy-dark font-mono text-xs uppercase">Date Range</span>
              <div className="col-span-8 flex items-center space-x-3">
                <input
                  type="date"
                  className="input py-2 text-xs font-mono font-bold w-full"
                  {...register('startDate')}
                />
                <span className="text-navy-dark font-bold text-xs uppercase font-mono">To</span>
                <input
                  type="date"
                  className="input py-2 text-xs font-mono font-bold w-full"
                  {...register('endDate')}
                />
              </div>
            </div>
            {errors.endDate && (
              <p className="text-xs text-terracotta text-right">{errors.endDate.message}</p>
            )}

            {/* Row 4: Allocation */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-bold text-navy-dark font-mono text-xs uppercase">Duration</span>
              <div className="col-span-8 flex items-center space-x-3">
                <span className="font-mono text-navy font-bold text-lg">
                  {formattedAllocation}
                </span>
                <span className="text-navy-dark font-bold font-mono text-xs">Days</span>
                {balance && (
                  <span className="text-xs text-copper font-mono font-bold ml-auto">
                    (Quota: {balance.remaining}d left)
                  </span>
                )}
              </div>
            </div>

            {/* Row 5: Attachment */}
            <div className="grid grid-cols-12 items-center gap-4">
              <span className="col-span-4 font-bold text-navy-dark font-mono text-xs uppercase">Certificate:</span>
              <div className="col-span-8 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-10 h-10 rounded-2xl bg-navy hover:bg-navy-dark text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  title="Upload certificate"
                >
                  <Upload className="w-5 h-5 text-copper-bright" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-xs text-text-muted italic">
                  {fileDisplay ? (
                    <span className="text-navy font-mono font-bold flex items-center space-x-1">
                      <FileCheck className="w-4 h-4 text-sage-deep inline mr-1" />
                      {fileDisplay}
                    </span>
                  ) : (
                    '(Required for medical/sick leave)'
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-4 border-t border-navy/10">
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="btn-navy py-2.5 px-6 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting || mutation.isPending ? 'Submitting…' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2.5 px-6 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Side Guide Card */}
        <div className="bg-white rounded-3xl p-6 border border-navy/10 w-full lg:w-72 shadow-elevated self-stretch flex flex-col justify-center">
          <div className="p-5 rounded-2xl border border-dashed border-navy/20 bg-cream-light space-y-4">
            <h3 className="font-heading font-bold text-base text-navy-dark border-b border-navy/10 pb-2">
              Leave Guidelines:
            </h3>
            <ul className="space-y-3 text-xs text-navy-dark font-medium">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-copper" />
                <span>Paid Time Off (24d / yr)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-copper" />
                <span>Sick Leave (7d / yr)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-copper" />
                <span>Casual & Unpaid Leaves</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
