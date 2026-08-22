import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Save,
} from 'lucide-react';

interface SalaryComponent {
  id?: string;
  name: string;
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  computedAmount: number;
  description?: string;
}

interface SalaryStructure {
  id?: string;
  employeeId?: string;
  monthlyWage: number;
  workingDaysPerWeek: number;
  breakHours?: number;
  pfPercent: number;
  professionalTax: number;
  components?: SalaryComponent[];
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export const SalaryInfoTab: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  const [monthlyWage, setMonthlyWage] = useState<number>(50000);
  const [workingDays, setWorkingDays] = useState<number>(5);
  const [breakHours, setBreakHours] = useState<number>(1);
  const [pfPercent, setPfPercent] = useState<number>(12);
  const [profTax, setProfTax] = useState<number>(200);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch live salary from backend
  const { data: salaryData, isLoading } = useQuery<{ salary: SalaryStructure | null }>({
    queryKey: ['employee', employeeId, 'salary'],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/salary`);
      return res.data;
    },
  });

  useEffect(() => {
    if (salaryData?.salary) {
      const s = salaryData.salary;
      setMonthlyWage(s.monthlyWage || 50000);
      setWorkingDays(s.workingDaysPerWeek || 5);
      setPfPercent(s.pfPercent || 12);
      setProfTax(s.professionalTax ?? 200);
    }
  }, [salaryData]);

  // Automatic Wireframe Component Calculations
  const yearlyWage = monthlyWage * 12;

  // 1. Basic Salary: 50% of monthly wage
  const basicSalary = monthlyWage * 0.5;

  // 2. House Rent Allowance (HRA): 50% of Basic salary (25% of wage)
  const hra = basicSalary * 0.5;

  // 3. Standard Allowance: 8.334% of wage (~4167)
  const standardAllowance = Math.round(monthlyWage * 0.08334);

  // 4. Performance Bonus: 8.33% of wage (~4165)
  const perfBonus = Math.round(monthlyWage * 0.0833);

  // 5. Leave Travel Allowance (LTA): 8.33% of wage (~4165)
  const lta = Math.round(monthlyWage * 0.0833);

  // 6. Fixed Allowance (Balance to ensure exact sum equals monthlyWage)
  const allocatedSum = basicSalary + hra + standardAllowance + perfBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - allocatedSum);

  // Provident Fund (PF): 12% of basic salary
  const employeePf = (basicSalary * pfPercent) / 100;
  const employerPf = (basicSalary * pfPercent) / 100;

  // Total Take-home before general tax
  const totalDeductions = employeePf + profTax;
  const netTakeHome = Math.max(0, monthlyWage - totalDeductions);

  // Mutation to save salary configuration
  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaveError(null);
      const components = [
        { name: 'Basic Salary', valueType: 'PERCENTAGE', value: 50 },
        { name: 'House Rent Allowance (HRA)', valueType: 'PERCENTAGE', value: 25 },
        { name: 'Standard Allowance', valueType: 'FIXED', value: standardAllowance },
        { name: 'Performance Bonus', valueType: 'PERCENTAGE', value: 8.33 },
        { name: 'Leave Travel Allowance', valueType: 'PERCENTAGE', value: 8.33 },
        { name: 'Fixed Allowance', valueType: 'FIXED', value: fixedAllowance },
      ];

      const res = await api.patch(`/employees/${employeeId}/salary`, {
        monthlyWage,
        workingDaysPerWeek: workingDays,
        pfPercent,
        professionalTax: profTax,
        components,
      });
      return res.data;
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId, 'salary'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.error || 'Failed to update salary structure');
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-text-muted flex items-center justify-center space-x-2">
        <div className="w-4 h-4 border-2 border-slate-brand border-t-transparent rounded-full animate-spin" />
        <span>Loading compensation details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="salary-info-tab">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-blue-grey/15">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-brand/10 text-slate-brand flex items-center justify-center border border-slate-brand/15">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Salary Information
                </h3>
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-light/40 text-sage-deep border border-sage-deep/20">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Define wage type, weekly schedule, automated salary components, and tax configs.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center space-x-2 self-start sm:self-auto shadow-sm"
            >
              {saveMutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveMutation.isPending ? 'Saving...' : 'Save Structure'}</span>
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-sage-light/30 border border-sage-deep/30 flex items-center space-x-2 text-xs text-sage-deep font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Salary structure and automated components saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-3 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-center space-x-2 text-xs text-terracotta animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Wage & Schedule Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          {/* Monthly Wage */}
          <div className="p-4 rounded-xl bg-cream/50 border border-blue-grey/20">
            <label className="label text-[11px] mb-1">Monthly Wage :-</label>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-text-muted">₹</span>
              <input
                type="number"
                value={monthlyWage}
                disabled={!isAdmin}
                onChange={(e) => setMonthlyWage(Math.max(0, Number(e.target.value)))}
                className="input py-1.5 px-3 text-base font-mono font-bold text-slate-brand bg-white"
                placeholder="50000"
              />
              <span className="text-xs font-semibold text-text-muted whitespace-nowrap">/ Month</span>
            </div>
          </div>

          {/* Yearly Wage (Auto calculated) */}
          <div className="p-4 rounded-xl bg-cream/50 border border-blue-grey/20">
            <label className="label text-[11px] mb-1">Yearly Wage :- (Auto-calculated)</label>
            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-mono font-bold text-text-primary">
                {formatINR(yearlyWage)}
              </span>
              <span className="text-xs font-semibold text-text-muted">/ Yearly</span>
            </div>
          </div>

          {/* Working days in a week */}
          <div className="p-4 rounded-xl bg-cream/50 border border-blue-grey/20">
            <label className="label text-[11px] mb-1">Working Days / Week :-</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={7}
                value={workingDays}
                disabled={!isAdmin}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="input py-1.5 px-3 text-base font-mono font-bold bg-white"
              />
              <span className="text-xs font-semibold text-text-muted whitespace-nowrap">Days</span>
            </div>
          </div>

          {/* Break time */}
          <div className="p-4 rounded-xl bg-cream/50 border border-blue-grey/20">
            <label className="label text-[11px] mb-1">Break Time :-</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={0}
                max={8}
                value={breakHours}
                disabled={!isAdmin}
                onChange={(e) => setBreakHours(Number(e.target.value))}
                className="input py-1.5 px-3 text-base font-mono font-bold bg-white"
              />
              <span className="text-xs font-semibold text-text-muted whitespace-nowrap">/ hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Components Section */}
      <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-blue-grey/15">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-brand" />
            <h4 className="font-heading font-semibold text-sm text-text-primary">
              Salary Components
            </h4>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Total Allocated: <span className="font-mono font-bold text-slate-brand">{formatINR(monthlyWage)}</span>
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Basic Salary */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">Basic Salary</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-brand/10 text-slate-brand font-bold">
                  50.00 % of Wage
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Defines basic salary for employee and computed based on monthly wage.
              </p>
            </div>
            <div className="text-right flex items-center sm:block space-x-2 sm:space-x-0">
              <span className="font-mono font-bold text-sm text-text-primary">
                {formatINR(basicSalary)}
              </span>
              <span className="text-[11px] text-text-muted block">/ month</span>
            </div>
          </div>

          {/* House Rent Allowance */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">House Rent Allowance (HRA)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-brand/10 text-slate-brand font-bold">
                  50.00 % of Basic
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                HRA provided to employees at 50% of the basic salary.
              </p>
            </div>
            <div className="text-right flex items-center sm:block space-x-2 sm:space-x-0">
              <span className="font-mono font-bold text-sm text-text-primary">
                {formatINR(hra)}
              </span>
              <span className="text-[11px] text-text-muted block">/ month</span>
            </div>
          </div>

          {/* Standard Allowance */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">Standard Allowance</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-brand/10 text-slate-brand font-bold">
                  8.33 % of Wage
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Predetermined fixed allowance provided to employee as part of salary.
              </p>
            </div>
            <div className="text-right flex items-center sm:block space-x-2 sm:space-x-0">
              <span className="font-mono font-bold text-sm text-text-primary">
                {formatINR(standardAllowance)}
              </span>
              <span className="text-[11px] text-text-muted block">/ month</span>
            </div>
          </div>

          {/* Performance Bonus */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">Performance Bonus</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-brand/10 text-slate-brand font-bold">
                  8.33 % of Wage
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Variable compensation defined by company policy calculated as percentage of wage.
              </p>
            </div>
            <div className="text-right flex items-center sm:block space-x-2 sm:space-x-0">
              <span className="font-mono font-bold text-sm text-text-primary">
                {formatINR(perfBonus)}
              </span>
              <span className="text-[11px] text-text-muted block">/ month</span>
            </div>
          </div>

          {/* Leave Travel Allowance (LTA) */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">Leave Travel Allowance (LTA)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-brand/10 text-slate-brand font-bold">
                  8.33 % of Wage
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                LTA paid by company to cover travel expenses.
              </p>
            </div>
            <div className="text-right flex items-center sm:block space-x-2 sm:space-x-0">
              <span className="font-mono font-bold text-sm text-text-primary">
                {formatINR(lta)}
              </span>
              <span className="text-[11px] text-text-muted block">/ month</span>
            </div>
          </div>

          {/* Fixed Allowance */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-blue-grey/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">Fixed Allowance</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sage-deep/10 text-sage-deep font-bold">
                  Balance Component
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Fixed allowance portion of wages determined after calculating all defined components.
              </p>
            </div>
            <div className="text-right flex items-center sm:block space-x-2 sm:space-x-0">
              <span className="font-mono font-bold text-sm text-text-primary">
                {formatINR(fixedAllowance)}
              </span>
              <span className="text-[11px] text-text-muted block">/ month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provident Fund & Tax Deductions 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provident Fund (PF) Contribution */}
        <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-blue-grey/15">
            <h4 className="font-heading font-semibold text-sm text-text-primary">
              Provident Fund (PF) Contribution
            </h4>
            <span className="text-[11px] font-mono font-semibold text-text-muted">
              {pfPercent}% of Basic
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-cream/40 border border-blue-grey/15 flex items-center justify-between">
              <div>
                <span className="font-medium text-text-primary block">Employee Contribution</span>
                <span className="text-[11px] text-text-muted">PF is calculated based on basic salary</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-text-primary">{formatINR(employeePf)}</span>
                <span className="text-[10px] text-text-muted block">/ month</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cream/40 border border-blue-grey/15 flex items-center justify-between">
              <div>
                <span className="font-medium text-text-primary block">Employer Contribution</span>
                <span className="text-[11px] text-text-muted">Company matching contribution</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-text-primary">{formatINR(employerPf)}</span>
                <span className="text-[10px] text-text-muted block">/ month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Deductions */}
        <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-blue-grey/15">
            <h4 className="font-heading font-semibold text-sm text-text-primary">
              Statutory Tax Deductions
            </h4>
            <span className="text-[11px] font-mono font-semibold text-text-muted">
              Monthly Deductions
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-cream/40 border border-blue-grey/15 flex items-center justify-between">
              <div>
                <span className="font-medium text-text-primary block">Professional Tax (PT)</span>
                <span className="text-[11px] text-text-muted">Professional Tax deducted from Gross salary</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-text-primary">{formatINR(profTax)}</span>
                <span className="text-[10px] text-text-muted block">/ month</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sage-light/30 border border-sage-deep/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary block">Estimated Net Take-Home</span>
                <span className="text-[11px] text-text-muted">Monthly wage minus statutory deductions</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sage-deep text-sm">{formatINR(netTakeHome)}</span>
                <span className="text-[10px] text-text-muted block">/ month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
