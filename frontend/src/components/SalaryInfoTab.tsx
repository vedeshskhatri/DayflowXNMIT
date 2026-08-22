import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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

function fmt(val: number): string {
  return Number(val || 0).toFixed(2);
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

  // Exact Formulas:
  const yearlyWage = monthlyWage * 12;
  const basicSalary = monthlyWage * 0.5;
  const hra = basicSalary * 0.5;
  const standardAllowance = Math.round(basicSalary * (16.668 / 100));
  const perfBonus = Math.round(basicSalary * (8.33 / 100) * 100) / 100;
  const lta = Math.round(basicSalary * (8.33 / 100) * 100) / 100;
  const allocatedSum = basicSalary + hra + standardAllowance + perfBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - allocatedSum);

  const employeePf = (basicSalary * pfPercent) / 100;
  const employerPf = (basicSalary * pfPercent) / 100;

  // Save structure mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaveError(null);
      const components = [
        { name: 'Basic Salary', valueType: 'PERCENTAGE', value: 50 },
        { name: 'House Rent Allowance', valueType: 'PERCENTAGE', value: 25 },
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
        <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        <span>Loading compensation details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="salary-info-tab">
      <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-navy/10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center shadow-sm">
              <Calculator className="w-6 h-6 text-copper-bright" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-lg text-navy-dark">
                  Salary Information & Compensation
                </h3>
                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-copper-muted text-copper-dark border border-copper/30 font-mono">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Admin Managed
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Automated statutory salary breakdown and tax computation.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-navy py-2.5 px-5 text-xs font-bold flex items-center space-x-2 self-start sm:self-auto shadow-sm cursor-pointer"
            >
              {saveMutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-copper-bright" />
              )}
              <span>{saveMutation.isPending ? 'Saving...' : 'Save Structure'}</span>
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-sage-light/30 border border-sage-deep/30 flex items-center space-x-2 text-xs text-navy-dark font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-sage-deep" />
            <span>Salary structure and automated components saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-xl bg-terracotta-light border border-terracotta/20 flex items-center space-x-2 text-xs text-terracotta animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* ── TOP SECTION: Month Wage, Yearly Wage, Working Days, Break Time ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 pb-6 border-b border-navy/10">
          <div className="lg:col-span-6 space-y-4">
            {/* Month Wage */}
            <div className="flex items-center space-x-4">
              <label className="text-xs font-heading font-bold text-navy-dark uppercase font-mono w-32">
                Monthly Wage
              </label>
              <div className="flex-1 flex items-center space-x-2 border-b-2 border-navy pb-1">
                <input
                  type="number"
                  value={monthlyWage}
                  disabled={!isAdmin}
                  onChange={(e) => setMonthlyWage(Math.max(0, Number(e.target.value)))}
                  className="w-full text-base font-mono font-bold text-navy-dark bg-transparent outline-none"
                  placeholder="50000"
                />
                <span className="text-xs font-bold text-copper font-mono whitespace-nowrap">
                  ₹ / Month
                </span>
              </div>
            </div>

            {/* Yearly Wage */}
            <div className="flex items-center space-x-4">
              <label className="text-xs font-heading font-bold text-navy-dark uppercase font-mono w-32">
                Yearly Wage (CTC)
              </label>
              <div className="flex-1 flex items-center justify-between border-b-2 border-navy/15 pb-1">
                <span className="text-base font-mono font-bold text-navy-dark">
                  ₹ {yearlyWage.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-text-muted font-mono whitespace-nowrap">
                  / Year
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4 lg:border-l lg:border-navy/10 lg:pl-6">
            {/* Working Days */}
            <div className="flex items-center space-x-4">
              <label className="text-xs font-heading font-bold text-navy-dark uppercase font-mono w-48">
                Working Days / Week:
              </label>
              <div className="flex-1 border-b-2 border-navy/15 pb-1">
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={workingDays}
                  disabled={!isAdmin}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="w-full text-base font-mono font-bold text-navy-dark bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Break Time */}
            <div className="flex items-center space-x-4">
              <label className="text-xs font-heading font-bold text-navy-dark uppercase font-mono w-48">
                Break Time / Day:
              </label>
              <div className="flex-1 flex items-center space-x-2 border-b-2 border-navy/15 pb-1">
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={breakHours}
                  disabled={!isAdmin}
                  onChange={(e) => setBreakHours(Number(e.target.value))}
                  className="w-full text-base font-mono font-bold text-navy-dark bg-transparent outline-none"
                />
                <span className="text-xs font-bold text-text-muted font-mono whitespace-nowrap">
                  Hours
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN GRID: Components (Left) | PF & Tax (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          {/* ═══════════ LEFT COLUMN: Salary Components ═══════════ */}
          <div className="lg:col-span-7 space-y-4">
            <div className="pb-2 border-b-2 border-navy/15">
              <h4 className="font-heading font-bold text-sm text-navy-dark">
                Earnings Components
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              {/* 1. Basic Salary */}
              <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-navy-dark">
                    Basic Salary
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(basicSalary)} ₹ / mo
                    </span>
                    <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                      50.00 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Define Basic salary from company cost compute it based on monthly Wages
                </p>
              </div>

              {/* 2. House Rent Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-navy-dark">
                    House Rent Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(hra)} ₹ / mo
                    </span>
                    <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                      50.00 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  HRA provided to employees 50% of the basic salary
                </p>
              </div>

              {/* 3. Standard Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-navy-dark">
                    Standard Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(standardAllowance)} ₹ / mo
                    </span>
                    <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                      16.67 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Predetermined fixed amount provided to employee as part of salary
                </p>
              </div>

              {/* 4. Performance Bonus */}
              <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-navy-dark">
                    Performance Bonus
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(perfBonus)} ₹ / mo
                    </span>
                    <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                      8.33 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Variable amount calculated as a % of basic salary
                </p>
              </div>

              {/* 5. Leave Travel Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-navy-dark">
                    Leave Travel Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(lta)} ₹ / mo
                    </span>
                    <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                      8.33 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  LTA to cover travel expenses, calculated as a % of basic salary
                </p>
              </div>

              {/* 6. Fixed Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-navy-dark">
                    Fixed Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(fixedAllowance)} ₹ / mo
                    </span>
                    <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                      11.67 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Remaining wage portion balanced after all component calculations
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════ RIGHT COLUMN: PF & Tax ═══════════ */}
          <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-navy/10 lg:pl-6">
            <div className="space-y-4">
              <div className="pb-2 border-b-2 border-navy/15">
                <h4 className="font-heading font-bold text-sm text-navy-dark">
                  Provident Fund (PF) Contribution
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                {/* Employee PF */}
                <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-navy-dark">
                      Employee PF
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                        {fmt(employeePf)} ₹ / mo
                      </span>
                      <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                        {fmt(pfPercent)} %
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    PF calculated based on basic salary (12%)
                  </p>
                </div>

                {/* Employer PF */}
                <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-navy-dark">
                      Employer PF
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                        {fmt(employerPf)} ₹ / mo
                      </span>
                      <span className="font-mono font-bold text-xs text-copper border-b border-navy/20 pb-0.5">
                        {fmt(pfPercent)} %
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    Matching statutory contribution
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Deductions */}
            <div className="space-y-4 pt-2">
              <div className="pb-2 border-b-2 border-navy/15">
                <h4 className="font-heading font-bold text-sm text-navy-dark">
                  Tax Deductions
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-cream-light border border-navy/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-navy-dark">
                      Professional Tax
                    </span>
                    <span className="font-mono font-bold text-sm text-navy-dark border-b border-navy/20 pb-0.5">
                      {fmt(profTax)} ₹ / mo
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    State statutory professional tax deduction
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
