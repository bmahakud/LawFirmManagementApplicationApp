'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Gavel, User, Users, Store, AlertCircle, Loader2, CheckCircle2, FileText, ChevronDown, Save, X, Hash, MapPin, Layers, Building2, Check, Scale } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Panel, SplitPanels, classNames } from './ui';

interface Option {
  value: string;
  label: string;
}

export default function CaseAddForm({ initialCategory }: { initialCategory?: 'pre_litigation' | 'court_case' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // -- Determine initial category --
  const urlCategory = searchParams.get('category') as any;
  const targetCategory = initialCategory || urlCategory || 'court_case';

  // -- State --
  const [form, setForm] = useState({
    case_title: '',
    case_number: '',
    case_type: 'intellectual property',
    category: targetCategory,
    client: '',
    status: 'open',
    priority: 'medium',
    billing_type: 'hourly',
    estimated_value: '',
    assigned_advocate: '',
    branch: '',
    court_name: '',
    filing_date: new Date().toISOString().split('T')[0],
    respondent_name: '',
    opposing_counsel: '',
    description: '',
    stage: 'case_filing'
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [fetchingData, setFetchingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [options, setOptions] = useState<{
    clients: Option[];
    advocates: Option[];
    branches: Option[];
  }>({
    clients: [],
    advocates: [],
    branches: []
  });

  // Sync category if URL param changes
  useEffect(() => {
    if (urlCategory && urlCategory !== form.category) {
      setForm(p => ({ ...p, category: urlCategory }));
    }
  }, [urlCategory]);

  // -- Fetch Options (Clients, Advocates, Branches) --
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        // Using the user-specified /api/accounts/users/ endpoint via standardized USERS.LIST
        const [clientsRes, advocatesRes, branchesRes] = await Promise.all([
          customFetch(`${API.USERS.LIST}?user_type=client`),
          customFetch(`${API.USERS.LIST}?user_type=advocate`),
          customFetch(API.FIRMS.BRANCHES.LIST)
        ]);

        const [clientsData, advocatesData, branchesData] = await Promise.all([
          clientsRes.json(),
          advocatesRes.json(),
          branchesRes.json()
        ]);

        const format = (list: any) => 
          (list.results || list).map((item: any) => ({
            value: item.id || item.uuid,
            label: item.full_name || item.get_full_name || `${item.first_name} ${item.last_name || ''}`.trim() || item.username || item.branch_name || item.name
          }));

        setOptions({
          clients: format(clientsData),
          advocates: format(advocatesData),
          branches: format(branchesData)
        });
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to load necessary form data. Please try again.");
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const set = (key: string, val: any) => {
    setForm(p => ({ ...p, [key]: val }));
    if (fieldErrors[key]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[key];
      setFieldErrors(newErrors);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await customFetch(API.CASES.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        if (typeof data === 'object' && !data.detail) {
          setFieldErrors(data);
          throw new Error('Please check the highlighted fields.');
        }
        throw new Error(data.detail || 'Failed to register case.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/super-admin/cases/${form.category}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
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
        <h3 className="text-xl font-bold text-gray-900">Matter Registered Successfully</h3>
        <p className="text-sm text-gray-400 mt-2">Opening case file and updating ledger…</p>
      </div>
    );
  }

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-[#984c1f]" />
        <p className="mt-4 text-sm font-semibold text-gray-500 tracking-wide">Initializing Case Form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <SplitPanels
          left={
            <div className="space-y-6">
              {/* Matter Identity */}
              <Panel title="Matter Identity" subtitle="Primary title and legal classification.">
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Case Title *</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#984c1f] transition-colors" />
                      <input
                        required
                        value={form.case_title}
                        onChange={e => set('case_title', e.target.value)}
                        placeholder="e.g. IP Case - Emily Chen"
                        className={classNames(
                          "h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold outline-none transition-all",
                          fieldErrors.case_title ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#984c1f] focus:ring-4 focus:ring-[#984c1f]/5"
                        )}
                      />
                    </div>
                    {fieldErrors.case_title && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.case_title[0]}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Case Number</label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={form.case_number}
                          onChange={e => set('case_number', e.target.value)}
                          placeholder="2026-IP-003"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Case Type</label>
                      <div className="relative group">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          value={form.case_type}
                          onChange={e => set('case_type', e.target.value)}
                          placeholder="e.g. Intellectual Property"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Personnel */}
              <Panel title="Assignments" subtitle="Clients and personnel allocation.">
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Client *</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        required
                        value={form.client}
                        onChange={e => set('client', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] focus:ring-4 focus:ring-[#984c1f]/5 transition-all"
                      >
                        <option value="">Select a Client</option>
                        {options.clients.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assigned Advocate</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          required
                          value={form.assigned_advocate}
                          onChange={e => set('assigned_advocate', e.target.value)}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        >
                          <option value="">Select Advocate</option>
                          {options.advocates.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Branch</label>
                      <div className="relative group">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          required
                          value={form.branch}
                          onChange={e => set('branch', e.target.value)}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        >
                          <option value="">Select Branch</option>
                          {options.branches.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Court Details */}
              <Panel title="Court Information" subtitle="Legal jurisdiction and timeline.">
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Court Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={form.court_name}
                        onChange={e => set('court_name', e.target.value)}
                        placeholder="e.g. High Court"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Filing Date</label>
                      <input
                        type="date"
                        value={form.filing_date}
                        onChange={e => set('filing_date', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Opposing Counsel</label>
                      <input
                        value={form.opposing_counsel}
                        onChange={e => set('opposing_counsel', e.target.value)}
                        placeholder="Counsel Name"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Respondent Name</label>
                    <input
                      value={form.respondent_name}
                      onChange={e => set('respondent_name', e.target.value)}
                      placeholder="Opposing Party Name"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                    />
                  </div>
                </div>
              </Panel>
            </div>
          }
          right={
            <div className="space-y-6">
              {/* Financials & Logic */}
              <Panel title="Economics & Status" subtitle="Priority, billing, and current stage.">
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4 text-center">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 text-left">Priority</label>
                      <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        {['low', 'medium', 'high'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => set('priority', p)}
                            className={classNames(
                              "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                              form.priority === p ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 text-left">Status</label>
                      <select
                        value={form.status}
                        onChange={e => set('status', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Billing Type</label>
                      <select
                        value={form.billing_type}
                        onChange={e => set('billing_type', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="flat_fee">Flat Fee</option>
                        <option value="retainer">Retainer</option>
                        <option value="contingency">Contingency</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Value (Est.)</label>
                      <input
                        type="text"
                        value={form.estimated_value}
                        onChange={e => set('estimated_value', e.target.value)}
                        placeholder="45000.00"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Description */}
              <Panel title="Documentation" subtitle="Brief summary and context.">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Matter Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder="e.g. Filing patent for new biotech innovation..."
                      rows={5}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none"
                    />
                  </div>
                </div>
              </Panel>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-12 flex items-center justify-center gap-2 rounded-xl bg-[#0e2340] text-white font-bold text-sm hover:bg-[#162d4d] transition-all shadow-lg shadow-[#0e2340]/10 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Register Matter
                </button>
              </div>
            </div>
          }
        />
      </form>
    </div>
  );
}
