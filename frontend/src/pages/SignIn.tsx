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
        navigate('/');
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
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Subtle animated background scenes & ambient shapes */}
      <AuthBackground />

      <div className="w-full max-w-md space-y-8 relative z-10">
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

        {/* Login Card */}
        <div className="card shadow-modal border border-blue-grey/20 bg-white">
          <h2 className="text-xl font-heading font-semibold text-text-primary mb-6">
            Sign In to your account
          </h2>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-start space-x-3 text-terracotta text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier Field */}
            <div>
              <label htmlFor="identifier" className="label">
                Login ID or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. DXADMI20260001 or DXPRSH20260002"
                  className="input pl-10"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">
                Format: <code className="bg-cream px-1.5 py-0.5 rounded text-slate-brand font-mono">[Company][Initials][Year][Serial]</code>
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-grey hover:text-text-primary transition-colors"
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
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-base"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Wireframe Link: Don't have an Account? Sign Up */}
            <div className="mt-4 text-center">
              <p className="text-xs text-text-muted">
                Don't have an Account?{' '}
                <Link to="/signup" className="font-semibold text-slate-brand hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>

          {/* Quick Fill Demo helper pills */}
          <div className="mt-6 pt-5 border-t border-blue-grey/20">
            <div className="flex items-center space-x-1.5 text-xs text-text-muted font-medium mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-brand" />
              <span>Demo Quick Login:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('DXADMI20260001', 'Admin@123')}
                className="text-left p-2 rounded-lg bg-cream/70 hover:bg-cream border border-blue-grey/20 transition-all text-xs"
              >
                <span className="font-semibold block text-slate-brand">Admin</span>
                <span className="text-[11px] text-text-muted">DXADMI20260001</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('DXPRSH20260002', 'Dayflow@123')}
                className="text-left p-2 rounded-lg bg-cream/70 hover:bg-cream border border-blue-grey/20 transition-all text-xs"
              >
                <span className="font-semibold block text-sage-deep">Employee</span>
                <span className="text-[11px] text-text-muted">DXPRSH20260002</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-text-muted">
          Employee accounts are provisioned exclusively by HR.
          <br />
          Self-registration is disabled for enterprise security.
        </p>
      </div>
    </div>
  );
};
