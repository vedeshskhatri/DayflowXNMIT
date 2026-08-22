import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TagInput } from './TagInput';
import { SalaryInfoTab } from './SalaryInfoTab';
import {
  CheckCircle2,
  Pencil,
  CreditCard,
  KeyRound,
} from 'lucide-react';

interface Tag {
  id?: string;
  name: string;
}

export interface EmployeeProfileData {
  id: string;
  loginId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  profilePicUrl?: string | null;
  bio?: string | null;
  jobLove?: string | null;
  interests?: string | null;
  dateOfBirth?: string | null;
  dateOfJoining: string;
  address?: string | null;
  personalEmail?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  skills: Tag[];
  certifications: Tag[];
  salary?: unknown;
}

const selfEditSchema = z.object({
  bio: z.string().max(2000).optional(),
  jobLove: z.string().max(1000).optional(),
  interests: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  profilePicUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

type SelfEditFormValues = z.infer<typeof selfEditSchema>;

type Tab = 'about' | 'private' | 'salary' | 'security';

interface EmployeeProfileViewProps {
  employeeId: string;
  editable: boolean;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employeeId,
  editable,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [successMsg, setSuccessMsg] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<EmployeeProfileData>({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await api.get<EmployeeProfileData>(`/employees/${employeeId}`);
      return res.data;
    },
  });

  const isOwnProfile = Boolean(
    editable ||
    (user && (
      user.id === employeeId ||
      user.loginId === employeeId ||
      (profile && (user.id === profile.id || user.loginId === profile.loginId))
    ))
  );
  const canViewSalary = Boolean(isAdmin || isOwnProfile);
  const canViewPrivateInfo = Boolean(isAdmin || isOwnProfile);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SelfEditFormValues>({
    resolver: zodResolver(selfEditSchema),
    defaultValues: {
      bio: profile?.bio ?? '',
      jobLove: profile?.jobLove ?? '',
      interests: profile?.interests ?? '',
      address: profile?.address ?? '',
      phone: profile?.phone ?? '',
      profilePicUrl: profile?.profilePicUrl ?? '',
      skills: profile?.skills?.map((s) => s.name) ?? [],
      certifications: profile?.certifications?.map((c) => c.name) ?? [],
    },
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        bio: profile.bio ?? '',
        jobLove: profile.jobLove ?? '',
        interests: profile.interests ?? '',
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        profilePicUrl: profile.profilePicUrl ?? '',
        skills: profile.skills?.map((s) => s.name) ?? [],
        certifications: profile.certifications?.map((c) => c.name) ?? [],
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (values: SelfEditFormValues) => {
      const payload = {
        ...values,
        skills: values.skills?.map((name) => ({ name })),
        certifications: values.certifications?.map((name) => ({ name })),
      };
      return api.patch(`/employees/${employeeId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      setSuccessMsg('Profile changes saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const onSubmit = async (values: SelfEditFormValues) => {
    await mutation.mutateAsync(values);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPwdError('Password must contain at least 1 uppercase letter and 1 number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: oldPassword,
        newPassword,
      });
      setPwdSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="card h-40 animate-pulse bg-white/60 border border-blue-grey/10" />
        <div className="card h-64 animate-pulse bg-white/60 border border-blue-grey/10" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card p-12 text-center text-terracotta bg-white border border-terracotta/20">
          <p className="font-heading font-semibold text-lg">Failed to load profile</p>
          <p className="text-xs text-text-muted mt-1">Please ensure the employee ID is valid.</p>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();


  const tabs: { id: Tab; label: string }[] = [
    { id: 'about', label: 'Resume' },
    ...(canViewPrivateInfo ? [{ id: 'private' as Tab, label: 'Private Info' }] : []),
    ...(canViewSalary ? [{ id: 'salary' as Tab, label: 'Salary Info' }] : []),
    ...(isOwnProfile || isAdmin ? [{ id: 'security' as Tab, label: 'Security' }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* ── TOP PAGE TITLE ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-text-primary">
          {isOwnProfile ? 'My Profile' : `${profile.firstName}'s Profile`}
        </h1>
        <span className="text-xs text-text-muted">
          Employee Portal &bull; {profile.department || 'Engineering'}
        </span>
      </div>

      {/* ── HEADER PROFILE SUMMARY (Matching Wireframe) ───────────── */}
      <div className="card border border-blue-grey/20 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 bg-gradient-to-r from-white via-white to-cream shadow-sm">
        {/* Avatar with Edit Pencil Overlay */}
        <div className="relative group flex-shrink-0">
          {profile.profilePicUrl ? (
            <img
              src={profile.profilePicUrl}
              alt={fullName}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-grey/20 shadow-sm"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold text-3xl flex items-center justify-center ring-4 ring-blue-grey/20 shadow-sm">
              {initials}
            </div>
          )}

          {editable && (
            <div
              className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-brand text-white shadow-md border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              title="Edit Profile"
              onClick={() => setActiveTab('private')}
            >
              <Pencil className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Header Details (Middle & Right Columns Matching Wireframe) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Middle Column: Name, Job Position, Email, Mobile */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-heading font-bold text-text-primary" data-testid="profile-name">
                  {fullName}
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sage-light/40 text-sage-deep border border-sage-deep/20 uppercase tracking-wide">
                  {profile.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-brand mt-0.5">
                {profile.jobTitle || 'Team Member'}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-text-muted">
              <p className="flex items-center space-x-2">
                <span className="font-bold text-text-primary w-24">Email :-</span>
                <span className="text-text-primary">{profile.email}</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-bold text-text-primary w-24">Mobile :-</span>
                <span className="text-text-primary">{profile.phone || '+91 98765 43210'}</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-bold text-text-primary w-24">Login ID :-</span>
                <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
              </p>

            </div>
          </div>

          {/* Right Column: Company, Department, Manager, Location */}
          <div className="text-xs text-text-muted space-y-2 md:border-l md:border-blue-grey/20 md:pl-6 flex flex-col justify-center">
            <p className="flex items-center justify-between pb-1.5 border-b border-blue-grey/15">
              <span className="font-bold text-text-primary">Company :-</span>
              <span className="font-medium text-text-primary">Dayflow HRMS</span>
            </p>
            <p className="flex items-center justify-between pb-1.5 border-b border-blue-grey/15">
              <span className="font-bold text-text-primary">Department :-</span>
              <span className="font-medium text-text-primary">{profile.department || 'Engineering'}</span>
            </p>
            <p className="flex items-center justify-between pb-1.5 border-b border-blue-grey/15">
              <span className="font-bold text-text-primary">Manager :-</span>
              <span className="font-medium text-text-primary">Alexander Mitchell (Admin)</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="font-bold text-text-primary">Location :-</span>
              <span className="font-medium text-text-primary">India (HQ)</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ────────────────────────────────────────── */}
      <div className="flex space-x-2 p-1.5 bg-white rounded-2xl border border-blue-grey/20 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-button-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-heading font-bold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-slate-brand text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT BOX ────────────────────────────────────────── */}
      <div className="card border border-blue-grey/20 p-6 bg-white">
        {editable ? (
          <form onSubmit={handleSubmit(onSubmit)} data-testid="profile-editable-form">
            {/* ── PRIVATE INFO TAB (Matching Wireframe 2-Column Grid) ── */}
            {activeTab === 'private' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Personal & Contact Details */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="pb-2 border-b border-blue-grey/20">
                    <h3 className="font-heading font-bold text-sm text-text-primary">
                      Personal & Contact Information
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-cream/40 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="font-semibold text-text-muted">Date of Birth</span>
                      <span className="font-medium text-text-primary">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Aug 1996'}
                      </span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="font-semibold text-text-muted">Nationality</span>
                      <span className="font-medium text-text-primary">Indian</span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="font-semibold text-text-muted">Personal Email</span>
                      <span className="font-medium text-text-primary">
                        {profile.personalEmail || `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@example.com`}
                      </span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="font-semibold text-text-muted">Gender</span>
                      <span className="font-medium text-text-primary">{profile.gender || 'Female'}</span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="font-semibold text-text-muted">Marital Status</span>
                      <span className="font-medium text-text-primary">{profile.maritalStatus || 'Single'}</span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="font-semibold text-text-muted">Date of Joining</span>
                      <span className="font-medium text-text-primary">
                        {new Date(profile.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold mb-1">Phone Number (10 digits) :-</label>
                      <input
                        {...register('phone')}
                        data-testid="input-phone"
                        type="tel"
                        className={`input py-2 text-xs ${errors.phone ? 'input-error' : ''}`}
                        placeholder="9876543210"
                      />
                      {errors.phone && <p data-testid="error-phone" className="error-text">{errors.phone.message}</p>}
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold mb-1">Residing Address :-</label>
                      <textarea
                        {...register('address')}
                        data-testid="input-address"
                        rows={2}
                        className="input resize-none text-xs"
                        placeholder="Enter current residential address..."
                      />
                      {errors.address && <p className="error-text">{errors.address.message}</p>}
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold mb-1">Profile Picture URL :-</label>
                      <input
                        {...register('profilePicUrl')}
                        data-testid="input-profilepic"
                        type="url"
                        className={`input py-2 text-xs ${errors.profilePicUrl ? 'input-error' : ''}`}
                        placeholder="https://example.com/avatar.jpg"
                      />
                      {errors.profilePicUrl && <p className="error-text">{errors.profilePicUrl.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Right Column: Bank Details (Matching Wireframe Header & Rows) */}
                <div className="lg:col-span-6 space-y-4 lg:border-l lg:border-blue-grey/20 lg:pl-8">
                  <div className="pb-2 border-b border-blue-grey/20 flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-text-primary">
                      Bank Details
                    </h3>
                    <CreditCard className="w-4 h-4 text-slate-brand" />
                  </div>

                  <div className="p-5 rounded-2xl bg-cream/40 border border-blue-grey/20 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-blue-grey/15">
                      <span className="font-semibold text-text-muted">Account Number</span>
                      <span className="font-mono font-bold text-text-primary tracking-wider">9876 5432 1098 4892</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-blue-grey/15">
                      <span className="font-semibold text-text-muted">Bank Name</span>
                      <span className="font-medium text-text-primary">HDFC Bank Ltd.</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-blue-grey/15">
                      <span className="font-semibold text-text-muted">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-brand">HDFC0001234</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-blue-grey/15">
                      <span className="font-semibold text-text-muted">PAN No</span>
                      <span className="font-mono font-bold text-text-primary uppercase">ABCDE1234F</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-blue-grey/15">
                      <span className="font-semibold text-text-muted">UAN NO</span>
                      <span className="font-mono font-bold text-text-primary">100987654321</span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="font-semibold text-text-muted">Emp Code</span>
                      <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RESUME / ABOUT TAB ──────────────────────────────────── */}
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <label className="label text-xs font-bold text-text-primary">About :-</label>
                    <textarea
                      {...register('bio')}
                      data-testid="input-bio"
                      rows={4}
                      className="input resize-none text-xs bg-cream/30"
                      placeholder="Share a brief overview of your background, experience, and role..."
                    />
                    {errors.bio && <p className="error-text">{errors.bio.message}</p>}
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-text-primary">
                      What I Love About My Job :-
                    </label>
                    <textarea
                      {...register('jobLove')}
                      data-testid="input-joblove"
                      rows={3}
                      className="input resize-none text-xs bg-cream/30"
                      placeholder="What drives and inspires you at work..."
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-text-primary">
                      My Interests and Hobbies :-
                    </label>
                    <textarea
                      {...register('interests')}
                      data-testid="input-interests"
                      rows={3}
                      className="input resize-none text-xs bg-cream/30"
                      placeholder="What you enjoy doing in your spare time..."
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-blue-grey/20 lg:pl-6">
                  <div>
                    <Controller
                      name="skills"
                      control={control}
                      render={({ field }) => (
                        <TagInput
                          label="Skills & Expertise"
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder="Type skill & press Enter..."
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      name="certifications"
                      control={control}
                      render={({ field }) => (
                        <TagInput
                          label="Certifications"
                          value={field.value ?? []}
                          onChange={field.onChange}
                          placeholder="Type certification & press Enter..."
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── SALARY INFO TAB ────────────────────────────────────── */}
            {activeTab === 'salary' && canViewSalary && (
              <SalaryInfoTab employeeId={employeeId} />
            )}

            {/* ── SECURITY TAB ───────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="max-w-xl mx-auto space-y-6 py-2">
                <div className="p-6 rounded-2xl bg-cream/30 border border-blue-grey/20 space-y-4">
                  <div className="flex items-center space-x-3 pb-3 border-b border-blue-grey/20">
                    <KeyRound className="w-5 h-5 text-slate-brand" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-text-primary">Change Password</h4>
                      <p className="text-xs text-text-muted">Update your login credentials securely.</p>
                    </div>
                  </div>

                  {pwdError && (
                    <div className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/20 text-xs text-terracotta font-medium">
                      {pwdError}
                    </div>
                  )}

                  {pwdSuccess && (
                    <div className="p-3 rounded-xl bg-sage-light/30 border border-sage-deep/30 text-xs text-sage-deep font-semibold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{pwdSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="label text-[11px] font-bold mb-1">Current Password :-</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="input py-2 text-xs"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold mb-1">New Password (min 8 chars, 1 uppercase, 1 number) :-</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input py-2 text-xs"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold mb-1">Confirm New Password :-</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input py-2 text-xs"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={pwdLoading || !oldPassword || !newPassword}
                      className="btn-primary w-full py-2.5 text-xs font-semibold mt-2 shadow-sm"
                    >
                      {pwdLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SAVE BAR (Only on editable Resume/Private tabs) ──────── */}
            {(activeTab === 'about' || activeTab === 'private') && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-blue-grey/20">
                {successMsg ? (
                  <span className="text-xs text-sage-deep font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{successMsg}</span>
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">
                    {isDirty ? 'Unsaved modifications pending' : 'All personal changes up to date'}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  data-testid="save-profile-button"
                  className="btn-primary text-xs py-2 px-6 shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            )}
          </form>
        ) : (
          /* ── READ-ONLY VIEW (When viewing another employee) ──────── */
          <div data-testid="profile-readonly-view" className="space-y-6">
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      About :-
                    </span>
                    <p className="text-xs text-text-primary leading-relaxed bg-cream/40 p-4 rounded-xl border border-blue-grey/15">
                      {profile.bio || <span className="text-text-muted italic">No bio provided.</span>}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      What I Love About My Job :-
                    </span>
                    <p className="text-xs text-text-primary leading-relaxed bg-cream/40 p-4 rounded-xl border border-blue-grey/15">
                      {profile.jobLove || <span className="text-text-muted italic">Not specified.</span>}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      My Interests and Hobbies :-
                    </span>
                    <p className="text-xs text-text-primary leading-relaxed bg-cream/40 p-4 rounded-xl border border-blue-grey/15">
                      {profile.interests || <span className="text-text-muted italic">None listed.</span>}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-blue-grey/20 lg:pl-6">
                  <div className="p-4 rounded-2xl bg-cream/40 border border-blue-grey/20 space-y-2">
                    <span className="text-xs font-bold text-text-primary block">
                      Skills &amp; Expertise
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.skills?.length > 0 ? (
                        profile.skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sage-light/40 text-text-primary border border-sage-light"
                          >
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-text-muted italic">No skills listed</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cream/40 border border-blue-grey/20 space-y-2">
                    <span className="text-xs font-bold text-text-primary block">
                      Certifications
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.certifications?.length > 0 ? (
                        profile.certifications.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-grey/20 text-slate-brand border border-blue-grey/30"
                          >
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-text-muted italic">No certifications listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'private' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6 space-y-3">
                  <h4 className="font-heading font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Personal &amp; Contact Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Date of Birth</span>
                      <span className="font-medium text-text-primary">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Aug 1996'}
                      </span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Nationality</span>
                      <span className="font-medium text-text-primary">Indian</span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Gender</span>
                      <span className="font-medium text-text-primary">{profile.gender || 'Female'}</span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Marital Status</span>
                      <span className="font-medium text-text-primary">{profile.maritalStatus || 'Single'}</span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Date of Joining</span>
                      <span className="font-medium text-text-primary">
                        {new Date(profile.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Phone</span>
                      <span className="font-medium text-text-primary">{profile.phone || '+91 98765 43210'}</span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Residing Address</span>
                      <span className="font-medium text-text-primary">{profile.address || 'Bengaluru, India'}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-3 lg:border-l lg:border-blue-grey/20 lg:pl-8">
                  <h4 className="font-heading font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Bank Details
                  </h4>
                  <div className="p-4 rounded-2xl bg-cream/40 border border-blue-grey/20 space-y-2.5 text-xs">
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">Account Number</span>
                      <span className="font-mono font-bold text-text-primary">9876 5432 1098 4892</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">Bank Name</span>
                      <span className="font-medium text-text-primary">HDFC Bank Ltd.</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-brand">HDFC0001234</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">PAN No</span>
                      <span className="font-mono font-bold text-text-primary">ABCDE1234F</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">UAN NO</span>
                      <span className="font-mono font-bold text-text-primary">100987654321</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-text-muted">Emp Code</span>
                      <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'salary' && canViewSalary && (
              <SalaryInfoTab employeeId={employeeId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
