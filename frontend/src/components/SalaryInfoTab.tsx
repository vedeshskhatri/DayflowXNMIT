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

  // Exact Wireframe Formulas:
  const yearlyWage = monthlyWage * 12;

  // 1. Basic Salary: 50% of monthly wage
  const basicSalary = monthlyWage * 0.5;

  // 2. House Rent Allowance: 50% of basic salary (25% of monthly wage)
  const hra = basicSalary * 0.5;

  // 3. Standard Allowance: 16.668% of basic salary (~4167.00)
  const standardAllowance = Math.round(basicSalary * (16.668 / 100));

  // 4. Performance Bonus: 8.33% of basic salary (~2082.50)
  const perfBonus = Math.round(basicSalary * (8.33 / 100) * 100) / 100;

  // 5. Leave Travel Allowance: 8.33% of basic salary (~2082.50)
  const lta = Math.round(basicSalary * (8.33 / 100) * 100) / 100;

  // 6. Fixed Allowance: Remainder to ensure sum equals exactly monthlyWage (~2918.00)
  const allocatedSum = basicSalary + hra + standardAllowance + perfBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - allocatedSum);

  // Provident Fund (PF): 12% of basic salary
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
        <div className="w-4 h-4 border-2 border-slate-brand border-t-transparent rounded-full animate-spin" />
        <span>Loading compensation details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="salary-info-tab">
      {/* ── Top Card: Title & Save Action ──────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-blue-grey/20 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-blue-grey/15">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-brand/10 text-slate-brand flex items-center justify-center border border-slate-brand/15">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Salary Info
                </h3>
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-light/40 text-sage-deep border border-sage-deep/20">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Salary Info tab Should only be visible to Admin
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center space-x-2 self-start sm:self-auto shadow-sm"
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
          <div className="p-3 rounded-xl bg-sage-light/30 border border-sage-deep/30 flex items-center space-x-2 text-xs text-sage-deep font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Salary structure and automated components saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-center space-x-2 text-xs text-terracotta animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* ── TOP WIREFRAME SECTION: Month Wage, Yearly Wage, Working Days, Break Time ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 pb-6 border-b border-blue-grey/15">
          {/* Left: Month Wage & Yearly Wage */}
          <div className="lg:col-span-6 space-y-4">
            {/* Month Wage */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-heading font-semibold text-text-primary w-32">
                Month Wage
              </label>
              <div className="flex-1 flex items-center space-x-2 border-b-2 border-slate-brand/40 pb-1">
                <input
                  type="number"
                  value={monthlyWage}
                  disabled={!isAdmin}
                  onChange={(e) => setMonthlyWage(Math.max(0, Number(e.target.value)))}
                  className="w-full text-base font-mono font-bold text-slate-brand bg-transparent outline-none"
                  placeholder="50000"
                />
                <span className="text-xs font-semibold text-text-muted whitespace-nowrap">
                  / Month
                </span>
              </div>
            </div>

            {/* Yearly Wage */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-heading font-semibold text-text-primary w-32">
                Yearly wage
              </label>
              <div className="flex-1 flex items-center justify-between border-b-2 border-blue-grey/30 pb-1">
                <span className="text-base font-mono font-bold text-text-primary">
                  {yearlyWage}
                </span>
                <span className="text-xs font-semibold text-text-muted whitespace-nowrap">
                  / Yearly
                </span>
              </div>
            </div>
          </div>

          {/* Right: Working Days & Break Time */}
          <div className="lg:col-span-6 space-y-4 lg:border-l lg:border-blue-grey/15 lg:pl-6">
            {/* Working Days */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-heading font-semibold text-text-primary w-48">
                No of working days in a week:
              </label>
              <div className="flex-1 border-b-2 border-blue-grey/30 pb-1">
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={workingDays}
                  disabled={!isAdmin}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="w-full text-base font-mono font-bold text-text-primary bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Break Time */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-heading font-semibold text-text-primary w-48">
                Break Time:
              </label>
              <div className="flex-1 flex items-center space-x-2 border-b-2 border-blue-grey/30 pb-1">
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={breakHours}
                  disabled={!isAdmin}
                  onChange={(e) => setBreakHours(Number(e.target.value))}
                  className="w-full text-base font-mono font-bold text-text-primary bg-transparent outline-none"
                />
                <span className="text-xs font-semibold text-text-muted whitespace-nowrap">
                  /hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN WIREFRAME GRID: Salary Components (Left) | PF & Tax (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          {/* ═══════════ LEFT COLUMN: Salary Components ═══════════ */}
          <div className="lg:col-span-7 space-y-4">
            <div className="pb-2 border-b-2 border-blue-grey/20">
              <h4 className="font-heading font-bold text-sm text-text-primary">
                Salary Components
              </h4>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Basic Salary */}
              <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    Basic Salary
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(basicSalary)} ₹ / month
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                      50.00 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Define Basic salary from company cost compute it based on monthly Wages
                </p>
              </div>

              {/* 2. House Rent Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    House Rent Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(hra)} ₹ / month
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                      50.00 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  HRA provided to employees 50% of the basic salary
                </p>
              </div>

              {/* 3. Standard Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    Standard Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(standardAllowance)} ₹ / month
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                      16.67 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  A standard allowance is a predetermined, fixed amount provided to employee as part of their salary
                </p>
              </div>

              {/* 4. Performance Bonus */}
              <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    Performance Bonus
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(perfBonus)} ₹ / month
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                      8.33 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary
                </p>
              </div>

              {/* 5. Leave Travel Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    Leave Travel Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(lta)} ₹ / month
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                      8.33 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  LTA is paid by the company to employees to cover their travel expenses. and calculated as a % of the basic salary
                </p>
              </div>

              {/* 6. Fixed Allowance */}
              <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-heading font-bold text-xs text-text-primary">
                    Fixed Allowance
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(fixedAllowance)} ₹ / month
                    </span>
                    <span className="font-mono font-bold text-xs text-sage-deep border-b border-blue-grey/30 pb-0.5">
                      11.67 %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted italic">
                  fixed allowance portion of wages is determined after calculating all salary components
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════ RIGHT COLUMN: PF Contribution & Tax Deductions ═══════════ */}
          <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-blue-grey/15 lg:pl-6">
            {/* Section 1: Provident Fund (PF) Contribution */}
            <div className="space-y-4">
              <div className="pb-2 border-b-2 border-blue-grey/20">
                <h4 className="font-heading font-bold text-sm text-text-primary">
                  Provident Fund (PF) Contribution
                </h4>
              </div>

              <div className="space-y-4 text-xs">
                {/* Employee PF */}
                <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-text-primary">
                      Employee
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                        {fmt(employeePf)} ₹ / month
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                        {fmt(pfPercent)} %
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    PF is calculated based on the basic salary
                  </p>
                </div>

                {/* Employer PF */}
                <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-text-primary">
                      Employe&apos;r
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                        {fmt(employerPf)} ₹ / month
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-brand border-b border-blue-grey/30 pb-0.5">
                        {fmt(pfPercent)} %
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    PF is calculated based on the basic salary
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Tax Deductions */}
            <div className="space-y-4 pt-2">
              <div className="pb-2 border-b-2 border-blue-grey/20">
                <h4 className="font-heading font-bold text-sm text-text-primary">
                  Tax Deductions
                </h4>
              </div>

              <div className="space-y-4 text-xs">
                {/* Professional Tax */}
                <div className="p-3.5 rounded-2xl bg-cream/35 border border-blue-grey/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-text-primary">
                      Professional Tax
                    </span>
                    <span className="font-mono font-bold text-sm text-text-primary border-b border-blue-grey/30 pb-0.5">
                      {fmt(profTax)} ₹ / month
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    Professional Tax deducted from the Gross salary
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

