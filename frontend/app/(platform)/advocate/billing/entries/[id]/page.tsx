'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  X, 
  MapPin, 
  Clock, 
  AlignLeft, 
  Scale, 
  User, 
  Briefcase,
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Edit3,
  Check,
  ChevronRight,
  Phone,
  Mail,
  Bell,
  StickyNote,
  History,
  IndianRupee,
  FileText,
  Tag,
  ChevronDown
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

export default function TimeEntryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    date: '',
    activity_type: '',
    description: '',
    notes: '',
    hours: '',
    hourly_rate: '',
    status: '',
    billable: true,
  });

  useEffect(() => {
    if (id) {
      fetchEntryDetails();
    }
  }, [id]);

  useEffect(() => {
    if (entry) {
      setEditData({
        date: entry.date || '',
        activity_type: entry.activity_type || '',
        description: entry.description || '',
        notes: entry.notes || '',
        hours: entry.hours || '',
        hourly_rate: entry.hourly_rate || '',
        status: entry.status || '',
        billable: entry.billable !== false,
      });
    }
  }, [entry]);

  const fetchEntryDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customFetch(API.BILLING.TIME_ENTRIES.DETAIL(id));
      if (response.ok) {
        const data = await response.json();
        setEntry(data);
      } else {
        setError("Failed to load time entry details.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setActionLoading(true);
    try {
      const payload = {
        date: editData.date,
        activity_type: editData.activity_type,
        description: editData.description,
        notes: editData.notes,
        hours: parseFloat(editData.hours),
        hourly_rate: parseFloat(editData.hourly_rate),
        status: editData.status,
        billable: editData.billable
      };

      const response = await customFetch(API.BILLING.TIME_ENTRIES.DETAIL(id), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsEditing(false);
        fetchEntryDetails();
      } else {
        alert("Failed to update time entry.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action: 'delete') => {
    if (action === 'delete' && !window.confirm("Are you sure you want to delete this time entry? This action cannot be undone.")) return;
    
    setActionLoading(true);
    try {
      if (action === 'delete') {
        const response = await customFetch(API.BILLING.TIME_ENTRIES.DETAIL(id), { method: 'DELETE' });
        if (response.ok) {
          router.push('/advocate/billing');
        } else {
          const data = await response.json();
          alert(data.message || "Action failed.");
        }
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
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
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Time Entry Log</h1>
            <p className="text-sm font-medium text-gray-500">Review or edit details for this billable record.</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative"
      >
        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center gap-6 text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
            <p className="font-bold tracking-widest text-xs uppercase text-gray-400">Fetching Record Data...</p>
          </div>
        ) : error || !entry ? (
           <div className="p-20 text-center space-y-8">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Connection Failed</h3>
              <p className="text-gray-500">{error || "The record could not be loaded."}</p>
            </div>
            <button onClick={() => router.back()} className="px-8 py-3 bg-gray-900 text-white rounded-[1.2rem] font-bold shadow-xl">Back to Billing Hub</button>
          </div>
        ) : (
          <>
            <div className="p-6 sm:p-8 space-y-8 bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">₹ {entry.amount || '0.00'}</h2>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Logged By: {entry.user_name}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide border ${
                    entry.billable ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {entry.billable ? 'Billable' : 'Non-Billable'}
                  </span>
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide border ${
                    entry.status === 'submitted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    entry.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    entry.status === 'invoiced' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {entry.status}
                  </span>
                  
                  {!isEditing && entry.status === 'draft' && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 ml-2 shadow-sm text-gray-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1 border-gray-200">Date</label>
                      <input 
                        type="date"
                        value={editData.date}
                        onChange={(e) => setEditData({...editData, date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1">Activity Type</label>
                      <input 
                        type="text"
                        value={editData.activity_type}
                        onChange={(e) => setEditData({...editData, activity_type: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-gray-800">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1">Hours</label>
                      <input type="number" step="0.1" value={editData.hours} onChange={(e) => setEditData({...editData, hours: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 shadow-sm" />
                    </div>
                    <div className="space-y-2 text-gray-800">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1">Hourly Rate</label>
                      <input type="number" step="0.1" value={editData.hourly_rate} onChange={(e) => setEditData({...editData, hourly_rate: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 text-gray-800">
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-2 mt-2">
                       <input type="checkbox" checked={editData.billable} onChange={e => setEditData({...editData, billable: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /> Billable Entry
                    </label>
                  </div>
                    <div className="space-y-2 text-gray-800">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1">Status</label>
                      <div className="relative group">
                        <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 shadow-sm appearance-none cursor-pointer">
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="invoiced">Invoiced</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  <div className="space-y-2 text-gray-800">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1">Description</label>
                    <textarea rows={3} value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-gray-900 shadow-sm" />
                  </div>
                  <div className="space-y-2 text-gray-800">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-1 flex items-center gap-2"><StickyNote className="w-3.5 h-3.5" /> Internal Notes (Optional)</label>
                    <textarea rows={2} value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-gray-900 shadow-sm placeholder:text-gray-400" placeholder="Private notes..." />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleUpdate} disabled={actionLoading} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-w-[140px]">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Changes</>}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-4">
                      <Clock className="w-6 h-6 text-blue-500 opacity-60 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Time Logged</p>
                        <p className="text-lg font-bold text-gray-900 leading-none">{entry.hours || '0'} hrs</p>
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center gap-4">
                      <IndianRupee className="w-6 h-6 text-zinc-500 opacity-60 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-0.5">Hourly Rate</p>
                        <p className="text-lg font-bold text-gray-900 leading-none">₹ {entry.hourly_rate || '0'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Activity Date
                      </p>
                      <p className="text-gray-900 font-medium text-sm">{entry.date}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Type
                      </p>
                      <p className="text-gray-900 font-medium text-sm uppercase">{entry.activity_type?.replace('_', ' ')}</p>
                    </div>
                  </div>

                   {entry.case_title && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center shadow-sm shrink-0"><Briefcase className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Associated Case</p>
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">{entry.case_title}</h4>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-800" />
                    </div>
                  )}

                  {entry.description && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <AlignLeft className="w-3.5 h-3.5" /> Description
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        {entry.description}
                      </p>
                    </div>
                  )}

                  {entry.notes && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <StickyNote className="w-3.5 h-3.5" /> Internal Notes
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                        {entry.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-start">
                    <button onClick={() => handleAction('delete')} disabled={actionLoading || entry.status === 'invoiced'} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Trash2 className="w-4 h-4" /><span>Delete Record</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
