'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, X, PlusCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

interface FormField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  required: boolean;
  half?: boolean;
}

const fields: FormField[] = [
  { key: 'firm_name', label: 'Firm Name', placeholder: 'e.g. Chen & Associates', required: true },
  { key: 'firm_code', label: 'Firm Code', placeholder: 'e.g. CHEN2024', required: true },
  { key: 'email', label: 'Email', placeholder: 'contact@lawfirm.com', type: 'email', required: true },
  { key: 'phone_number', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel', required: true },
  { key: 'city', label: 'City', placeholder: 'Mumbai', required: true },
  { key: 'state', label: 'State', placeholder: 'Maharashtra', required: true },
  { key: 'country', label: 'Country', placeholder: 'India', required: false },
  { key: 'address', label: 'Address', placeholder: 'Office address', required: false },
  { key: 'postal_code', label: 'Postal Code', placeholder: '400001', required: false },
  { key: 'website', label: 'Website', placeholder: 'https://lawfirm.com', type: 'url', required: false },
  { key: 'subscription_type', label: 'Subscription', placeholder: 'trial', required: false },
];

const emptyForm = Object.fromEntries(fields.map((f) => [f.key, f.key === 'country' ? 'India' : f.key === 'subscription_type' ? 'trial' : '']));

export default function CreateFirmForm() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  const set = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setError('');
    // Clear field-specific error when user types
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setError('');
    setFieldErrors({});
    setSuccess(false);
  };

  const handleSubmit = async () => {
    // Client-side validation
    const requiredFields = fields.filter(f => f.required);
    const missingFields: Record<string, string[]> = {};
    for (const f of requiredFields) {
      if (!form[f.key]?.trim()) {
        missingFields[f.key] = [`${f.label} is required.`];
      }
    }
    if (Object.keys(missingFields).length > 0) {
      setFieldErrors(missingFields);
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      // Build payload — only send non-empty fields
      const payload: Record<string, string> = {};
      for (const f of fields) {
        const val = form[f.key]?.trim();
        if (val) payload[f.key] = val;
      }

      const response = await customFetch(API.FIRMS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returns field-level errors
        if (typeof data === 'object' && !data.detail && !data.message) {
          setFieldErrors(data);
          setError('Please fix the highlighted errors below.');
        } else {
          throw new Error(data.detail || data.message || 'Failed to create firm.');
        }
        return;
      }

      setSuccess(true);
      // Redirect to firms list after brief success display
      setTimeout(() => {
        router.push('/platform-owner/firms');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      console.error('Create firm error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Firm Created Successfully!</h3>
        <p className="text-sm text-gray-400 mt-1">Redirecting to firms list…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0e2340] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0e2340]">Create New Firm</h2>
            <p className="text-xs text-gray-400">Fill in the details to register a new law firm</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-7 mt-5 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Fields */}
      <div className="px-7 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(({ key, label, placeholder, type, required }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                {label}
                {required && <span className="text-red-400">*</span>}
              </label>
              {key === 'subscription_type' ? (
                <select
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className={`h-10 px-3.5 rounded-xl border bg-[#f7f8fa] text-sm text-gray-700 outline-none focus:border-[#0e2340]/40 focus:ring-2 focus:ring-[#0e2340]/8 transition-all ${
                    fieldErrors[key] ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                  }`}
                >
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              ) : (
                <input
                  type={type ?? 'text'}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className={`h-10 px-3.5 rounded-xl border bg-[#f7f8fa] text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#0e2340]/40 focus:ring-2 focus:ring-[#0e2340]/8 transition-all ${
                    fieldErrors[key] ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                  }`}
                />
              )}
              {fieldErrors[key] && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors[key][0]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-7 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0e2340] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3a5c] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating…
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" /> Create Firm
            </>
          )}
        </button>
        <button
          onClick={reset}
          disabled={loading}
          className="ml-auto text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-2"
        >
          Clear
        </button>
      </div>
    </div>
  );
}