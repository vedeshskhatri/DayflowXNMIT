import React, { useState, useRef } from 'react';
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
  Camera,
  Upload,
  CreditCard,
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
  profilePicUrl: z.string().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

type SelfEditFormValues = z.infer<typeof selfEditSchema>;

type Tab = 'about' | 'private' | 'salary';

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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [successMsg, setSuccessMsg] = useState('');

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

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
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

  const watchedProfilePicUrl = watch('profilePicUrl');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo size must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setValue('profilePicUrl', result, { shouldDirty: true, shouldValidate: true });
      setPhotoError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setValue('profilePicUrl', '', { shouldDirty: true, shouldValidate: true });
    if (photoInputRef.current) photoInputRef.current.value = '';
    setPhotoError(null);
  };

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
    editable ||
    (user && profile && (user.id === profile.id || user.loginId === profile.loginId)) ||
    (user && (user.id === employeeId || user.loginId === employeeId))
  );
  const canViewPrivateInfo = Boolean(isAdmin || isOwnProfile);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'about', label: 'Resume / About' },
    ...(canViewPrivateInfo ? [{ id: 'private' as Tab, label: 'Private Info' }] : []),
    ...(isAdmin ? [{ id: 'salary' as Tab, label: 'Salary Info' }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header Profile Summary matching Wireframe */}
      <div className="card border border-blue-grey/20 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 bg-gradient-to-r from-white via-white to-cream shadow-sm">
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

        {/* Header Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-heading font-bold text-text-primary" data-testid="profile-name">
                {fullName}
              </h1>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sage-light/40 text-sage-deep border border-sage-deep/20 uppercase tracking-wide">
                {profile.role.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-xs text-text-muted">
              <p>
                <span className="font-semibold text-text-primary">Login ID :-</span>{' '}
                <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
              </p>
              <p>
                <span className="font-semibold text-text-primary">Email :-</span> {profile.email}
              </p>
              {canViewPrivateInfo && profile.phone && (
                <p>
                  <span className="font-semibold text-text-primary">Mobile :-</span> {profile.phone}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-text-muted space-y-1 md:border-l md:border-blue-grey/20 md:pl-5">
            <p>
              <span className="font-semibold text-text-primary">Company :-</span> Dayflow HRMS
            </p>
            <p>
              <span className="font-semibold text-text-primary">Department :-</span> {profile.department || 'Engineering'}
            </p>
            <p>
              <span className="font-semibold text-text-primary">Designation :-</span> {profile.jobTitle || 'Team Member'}
            </p>
            <p>
              <span className="font-semibold text-text-primary">Location :-</span> India (HQ)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
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

      {/* Tab Content Box */}
      <div className="card border border-blue-grey/20 p-6">
        {editable ? (
          <form onSubmit={handleSubmit(onSubmit)} data-testid="profile-editable-form">
            {/* ── ABOUT TAB (2-Column Grid) ────────────────────────── */}
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Bio, Love, Interests */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <label className="label text-xs font-bold text-text-primary">About :-</label>
                    <textarea
                      {...register('bio')}
                      data-testid="input-bio"
                      rows={4}
                      className="input resize-none text-xs bg-cream/30"
                      placeholder="Share a short bio with your colleagues..."
                    />
                    {errors.bio && <p className="error-text">{errors.bio.message}</p>}
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-text-primary">What I love about my job :-</label>
                    <textarea
                      {...register('jobLove')}
                      data-testid="input-joblove"
                      rows={3}
                      className="input resize-none text-xs bg-cream/30"
                      placeholder="What excites and inspires you at Dayflow?"
                    />
                    {errors.jobLove && <p className="error-text">{errors.jobLove.message}</p>}
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-text-primary">My interests and hobbies :-</label>
                    <textarea
                      {...register('interests')}
                      data-testid="input-interests"
                      rows={2}
                      className="input resize-none text-xs bg-cream/30"
                      placeholder="Hiking, reading, open source, gaming..."
                    />
                    {errors.interests && <p className="error-text">{errors.interests.message}</p>}
                  </div>
                </div>

                {/* Right Column: Skills & Certifications */}
                <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-blue-grey/20 lg:pl-6">
                  <div className="p-4 rounded-2xl bg-cream/40 border border-blue-grey/20">
                    <Controller
                      name="skills"
                      control={control}
                      render={({ field }) => (
                        <TagInput
                          label="Skills & Expertise"
                          value={field.value ?? []}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-cream/40 border border-blue-grey/20">
                    <Controller
                      name="certifications"
                      control={control}
                      render={({ field }) => (
                        <TagInput
                          label="Certifications & Badges"
                          value={field.value ?? []}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── PRIVATE INFO TAB (2-Column Grid with Bank Details) ─── */}
            {activeTab === 'private' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Personal & Employment */}
                <div className="lg:col-span-6 space-y-4">
                  <h4 className="font-heading font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Personal & Contact Details
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="text-text-muted">Date of Birth</span>
                      <span className="font-medium text-text-primary">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '15 Aug 1996'}
                      </span>
                    </div>

                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="text-text-muted">Date of Joining</span>
                      <span className="font-medium text-text-primary">
                        {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="text-text-muted">Nationality</span>
                      <span className="font-medium text-text-primary">Indian</span>
                    </div>

                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="text-text-muted">Gender</span>
                      <span className="font-medium text-text-primary">{profile.gender || 'Not specified'}</span>
                    </div>

                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between items-center">
                      <span className="text-text-muted">Marital Status</span>
                      <span className="font-medium text-text-primary">{profile.maritalStatus || 'Single'}</span>
                    </div>

                    <div>
                      <label className="label text-[11px] mb-1">Phone Number (10 digits) :-</label>
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
                      <label className="label text-[11px] mb-1">Residing Address :-</label>
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
                      <label className="label text-[11px] mb-1">Profile Photo :-</label>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="btn-secondary text-xs flex items-center space-x-2 py-2 px-3.5 shadow-xs hover:border-slate-brand transition-all"
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
                      {photoError && <p className="error-text mt-1">{photoError}</p>}
                      <p className="text-[10px] text-text-muted mt-1">
                        Supports JPG, PNG, WEBP (Max 5MB)
                      </p>
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
                </div>

                {/* Right Column: Bank & Statutory Details */}
                <div className="lg:col-span-6 space-y-4 lg:border-l lg:border-blue-grey/20 lg:pl-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-slate-brand" />
                    <h4 className="font-heading font-semibold text-xs text-text-primary uppercase tracking-wider">
                      Bank & Statutory Details
                    </h4>
                  </div>

                  <div className="p-5 rounded-2xl bg-cream/40 border border-blue-grey/20 space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">Account Number</span>
                      <span className="font-mono font-bold text-text-primary">**** **** 4892</span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">Bank Name</span>
                      <span className="font-medium text-text-primary">HDFC Bank Ltd.</span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-brand">HDFC0001234</span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">PAN Number</span>
                      <span className="font-mono font-bold text-text-primary">ABCDE1234F</span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">UAN Number</span>
                      <span className="font-mono font-bold text-text-primary">100987654321</span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-text-muted">Employee Code</span>
                      <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SALARY INFO TAB (Admin Only) ───────────────────────── */}
            {activeTab === 'salary' && isAdmin && (
              <SalaryInfoTab employeeId={employeeId} />
            )}

            {/* Save Bar */}
            {activeTab !== 'salary' && (
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-3">
                  <h4 className="font-heading font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Personal & Contact Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Date of Birth</span>
                      <span className="font-medium text-text-primary">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '15 Aug 1996'}
                      </span>
                    </div>
                    <div className="p-3 bg-cream/50 rounded-xl border border-blue-grey/20 flex justify-between">
                      <span className="text-text-muted">Date of Joining</span>
                      <span className="font-medium text-text-primary">
                        {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '—'}
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

                <div className="lg:col-span-6 space-y-3 lg:border-l lg:border-blue-grey/20 lg:pl-6">
                  <h4 className="font-heading font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Bank & Statutory Details
                  </h4>
                  <div className="p-4 rounded-2xl bg-cream/40 border border-blue-grey/20 space-y-2 text-xs">
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">Bank Name</span>
                      <span className="font-medium text-text-primary">HDFC Bank Ltd.</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-blue-grey/15">
                      <span className="text-text-muted">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-brand">HDFC0001234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Employee Code</span>
                      <span className="font-mono font-bold text-slate-brand">{profile.loginId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'salary' && isAdmin && (
              <SalaryInfoTab employeeId={employeeId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
