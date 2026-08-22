import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DayflowLogo } from '../components/DayflowLogo';
import { AuthBackground } from '../components/AuthBackground';

export const SignIn: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<'admin' | 'employee' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Login ID or Email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { mustResetPwd } = await login(identifier.trim(), password);

      if (mustResetPwd) {
        navigate('/reset-password');
      } else {
        navigate('/employees');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMessage(
        e.response?.data?.error || 'Invalid credentials. Please check your Login ID and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for demo ease
  const fillCredentials = (role: 'admin' | 'employee', id: string, pass: string) => {
    setSelectedDemoRole(role);
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden font-sans">
      {/* Ambient background decoration */}
      <AuthBackground />

      <div className="w-full max-w-4xl relative z-10 my-auto">
        {/* Main Split Authentication Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-grey/25 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
          
          {/* Left Column: Sign In Form (7 cols on lg) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <Link to="/" className="inline-block group" aria-label="Dayflow Home">
                  <DayflowLogo size="md" showText />
                </Link>
                <span className="hidden sm:inline-flex items-center space-x-1.5 text-[11px] font-semibold text-slate-brand bg-slate-brand/10 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enterprise HRMS</span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  Enter your credentials to access live presence, leave approvals, and payroll.
                </p>
              </div>

              {/* Demo Quick Select Pills */}
              <div className="bg-cream/40 border border-blue-grey/20 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                  <span className="font-semibold text-text-primary flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-brand" />
                    <span>Demo 1-Click Fill:</span>
                  </span>
                  <span className="text-[10px]">Click to auto-populate</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin', 'DXADMI20260001', 'Admin@123')}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      selectedDemoRole === 'admin'
                        ? 'bg-white border-slate-brand shadow-xs ring-2 ring-slate-brand/20'
                        : 'bg-white/70 hover:bg-white border-blue-grey/20 hover:border-blue-grey/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-heading font-bold text-xs text-slate-brand">Admin Portal</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-slate-brand/10 text-slate-brand rounded">
                        Full Access
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-text-muted truncate">DXADMI20260001</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('employee', 'DXPRSH20260002', 'Dayflow@123')}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      selectedDemoRole === 'employee'
                        ? 'bg-white border-sage-deep shadow-xs ring-2 ring-sage-deep/20'
                        : 'bg-white/70 hover:bg-white border-blue-grey/20 hover:border-blue-grey/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-heading font-bold text-xs text-sage-deep">Employee View</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-sage-light/30 text-sage-deep rounded">
                        Member
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-text-muted truncate">DXPRSH20260002</p>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-start space-x-3 text-terracotta text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="identifier" className="text-xs font-semibold text-text-primary">
                      Login ID or Email
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setSelectedDemoRole(null);
                      }}
                      placeholder="e.g. DXADMI20260001"
                      className="input pl-10 text-xs sm:text-sm py-2.5 rounded-xl bg-white border-blue-grey/30 focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20 transition-all"
                      autoComplete="username"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="text-xs font-semibold text-text-primary">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setSelectedDemoRole(null);
                      }}
                      placeholder="••••••••"
                      className="input pl-10 pr-10 text-xs sm:text-sm py-2.5 rounded-xl bg-white border-blue-grey/30 focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20 transition-all"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-brand hover:bg-slate-brand/90 text-white font-heading font-semibold text-sm w-full py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 group disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Link to Sign Up */}
            <div className="pt-4 border-t border-blue-grey/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
              <span>Don&apos;t have an organization workspace?</span>
              <Link
                to="/signup"
                className="font-semibold text-slate-brand hover:underline inline-flex items-center space-x-1"
              >
                <span>Sign Up Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live Workspace Pulse & Platform Highlights (5 cols on lg) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-cream/90 via-cream/50 to-slate-brand/10 p-8 flex-col justify-between border-l border-blue-grey/20 relative">
            {/* Top Widget: Live Presence Feed Simulation */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-blue-grey/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-grey/15">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-light opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-light" />
                    </span>
                    <span className="text-xs font-heading font-bold text-text-primary">
                      Live Workplace Pulse
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">Today</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-cream/40 p-2 rounded-xl border border-blue-grey/15">
                    <p className="text-[10px] text-text-muted">Present</p>
                    <p className="text-sm font-heading font-bold text-sage-deep">18</p>
                  </div>
                  <div className="bg-cream/40 p-2 rounded-xl border border-blue-grey/15">
                    <p className="text-[10px] text-text-muted">On Leave</p>
                    <p className="text-sm font-heading font-bold text-slate-brand">2</p>
                  </div>
                  <div className="bg-cream/40 p-2 rounded-xl border border-blue-grey/15">
                    <p className="text-[10px] text-text-muted">Absent</p>
                    <p className="text-sm font-heading font-bold text-terracotta">4</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-text-muted bg-white p-2 rounded-lg border border-blue-grey/10">
                  <Clock className="w-3.5 h-3.5 text-slate-brand flex-shrink-0" />
                  <span className="truncate">Shift started on schedule • 09:00 AM</span>
                </div>
              </div>

              {/* Platform Values Callouts */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-start space-x-2.5 text-xs text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>1-Tap Attendance:</strong> Real-time geo and IP-gated check-ins.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Payroll Harmony:</strong> Automated wage component calculation.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Role Governance:</strong> Isolated admin and employee views.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Security Footer Pill */}
            <div className="pt-6 border-t border-blue-grey/20 flex items-center justify-between text-[11px] text-text-muted">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-brand" />
                <span>256-bit SSL Protected</span>
              </div>
              <span className="font-mono text-[10px]">v1.4.0</span>
            </div>
          </div>
        </div>

        {/* Outer Help Note */}
        <p className="text-center text-xs text-text-muted mt-6">
          Dayflow Enterprise HRMS &copy; 2026. Every workday, perfectly aligned.
        </p>
      </div>
    </div>
  );
};
