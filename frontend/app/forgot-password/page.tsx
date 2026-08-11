'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Phone,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { API, API_BASE_URL } from '@/lib/api';
import { PasswordInput } from '@/components/platform/ui';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard Steps: 1: Lookup, 2: Choose Channel, 3: Verify OTP, 4: Reset Password, 5: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    masked_email?: string | null;
    masked_phone?: string | null;
    has_email?: boolean;
    has_phone?: boolean;
  } | null>(null);

  const [selectedChannel, setSelectedChannel] = useState<'email' | 'phone'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  /* ── Step 1: Lookup Account ── */
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}${API.AUTH.FORGOT_PASSWORD_LOOKUP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'No account found matching this identifier.');
      }

      setLookupResult(data);
      if (data.has_email) {
        setSelectedChannel('email');
      } else if (data.has_phone) {
        setSelectedChannel('phone');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Account lookup failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Request Recovery OTP ── */
  const handleRequestOTP = async (channelOverride?: 'email' | 'phone') => {
    const channelToUse = channelOverride || selectedChannel;
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}${API.AUTH.FORGOT_PASSWORD_REQUEST_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          channel: channelToUse,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to send recovery OTP');
      }

      setInfoMessage(data.message || `Recovery OTP sent to your ${channelToUse}.`);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Verify Recovery OTP ── */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}${API.AUTH.FORGOT_PASSWORD_VERIFY_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          channel: selectedChannel,
          otp_code: otpCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Invalid verification code');
      }

      setResetToken(data.reset_token);
      setError('');
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 4: Reset Password ── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}${API.AUTH.FORGOT_PASSWORD_RESET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          reset_token: resetToken,
          new_password: newPassword,
          new_password_confirm: newPasswordConfirm,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Password reset failed');
      }

      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0e2340] text-white shadow-lg mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AntLegal</h2>
        <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">Account Password Recovery</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          
          {/* Progress Indicator */}
          {step < 5 && (
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s
                        ? 'bg-[#0e2340] text-white ring-4 ring-[#0e2340]/10 scale-110'
                        : step > s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step > s ? '✓' : s}
                  </div>
                  {s < 4 && (
                    <div className={`w-8 sm:w-12 h-0.5 rounded-full ${step > s ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 p-3.5 bg-purple-50 border border-purple-100 rounded-2xl text-xs font-semibold text-purple-700 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: Account Lookup */}
          {step === 1 && (
            <form onSubmit={handleLookup} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Find your account</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Enter your email address or phone number linked to your AntLegal account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. name@example.com or 9876543210"
                    className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#0e2340] outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full h-11 bg-[#0e2340] text-white text-sm font-bold rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0e2340]/10 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Channel Choice & Send OTP */}
          {step === 2 && lookupResult && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Choose recovery channel</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Where should we send your 6-digit recovery OTP?
                </p>
              </div>

              <div className="space-y-3">
                {lookupResult.has_email && (
                  <label
                    onClick={() => setSelectedChannel('email')}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedChannel === 'email'
                        ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedChannel === 'email' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">Send OTP to Email</p>
                      <p className="text-xs text-slate-500 font-semibold truncate">{lookupResult.masked_email}</p>
                    </div>
                    <input type="radio" checked={selectedChannel === 'email'} onChange={() => setSelectedChannel('email')} className="accent-purple-600" />
                  </label>
                )}

                {lookupResult.has_phone && (
                  <label
                    onClick={() => setSelectedChannel('phone')}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedChannel === 'phone'
                        ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedChannel === 'phone' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">Send OTP to Phone SMS</p>
                      <p className="text-xs text-slate-500 font-semibold truncate">{lookupResult.masked_phone}</p>
                    </div>
                    <input type="radio" checked={selectedChannel === 'phone'} onChange={() => setSelectedChannel('phone')} className="accent-purple-600" />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestOTP()}
                  disabled={loading}
                  className="flex-1 h-11 bg-[#0e2340] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0e2340]/10 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? 'Sending...' : 'Send Recovery OTP'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OTP Verification */}
          {step === 3 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enter verification code</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Please enter the 6-digit recovery OTP sent to your {selectedChannel}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 999999"
                  className="w-full text-center text-2xl font-bold tracking-[0.3em] h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none transition-all text-slate-900"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium text-center">
                  Test Code: <span className="font-bold text-purple-700">999999</span>
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRequestOTP()}
                  disabled={loading}
                  className="flex-1 h-11 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className="flex-1 h-11 bg-[#0e2340] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0e2340]/10 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Set New Password */}
          {step === 4 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Set new password</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Create a new password for your account (minimum 8 characters).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    New Password
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={setNewPassword}
                    required
                    placeholder="Enter new password"
                    className="!h-11 !rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    value={newPasswordConfirm}
                    onChange={setNewPasswordConfirm}
                    required
                    placeholder="Confirm new password"
                    className="!h-11 !rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !newPasswordConfirm}
                className="w-full h-11 bg-[#0e2340] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0e2340]/10 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && (
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Password Reset Successful!</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Your password has been updated. You can now log into your account using your new credentials.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full h-11 bg-[#0e2340] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0e2340]/10"
              >
                Go to Login Page
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
