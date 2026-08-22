import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  X,
  UserPlus,
  Copy,
  Check,
  ShieldCheck,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const createEmployeeFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Must be a valid email address'),
  phone: z
    .string()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: 'Phone must be exactly 10 digits',
    })
    .optional(),
  role: z.enum(['EMPLOYEE', 'ADMIN', 'HR_OFFICER']),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  dateOfJoining: z
    .string()
    .min(1, 'Date of joining is required')
    .refine(
      (d) => new Date(d) <= new Date(),
      'Date of joining cannot be in the future'
    ),
});

type CreateEmployeeFormValues = z.infer<typeof createEmployeeFormSchema>;

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreatedCredentials {
  loginId: string;
  tempPassword: string;
  note: string;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [createdCredentials, setCreatedCredentials] =
    useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeFormSchema),
    defaultValues: {
      role: 'EMPLOYEE',
      dateOfJoining: new Date().toISOString().split('T')[0],
    },
  });

  if (!isOpen) return null;

  const handleModalClose = () => {
    reset();
    setCreatedCredentials(null);
    setApiError(null);
    setCopied(false);
    onClose();
  };

  const onSubmit = async (data: CreateEmployeeFormValues) => {
    setApiError(null);
    try {
      const payload = {
        ...data,
        phone: data.phone?.trim() ? data.phone.trim() : undefined,
        jobTitle: data.jobTitle?.trim() ? data.jobTitle.trim() : undefined,
        department: data.department?.trim() ? data.department.trim() : undefined,
      };

      const res = await api.post<{
        message: string;
        credentials: CreatedCredentials;
      }>('/auth/employees', payload);

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCreatedCredentials(res.data.credentials);
    } catch (err: any) {
      setApiError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to create employee. Please verify the input.'
      );
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Dayflow Login Credentials:\nLogin ID: ${createdCredentials.loginId}\nTemporary Password: ${createdCredentials.tempPassword}\nURL: http://localhost:5173`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-dark/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-modal max-w-lg w-full overflow-hidden border border-navy/15 animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10 bg-cream/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center shadow-sm">
              <UserPlus className="w-4 h-4 text-copper-bright" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-navy-dark">
                {createdCredentials ? 'Employee Registered' : 'Add New Employee'}
              </h2>
              <p className="text-[11px] text-text-muted">
                {createdCredentials
                  ? 'Share the generated credentials with the employee'
                  : 'Create account & auto-generate Dayflow Login ID'}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-navy-dark hover:bg-cream transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {apiError && (
            <div className="mb-4 p-3.5 rounded-xl bg-terracotta-light border border-terracotta/20 flex items-start space-x-3 text-terracotta text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{apiError}</span>
            </div>
          )}

          {createdCredentials ? (
            /* Success State: Credentials Card */
            <div className="space-y-5">
              <div className="bg-cream/80 border border-navy/15 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-copper font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-copper" /> Credentials Generated
                  </span>
                  <button
                    onClick={handleCopyCredentials}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-navy/15 hover:bg-cream rounded-xl text-xs font-bold text-navy-dark transition-colors shadow-sm cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-copper" />
                        <span className="text-copper">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-text-muted" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-navy/10">
                    <span className="text-xs text-text-muted font-sans font-medium">Login ID:</span>
                    <span className="text-sm font-bold text-navy-dark">
                      {createdCredentials.loginId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-navy/10">
                    <span className="text-xs text-text-muted font-sans font-medium">Temporary Password:</span>
                    <span className="text-sm font-bold text-copper font-mono">
                      {createdCredentials.tempPassword}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted pt-1">
                  * Employee will be prompted to reset their temporary password on first sign-in.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="btn-navy py-2 px-5 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName')}
                      placeholder="e.g. Vikram"
                      className="input pl-9 text-xs"
                    />
                  </div>
                  {errors.firstName && (
                    <span className="error-text">{errors.firstName.message}</span>
                  )}
                </div>

                <div>
                  <label className="label">Last Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...register('lastName')}
                      placeholder="e.g. Joshi"
                      className="input pl-9 text-xs"
                    />
                  </div>
                  {errors.lastName && (
                    <span className="error-text">{errors.lastName.message}</span>
                  )}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="vikram@dayflow.dev"
                      className="input pl-9 text-xs"
                    />
                  </div>
                  {errors.email && (
                    <span className="error-text">{errors.email.message}</span>
                  )}
                </div>

                <div>
                  <label className="label">Phone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="9876543210"
                      className="input pl-9 text-xs"
                    />
                  </div>
                  {errors.phone && (
                    <span className="error-text">{errors.phone.message}</span>
                  )}
                </div>
              </div>

              {/* Role & Date of Joining */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">System Role *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <select
                      {...register('role')}
                      className="input pl-9 text-xs appearance-none bg-white font-medium"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_OFFICER">HR Officer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Date of Joining *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      {...register('dateOfJoining')}
                      className="input pl-9 text-xs"
                    />
                  </div>
                  {errors.dateOfJoining && (
                    <span className="error-text">{errors.dateOfJoining.message}</span>
                  )}
                </div>
              </div>

              {/* Job Title & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Job Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy/40">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...register('jobTitle')}
                      placeholder="e.g. Staff Engineer"
                      className="input pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Department</label>
                  <input
                    type="text"
                    {...register('department')}
                    placeholder="e.g. Engineering"
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-navy/10">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-navy py-2 px-5 text-xs font-bold flex items-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating…</span>
                    </>
                  ) : (
                    <span>Create & Generate ID</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
