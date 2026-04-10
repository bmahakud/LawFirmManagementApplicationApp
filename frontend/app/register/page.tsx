"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, CheckCircle2, ChevronRight, ChevronLeft, User, Building, MapPin, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

export default function RegisterWizard() {
  const router = useRouter();

  const [registerType, setRegisterType] = useState<'client' | 'super_admin'>('client');
  const [currentStep, setCurrentStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', password_confirm: '', date_of_birth: '', gender: 'M',
    address_line_1: '', city: '', state: '', country: '', postal_code: '',
    firm_name: '', firm_address: '',
  });

  // Track ISO codes for the library to fetch dependents
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  const stepsList = registerType === 'client'
    ? ["Account Type", "Personal Details", "Address Data", "Security & Access"]
    : ["Account Type", "Personal Details", "Law Firm Profile", "Address Data", "Security & Access"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    setError('');
    setCurrentStep(s => Math.min(s + 1, stepsList.length - 1));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setError('');
    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const payload: any = { ...formData };
      if (registerType === 'client') {
        delete payload.firm_name;
        delete payload.firm_address;
      }

      const response = await customFetch(API.USERS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (typeof data === 'object' && data !== null && !data.message && !data.detail) {
          const keyErrors = Object.entries(data).map(([key, val]) => `${key}: ${val}`);
          throw new Error(keyErrors.join(' | '));
        }
        throw new Error(data.detail || data.message || 'Registration failed. Please try again.');
      }

      setSuccess(true);
      if (data.token) localStorage.setItem("auth_token", data.token);
      if (data.user) localStorage.setItem("user_details", JSON.stringify(data.user));

      setTimeout(() => {
        router.push(data.user?.user_type === 'super_admin' ? '/super-admin/dashboard' : '/client/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === stepsList.length - 1) {
      handleSubmit();
    } else {
      nextStep();
    }
  };

  const renderStepContent = () => {
    // Step 0: Account Type
    if (currentStep === 0) {
      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <h2 className="text-3xl font-extrabold text-[#0e2340] mb-2">Create your account</h2>
          <p className="text-gray-500 font-medium mb-8">Select how you want to use the platform.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRegisterType('client')}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${registerType === 'client'
                ? 'border-[#0e2340] bg-[#0e2340]/5'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${registerType === 'client' ? 'bg-[#0e2340] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <User className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold ${registerType === 'client' ? 'text-[#0e2340]' : 'text-gray-900'}`}>Client Account</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Book consultations, manage cases, and securely communicate with legal teams.</p>
            </button>
            <button
              type="button"
              onClick={() => setRegisterType('super_admin')}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${registerType === 'super_admin'
                ? 'border-[#0e2340] bg-[#0e2340]/5'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${registerType === 'super_admin' ? 'bg-[#c9a96e] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Building className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold ${registerType === 'super_admin' ? 'text-[#0e2340]' : 'text-gray-900'}`}>Create your Lawfirm</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Create a workspace to manage lawyers, billing, documents, and client timelines natively.</p>
            </button>
          </div>
        </motion.div>
      );
    }

    const sectionName = stepsList[currentStep];

    if (sectionName === "Personal Details") {
      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0e2340]">Personal Information</h2>
              <p className="text-gray-500 text-sm">Tell us about yourself.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">First Name</label>
              <input name="first_name" type="text" required value={formData.first_name} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="John" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Last Name</label>
              <input name="last_name" type="text" required value={formData.last_name} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="Doe" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Date of Birth</label>
              <input name="date_of_birth" type="date" required value={formData.date_of_birth} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Gender</label>
              <select name="gender" required value={formData.gender} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400 bg-white">
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>
        </motion.div>
      );
    }

    if (sectionName === "Law Firm Profile") {
      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0e2340]">Law Firm Profile</h2>
              <p className="text-gray-500 text-sm">Set up your organizational hierarchy.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Registered Firm Name</label>
              <input name="firm_name" type="text" required value={formData.firm_name} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="Smith & Associates Law Firm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Firm Headquarters Address</label>
              <input name="firm_address" type="text" required value={formData.firm_address} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="Suite 500, Legal Street, Mumbai" />
            </div>
          </div>
        </motion.div>
      );
    }

    if (sectionName === "Address Data") {
      const countries = Country.getAllCountries();
      const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
      const cities = selectedStateCode ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : [];

      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0e2340]">Geographical Profile</h2>
              <p className="text-gray-500 text-sm">Where can we reach you physically?</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Address Line 1</label>
              <input name="address_line_1" type="text" required value={formData.address_line_1} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="Floor 4, Block B" />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Country</label>
              <select
                required
                value={selectedCountryCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const countryObj = Country.getCountryByCode(code);
                  setSelectedCountryCode(code);
                  setSelectedStateCode('');
                  setFormData(p => ({ ...p, country: countryObj?.name || '', state: '', city: '' }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400 bg-white"
              >
                <option value="">Select Country...</option>
                {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">State / Province</label>
              <select
                required
                disabled={!selectedCountryCode || states.length === 0}
                value={selectedStateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const stateObj = State.getStateByCodeAndCountry(code, selectedCountryCode);
                  setSelectedStateCode(code);
                  setFormData(p => ({ ...p, state: stateObj?.name || '', city: '' }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400 bg-white disabled:opacity-50 disabled:bg-gray-50"
              >
                <option value="">Select State...</option>
                {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">City</label>
              <select
                required
                disabled={!selectedStateCode || cities.length === 0}
                value={formData.city}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData(p => ({ ...p, city: name }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400 bg-white disabled:opacity-50 disabled:bg-gray-50"
              >
                <option value="">Select City...</option>
                {cities.map(cit => <option key={cit.name} value={cit.name}>{cit.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Postal Code</label>
              <input name="postal_code" type="text" required value={formData.postal_code} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="400001" />
            </div>
          </div>
        </motion.div>
      );
    }

    if (sectionName === "Security & Access") {
      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0e2340]">Security & Access</h2>
              <p className="text-gray-500 text-sm">Secure your account credentials.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 gap-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Email Address</label>
                <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="contact@example.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Phone Number</label>
                <input name="phone_number" type="tel" required value={formData.phone_number} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Password</label>
                <input name="password" type="password" required value={formData.password} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Confirm Password</label>
                <input name="password_confirm" type="password" required value={formData.password_confirm} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] text-[15px] font-medium text-slate-900 placeholder-slate-400" placeholder="••••••••" />
              </div>
            </div>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Dynamic Progress */}
      <div className="hidden lg:flex w-[400px] bg-[#0e2340] flex-col justify-between p-12 relative overflow-hidden border-r border-[#1a3a5c]">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-[#1a3a5c] rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-[#c9a96e] rounded-full blur-3xl opacity-20" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-[#0e2340]" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">AntLegal</span>
          </div>

          <div className="flex-1">
            <h3 className="text-[11px] font-bold text-[#c9a96e] uppercase tracking-[0.2em] mb-8">Registration Progress</h3>

            <div className="space-y-6">
              {stepsList.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;

                return (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== stepsList.length - 1 && (
                      <div className={`absolute top-8 left-4 w-0.5 h-full -ml-[1px] ${isCompleted ? 'bg-[#c9a96e]' : 'bg-white/10'}`} />
                    )}

                    <div className="relative z-10 shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                        ? 'bg-[#c9a96e] border-[#c9a96e] text-[#0e2340]'
                        : isActive
                          ? 'bg-[var(--navy)] border-[#c9a96e] text-[#c9a96e] shadow-[0_0_15px_rgba(201,169,110,0.4)]'
                          : 'bg-transparent border-white/20 text-white/30'
                        }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                    </div>

                    <div className={`mt-1.5 transition-all duration-300 ${isCompleted ? 'opacity-70' : isActive ? 'opacity-100' : 'opacity-40'}`}>
                      <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/80'}`}>{step}</p>
                      {isActive && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs text-[#859fbd] mt-1 pr-4">
                          Complete this section to advance your onboarding.
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[10px] text-[#859fbd] leading-tight">By proceeding, you agree to the AntLegal MSA and Privacy constraints.</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col py-10 px-4 sm:px-12 lg:px-24 justify-center relative overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-[#0e2340] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">AntLegal</span>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center space-y-5 shadow-xl"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">Registration Complete!</h3>
              <p className="text-gray-600 font-medium text-lg">Preparing your dedicated environment...</p>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
                </motion.div>
              )}

              <form onSubmit={submitHandler} className="space-y-8">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-6 mt-10 border-t border-gray-100">
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-[#0e2340] hover:bg-gray-100 transition-all flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 rounded-xl shadow-lg text-[15px] font-bold text-white bg-[#0e2340] hover:bg-[#1a3a5c] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : currentStep === stepsList.length - 1 ? (
                      <>Generate Perimeter <KeyRound className="w-4 h-4" /></>
                    ) : (
                      <>Continue <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>

              {currentStep === 0 && (
                <div className="mt-12 text-center text-sm font-medium text-gray-500">
                  Already part of the ecosystem?{' '}
                  <Link href="/login" className="text-[#0e2340] font-bold hover:underline">
                    Sign in here
                  </Link>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
