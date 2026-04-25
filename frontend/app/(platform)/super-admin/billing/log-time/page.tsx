'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  AlignLeft,
  Briefcase,
  AlertCircle,
  Loader2,
  ChevronDown,
  Calendar,
  Sparkles,
  IndianRupee,
  FileText,
  Keyboard,
  Check,
  User,
  StickyNote,
  Tag
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const ACTIVITY_TYPES = [
  { value: 'court_appearance', label: 'Court Appearance' },
  { value: 'research', label: 'Legal Research' },
  { value: 'drafting', label: 'Document Drafting' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

export default function LogTimeEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    case: '',
    user: '',
    date: new Date().toISOString().slice(0, 10),
    activity_type: 'research',
    description: '',
    notes: '',
    hours: '',
    hourly_rate: '',
    status: 'draft',
    billable: true,
  });

  useEffect(() => {
    fetchCases();
    fetchUsers();
    
    try {
      const storedUser = localStorage.getItem("user_details");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          setCurrentUser(user);
          setFormData(prev => ({ ...prev, user: user.id }));
        }
      }
    } catch (err) {
      console.error("Failed to parse user details from local storage");
    }
  }, []);

  const fetchCases = async () => {
    try {
      const response = await customFetch(API.CASES.LIST);
      if (response.ok) setCases((await response.json()).results || []);
    } catch (err) {
      console.error("Failed to fetch cases", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await customFetch(API.USERS.LIST);
      if (response.ok) setUsers((await response.json()).results || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        case: formData.case || null,
        user: formData.user || null,
        hours: parseFloat(formData.hours),
        hourly_rate: parseFloat(formData.hourly_rate),
      };

      const response = await customFetch(API.BILLING.TIME_ENTRIES.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/super-admin/billing');
      } else {
        const data = await response.json();
        setError(data.message || "Failed to log time entry. Please check your inputs.");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Log Time Entry</h1>
            <p className="text-sm font-medium text-gray-500">Record billable hours and activities</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-8">
          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-sm font-black">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Case Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Associated Case
              </label>
              <div className="relative group">
                <select
                  value={formData.case}
                  onChange={e => setFormData(prev => ({ ...prev, case: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none text-sm font-medium text-gray-900 cursor-pointer shadow-sm transition-all"
                >
                  <option value="" className="text-gray-500">Select a Case (Optional)</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_title || c.title || c.id}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* User Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Logged By
              </label>
              <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center cursor-not-allowed">
                {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username : 'Loading...'}
              </div>
            </div>

            {/* Date & Status */}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Date of Activity
              </label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-gray-900 shadow-sm transition-all [color-scheme:light]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Status
              </label>
              <div className="relative group">
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none text-sm font-medium text-gray-900 cursor-pointer shadow-sm transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="invoiced">Invoiced</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* Activity & Billable */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Activity Type
              </label>
              <div className="relative group">
                <select
                  value={formData.activity_type}
                  onChange={e => setFormData(prev => ({ ...prev, activity_type: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none text-sm font-medium text-gray-900 cursor-pointer shadow-sm transition-all"
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer group w-max mt-2">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.billable ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-transparent group-hover:border-blue-400'}`}>
                   <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 leading-none">Billable Entry</span>
                  <span className="text-xs text-gray-500 font-medium mt-1">Include in next invoice</span>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.billable}
                  onChange={e => setFormData(prev => ({ ...prev, billable: e.target.checked }))}
                />
              </label>
            </div>

            {/* Hours & Rate */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Total Hours
              </label>
              <input
                required
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.0"
                value={formData.hours}
                onChange={e => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-gray-900 shadow-sm transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5" /> Hourly Rate
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.hourly_rate}
                onChange={e => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-gray-900 shadow-sm transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5" /> Task Description
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detail the services rendered..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-sm font-medium text-gray-900 shadow-sm transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Internal Notes */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5" /> Internal Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Private notes..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-sm font-medium text-gray-900 shadow-sm transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[140px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save Time Entry'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
