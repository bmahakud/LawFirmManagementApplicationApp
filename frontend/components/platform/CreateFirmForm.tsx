'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, PlusCircle, Loader2, CheckCircle2, AlertCircle, ChevronDown, Globe, Phone, Save, X, Briefcase, Mail, Link as LinkIcon, MapPin, Upload } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Country, State, City } from 'country-state-city';
import { Panel, SplitPanels, classNames } from './ui';

export default function CreateFirmForm() {
  const router = useRouter();

  // -- State --
  const [form, setForm] = useState<Record<string, string>>({
    firm_name: '', firm_code: '', email: '', phone_number: '',
    country: 'IN', state: '', city: '', address: '',
    postal_code: '', website: '', subscription_type: 'trial',
    registration_number: '',
  });
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneFlag, setPhoneFlag] = useState('🇮🇳');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // -- Location Data --
  const countries = Country.getAllCountries();
  const states = form.country ? State.getStatesOfCountry(form.country) : [];
  const cities = (form.country && form.state) ? City.getCitiesOfState(form.country, form.state) : [];

  // -- Pre-sync phone code on mount or country change --
  useEffect(() => {
    if (form.country) {
      const countryData = countries.find(c => c.isoCode === form.country);
      if (countryData) {
        setPhoneCode('+' + countryData.phonecode.replace('+', ''));
        setPhoneFlag(countryData.flag);
      }
    }
  }, [form.country]);

  const set = (key: string, val: string) => {
    setForm((p) => {
      const next = { ...p, [key]: val };
      // Reset dependent fields
      if (key === 'country') { next.state = ''; next.city = ''; }
      if (key === 'state') { next.city = ''; }
      return next;
    });
    setError('');
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const cleanedPhoneNumber = form.phone_number.replace(/\D/g, '');
      const fullPhoneNumber = `${phoneCode} ${cleanedPhoneNumber}`.trim();
      const countryName = countries.find(c => c.isoCode === form.country)?.name || form.country;
      const stateName = states.find(s => s.isoCode === form.state)?.name || form.state;

      const payload: any = {
        ...form,
        phone_number: fullPhoneNumber,
        country: countryName,
        state: stateName,
      };

      let response;
      if (logoFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            formData.append(key, String(val));
          }
        });
        formData.append('logo', logoFile);
        response = await customFetch(API.FIRMS.CREATE, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await customFetch(API.FIRMS.CREATE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        if (typeof data === 'object' && !data.detail && !data.message) {
          setFieldErrors(data);
          setError('Please fix the highlighted errors below.');
        } else {
          throw new Error(data.detail || data.message || (typeof data === 'object' ? Object.values(data)[0] : 'Failed to create firm.'));
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/platform-owner/firms'), 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Firm Registered Successfully</h3>
        <p className="text-sm text-gray-400 mt-2">Provisioning systems and setting up infrastructure…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <SplitPanels
        left={
          <div className="space-y-6">
            <Panel title="Core Credentials" subtitle="Primary identification and contact markers.">
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors group relative cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {logoPreview ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm">
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#0e2340] transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Upload Firm Logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Firm Name *</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                      <input
                        value={form.firm_name}
                        onChange={e => set('firm_name', e.target.value)}
                        placeholder="e.g. Chen & Associates"
                        required
                        className={classNames(
                          "h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold outline-none transition-all",
                          fieldErrors.firm_name ? "border-red-200 bg-red-50/50 text-red-900 placeholder:text-red-300" : "border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                        )}
                      />
                    </div>
                    {fieldErrors.firm_name && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.firm_name[0]}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Firm Code *</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                      <input
                        value={form.firm_code}
                        onChange={e => set('firm_code', e.target.value)}
                        placeholder="e.g. CHEN2024"
                        required
                        className={classNames(
                          "h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold outline-none transition-all uppercase",
                          fieldErrors.firm_code ? "border-red-200 bg-red-50/50 text-red-900 placeholder:text-red-300" : "border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                        )}
                      />
                    </div>
                    {fieldErrors.firm_code && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.firm_code[0]}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Business Email *</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="contact@lawfirm.com"
                      required
                      className={classNames(
                        "h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold outline-none transition-all",
                        fieldErrors.email ? "border-red-200 bg-red-50/50 text-red-900 placeholder:text-red-300" : "border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                      )}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.email[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Contact Number *</label>
                  <div className={classNames(
                    "flex items-center h-11 rounded-xl border transition-all overflow-hidden",
                    fieldErrors.phone_number ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus-within:bg-white focus-within:border-[#0e2340] focus-within:ring-4 focus-within:ring-[#0e2340]/5"
                  )}>
                    <div className="flex items-center gap-2 px-4 border-r border-gray-100/50 bg-gray-100/30 h-full shrink-0">
                      <span className="text-xs font-bold text-gray-500">{phoneCode}</span>
                    </div>
                    <input
                      type="tel"
                      value={form.phone_number}
                      onChange={e => set('phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      placeholder="9876543210"
                      required
                      className="flex-1 h-full px-4 text-sm font-semibold text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                    />
                  </div>
                  {fieldErrors.phone_number && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.phone_number[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Office Website</label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={e => set('website', e.target.value)}
                      placeholder="https://lawfirm.com"
                      className="h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold outline-none border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all"
                    />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Detailed Address" subtitle="Official registration locale.">
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Street Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <input
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      placeholder="Floor 4, Lex Tower..."
                      className="h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold outline-none border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Postal Code</label>
                    <input
                      value={form.postal_code}
                      onChange={e => set('postal_code', e.target.value.replace(/\D/g, ''))}
                      placeholder="400001"
                      className="h-11 w-full rounded-xl border px-4 text-sm font-semibold outline-none border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Subscription Plan</label>
                    <div className="relative group">
                      <select
                        value={form.subscription_type}
                        onChange={e => set('subscription_type', e.target.value)}
                        className="h-11 w-full rounded-xl border px-4 appearance-none text-sm font-semibold outline-none border-gray-100 bg-gray-50/50 text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all"
                      >
                        <option value="trial">Trial Access</option>
                        <option value="basic">Basic Plan</option>
                        <option value="premium">Premium Enterprise</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-6">
            <Panel title="Regional Alignment" subtitle="Geographic metadata binding.">
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Country *</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <select
                      value={form.country}
                      onChange={e => set('country', e.target.value)}
                      required
                      className={classNames(
                        "h-11 w-full rounded-xl border pl-11 pr-10 appearance-none text-sm font-bold outline-none transition-all",
                        fieldErrors.country ? "border-red-200 bg-red-50/50 text-red-900" : "border-gray-100 bg-gray-50/50 text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                      )}
                    >
                      <option value="">Select Country</option>
                      {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {fieldErrors.country && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.country[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">State / Province *</label>
                  <div className="relative group">
                    <select
                      value={form.state}
                      onChange={e => set('state', e.target.value)}
                      required
                      disabled={!form.country}
                      className={classNames(
                        "h-11 w-full rounded-xl border px-4 pr-10 appearance-none text-sm font-bold outline-none transition-all disabled:opacity-50",
                        fieldErrors.state ? "border-red-200 bg-red-50/50 text-red-900" : "border-gray-100 bg-gray-50/50 text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                      )}
                    >
                      <option value="">Select State</option>
                      {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {fieldErrors.state && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.state[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">City *</label>
                  <div className="relative group">
                    {cities.length > 0 ? (
                      <>
                        <select
                          value={cities.some(c => c.name === form.city) ? form.city : (form.city ? "Other" : "")}
                          onChange={e => set('city', e.target.value === "Other" ? "" : e.target.value)}
                          required
                          disabled={!form.state}
                          className={classNames(
                            "h-11 w-full rounded-xl border px-4 pr-10 appearance-none text-sm font-bold outline-none transition-all disabled:opacity-50",
                            fieldErrors.city ? "border-red-200 bg-red-50/50 text-red-900" : "border-gray-100 bg-gray-50/50 text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                          )}
                        >
                          <option value="">Select City</option>
                          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          <option value="Other">Other (Input Manual)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </>
                    ) : (
                      <input
                        value={form.city}
                        onChange={e => set('city', e.target.value)}
                        placeholder="Type city name..."
                        required
                        disabled={!form.state}
                        className="h-11 w-full rounded-xl border px-4 text-sm font-bold outline-none border-gray-100 bg-gray-50/50 text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all disabled:opacity-50"
                      />
                    )}
                  </div>
                  {cities.length > 0 && !cities.some(c => c.name === form.city) && form.city === "" && form.state && (
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="Specify city name..."
                      required
                      className="mt-2 h-10 px-4 rounded-xl border border-gray-100 bg-gray-50/30 text-sm font-bold outline-none focus:border-[#0e2340] animate-in slide-in-from-top-1"
                    />
                  )}
                  {fieldErrors.city && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.city[0]}</p>}
                </div>
              </div>
            </Panel>

            <Panel title="Actions" subtitle="Finalize registration.">
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#0e2340] px-4 py-3 text-sm font-bold text-white hover:bg-[#1a3a5c] shadow-lg shadow-[#0e2340]/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Register Enterprise Firm
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all active:scale-[0.98]"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
              {error && <p className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-500 animate-in slide-in-from-top-2">{error}</p>}
            </Panel>
          </div>
        }
      />
    </form>
  );
}
