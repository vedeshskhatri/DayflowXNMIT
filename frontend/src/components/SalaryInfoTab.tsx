import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DollarSign, ShieldAlert } from 'lucide-react';

export const SalaryInfoTab: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee', employeeId, 'salary'],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}`);
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center text-xs text-text-muted">Loading salary structure...</div>;
  }

  const salary = employeeData?.salary;

  return (
    <div className="space-y-6 py-2" data-testid="salary-info-tab">
      <div className="flex items-center justify-between pb-4 border-b border-blue-grey/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-base text-text-primary">
              Compensation & Salary Structure
            </h3>
            <p className="text-xs text-text-muted">Confidential &bull; Admin Access Only</p>
          </div>
        </div>
      </div>

      {salary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card bg-cream/60 border border-blue-grey/20 p-4">
            <span className="text-xs text-text-muted block">Monthly Base Wage</span>
            <span className="text-xl font-heading font-bold text-text-primary font-mono mt-1 block">
              ₹{salary.monthlyWage?.toLocaleString('en-IN') || '0'}
            </span>
          </div>
          <div className="card bg-cream/60 border border-blue-grey/20 p-4">
            <span className="text-xs text-text-muted block">Composition Type</span>
            <span className="text-sm font-semibold text-text-primary mt-1 block capitalize">
              {salary.compositionType?.toLowerCase() || 'Percentage'}
            </span>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-text-muted space-y-2 border border-blue-grey/20">
          <ShieldAlert className="w-8 h-8 mx-auto text-blue-grey" />
          <p className="text-sm font-semibold text-text-primary">No Salary Structure Configured</p>
          <p className="text-xs">Salary details will appear once assigned by HR/Admin.</p>
        </div>
      )}
    </div>
  );
};
