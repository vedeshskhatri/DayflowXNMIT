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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-blue-grey/20 animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-grey/15 bg-cream/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-brand text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-bold text-lg text-text-primary">
              {createdCredentials ? 'Employee Account Created' : 'Add New Employee'}
            </h2>
          </div>
          <button
            onClick={handleModalClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {createdCredentials ? (
            /* Success State with Credentials */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-xl bg-sage-light/40 border border-sage-deep/30 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-sage-deep text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Login credentials generated!
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {createdCredentials.note}
                  </p>
                </div>
              </div>

              {/* Credentials Box */}
              <div className="bg-cream/70 rounded-xl p-4 border border-blue-grey/20 space-y-3">
                <div>
                  <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                    Generated Login ID
                  </span>
                  <div className="font-mono text-base font-bold text-slate-brand mt-0.5">
                    {createdCredentials.loginId}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                    Temporary Password
                  </span>
                  <div className="font-mono text-base font-bold text-text-primary mt-0.5">
                    {createdCredentials.tempPassword}
                  </div>
                </div>
              </div>

              {/* Copy Action */}
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-2.5"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Credentials Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Credentials to Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full btn-secondary py-2 text-sm text-center"
              >
                Done & Return to Directory
              </button>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {apiError && (
                <div className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/30 flex items-center space-x-2 text-terracotta text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      {...register('firstName')}
                      placeholder="e.g. Rahul"
                      className="input pl-9 py-2 text-sm bg-cream/40"
                    />
                  </div>
                  {errors.firstName && (
                    <span className="text-[11px] text-terracotta mt-0.5 block">
                      {errors.firstName.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    placeholder="e.g. Sharma"
                    className="input px-3 py-2 text-sm bg-cream/40"
                  />
                  {errors.lastName && (
                    <span className="text-[11px] text-terracotta mt-0.5 block">
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="rahul@dayflow.internal"
                      className="input pl-9 py-2 text-sm bg-cream/40"
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[11px] text-terracotta mt-0.5 block">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Phone (10 digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="9876543210"
                      className="input pl-9 py-2 text-sm bg-cream/40"
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-[11px] text-terracotta mt-0.5 block">
                      {errors.phone.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Department & Job Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      {...register('department')}
                      placeholder="e.g. Engineering"
                      className="input pl-9 py-2 text-sm bg-cream/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    {...register('jobTitle')}
                    placeholder="e.g. Frontend Engineer"
                    className="input px-3 py-2 text-sm bg-cream/40"
                  />
                </div>
              </div>

              {/* Role & Date of Joining */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Role *
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      {...register('role')}
                      className="input pl-9 py-2 text-sm bg-cream/40"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_OFFICER">HR Officer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Date of Joining *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-blue-grey absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      {...register('dateOfJoining')}
                      className="input pl-9 py-2 text-sm bg-cream/40"
                    />
                  </div>
                  {errors.dateOfJoining && (
                    <span className="text-[11px] text-terracotta mt-0.5 block">
                      {errors.dateOfJoining.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-blue-grey/15 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-5 text-sm flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Employee</span>
                    </>
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
