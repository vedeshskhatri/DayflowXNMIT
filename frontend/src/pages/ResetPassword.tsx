import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ResetPasswordResponse } from '../lib/api';
import { Lock, CheckCircle2, Circle, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { AuthBackground } from '../components/AuthBackground';

export const ResetPassword: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage('Please satisfy all password security requirements.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post<ResetPasswordResponse>('/auth/reset-password', {
        newPassword,
      });

      if (user) {
        updateUser({
          ...user,
          mustResetPwd: false,
        });
      }

      navigate('/employees');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMessage(
        e.response?.data?.error || 'Failed to update password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Subtle animated background scenes & ambient shapes */}
      <AuthBackground />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-brand text-white font-heading font-bold text-2xl shadow-lg ring-4 ring-white">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
            Set Your New Password
          </h1>
          <p className="text-sm text-text-muted">
            For security, please set a strong personal password for your Dayflow account.
          </p>
        </div>

        <div className="card shadow-modal border border-blue-grey/20 bg-white">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/20 flex items-start space-x-3 text-terracotta text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="label" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-grey">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className={`input pl-10 ${confirmPassword && !passwordsMatch ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="error-text">Passwords do not match</p>
              )}
            </div>

            {/* Live Criteria Checklist */}
            <div className="p-3.5 bg-cream/60 rounded-xl space-y-2 border border-blue-grey/20">
              <div className="text-xs font-semibold text-text-primary mb-1">
                Password Requirements:
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {hasMinLength ? (
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-blue-grey flex-shrink-0" />
                )}
                <span className={hasMinLength ? 'text-text-primary font-medium' : 'text-text-muted'}>
                  At least 8 characters
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {hasUppercase ? (
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-blue-grey flex-shrink-0" />
                )}
                <span className={hasUppercase ? 'text-text-primary font-medium' : 'text-text-muted'}>
                  At least 1 uppercase letter (A-Z)
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {hasNumber ? (
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-blue-grey flex-shrink-0" />
                )}
                <span className={hasNumber ? 'text-text-primary font-medium' : 'text-text-muted'}>
                  At least 1 number (0-9)
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {passwordsMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-blue-grey flex-shrink-0" />
                )}
                <span className={passwordsMatch ? 'text-text-primary font-medium' : 'text-text-muted'}>
                  Passwords match
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-base"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save Password & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
