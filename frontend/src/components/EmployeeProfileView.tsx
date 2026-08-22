import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TagInput } from './TagInput';
import { SalaryInfoTab } from './SalaryInfoTab';
import { User, Shield, Briefcase, CheckCircle2 } from 'lucide-react';

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
  bio:            z.string().max(2000).optional(),
  jobLove:        z.string().max(1000).optional(),
  interests:      z.string().max(1000).optional(),
  address:        z.string().max(500).optional(),
  phone:          z
    .string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  profilePicUrl:  z.string().url('Must be a valid URL').optional().or(z.literal('')),
  skills:         z.array(z.string()).optional(),
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
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SelfEditFormValues>({
    resolver: zodResolver(selfEditSchema),
    defaultValues: {
      bio:            profile?.bio ?? '',
      jobLove:        profile?.jobLove ?? '',
      interests:      profile?.interests ?? '',
      address:        profile?.address ?? '',
      phone:          profile?.phone ?? '',
      profilePicUrl:  profile?.profilePicUrl ?? '',
      skills:         profile?.skills?.map((s) => s.name) ?? [],
      certifications: profile?.certifications?.map((c) => c.name) ?? [],
    },
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        bio:            profile.bio ?? '',
        jobLove:        profile.jobLove ?? '',
        interests:      profile.interests ?? '',
        address:        profile.address ?? '',
        phone:          profile.phone ?? '',
        profilePicUrl:  profile.profilePicUrl ?? '',
        skills:         profile.skills?.map((s) => s.name) ?? [],
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="card h-40 animate-pulse bg-white/60 border border-blue-grey/10" />
        <div className="card h-64 animate-pulse bg-white/60 border border-blue-grey/10" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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
    { id: 'about', label: 'About' },
    { id: 'private', label: 'Private Info' },
    ...(isAdmin ? [{ id: 'salary' as Tab, label: 'Salary Info' }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header Profile Summary */}
      <div className="card border border-blue-grey/20 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-r from-white via-white to-cream shadow-sm">
        {profile.profilePicUrl ? (
          <img
            src={profile.profilePicUrl}
            alt={fullName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-grey/20 shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-brand/10 text-slate-brand font-heading font-bold text-2xl flex items-center justify-center ring-4 ring-blue-grey/20 shadow-sm flex-shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-2xl font-heading font-bold text-text-primary" data-testid="profile-name">
              {fullName}
            </h1>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sage-light/40 text-text-primary border border-sage-light capitalize">
              {profile.role.toLowerCase().replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-text-muted font-medium">
            {profile.jobTitle || 'Team Member'} &bull; {profile.department || 'Dayflow'}
          </p>

          <p className="text-xs text-text-muted font-mono pt-1">
            Login ID: <span className="text-slate-brand font-semibold">{profile.loginId}</span> &bull; Work Email: {profile.email}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1.5 p-1.5 bg-white rounded-xl border border-blue-grey/20 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-button-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-heading font-semibold rounded-lg transition-all ${
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
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <label className="label">Bio</label>
                  <textarea
                    {...register('bio')}
                    data-testid="input-bio"
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell your team about yourself..."
                  />
                  {errors.bio && <p className="error-text">{errors.bio.message}</p>}
                </div>

                <div>
                  <label className="label">What I Love About My Job</label>
                  <textarea
                    {...register('jobLove')}
                    data-testid="input-joblove"
                    rows={3}
                    className="input resize-none"
                    placeholder="What excites you about work?"
                  />
                  {errors.jobLove && <p className="error-text">{errors.jobLove.message}</p>}
                </div>

                <div>
                  <label className="label">Interests & Hobbies</label>
                  <textarea
                    {...register('interests')}
                    data-testid="input-interests"
                    rows={2}
                    className="input resize-none"
                    placeholder="Hiking, reading, gaming..."
                  />
                  {errors.interests && <p className="error-text">{errors.interests.message}</p>}
                </div>

                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      label="Skills"
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="certifications"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      label="Certifications"
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            {activeTab === 'private' && (
              <div className="space-y-6">
                {/* Read-only company employment details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-cream/70 rounded-xl border border-blue-grey/20 text-xs">
                  <div>
                    <span className="text-text-muted block">Date of Birth</span>
                    <span className="font-medium text-text-primary mt-0.5 block">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Date of Joining</span>
                    <span className="font-medium text-text-primary mt-0.5 block">
                      {new Date(profile.dateOfJoining).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Gender</span>
                    <span className="font-medium text-text-primary mt-0.5 block">{profile.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Marital Status</span>
                    <span className="font-medium text-text-primary mt-0.5 block">{profile.maritalStatus || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Department</span>
                    <span className="font-medium text-text-primary mt-0.5 block">{profile.department || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Job Title</span>
                    <span className="font-medium text-text-primary mt-0.5 block">{profile.jobTitle || '—'}</span>
                  </div>
                </div>

                {/* Editable self contact fields */}
                <div>
                  <label className="label">Phone Number (10 digits)</label>
                  <input
                    {...register('phone')}
                    data-testid="input-phone"
                    type="tel"
                    className={`input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="e.g. 9876543210"
                  />
                  {errors.phone && <p data-testid="error-phone" className="error-text">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="label">Residential Address</label>
                  <textarea
                    {...register('address')}
                    data-testid="input-address"
                    rows={3}
                    className="input resize-none"
                    placeholder="Enter your home address..."
                  />
                  {errors.address && <p className="error-text">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="label">Profile Picture URL</label>
                  <input
                    {...register('profilePicUrl')}
                    data-testid="input-profilepic"
                    type="url"
                    className={`input ${errors.profilePicUrl ? 'input-error' : ''}`}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.profilePicUrl && <p className="error-text">{errors.profilePicUrl.message}</p>}
                </div>
              </div>
            )}

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
                  className="btn-primary text-xs py-2 px-6"
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            )}
          </form>
        ) : (
          <div data-testid="profile-readonly-view" className="space-y-6">
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    Bio
                  </span>
                  <p className="text-sm text-text-primary leading-relaxed bg-cream/40 p-4 rounded-xl border border-blue-grey/15">
                    {profile.bio || <span className="text-text-muted italic">No bio provided.</span>}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    What I Love About My Job
                  </span>
                  <p className="text-sm text-text-primary leading-relaxed bg-cream/40 p-4 rounded-xl border border-blue-grey/15">
                    {profile.jobLove || <span className="text-text-muted italic">Not specified.</span>}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
                    Interests & Hobbies
                  </span>
                  <p className="text-sm text-text-primary leading-relaxed bg-cream/40 p-4 rounded-xl border border-blue-grey/15">
                    {profile.interests || <span className="text-text-muted italic">None listed.</span>}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.length > 0 ? (
                      profile.skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-sage-light/40 text-text-primary border border-sage-light"
                        >
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">None added</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Certifications
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications?.length > 0 ? (
                      profile.certifications.map((c, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-blue-grey/20 text-slate-brand border border-blue-grey/30"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">None added</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'private' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20">
                  <span className="text-xs text-text-muted block">Date of Birth</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20">
                  <span className="text-xs text-text-muted block">Date of Joining</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {new Date(profile.dateOfJoining).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20">
                  <span className="text-xs text-text-muted block">Phone</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {profile.phone || '—'}
                  </span>
                </div>
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20">
                  <span className="text-xs text-text-muted block">Gender</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {profile.gender || '—'}
                  </span>
                </div>
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20">
                  <span className="text-xs text-text-muted block">Marital Status</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {profile.maritalStatus || '—'}
                  </span>
                </div>
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20">
                  <span className="text-xs text-text-muted block">Department</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {profile.department || '—'}
                  </span>
                </div>
                <div className="p-4 bg-cream/60 rounded-xl border border-blue-grey/20 sm:col-span-2">
                  <span className="text-xs text-text-muted block">Residential Address</span>
                  <span className="text-sm font-medium text-text-primary mt-1 block">
                    {profile.address || '—'}
                  </span>
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
