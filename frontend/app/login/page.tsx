"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Scale,
  AlertCircle,
  Phone,
  ArrowRight,
  Fingerprint,
  ShieldCheck,
  Clock,
  UserCheck
} from 'lucide-react';

import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { PasswordInput } from '@/components/platform/ui';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'code'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const isEmailInput = formData.email.includes('@');

  const getDashboardRoute = (role: string): string => {
    const normalizedRole = role?.toLowerCase();
    switch (normalizedRole) {
      case 'platform_owner': return '/platform-owner/dashboard';
      case 'partner_manager': return '/partner-manager/dashboard';
      case 'super_admin':
      case 'firm_owner': return '/super-admin/dashboard';
      case 'admin':
      case 'firm_admin': return '/firm-admin/dashboard';
      case 'advocate':
      case 'lawyer': return '/advocate/dashboard';
      case 'paralegal': return '/paralegal/dashboard';
      case 'client': return '/client/dashboard';
      default: return '/platform-owner/dashboard';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginMode === 'password') {
        const payload = {
          username: formData.email,
          password: formData.password
        };

        const response = await customFetch(API.AUTH.LOGIN_USERNAME_PASSWORD, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          let errorMsg = data.detail || data.message;
          if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
            errorMsg = data.non_field_errors.includes("User account is inactive")
              ? "Your account is inactive please contact your admin for details"
              : data.non_field_errors[0];
          }
          throw new Error(errorMsg || 'Login failed. Please check your credentials.');
        }

        if (data.token) localStorage.setItem("auth_token", data.token);
        if (data.user) localStorage.setItem("user_details", JSON.stringify(data.user));

        const targetRoute = getDashboardRoute(data.user?.user_type);
        router.push(targetRoute);

      } else if (loginMode === 'code') {
        if (!otpSent) {
          if (isEmailInput) {
            const response = await customFetch(API.AUTH.REQUEST_EMAIL_OTP, {
              method: 'POST',
              body: JSON.stringify({ email: formData.email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || data.message || 'Failed to send OTP to email.');
          } else {
            const response = await customFetch(API.AUTH.REQUEST_PHONE_OTP, {
              method: 'POST',
              body: JSON.stringify({ phone_number: formData.email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || data.message || 'Failed to send OTP to phone.');
          }
          setOtpSent(true);
        } else {
          const payload = isEmailInput
            ? { email: formData.email, otp_code: otpValue }
            : { phone_number: formData.email, otp_code: otpValue };

          const response = await customFetch(API.AUTH.VERIFY_OTP, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          const data = await response.json();

          if (!response.ok) {
            let errorMsg = data.detail || data.message || data.error;
            if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
              errorMsg = data.non_field_errors.includes("User account is inactive")
                ? "Your account is inactive please contact your admin for details"
                : data.non_field_errors[0];
            }
            throw new Error(errorMsg || 'Invalid OTP. Please try again.');
          }

          const token = data.token || data.data?.access;
          const user = data.user || data.data?.user;

          if (token) localStorage.setItem("auth_token", token);
          if (user) localStorage.setItem("user_details", JSON.stringify(user));

          const targetRoute = getDashboardRoute(user?.user_type);
          router.push(targetRoute);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Process failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-white font-['DM_Sans',sans-serif] overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-serif { font-family: 'DM Serif Display', serif; }
      `}</style>

      {/* LEFT SIDE: Brand & Showcase */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-6 xl:p-10 2xl:p-12 text-white h-full overflow-hidden"
        style={{
          background: "url('/courtlogin.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 shrink-0"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#c9a96e] rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <Scale className="w-4.5 h-4.5 text-[#0e2340]" />
            </div>
            <div>
              <span className="font-bold text-xl xl:text-2xl tracking-tight block text-white">
                Ant<span className="text-[#c9a96e]">Legal</span>
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Content Area */}
        <div className="relative z-10 my-auto flex flex-col justify-center">
          {/* Gold Bar Line above heading */}
          <div className="w-8 h-[2px] bg-[#c9a96e] mb-4" />

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-3xl xl:text-4xl 2xl:text-5xl leading-[1.1] tracking-tight mb-4"
          >
            Empowering the <br />
            <span className="italic text-[#c9a96e]">Modern</span> Advocate
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm xl:text-base text-white/80 max-w-sm leading-relaxed"
          >
            The comprehensive operating system designed specifically for high-performance law firms.
          </motion.p>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 flex flex-wrap items-center gap-4 xl:gap-8 pt-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#c9a96e] shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-semibold text-white">Secure Access</p>
              <p className="text-[11px] text-white/60">256-bit encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#c9a96e] shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-semibold text-white">Always Available</p>
              <p className="text-[11px] text-white/60">99.9% uptime</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#c9a96e] shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-semibold text-white">Data Protected</p>
              <p className="text-[11px] text-white/60">Industry standards</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form Container */}
      <div className="w-full lg:w-1/2 bg-[#f8f9fa] flex flex-col items-center justify-between relative p-4 sm:p-6 h-full overflow-hidden">

        {/* Background ambient accents */}
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, #f2ece1 0%, transparent 40%)' }}></div>
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{ background: 'radial-gradient(circle at bottom left, #f2ece1 0%, transparent 40%)' }}></div>

        {/* FLOATING CARD */}
        <div className="relative z-10 w-full max-w-[400px] xl:max-w-[400px] bg-white rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 xl:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 my-auto shrink max-h-[calc(100vh-48px)] overflow-y-auto">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* Header section with icon */}
            <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#faf7f2] border border-[#f2e8d5] rounded-full flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a96e]" strokeWidth={2} />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl xl:text-[28px] text-[#0e2340] mb-0.5">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">Sign in to access your AntLegal portal</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-red-700"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div className="text-xs font-medium">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>

              {/* Email / Username Input */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-[#0e2340]">
                  {loginMode === 'password' ? 'Email or Username' : 'Email or Phone'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    {isEmailInput ? (
                      <User className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-[#c9a96e]' : 'text-gray-400'}`} strokeWidth={1.5} />
                    ) : (
                      <Phone className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-[#c9a96e]' : 'text-gray-400'}`} strokeWidth={1.5} />
                    )}
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.email}
                    disabled={otpSent && loginMode === 'code'}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-10 pr-3.5 h-[42px] sm:h-[46px] bg-white border rounded-xl text-[#0e2340] font-medium text-xs sm:text-sm placeholder-gray-400 transition-all focus:outline-none focus:ring-1 focus:ring-[#0e2340] ${focusedField === 'email' ? 'border-[#0e2340]' : 'border-gray-200'} ${otpSent && loginMode === 'code' ? 'opacity-50 bg-gray-50' : ''}`}
                    placeholder="name@lawfirm.com"
                  />
                </div>
              </div>

              {/* Dynamic Second Field (Password or OTP) */}
              <AnimatePresence mode="wait">
                {loginMode === 'password' ? (
                  <motion.div
                    key="password-field"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-xs font-semibold text-[#0e2340]">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] sm:text-xs font-medium text-[#c9a96e] hover:text-[#0e2340] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <PasswordInput
                        value={formData.password}
                        onChange={v => setFormData(p => ({ ...p, password: v }))}
                        required={loginMode === 'password'}
                        autoComplete="current-password"
                        className="!pl-10 !h-[42px] sm:!h-[46px] !bg-white !border !border-gray-200 !rounded-xl focus:!border-[#0e2340] focus:!ring-1 focus:!ring-[#0e2340] transition-all !font-medium text-xs sm:text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      </div>
                    </div>
                  </motion.div>
                ) : otpSent ? (
                  <motion.div
                    key="otp-field"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <label htmlFor="otp" className="block text-xs font-semibold text-[#0e2340]">
                        Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpValue(''); setError(''); }}
                        className="text-[11px] sm:text-xs font-medium text-[#c9a96e] hover:text-[#0e2340] transition-colors"
                      >
                        Change Account
                      </button>
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otpValue}
                      onChange={(e) => { setOtpValue(e.target.value); setError(''); }}
                      className="block w-full px-3.5 h-[42px] sm:h-[46px] bg-white border border-gray-200 rounded-xl text-center tracking-[0.4em] text-base sm:text-lg font-bold text-[#0e2340] placeholder-gray-300 focus:outline-none focus:border-[#0e2340] focus:ring-1 focus:ring-[#0e2340] transition-all uppercase"
                      placeholder="••••••"
                      maxLength={6}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Main Submit Button */}
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                type="submit"
                disabled={loading}
                className="w-full mt-1 h-[42px] sm:h-[46px] bg-[#0A1629] text-white rounded-xl font-semibold text-xs sm:text-sm transition-all hover:bg-[#122543] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center px-5 relative"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {loginMode === 'password' ? 'Sign In to Portal' :
                        otpSent ? 'Verify Code' : 'Send Code'}
                    </span>
                    <ArrowRight className="w-4 h-4 absolute right-4 sm:right-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-3.5 sm:py-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-3 text-gray-400 text-[10px] sm:text-xs font-semibold uppercase">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* OTP / Password Toggle Button */}
            <button
              type="button"
              className="w-full h-[40px] sm:h-[44px] bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0e2340] transition-all hover:bg-gray-50 flex items-center justify-center gap-2 mb-3.5 sm:mb-4"
              onClick={() => { setLoginMode(loginMode === 'password' ? 'code' : 'password'); setOtpSent(false); setOtpValue(''); setError(''); }}
            >
              {loginMode === 'password' ? (
                <><Fingerprint className="w-4 h-4 text-[#c9a96e]" /> Sign in with OTP</>
              ) : (
                <><Lock className="w-4 h-4 text-[#c9a96e]" /> Sign in with Password</>
              )}
            </button>

            {/* Remember Me & Create Account Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#0e2340] border-gray-300 rounded focus:ring-[#0e2340] cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs text-gray-600 font-medium cursor-pointer">
                  Remember me
                </label>
              </div>
              <p className="text-xs font-medium text-gray-500">
                New here? {' '}
                <Link href="/register" className="text-[#c9a96e] hover:text-[#0e2340] font-semibold transition-colors">Create Account</Link>
              </p>
            </div>

            {/* Trust Badge */}
            <div className="bg-[#f8f9fa] rounded-xl p-3 flex gap-2.5 items-start border border-gray-100">
              <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                Protected by industry-standard encryption.<br />
                By signing in, you agree to our <Link href="/terms" className="text-[#c9a96e] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#c9a96e] hover:underline">Privacy Policy</Link>.
              </p>
            </div>

          </motion.div>
        </div> {/* END FLOATING CARD */}

        {/* Copyright Text at Bottom */}
        <div className="text-[11px] sm:text-xs font-medium text-gray-500 py-1 text-center shrink-0">
          © 2026 AntLegal. All rights reserved.
        </div>
      </div>
    </div>
  );
}