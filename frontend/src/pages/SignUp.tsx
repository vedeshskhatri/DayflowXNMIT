import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { DayflowLogo } from '../components/DayflowLogo';
import { AuthBackground } from '../components/AuthBackground';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';

const signUpSchema = z
  .object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
    companyLogoUrl: z.string().max(5000000).optional().or(z.literal('')),
    name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Must be a valid email address'),
    phone: z
      .string()
      .refine((val) => !val || /^\d{10}$/.test(val), {
        message: 'Phone must be exactly 10 digits',
      })
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export const SignUp: React.FC = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    loginId: string;
    companyCode: string;
    employee: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      companyName: '',
      companyLogoUrl: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 5MB');
      return;
    }

    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setValue('companyLogoUrl', result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFileName(null);
    setValue('companyLogoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: SignUpFormValues) => {
    setErrorMessage(null);
    try {
      const res = await api.post<{
        message: string;
        employee: any;
        loginId: string;
      }>('/auth/signup', {
        companyName: data.companyName.trim(),
        companyLogoUrl: data.companyLogoUrl?.trim() || undefined,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      updateUser(res.data.employee);
      setSuccessData({
        loginId: res.data.loginId,
        companyCode: res.data.employee?.company?.code || 'CO',
        employee: res.data.employee,
      });
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Registration failed. Please check your details.'
      );
    }
  };

  const handleCopy = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.loginId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Subtle animated background scenes & ambient shapes */}
      <AuthBackground />

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center shadow-lg rounded-2xl ring-4 ring-white">
            <DayflowLogo size="xl" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary tracking-tight">
            Dayflow
          </h1>
          <p className="text-sm text-text-muted">
            Every workday, perfectly aligned.
          </p>
        </div>

        {/* Signup / Success Card */}
        <div className="card shadow-modal border border-blue-grey/20 bg-white">
          {successData ? (
            /* Success State with Generated Login ID details */
            <div className="space-y-6 animate-fadeIn py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center mx-auto text-sage-deep">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-primary">
                  Company & Admin Registered!
                </h2>
                <p className="text-xs text-text-muted">
                  Your organization account is active and your administrator Login ID has been generated.
                </p>
              </div>

              {/* Login ID Showcase Box */}
              <div className="bg-cream/80 border border-blue-grey/25 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Your System-Generated Login ID
                    </span>
                    <div className="text-2xl font-mono font-bold text-slate-brand mt-0.5 tracking-wide">
                      {successData.loginId}
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl border border-blue-grey/20 bg-white hover:bg-cream text-text-primary transition-colors flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
                    title="Copy Login ID"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-sage-deep" />
                        <span className="text-sage-deep">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-blue-grey" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Wireframe Format Explanation Box */}
                <div className="pt-3 border-t border-blue-grey/20 text-xs text-text-muted space-y-1.5">
                  <p className="font-semibold text-text-primary flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-brand" />
                    <span>How your Login ID was structured:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/70 p-2.5 rounded-xl border border-blue-grey/15">
                    <div><span className="font-mono font-bold text-slate-brand">{successData.companyCode}</span> → Company Code</div>
                    <div><span className="font-mono font-bold text-slate-brand">{successData.loginId.slice(successData.companyCode.length, successData.companyCode.length + 4)}</span> → Name Initials</div>
                    <div><span className="font-mono font-bold text-slate-brand">{new Date().getFullYear()}</span> → Year of Joining</div>
                    <div><span className="font-mono font-bold text-slate-brand">0001</span> → Admin Joining Serial</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-base"
              >
                <span>Enter Workspace Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Sign Up Form matching Wireframe */
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-heading font-semibold text-text-primary">
                  Sign Up Organization
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Create your company workspace and initial Administrator account.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-start space-x-3 text-terracotta text-sm animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hidden File Input for Logo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleLogoFile(e.target.files[0]);
                    }
                  }}
                />

                {/* Company Name & Upload Logo Row */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Company Name :- *</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-slate-brand hover:text-slate-brand/80 flex items-center space-x-1.5 py-1 px-2.5 rounded-lg bg-slate-brand/10 hover:bg-slate-brand/15 border border-slate-brand/20 transition-all shadow-sm"
                      title="Upload Logo File"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...register('companyName')}
                      placeholder="e.g. Odoo India or Dayflow Tech"
                      className="input pl-10 text-sm bg-cream/40"
                    />
                  </div>
                  {errors.companyName && (
                    <span className="text-[11px] text-terracotta mt-1 block">
                      {errors.companyName.message}
                    </span>
                  )}
                </div>

                {/* Company Logo Preview or Dropzone */}
                {logoPreview ? (
                  /* Uploaded Logo Preview Card */
                  <div className="p-3 rounded-xl bg-cream/80 border border-blue-grey/25 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center space-x-3">
                      <img
                        src={logoPreview}
                        alt="Company Logo Preview"
                        className="w-12 h-12 rounded-xl object-contain bg-white border border-blue-grey/20 p-1 shadow-sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-text-primary block truncate max-w-[200px]">
                          {logoFileName || 'Company Logo'}
                        </span>
                        <span className="text-[11px] text-sage-deep font-medium flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Logo attached successfully</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-xs text-text-muted hover:text-slate-brand rounded-lg hover:bg-cream"
                        title="Change Logo"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-1.5 text-text-muted hover:text-terracotta rounded-lg hover:bg-terracotta/10 transition-colors"
                        title="Remove Logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Compact Dropzone Area */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleLogoFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-blue-grey/30 hover:border-slate-brand/50 rounded-xl p-3 text-center cursor-pointer bg-cream/20 hover:bg-cream/50 transition-all group"
                  >
                    <div className="flex items-center justify-center space-x-2 text-xs text-text-muted group-hover:text-slate-brand">
                      <ImageIcon className="w-4 h-4 text-blue-grey group-hover:text-slate-brand" />
                      <span className="font-medium">
                        Click or drag & drop company logo (PNG, JPG, SVG, WebP)
                      </span>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="label">Name :- *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. John Doe"
                      className="input pl-10 text-sm bg-cream/40"
                    />
                  </div>
                  {errors.name && (
                    <span className="text-[11px] text-terracotta mt-1 block">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email :- *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="john@company.com"
                        className="input pl-10 text-sm bg-cream/40"
                      />
                    </div>
                    {errors.email && (
                      <span className="text-[11px] text-terracotta mt-1 block">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="label">Phone :-</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        {...register('phone')}
                        placeholder="9876543210"
                        className="input pl-10 text-sm bg-cream/40"
                      />
                    </div>
                    {errors.phone && (
                      <span className="text-[11px] text-terracotta mt-1 block">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Password & Confirm Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Password :- *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="••••••••"
                        className="input pl-10 pr-9 text-sm bg-cream/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-grey hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-[11px] text-terracotta mt-1 block">
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="label">Confirm Password :- *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        placeholder="••••••••"
                        className="input pl-10 pr-9 text-sm bg-cream/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-grey hover:text-text-primary"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="text-[11px] text-terracotta mt-1 block">
                        {errors.confirmPassword.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-base"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign Up</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Wireframe link: Already have an account ? Sign In */}
              <div className="mt-5 text-center">
                <p className="text-xs text-text-muted">
                  Already have an account ?{' '}
                  <Link to="/login" className="font-semibold text-slate-brand hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info matching wireframe note */}
        <p className="text-center text-xs text-text-muted">
          Company admin credentials generate a unique <span className="font-semibold text-text-primary">Login ID</span> (e.g. OIJODO20260001).
          <br />
          Subsequent employee accounts are created securely from the HR dashboard.
        </p>
      </div>
    </div>
  );
};
