'use client';

import { useState, useEffect } from 'react';
import {
  User, Camera, Save, Loader2, CheckCircle2, AlertCircle,
  Phone, Mail, MapPin, Calendar, Building2, BadgeCheck,
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import { AadharInput, PANInput, PhoneInput } from '@/components/platform/ui';
import { Country, State, City } from 'country-state-city';
import { useTopbarTitle } from '@/components/platform/TopbarContext';

const ACCENT = '#1f2937';

const GENDERS = [
  { value: '', label: 'Select Gender' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

export default function ClientProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileFile, setProfileFile] = useState<File | null | 'REMOVE'>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  /* ── Fetch profile ── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Get current user id from localStorage
        const stored = localStorage.getItem('user_details');
        let userId: string | null = null;
        if (stored) {
          try { userId = JSON.parse(stored)?.id; } catch (_) { }
        }

        // Fetch user list filtered by client type and find self
        const res = await customFetch(`${API.USERS.LIST}?user_type=client`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        const me = userId ? list.find((u: any) => u.id === userId) : list[0];
        if (!me) throw new Error('Profile not found');

        setUser(me);
        setPreview(me.profile_image
          ? (me.profile_image.startsWith('http') ? me.profile_image : `${API_BASE_URL}${me.profile_image}`)
          : null);
        setForm({
          first_name: me.first_name || '',
          last_name: me.last_name || '',
          phone_number: me.phone_number || '',
          gender: me.gender || '',
          date_of_birth: me.date_of_birth || '',
          address_line_1: me.address_line_1 || '',
          address_line_2: me.address_line_2 || '',
          country: me.country || '',
          state: me.state || '',
          city: me.city || '',
          postal_code: me.postal_code || '',
          aadhar_number: me.aadhar_number || '',
          pan_number: me.pan_number || '',
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fullName = `${form.first_name || ''} ${form.last_name || ''}`.trim() || user?.username || '';
  useTopbarTitle(fullName, fullName ? 'Client Profile' : '');

  const set = (key: string, val: string) => setForm((f: any) => ({ ...f, [key]: val }));

  /* ── Save profile ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      let response: Response;
      if (profileFile instanceof File) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            let val = String(v);
            if (k === 'aadhar_number') val = val.replace(/\s/g, '');
            if (k === 'phone_number') val = val.replace(/\D/g, '');
            fd.append(k, val);
          }
        });
        fd.append('profile_image', profileFile);
        response = await customFetch(API.USERS.DETAIL(user.id), { method: 'PATCH', body: fd });
      } else {
        const payload: any = { ...form };
        if (payload.aadhar_number) {
          payload.aadhar_number = payload.aadhar_number.replace(/\s/g, '');
        }
        if (payload.phone_number) {
          payload.phone_number = payload.phone_number.replace(/\D/g, '');
        }
        if (profileFile === 'REMOVE') payload.profile_image = null;
        response = await customFetch(API.USERS.DETAIL(user.id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || Object.values(err).flat().join(', ') || 'Save failed');
      }
      const updated = await response.json();
      setUser(updated);
      setPreview(updated.profile_image
        ? (updated.profile_image.startsWith('http') ? updated.profile_image : `${API_BASE_URL}${updated.profile_image}`)
        : null);
      setProfileFile(null);
      setSuccess('Profile updated successfully!');
      // Dispatch so topbar refreshes
      window.dispatchEvent(new Event('client-profile-updated'));
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }
  if (!user && error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-100 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const initials = `${(user?.first_name || user?.username || '').charAt(0)}${(user?.last_name || '').charAt(0)}`.toUpperCase() || 'C';

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Page header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-4">

        <div>
          <h1 className="text-base font-bold text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-400 mt-0.5">Update your personal details and identity information.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6">

        {/* ── LEFT: FORM ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Avatar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Profile Photo</p>
            <div className="flex items-center gap-5">
              <div className="relative group w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setProfileFile(file); setPreview(URL.createObjectURL(file)); }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {preview ? (
                  <>
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ background: ACCENT }}>
                      {initials}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">Click the circle to upload a new photo (max 5MB).</p>
                {preview && (
                  <button type="button" onClick={() => { setProfileFile('REMOVE'); setPreview(null); }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Personal Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'first_name', label: 'First Name' },
                { key: 'last_name', label: 'Last Name' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors" />
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Phone</label>
                <PhoneInput value={form.phone_number} onChange={v => set('phone_number', v)} />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors appearance-none">
                  {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Aadhar Number</label>
                <AadharInput value={form.aadhar_number} onChange={v => set('aadhar_number', v)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">PAN Number</label>
                <PANInput value={form.pan_number} onChange={v => set('pan_number', v)} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Address</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Address Line 1</label>
                <input value={form.address_line_1} onChange={e => set('address_line_1', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Address Line 2</label>
                <input value={form.address_line_2} onChange={e => set('address_line_2', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Country</label>
                <select value={form.country} onChange={e => { set('country', e.target.value); set('state', ''); set('city', ''); }}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors appearance-none">
                  <option value="">Select Country</option>
                  {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">State</label>
                <select value={form.state} disabled={!form.country} onChange={e => { set('state', e.target.value); set('city', ''); }}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors appearance-none disabled:opacity-50">
                  <option value="">Select State</option>
                  {form.country && State.getStatesOfCountry(form.country).map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">City</label>
                {form.country && form.state && City.getCitiesOfState(form.country, form.state).length > 0 ? (
                  <select value={form.city} onChange={e => set('city', e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors appearance-none">
                    <option value="">Select City</option>
                    {City.getCitiesOfState(form.country, form.state).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                ) : (
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Enter city"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors" />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Postal Code</label>
                <input value={form.postal_code} onChange={e => set('postal_code', e.target.value.replace(/\D/g, ''))}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#1f2937] transition-colors" />
              </div>
            </div>
          </div>

          {/* Feedback + Submit */}
          {error && <p className="text-xs font-semibold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          {success && (
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: ACCENT }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* ── RIGHT: Info panel ── */}
        <div className="space-y-5">

          {/* Account details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Account Details</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Phone, label: 'Phone', value: user?.phone_number || '—' },
                { icon: Building2, label: 'Firm', value: user?.firm_name || '—' },
                { icon: MapPin, label: 'Username', value: user?.username },
                { icon: Calendar, label: 'Joined', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <row.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification badges */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Verification Status</p>
            </div>
            <div className="p-5 space-y-2">
              {[
                { label: 'Email Verified', ok: user?.is_email_verified },
                { label: 'Phone Verified', ok: user?.is_phone_verified },
                { label: 'Documents Verified', ok: user?.is_document_verified },
                { label: 'Account Active', ok: user?.is_active },
              ].map((v, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600">{v.label}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${v.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {v.ok ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Firm memberships */}
          {(user?.available_firms || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Firm Membership</p>
              </div>
              <div className="p-5 space-y-3">
                {user.available_firms.map((f: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-[#1f2937]" />
                      <span className="text-sm font-semibold text-gray-800">{f.firm_name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${f.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
