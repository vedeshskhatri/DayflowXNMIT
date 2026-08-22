import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Calculator,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalaryComponent {
  id?: string;
  name: string;
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  computedAmount: number;
}

interface SalaryStructure {
  id: string;
  employeeId: string;
  monthlyWage: number;
  compositionType?: 'FIXED' | 'PERCENTAGE';
  workingDaysPerWeek: number;
  pfPercent: number;
  professionalTax: number;
  components: SalaryComponent[];
  updatedAt?: string;
}

interface PayableDaysResult {
  totalWorkingDays: number;
  unpaidLeaveDays: number;
  unaccountedAbsences: number;
  payableDays: number;
  from: string;
  to: string;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const salaryComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  valueType: z.enum(['FIXED', 'PERCENTAGE']),
  value: z
    .number({ invalid_type_error: 'Must be a valid number' })
    .positive('Must be greater than 0'),
});

const upsertSalarySchema = z.object({
  monthlyWage: z
    .number({ invalid_type_error: 'Must be a valid number' })
    .positive('Monthly wage must be greater than 0'),
  workingDaysPerWeek: z
    .number({ invalid_type_error: 'Must be a valid number' })
    .int('Must be a whole number')
    .min(1, 'Minimum 1 day')
    .max(7, 'Maximum 7 days'),
  pfPercent: z
    .number({ invalid_type_error: 'Must be a valid number' })
    .min(0, 'Cannot be negative'),
  professionalTax: z
    .number({ invalid_type_error: 'Must be a valid number' })
    .min(0, 'Cannot be negative'),
  components: z
    .array(salaryComponentSchema)
    .min(1, 'At least one salary component is required'),
});

type SalaryFormValues = z.infer<typeof upsertSalarySchema>;

// ─── Currency Formatter ───────────────────────────────────────────────────────

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

// ─── Employee View ─────────────────────────────────────────────────────────────

function EmployeeSalaryView({ employeeId }: { employeeId: string }) {
  const {
    data: salary,
    isLoading,
    isError,
    error,
  } = useQuery<SalaryStructure>({
    queryKey: ['salary', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/salary`);
      return res.data;
    },
    retry: false,
  });

  const is404 =
    (error as { response?: { status?: number } })?.response?.status === 404;

  if (isLoading) {
    return (
      <div className="card bg-white border border-navy/10 p-12 text-center space-y-3 shadow-card rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto" />
        <p className="text-sm text-text-muted">Loading your salary structure…</p>
      </div>
    );
  }

  if (is404 || isError || !salary) {
    return (
      <div className="card bg-white border border-navy/10 p-12 text-center space-y-3 shadow-card rounded-3xl">
        <DollarSign className="w-12 h-12 text-navy/30 mx-auto" />
        <h3 className="text-lg font-heading font-bold text-navy-dark">
          No salary structure has been set up yet
        </h3>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Your compensation details have not been configured in the system. Please reach
          out to your HR or administrator.
        </p>
      </div>
    );
  }

  const yearlyWage = salary.monthlyWage * 12;

  return (
    <div className="space-y-6">
      {/* Top Wage Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-white border border-navy/10 p-6 rounded-3xl shadow-card space-y-1">
          <span className="text-xs text-text-muted font-bold uppercase tracking-wider font-mono">
            Monthly Base Wage
          </span>
          <p className="text-2xl font-heading font-bold text-navy-dark font-mono">
            {formatINR(salary.monthlyWage)}
          </p>
        </div>

        <div className="card bg-white border border-navy/10 p-6 rounded-3xl shadow-card space-y-1">
          <span className="text-xs text-copper font-bold uppercase tracking-wider font-mono">
            Annual CTC (Yearly)
          </span>
          <p className="text-2xl font-heading font-bold text-copper font-mono">
            {formatINR(yearlyWage)}
          </p>
        </div>

        <div className="card bg-white border border-navy/10 p-6 rounded-3xl shadow-card space-y-1">
          <span className="text-xs text-text-muted font-bold uppercase tracking-wider font-mono">
            Working Days / Week
          </span>
          <p className="text-2xl font-heading font-bold text-navy-dark font-mono">
            {salary.workingDaysPerWeek}{' '}
            <span className="text-sm font-normal text-text-muted">days</span>
          </p>
        </div>

        <div className="card bg-white border border-navy/10 p-6 rounded-3xl shadow-card space-y-1">
          <span className="text-xs text-text-muted font-bold uppercase tracking-wider font-mono">
            PF &amp; Tax Deductions
          </span>
          <p className="text-sm font-bold text-navy-dark pt-1 font-mono">
            PF: {salary.pfPercent}% &bull; PT: {formatINR(salary.professionalTax)}
          </p>
        </div>
      </div>

      {/* Salary Components Breakdown Table */}
      <div className="card bg-white border border-navy/10 p-0 overflow-hidden shadow-elevated rounded-3xl">
        <div className="px-8 py-5 border-b border-navy/10 bg-cream/50">
          <h2 className="text-base font-heading font-bold text-navy-dark">
            Salary Components Breakdown
          </h2>
          <p className="text-xs text-text-muted mt-0.5 font-medium">
            Detailed breakdown of earnings and component values
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/80 border-b border-navy/10 text-xs text-navy-dark uppercase tracking-wider font-mono font-bold">
              <tr>
                <th className="text-left px-8 py-4">Component Name</th>
                <th className="text-left px-8 py-4">Calculation Type</th>
                <th className="text-left px-8 py-4">Configured Value</th>
                <th className="text-right px-8 py-4">Computed Monthly Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {salary.components.map((c, i) => (
                <tr key={c.id || i} className="hover:bg-cream/30 transition-colors">
                  <td className="px-8 py-4 font-bold text-navy-dark">{c.name}</td>
                  <td className="px-8 py-4 text-text-muted">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono bg-cream text-navy border border-navy/10">
                      {c.valueType}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-text-muted font-mono text-xs font-bold">
                    {c.valueType === 'PERCENTAGE' ? `${c.value}% of wage` : formatINR(c.value)}
                  </td>
                  <td className="px-8 py-4 text-right font-bold text-navy-dark font-mono">
                    {formatINR(c.computedAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-cream/50 border-t border-navy/10 font-mono">
              <tr>
                <td colSpan={3} className="px-8 py-4 font-heading font-bold text-navy-dark">
                  Total Allocated Monthly Components
                </td>
                <td className="px-8 py-4 text-right font-heading font-bold text-navy text-base">
                  {formatINR(
                    salary.components.reduce((sum, c) => sum + (c.computedAmount || 0), 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Admin View ────────────────────────────────────────────────────────────────

function AdminSalaryView({ employeeId }: { employeeId: string }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);

  const [calcFrom, setCalcFrom] = useState(defaultFrom);
  const [calcTo, setCalcTo] = useState(defaultTo);

  const {
    data: existingSalary,
    isLoading: salaryLoading,
  } = useQuery<SalaryStructure>({
    queryKey: ['salary', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/salary`);
      return res.data;
    },
    retry: false,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalaryFormValues>({
    resolver: zodResolver(upsertSalarySchema),
    defaultValues: {
      monthlyWage: 0,
      workingDaysPerWeek: 5,
      pfPercent: 12,
      professionalTax: 200,
      components: [
        { name: 'Basic Salary', valueType: 'PERCENTAGE', value: 50 },
        { name: 'HRA', valueType: 'PERCENTAGE', value: 20 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  useEffect(() => {
    if (existingSalary) {
      reset({
        monthlyWage: existingSalary.monthlyWage,
        workingDaysPerWeek: existingSalary.workingDaysPerWeek,
        pfPercent: existingSalary.pfPercent,
        professionalTax: existingSalary.professionalTax,
        components:
          existingSalary.components.length > 0
            ? existingSalary.components.map((c) => ({
                name: c.name,
                valueType: c.valueType,
                value: c.value,
              }))
            : [{ name: 'Basic Salary', valueType: 'PERCENTAGE', value: 50 }],
      });
    }
  }, [existingSalary, reset]);

  const watchedMonthlyWage = watch('monthlyWage') || 0;
  const watchedComponents = watch('components') || [];

  const totalComputed = watchedComponents.reduce((sum, c) => {
    if (!c) return sum;
    const val = Number(c.value) || 0;
    if (c.valueType === 'FIXED') {
      return sum + val;
    }
    return sum + (watchedMonthlyWage > 0 ? (val / 100) * watchedMonthlyWage : 0);
  }, 0);

  const isExceeding = watchedMonthlyWage > 0 && totalComputed > watchedMonthlyWage;
  const yearlyWagePreview = watchedMonthlyWage > 0 ? watchedMonthlyWage * 12 : 0;

  const mutation = useMutation({
    mutationFn: async (values: SalaryFormValues) => {
      const res = await api.patch(`/employees/${employeeId}/salary`, values);
      return res.data;
    },
    onSuccess: () => {
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['salary', employeeId] });
      setLiveToast('Salary structure saved successfully!');
      setTimeout(() => setLiveToast(null), 4000);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response
          ?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save salary structure';
      setServerError(msg);
    },
  });

  const onSubmit = (values: SalaryFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  const {
    data: payableDaysResult,
    isLoading: payableDaysLoading,
    isError: payableDaysError,
    error: payableDaysErrObj,
    refetch: refetchPayableDays,
  } = useQuery<PayableDaysResult>({
    queryKey: ['payable-days', employeeId, calcFrom, calcTo],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/payable-days`, {
        params: { from: calcFrom, to: calcTo },
      });
      return res.data;
    },
    enabled: false,
  });

  const handleCalculatePayableDays = () => {
    refetchPayableDays();
  };

  if (salaryLoading) {
    return (
      <div className="card bg-white border border-navy/10 p-12 text-center space-y-3 shadow-card rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto" />
        <p className="text-sm text-text-muted">Loading employee salary configuration…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-navy text-white text-sm px-6 py-4 rounded-2xl shadow-xl animate-fadeIn border border-copper/30">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-copper-bright" />
          <span className="font-bold">{liveToast}</span>
        </div>
      )}

      {/* Main Salary Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card bg-white border border-navy/10 p-8 rounded-3xl shadow-elevated space-y-6">
          <div className="border-b border-navy/10 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-heading font-bold text-navy-dark">
                Salary &amp; Wage Configuration
              </h2>
              <p className="text-xs text-text-muted mt-0.5 font-medium">
                Configure base wages, working schedule, and statutory deductions.
              </p>
            </div>
            {existingSalary && (
              <span className="text-xs text-copper-dark bg-copper-muted px-3 py-1 rounded-full border border-copper/30 font-mono font-bold">
                Active Structure Configured
              </span>
            )}
          </div>

          {/* Wage Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label text-navy-dark font-bold font-mono text-xs uppercase" htmlFor="monthlyWage">
                Monthly Wage (₹)
              </label>
              <input
                id="monthlyWage"
                type="number"
                step="any"
                className={`input py-2.5 font-mono font-bold text-navy-dark ${errors.monthlyWage ? 'input-error' : ''}`}
                placeholder="e.g. 50000"
                {...register('monthlyWage', { valueAsNumber: true })}
              />
              {errors.monthlyWage && (
                <p className="error-text text-terracotta">{errors.monthlyWage.message}</p>
              )}
            </div>

            <div>
              <label className="label text-navy-dark font-bold font-mono text-xs uppercase">Yearly Wage / Annual CTC (Computed)</label>
              <div className="input bg-cream-light text-navy font-heading font-bold flex items-center py-2.5 font-mono">
                {formatINR(yearlyWagePreview)}
              </div>
              <span className="text-xs text-text-muted mt-1 block font-mono">
                Automatically calculated as Monthly Wage &times; 12
              </span>
            </div>
          </div>

          {/* Statutory & Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-navy/10">
            <div>
              <label className="label text-navy-dark font-bold font-mono text-xs uppercase" htmlFor="workingDaysPerWeek">
                Working Days / Week (1–7)
              </label>
              <input
                id="workingDaysPerWeek"
                type="number"
                min={1}
                max={7}
                className={`input py-2.5 font-mono font-bold ${errors.workingDaysPerWeek ? 'input-error' : ''}`}
                {...register('workingDaysPerWeek', { valueAsNumber: true })}
              />
              {errors.workingDaysPerWeek && (
                <p className="error-text text-terracotta">{errors.workingDaysPerWeek.message}</p>
              )}
            </div>

            <div>
              <label className="label text-navy-dark font-bold font-mono text-xs uppercase" htmlFor="pfPercent">
                Provident Fund (PF %)
              </label>
              <input
                id="pfPercent"
                type="number"
                step="any"
                className={`input py-2.5 font-mono font-bold ${errors.pfPercent ? 'input-error' : ''}`}
                {...register('pfPercent', { valueAsNumber: true })}
              />
              {errors.pfPercent && (
                <p className="error-text text-terracotta">{errors.pfPercent.message}</p>
              )}
            </div>

            <div>
              <label className="label text-navy-dark font-bold font-mono text-xs uppercase" htmlFor="professionalTax">
                Professional Tax (₹)
              </label>
              <input
                id="professionalTax"
                type="number"
                step="any"
                className={`input py-2.5 font-mono font-bold ${errors.professionalTax ? 'input-error' : ''}`}
                {...register('professionalTax', { valueAsNumber: true })}
              />
              {errors.professionalTax && (
                <p className="error-text text-terracotta">{errors.professionalTax.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Components Section */}
        <div className="card bg-white border border-navy/10 p-8 rounded-3xl shadow-elevated space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-navy/10 pb-4">
            <div>
              <h3 className="text-base font-heading font-bold text-navy-dark">
                Salary Components
              </h3>
              <p className="text-xs text-text-muted mt-0.5 font-medium">
                Define fixed amounts or percentage allocations of the monthly wage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => append({ name: '', valueType: 'FIXED', value: 0 })}
              className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-4 self-start sm:self-auto font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-copper" />
              <span>Add Component</span>
            </button>
          </div>

          {errors.components?.root && (
            <p className="error-text text-terracotta">{errors.components.root.message}</p>
          )}

          {/* Component Row List */}
          <div className="space-y-3">
            {fields.map((field, index) => {
              const comp = watchedComponents[index];
              const compVal = Number(comp?.value) || 0;
              const computedPreview =
                comp?.valueType === 'FIXED'
                  ? compVal
                  : watchedMonthlyWage > 0
                  ? (compVal / 100) * watchedMonthlyWage
                  : 0;

              return (
                <div
                  key={field.id}
                  className="p-5 bg-cream-light rounded-2xl border border-navy/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-4">
                    <label className="label text-xs font-bold text-navy-dark font-mono uppercase">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Basic Salary"
                      className={`input text-sm py-2 font-bold ${
                        errors.components?.[index]?.name ? 'input-error' : ''
                      }`}
                      {...register(`components.${index}.name` as const)}
                    />
                    {errors.components?.[index]?.name && (
                      <p className="error-text text-[11px] text-terracotta">
                        {errors.components[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="label text-xs font-bold text-navy-dark font-mono uppercase">Type</label>
                    <select
                      className="input text-sm py-2 font-bold font-mono"
                      {...register(`components.${index}.valueType` as const)}
                    >
                      <option value="FIXED">FIXED (₹)</option>
                      <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label text-xs font-bold text-navy-dark font-mono uppercase">Value</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      className={`input text-sm py-2 font-mono font-bold ${
                        errors.components?.[index]?.value ? 'input-error' : ''
                      }`}
                      {...register(`components.${index}.value` as const, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.components?.[index]?.value && (
                      <p className="error-text text-[11px] text-terracotta">
                        {errors.components[index]?.value?.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label text-xs font-bold text-navy-dark font-mono uppercase">Computed (₹)</label>
                    <div className="input bg-white text-xs py-2 font-mono font-bold text-navy flex items-center justify-end">
                      {formatINR(computedPreview)}
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                      className="p-2 text-text-muted hover:text-terracotta hover:bg-terracotta/10 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Remove component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Running Totals & Validation */}
          <div className="p-5 bg-cream/70 rounded-2xl border border-navy/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs text-text-muted uppercase font-bold tracking-wider font-mono">
                Total Allocated Components
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-heading font-bold text-navy-dark font-mono">
                  {formatINR(totalComputed)}
                </span>
                <span className="text-xs text-text-muted font-mono">
                  of {formatINR(watchedMonthlyWage)} wage
                </span>
              </div>
            </div>

            {isExceeding && (
              <div className="flex items-center space-x-2 text-terracotta text-xs font-bold bg-terracotta-light px-4 py-2 rounded-xl border border-terracotta/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Components exceed monthly wage</span>
              </div>
            )}
          </div>

          {serverError && (
            <div className="flex items-center space-x-2 bg-terracotta-light border border-terracotta/30 rounded-2xl px-4 py-3 text-sm text-terracotta">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending || isExceeding}
              className="btn-navy text-xs font-bold flex items-center space-x-2 px-6 py-3 cursor-pointer disabled:opacity-50"
            >
              {(isSubmitting || mutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin text-copper-bright" />
              )}
              <span>
                {isSubmitting || mutation.isPending
                  ? 'Saving Structure…'
                  : 'Save Salary Structure'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Payable Days Section */}
      <section className="card bg-white border border-navy/10 p-8 rounded-3xl shadow-elevated space-y-5">
        <div className="border-b border-navy/10 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-navy text-white flex items-center justify-center shadow-sm">
              <Calculator className="w-5 h-5 text-copper-bright" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-navy-dark">
                Payable Days Calculator
              </h3>
              <p className="text-xs text-text-muted font-medium">
                Derive net payable working days adjusted for unpaid leave and absences.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label text-navy-dark font-bold font-mono text-xs uppercase" htmlFor="calcFrom">
              From Date
            </label>
            <input
              id="calcFrom"
              type="date"
              className="input text-sm py-2 font-mono font-bold"
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-navy-dark font-bold font-mono text-xs uppercase" htmlFor="calcTo">
              To Date
            </label>
            <input
              id="calcTo"
              type="date"
              className="input text-sm py-2 font-mono font-bold"
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value)}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleCalculatePayableDays}
              disabled={payableDaysLoading || !calcFrom || !calcTo}
              className="btn-navy w-full text-xs font-bold flex items-center justify-center space-x-2 py-2.5 cursor-pointer"
            >
              {payableDaysLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-copper-bright" />
              ) : (
                <Calculator className="w-4 h-4 text-copper-bright" />
              )}
              <span>{payableDaysLoading ? 'Calculating…' : 'Calculate'}</span>
            </button>
          </div>
        </div>

        {payableDaysError && (
          <div className="flex items-center space-x-2 bg-terracotta-light border border-terracotta/30 rounded-2xl px-4 py-3 text-sm text-terracotta">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {(payableDaysErrObj as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || 'Failed to calculate payable days'}
            </span>
          </div>
        )}

        {payableDaysResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
            <div className="card bg-cream-light border border-navy/10 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider font-mono">
                Total Working Days
              </span>
              <p className="text-2xl font-heading font-bold text-navy-dark font-mono">
                {payableDaysResult.totalWorkingDays}
              </p>
              <span className="text-[11px] text-text-muted block">Weekdays in range</span>
            </div>

            <div className="card bg-cream-light border border-navy/10 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-copper font-bold uppercase tracking-wider font-mono">
                Unpaid Leave Days
              </span>
              <p className="text-2xl font-heading font-bold text-copper font-mono">
                {payableDaysResult.unpaidLeaveDays}
              </p>
              <span className="text-[11px] text-text-muted block">Approved unpaid leaves</span>
            </div>

            <div className="card bg-cream-light border border-navy/10 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-terracotta font-bold uppercase tracking-wider font-mono">
                Unaccounted Absences
              </span>
              <p className="text-2xl font-heading font-bold text-terracotta font-mono">
                {payableDaysResult.unaccountedAbsences}
              </p>
              <span className="text-[11px] text-text-muted block">Days without check-in</span>
            </div>

            <div className="card bg-sage-light/30 border border-sage-deep/30 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-sage-deep font-bold uppercase tracking-wider font-mono">
                Net Payable Days
              </span>
              <p className="text-2xl font-heading font-bold text-sage-deep font-mono">
                {payableDaysResult.payableDays}
              </p>
              <span className="text-[11px] text-sage-deep/80 block font-medium">
                Working days &minus; unpaid &minus; absent
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Main SalaryPage Root Component ───────────────────────────────────────────

export const SalaryPage: React.FC = () => {
  const { user } = useAuth();
  const { employeeId: paramEmployeeId } = useParams<{ employeeId?: string }>();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  if (paramEmployeeId && !isAdmin) {
    return <Navigate to="/salary" replace />;
  }

  const targetEmployeeId = paramEmployeeId || user?.id || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-navy/10">
        <div>
          <h1 className="text-3xl font-heading font-bold text-navy-dark">
            {isAdmin ? 'Salary & Compensation Management' : 'My Salary & Compensation'}
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium">
            {isAdmin
              ? 'Configure salary components, base wages, and derive payable days.'
              : 'Review your salary structure, component allocations, and statutory deductions.'}
          </p>
        </div>

        {isAdmin && (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-copper-muted text-copper-dark text-xs font-bold border border-copper/30 font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Management</span>
          </span>
        )}
      </div>

      {/* View routing */}
      {isAdmin ? (
        <AdminSalaryView employeeId={targetEmployeeId} />
      ) : (
        <EmployeeSalaryView employeeId={targetEmployeeId} />
      )}
    </div>
  );
};
export default SalaryPage;
