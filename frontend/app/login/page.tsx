"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Scale,
  AlertCircle,
  Star,
  Briefcase,
  FileText,
  Calendar,
} from 'lucide-react';

// Note: You'll need to create or import these hooks/contexts
// import { useAuthContext } from '../contexts/AuthContext';
// import DeviceConflictModal from '../components/DeviceConflictModal';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'code'>('password');

  // Replace with your actual auth hook
  // const { login, deviceConflict, setDeviceConflict } = useAuthContext();

  const getDashboardRoute = (role: string): string => {
    const normalizedRole = role?.toLowerCase();

    switch (normalizedRole) {
      case 'platform_owner':
        return '/platform-owner/dashboard';
      case 'partner_manager':
        return '/partner-manager/dashboard';
      case 'super_admin':
      case 'firm_owner':
        return '/super-admin/dashboard';
      case 'admin':
      case 'firm_admin':
        return '/firm-admin/dashboard';
      case 'advocate':
      case 'lawyer':
        return '/advocate/dashboard';
      case 'paralegal':
        return '/paralegal/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/platform-owner/dashboard';
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
      // Replace with your actual login logic
      // const loggedInUser = await login(formData.email, formData.password);

      // Mock login for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));

      let userRole = '';
      const email = formData.email.toLowerCase();
      const password = formData.password;

      if (email === 'platformowner@lawfirm.com' && password === 'platformowner') {
        userRole = 'platform_owner';
      } else if (email === 'partnermanager@lawfirm.com' && password === 'partnermanager') {
        userRole = 'partner_manager';
      } else if (email === 'firmowner@lawfirm.com' && password === 'firmowner') {
        userRole = 'firm_owner';
      } else if (email === 'firmadmin@lawfirm.com' && password === 'firmadmin') {
        userRole = 'firm_admin';
      } else if (email === 'advocate@lawfirm.com' && password === 'advocate') {
        userRole = 'advocate';
      } else if (email === 'paralegal@lawfirm.com' && password === 'paralegal') {
        userRole = 'paralegal';
      } else if (email === 'client@lawfirm.com' && password === 'client') {
        userRole = 'client';
      } else {
        throw new Error('Invalid credentials. Please use one of the demo accounts.');
      }

      // Mock user role - replace with actual user data from your API
      const mockUser = {
        role: userRole,
        name: 'Demo User',
      };

      // Redirect based on user role
      const dashboardRoute = getDashboardRoute(mockUser.role);
      router.push(dashboardRoute);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Device conflict handlers (if needed)
  // const handleSwitchDevice = async () => { ... };
  // const handleCancelDeviceSwitch = () => { ... };

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* Device Conflict Modal - Uncomment when you have the component */}
      {/* {deviceConflict && (
        <DeviceConflictModal
          isOpen={true}
          conflictInfo={deviceConflict.conflictInfo}
          onSwitchDevice={handleSwitchDevice}
          onCancel={handleCancelDeviceSwitch}
        />
      )} */}

      {/* LEFT SIDE: Brand & Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white"
        style={{
          backgroundColor: '#1e3a5f',
          backgroundImage: `
            radial-gradient(at 0% 0%, #0a2a44 0, transparent 50%), 
            radial-gradient(at 50% 0%, #2c5a7a 0, transparent 50%), 
            radial-gradient(at 100% 0%, #1e4a6f 0, transparent 50%)
          `
        }}
      >
        {/* Abstract Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="legal-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <path d="M10 5 L15 10 L10 15 L5 10 Z" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="10" cy="10" r="1" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#legal-pattern)" />
          </svg>
        </div>

        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Nyaya Setu</span>
        </motion.div>

        {/* Testimonial / Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <div
            className="p-8 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4" fill="currentColor" />
              ))}
            </div>

            <blockquote className="text-lg font-medium leading-relaxed mb-6">
              "Nyaya Setu has transformed how we run our practice. From case management to client billing, everything is streamlined. Our productivity has increased by 40%."
            </blockquote>

            <div className="flex items-center gap-4">
              <img
                src="https://ui-avatars.com/api/?name=Sarah+Chen&background=1e3a5f&color=fff&bold=true"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-white/20"
              />
              <div>
                <p className="font-bold text-sm">Sarah Chen, Esq.</p>
                <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">
                  Managing Partner, Chen & Associates
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 opacity-80">
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-xs text-white/70">Law Firms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">10k+</div>
              <div className="text-xs text-white/70">Cases Managed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-white/70">Uptime</div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-white/60">
          © 2026 Nyaya Setu Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white">
              <Scale className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-900">Nyaya Setu</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Authentication failed</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address / Phone
              </label>
              <div className={`relative group rounded-lg transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-[#1e3a5f]/20' : ''
                }`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-[#1e3a5f]' : 'text-slate-400'
                    }`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1e3a5f] transition-all text-sm"
                  placeholder="attorney@lawfirm.com"
                />
              </div>
            </div>

            {/* Password Input OR OTP Message */}
            {loginMode === 'password' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#1e3a5f] hover:text-[#0f2b44] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className={`relative group rounded-lg transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-[#1e3a5f]/20' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-[#1e3a5f]' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required={loginMode === 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1e3a5f] transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600 font-medium pb-2 text-center">
                Message and data rates may apply
              </div>
            )}

            {/* Primary Submit Button */}
            <div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  loginMode === 'password' ? 'Sign in' : 'Send sign-in code'
                )}
              </motion.button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Secondary Toggle Button */}
            <div>
              <button
                type="button"
                className="w-full flex justify-center py-3 px-4 border border-transparent bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
                onClick={() => setLoginMode(loginMode === 'password' ? 'code' : 'password')}
              >
                {loginMode === 'password' ? 'Use a sign-in code' : 'Use password'}
              </button>
            </div>
          </form>

          {/* Contextual Secondary Links & Layout */}
          <div className="mt-6 flex flex-col items-center sm:items-start gap-4">
            {loginMode === 'code' && (
              <div className="w-full text-center">
                <Link href="/forgot-email" className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:underline transition-colors">
                  Forgot email or phone number?
                </Link>
              </div>
            )}

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm text-slate-600 mt-2">
              New to Nyaya Setu?{' '}
              <Link href="/register" className="font-semibold text-slate-900 hover:underline transition-colors">
                Sign up now.
              </Link>
            </div>

            <div className="text-xs text-slate-400 max-w-sm leading-relaxed mt-2">
              This page is protected by Google reCAPTCHA to ensure you're not a bot.
            </div>
          </div>
        </motion.div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-6 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <Link href="/help" className="hover:text-slate-600 transition-colors">Help Center</Link>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Powered by{' '}
            <a
              href="http://anthemgt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1e3a5f] hover:text-[#0f2b44] transition-colors"
            >
              Anthem
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}