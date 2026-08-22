import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Camera,
  Upload,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { TagInput } from './TagInput';
import { SalaryInfoTab } from './SalaryInfoTab';
import { useAuth } from '../context/AuthContext';

type Tab = 'about' | 'private' | 'salary' | 'security';

interface EmployeeProfileViewProps {
  employeeId: string;
  editable?: boolean; // false for read-only view in directory
}

interface Tag {
  id?: string;
  name: string;
}

export interface EmployeeFullProfile {
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
  address?: string | null;
  personalEmail?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  dateOfJoining?: string | null;
  dateOfBirth?: string | null;
  skills: Tag[];
  certifications: Tag[];
  status?: string;
}

export type EmployeeProfileData = EmployeeFullProfile;

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
  profilePicUrl: z.string().max(10000000).optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

type SelfEditFormValues = z.infer<typeof selfEditSchema>;

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employeeId,
  editable = true,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Security tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Fetch full profile from backend
  const { data: rawData, isLoading, isError } = useQuery<any>({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}`);
      return res.data;
    },
  });

  const profile: EmployeeFullProfile | undefined = rawData?.employee || (rawData?.id ? rawData : undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SelfEditFormValues>({
    resolver: zodResolver(selfEditSchema),
    defaultValues: {
      bio: '',
      jobLove: '',
      interests: '',
      address: '',
      phone: '',
      profilePicUrl: '',
      skills: [],
      certifications: [],
    },
  });

  const watchedSkills = watch('skills') || [];
  const watchedCertifications = watch('certifications') || [];
  const watchedProfilePicUrl = watch('profilePicUrl');

  // Handle local device image file upload to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setValue('profilePicUrl', base64, { shouldDirty: true, shouldValidate: true });
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setValue('profilePicUrl', '', { shouldDirty: true, shouldValidate: true });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Populate form with current values
  useEffect(() => {
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
    setPwdMsg(null);
    setPwdError(null);

    if (!newPassword || newPassword.length < 8) {
      setPwdError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPwdError('Password must contain at least 1 uppercase letter and 1 number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }

    try {
      setPwdLoading(true);
      await api.post('/auth/reset-password', { newPassword });
      setPwdMsg('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Failed to update password');
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
  const isOwnProfile = Boolean(
    editable &&
    ((user && (user.id === profile.id || user.loginId === profile.loginId)) ||
     (user && (user.id === employeeId || user.loginId === employeeId)))
  );
  const canViewPrivateInfo = Boolean(isAdmin || isOwnProfile);
  const canViewSalary = Boolean(isAdmin || isOwnProfile);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'about', label: 'Resume' },
    ...(canViewPrivateInfo ? [{ id: 'private' as Tab, label: 'Private Info' }] : []),
    ...(canViewSalary ? [{ id: 'salary' as Tab, label: 'Salary Info' }] : []),
    ...(isOwnProfile ? [{ id: 'security' as Tab, label: 'Security' }] : []),
  ];

  const formattedDob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '15 Aug 1996';

  const formattedDoj = profile.dateOfJoining
    ? new Date(profile.dateOfJoining).toLocaleDateString()
    : '1/15/2026';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* ── HEADER PROFILE SUMMARY (Master Wireframe Alignment) ───────── */}
      <div className="p-6 rounded-3xl bg-white border border-blue-grey/20 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar with Edit Camera Overlay */}
        <div
          className={`relative group flex-shrink-0 ${editable ? 'cursor-pointer' : ''}`}
          onClick={() => {
            if (editable) photoInputRef.current?.click();
          }}
          title={editable ? 'Click to upload profile photo from device' : undefined}
        >
          {(watchedProfilePicUrl || profile.profilePicUrl) ? (
            <img
              src={watchedProfilePicUrl || profile.profilePicUrl || ''}
              alt={fullName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-grey/20 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-brand/15 text-slate-brand font-heading font-bold text-2xl flex items-center justify-center ring-4 ring-blue-grey/20 shadow-sm">
              {initials}
            </div>
          )}

          {editable && (
            <div
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-brand text-white shadow-md border-2 border-white group-hover:bg-slate-brand/90 transition-colors"
              title="Upload profile photo from device"
            >
              <Camera className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Header Details (Left & Right 2-Column Columns) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column: Name, Job Position, Email, Mobile */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-heading font-bold text-text-primary" data-testid="profile-name">
                {fullName}
              </h1>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sage-light/40 text-sage-deep border border-sage-deep/20 uppercase tracking-wide">
                {profile.role.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-text-muted pt-1">
              <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
                <span className="font-semibold text-text-primary">Job Position</span>
                <span className="font-medium text-text-primary">{profile.jobTitle || 'Product Designer'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
                <span className="font-semibold text-text-primary">Email</span>
                <span className="font-mono text-text-primary">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
                <span className="font-semibold text-text-primary">Mobile</span>
                <span className="font-mono text-text-primary">{profile.phone || '9876543210'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Company, Department, Manager, Location */}
          <div className="space-y-1.5 text-xs text-text-muted md:border-l md:border-blue-grey/20 md:pl-6 pt-1 md:pt-8">
            <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
              <span className="font-semibold text-text-primary">Company</span>
              <span className="font-medium text-text-primary">Dayflow HRMS</span>
            </div>
            <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
              <span className="font-semibold text-text-primary">Department</span>
              <span className="font-medium text-text-primary">{profile.department || 'Design'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
              <span className="font-semibold text-text-primary">Manager</span>
              <span className="font-medium text-text-primary">Alok Verma</span>
            </div>
            <div className="flex items-center justify-between border-b border-blue-grey/20 pb-1">
              <span className="font-semibold text-text-primary">Location</span>
              <span className="font-medium text-text-primary">India (HQ)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION (Resume, Private Info, Salary Info, Security) ─ */}
      <div className="flex space-x-2 p-1.5 bg-white rounded-2xl border border-blue-grey/20 shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-button-${tab.id}`}
              className={`flex-1 py-2.5 text-xs font-heading font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-brand text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-cream'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-blue-grey/20 shadow-sm">
        {editable ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            data-testid="profile-editable-form"
            className="space-y-6"
          >
            {/* ── RESUME / ABOUT TAB ──────────────────────────────────── */}
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="label text-[11px] mb-1">About :-</label>
                    <textarea
                      {...register('bio')}
                      data-testid="input-bio"
                      rows={3}
                      className="input resize-none text-xs"
                      placeholder="Share a brief introduction about yourself and your professional journey..."
                    />
                    {errors.bio && <p className="error-text">{errors.bio.message}</p>}
                  </div>

                  <div>
                    <label className="label text-[11px] mb-1">What I Love About My Job :-</label>
                    <textarea
                      {...register('jobLove')}
                      data-testid="input-joblove"
                      rows={2}
                      className="input resize-none text-xs"
                      placeholder="What drives your passion in this role?"
                    />
                    {errors.jobLove && <p className="error-text">{errors.jobLove.message}</p>}
                  </div>

                  <div>
                    <label className="label text-[11px] mb-1">My Interests and Hobbies :-</label>
                    <textarea
                      {...register('interests')}
                      data-testid="input-interests"
                      rows={2}
                      className="input resize-none text-xs"
                      placeholder="Books, hiking, music, coding, design..."
                    />
                    {errors.interests && <p className="error-text">{errors.interests.message}</p>}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-blue-grey/20 lg:pl-6">
                  <div>
                    <TagInput
                      label="Skills & Expertise :-"
                      value={watchedSkills}
                      onChange={(newSkills) =>
                        setValue('skills', newSkills, { shouldDirty: true, shouldValidate: true })
                      }
                      placeholder="e.g. Figma, React, Design Systems..."
                    />
                  </div>

                  <div>
                    <TagInput
                      label="Certifications :-"
                      value={watchedCertifications}
                      onChange={(newCerts) =>
                        setValue('certifications', newCerts, { shouldDirty: true, shouldValidate: true })
                      }
                      placeholder="e.g. AWS Certified, PMP..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── PRIVATE INFO TAB (Exact Wireframe 2-Column Layout) ──── */}
            {activeTab === 'private' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Personal & Contact Wireframe Fields */}
                <div className="lg:col-span-6 space-y-4 text-xs">
                  {/* 1. Date of Birth */}
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Date of Birth</span>
                    <span className="font-mono text-text-primary">{formattedDob}</span>
                  </div>

                  {/* 2. Residing Address */}
                  <div className="border-b border-blue-grey/20 pb-2 space-y-1">
                    <label className="font-semibold text-text-primary block">Residing Address</label>
                    <input
                      {...register('address')}
                      data-testid="input-address"
                      type="text"
                      className="w-full text-xs font-medium text-text-primary bg-transparent outline-none border-b border-slate-brand/40 pb-0.5"
                      placeholder="Enter residing address..."
                    />
                    {errors.address && <p className="error-text">{errors.address.message}</p>}
                  </div>

                  {/* 3. Nationality */}
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Nationality</span>
                    <span className="font-medium text-text-primary">Indian</span>
                  </div>

                  {/* 4. Personal Email */}
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Personal Email</span>
                    <span className="font-mono text-text-primary">
                      {`${profile.firstName.toLowerCase()}.personal@dayflow.internal`}
                    </span>
                  </div>

                  {/* 5. Gender */}
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Gender</span>
                    <span className="font-medium text-text-primary">{profile.gender || 'Female'}</span>
                  </div>

                  {/* 6. Marital Status */}
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Marital Status</span>
                    <span className="font-medium text-text-primary">{profile.maritalStatus || 'Single'}</span>
                  </div>

                  {/* 7. Date of Joining */}
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Date of Joining</span>
                    <span className="font-mono text-text-primary">{formattedDoj}</span>
                  </div>

                  {/* Phone Number Input */}
                  <div className="border-b border-blue-grey/20 pb-2 space-y-1">
                    <label className="font-semibold text-text-primary block">Phone Number (10 digits)</label>
                    <input
                      {...register('phone')}
                      data-testid="input-phone"
                      type="tel"
                      className="w-full text-xs font-mono font-medium text-text-primary bg-transparent outline-none border-b border-slate-brand/40 pb-0.5"
                      placeholder="9876543210"
                    />
                    {errors.phone && <p data-testid="error-phone" className="error-text">{errors.phone.message}</p>}
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="pt-2 space-y-2">
                    <label className="font-semibold text-text-primary block">Profile Photo</label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="btn-secondary text-xs flex items-center space-x-2 py-1.5 px-3 shadow-xs hover:border-slate-brand transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-brand" />
                        <span>Upload Photo from Device</span>
                      </button>
                      {(watchedProfilePicUrl || profile.profilePicUrl) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-xs text-terracotta hover:underline font-semibold"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    {photoError && <p className="error-text">{photoError}</p>}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      data-testid="input-photo-file"
                    />
                    <input type="hidden" {...register('profilePicUrl')} />
                  </div>
                </div>

                {/* Right Column: Bank Details Header with Underline */}
                <div className="lg:col-span-6 space-y-4 lg:border-l lg:border-blue-grey/20 lg:pl-8">
                  <div className="pb-2 border-b-2 border-blue-grey/20">
                    <h4 className="font-heading font-bold text-sm text-text-primary">
                      Bank Details
                    </h4>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Account Number */}
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">Account Number</span>
                      <span className="font-mono font-bold text-text-primary">**** **** 4892</span>
                    </div>

                    {/* Bank Name */}
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">Bank Name</span>
                      <span className="font-medium text-text-primary">HDFC Bank Ltd.</span>
                    </div>

                    {/* IFSC Code */}
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-brand">HDFC0001234</span>
                    </div>

                    {/* PAN No */}
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">PAN No</span>
                      <span className="font-mono font-bold text-text-primary">ABCDE1234F</span>
                    </div>

                    {/* UAN NO */}
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">UAN NO</span>
                      <span className="font-mono font-bold text-text-primary">100987654321</span>
                    </div>

                    {/* Emp Code */}
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">Emp Code</span>
                      <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SALARY INFO TAB ────────────────────────────────────── */}
            {activeTab === 'salary' && canViewSalary && (
              <SalaryInfoTab employeeId={employeeId} />
            )}

            {/* ── SECURITY TAB (Password Rules & Change Password) ──── */}
            {activeTab === 'security' && (
              <div className="max-w-lg space-y-6">
                <div>
                  <h4 className="font-heading font-bold text-sm text-text-primary">
                    Security & Password
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    Set a strong personal password to protect your Dayflow account.
                  </p>
                </div>

                {pwdMsg && (
                  <div className="p-3.5 rounded-xl bg-sage-light/30 border border-sage-deep/30 flex items-center space-x-2 text-xs text-sage-deep font-semibold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{pwdMsg}</span>
                  </div>
                )}

                {pwdError && (
                  <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-center space-x-2 text-xs text-terracotta animate-fadeIn">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="label text-[11px] mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input py-2 text-xs w-full font-mono bg-cream/30"
                    />
                  </div>

                  <div>
                    <label className="label text-[11px] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={`input py-2 text-xs w-full font-mono bg-cream/30 ${
                        confirmPassword && newPassword !== confirmPassword ? 'input-error' : ''
                      }`}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="error-text mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* ── Live Password Rules Checklist ── */}
                  <div className="p-4 bg-cream/60 rounded-2xl border border-blue-grey/20 space-y-2.5">
                    <span className="text-xs font-bold text-text-primary block">
                      Password Requirements:
                    </span>

                    <div className="flex items-center space-x-2">
                      {newPassword.length >= 8 ? (
                        <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-grey/40 flex-shrink-0" />
                      )}
                      <span className={newPassword.length >= 8 ? 'text-text-primary font-semibold' : 'text-text-muted'}>
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/[A-Z]/.test(newPassword) ? (
                        <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-grey/40 flex-shrink-0" />
                      )}
                      <span className={/[A-Z]/.test(newPassword) ? 'text-text-primary font-semibold' : 'text-text-muted'}>
                        At least 1 uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/[0-9]/.test(newPassword) ? (
                        <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-grey/40 flex-shrink-0" />
                      )}
                      <span className={/[0-9]/.test(newPassword) ? 'text-text-primary font-semibold' : 'text-text-muted'}>
                        At least 1 number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {newPassword.length > 0 && newPassword === confirmPassword ? (
                        <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-grey/40 flex-shrink-0" />
                      )}
                      <span className={newPassword.length > 0 && newPassword === confirmPassword ? 'text-text-primary font-semibold' : 'text-text-muted'}>
                        Passwords match
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={
                      pwdLoading ||
                      newPassword.length < 8 ||
                      !/[A-Z]/.test(newPassword) ||
                      !/[0-9]/.test(newPassword) ||
                      newPassword !== confirmPassword
                    }
                    className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{pwdLoading ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Save Bar */}
            {activeTab !== 'salary' && activeTab !== 'security' && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-blue-grey/20">
                {successMsg ? (
                  <span className="text-xs text-sage-deep font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{successMsg}</span>
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">
                    {isDirty ? 'Unsaved modifications pending' : 'All changes saved'}
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
          /* ── READ-ONLY VIEW (When accessed via employee cards) ─────── */
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
                      Skills & Expertise
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
                {/* Left Column: Personal Wireframe Fields */}
                <div className="lg:col-span-6 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Date of Birth</span>
                    <span className="font-mono text-text-primary">{formattedDob}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Residing Address</span>
                    <span className="font-medium text-text-primary">{profile.address || 'Bengaluru, India'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Nationality</span>
                    <span className="font-medium text-text-primary">Indian</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Personal Email</span>
                    <span className="font-mono text-text-primary">
                      {`${profile.firstName.toLowerCase()}.personal@dayflow.internal`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Gender</span>
                    <span className="font-medium text-text-primary">{profile.gender || 'Female'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Marital Status</span>
                    <span className="font-medium text-text-primary">{profile.maritalStatus || 'Single'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                    <span className="font-semibold text-text-primary">Date of Joining</span>
                    <span className="font-mono text-text-primary">{formattedDoj}</span>
                  </div>
                </div>

                {/* Right Column: Bank Details */}
                <div className="lg:col-span-6 space-y-4 lg:border-l lg:border-blue-grey/20 lg:pl-8">
                  <div className="pb-2 border-b-2 border-blue-grey/20">
                    <h4 className="font-heading font-bold text-sm text-text-primary">
                      Bank Details
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">Account Number</span>
                      <span className="font-mono font-bold text-text-primary">**** **** 4892</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">Bank Name</span>
                      <span className="font-medium text-text-primary">HDFC Bank Ltd.</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-brand">HDFC0001234</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">PAN No</span>
                      <span className="font-mono font-bold text-text-primary">ABCDE1234F</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">UAN NO</span>
                      <span className="font-mono font-bold text-text-primary">100987654321</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-blue-grey/20 pb-2">
                      <span className="font-semibold text-text-primary">Emp Code</span>
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
