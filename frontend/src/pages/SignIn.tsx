import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
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
  const fillCredentials = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-cream-light flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Animated background scenes & ambient shapes */}
      <AuthBackground />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center shadow-elevated rounded-3xl ring-4 ring-white/80 p-1 bg-white">
            <DayflowLogo size="xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-navy-dark tracking-tight">
            Dayflow
          </h1>
          <p className="text-sm text-text-muted font-medium">
            Every workday, perfectly aligned.
          </p>
        </div>

        {/* Login Card */}
        <div className="card shadow-modal border border-navy/15 bg-white rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-navy/10">
            <h2 className="text-xl font-heading font-bold text-navy-dark">
              Sign In
            </h2>
            <span className="text-xs font-bold text-copper-dark bg-copper-muted px-2.5 py-1 rounded-full border border-copper/30 font-mono">
              Enterprise HRMS
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-terracotta-light border border-terracotta/20 flex items-start space-x-3 text-terracotta text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier Field */}
            <div>
              <label htmlFor="identifier" className="label">
                Login ID or Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. DXADMI20260001 or admin@dayflow.dev"
                  className="input pl-10"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5 font-mono">
                Format: <code className="bg-cream px-1.5 py-0.5 rounded text-navy-dark font-bold font-mono">[Company][Initials][Year][Serial]</code>
              </p>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-navy/40 hover:text-navy transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-navy w-full py-3 text-sm flex items-center justify-center space-x-2 group cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating…</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4 text-copper-bright group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Bar */}
          <div className="mt-6 pt-5 border-t border-navy/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-copper uppercase tracking-wider flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-copper" />
                Demo Credentials
              </span>
              <span className="text-[10px] text-text-muted">Click to auto-fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('DXADMI20260001', 'Admin@123')}
                className="p-2.5 text-left rounded-xl bg-cream/70 hover:bg-cream border border-navy/10 hover:border-copper/40 transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-navy-dark">Admin Mishra</span>
                  <span className="text-[10px] font-bold text-copper bg-copper-muted px-1.5 py-0.2 rounded">HR</span>
                </div>
                <div className="text-[10px] text-text-muted font-mono truncate">DXADMI20260001</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('DXPRSH20260002', 'Dayflow@123')}
                className="p-2.5 text-left rounded-xl bg-cream/70 hover:bg-cream border border-navy/10 hover:border-copper/40 transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-navy-dark">Priya Sharma</span>
                  <span className="text-[10px] font-bold text-navy bg-navy/10 px-1.5 py-0.2 rounded">Dev</span>
                </div>
                <div className="text-[10px] text-text-muted font-mono truncate">DXPRSH20260002</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-text-muted">
              Want to set up a new company?{' '}
              <Link to="/signup" className="text-copper font-bold hover:underline">
                Create Workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
