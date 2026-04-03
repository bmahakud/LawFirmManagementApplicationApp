'use client';

import { useState } from 'react';
import { Building2, X, Save, PlusCircle } from 'lucide-react';

interface Field {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  colSpan?: boolean;
}

const fields: Field[] = [
  { key: 'firmName',  label: 'Firm Name',    placeholder: 'e.g. Chen & Associates' },
  { key: 'firmCode',  label: 'Firm Code',    placeholder: 'e.g. CHEN2024' },
  { key: 'ownerName', label: 'Owner Name',   placeholder: 'Full name' },
  { key: 'email',     label: 'Email',        placeholder: 'owner@example.com', type: 'email' },
  { key: 'phone',     label: 'Phone',        placeholder: '+91 98765 43210', type: 'tel' },
  { key: 'username',  label: 'Username',     placeholder: 'login username' },
  { key: 'password',  label: 'Password',     placeholder: '••••••••', type: 'password' },
  { key: 'city',      label: 'City',         placeholder: 'Mumbai' },
  { key: 'state',     label: 'State',        placeholder: 'Maharashtra' },
  { key: 'country',   label: 'Country',      placeholder: 'India' },
];

const empty = Object.fromEntries(fields.map((f) => [f.key, '']));

export default function CreateFirmForm() {
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [open, setOpen] = useState(true);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));
  const reset = () => setForm(empty);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 mb-6 bg-[#0e2340] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3a5c] transition-colors shadow-sm"
      >
        <PlusCircle className="w-4 h-4" /> Add New Firm
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-7 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0e2340] flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0e2340]">Create New Firm</h2>
            <p className="text-xs text-gray-400">Fill in the details to register a new law firm</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Fields */}
      <div className="px-7 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(({ key, label, placeholder, type }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label}
              </label>
              <input
                type={type ?? 'text'}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="h-10 px-3.5 rounded-xl border border-gray-200 bg-[#f7f8fa] text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#0e2340]/40 focus:ring-2 focus:ring-[#0e2340]/8 transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-7 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
        <button className="flex items-center gap-2 bg-[#0e2340] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3a5c] transition-colors shadow-sm">
          <PlusCircle className="w-4 h-4" /> Create Firm
        </button>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button
          onClick={reset}
          className="ml-auto text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-2"
        >
          Clear
        </button>
      </div>
    </div>
  );
}