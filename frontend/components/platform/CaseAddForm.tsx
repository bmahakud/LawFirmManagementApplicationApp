'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Gavel, User, Users, Store, AlertCircle, Loader2, CheckCircle2, FileText, ChevronDown, Save, X, Hash, MapPin, Layers, Building2, Check, Scale, FileCheck } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Panel, SplitPanels, classNames } from './ui';

interface Option {
  value: string;
  label: string;
}

const STATE_OPTIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function optionLabel(item: any): string {
  const fullName = item.full_name || item.get_full_name;
  const firstLast = [item.first_name, item.last_name].filter(Boolean).join(' ').trim();
  return fullName || firstLast || item.username || item.branch_name || item.name || item.id || item.uuid || 'Unknown';
}

function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

// ─── Mandatory Fields Mapping ───────────────────────────────────────────────
const MANDATORY_FIELDS = {
  case_title: true,
  case_type: true,
  client: true,
  assigned_advocate: true,
  branch: true,
};

const FIELD_GROUPS = {
  matter_identity: ['case_title', 'case_number', 'case_type'],
  assignments: ['client', 'assigned_advocate', 'branch'],
  court_details: ['court_name', 'filing_date', 'opposing_counsel', 'respondent_name'],
  economics: ['priority', 'status', 'billing_type', 'estimated_value'],
  documentation: ['description'],
};

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
    assigned_paralegal: '',
    branch: '',
    court_name: '',
    filing_date: new Date().toISOString().split('T')[0],
    respondent_name: '',
    opposing_counsel: '',
    description: '',
    stage: 'case_filing',
    case_summary: '',
    payment_terms: '',
    loe_notes: '',
    petitioner_name: '',
    court_no: '',
    judge_name: '',
    district: '',
    state: '',
    representing: '',
    cnr_number: '',
    next_hearing_date: '',
    additional_expenses: '',
    total_fee: '',
    hearing_fee: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [fetchingData, setFetchingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [options, setOptions] = useState<{
    clients: Option[];
    advocates: Option[];
    paralegals: Option[];
    branches: Option[];
  }>({
    clients: [],
    advocates: [],
    paralegals: [],
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
        const [clientsRes, advocatesRes, paralegalsRes, branchesRes] = await Promise.all([
          customFetch(`${API.USERS.LIST}?user_type=client`),
          customFetch(`${API.USERS.LIST}?user_type=advocate`),
          customFetch(`${API.USERS.LIST}?user_type=paralegal`),
          customFetch(API.FIRMS.BRANCHES.LIST)
        ]);

        const [clientsData, advocatesData, paralegalsData, branchesData] = await Promise.all([
          clientsRes.json(),
          advocatesRes.json(),
          paralegalsRes.json(),
          branchesRes.json()
        ]);

        const format = (list: any) =>
          (list.results || list).map((item: any) => ({
            value: item.id || item.uuid,
            label: optionLabel(item)
          }));

        setOptions({
          clients: format(clientsData),
          advocates: format(advocatesData),
          paralegals: format(paralegalsData),
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
      const optionalStringFields = [
        'court_name', 'description', 'opposing_counsel',
        'respondent_name', 'case_number', 'court_no', 'judge_name',
        'district', 'state', 'representing', 'cnr_number', 'case_summary',
        'payment_terms', 'loe_notes', 'petitioner_name', 'next_hearing_date',
        'assigned_paralegal',
      ];
      const payload: Record<string, any> = { ...form };

      optionalStringFields.forEach((field) => {
        if (payload[field] === '') payload[field] = null;
      });

      if (payload.estimated_value === '' || payload.estimated_value === null) {
        payload.estimated_value = null;
      } else {
        const parsed = parseFloat(payload.estimated_value);
        payload.estimated_value = isNaN(parsed) ? null : parsed;
      }

      if (payload.total_fee === '' || payload.total_fee === null) {
        payload.total_fee = null;
      } else {
        const parsed = parseFloat(payload.total_fee);
        payload.total_fee = isNaN(parsed) ? null : parsed;
      }

      if (payload.hearing_fee === '' || payload.hearing_fee === null) {
        payload.hearing_fee = null;
      } else {
        const parsed = parseFloat(payload.hearing_fee);
        payload.hearing_fee = isNaN(parsed) ? null : parsed;
      }

      if (payload.additional_expenses === '' || payload.additional_expenses === null) {
        payload.additional_expenses = null;
      } else {
        const parsed = parseFloat(payload.additional_expenses);
        payload.additional_expenses = isNaN(parsed) ? null : parsed;
      }

      const response = await customFetch(API.CASES.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const FieldLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
      {children}
      {required && <span className="text-red-500 text-xs">*</span>}
    </label>
  );

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
                    <FieldLabel required={MANDATORY_FIELDS.case_title}>Case Title</FieldLabel>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#984c1f] transition-colors" />
                      <input
                        required
                        value={form.case_title}
                        onChange={e => set('case_title', e.target.value)}
                        placeholder="e.g. IP Case - Emily Chen"
                        className={classNames(
                          "h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold text-gray-900 outline-none transition-all",
                          fieldErrors.case_title ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#984c1f] focus:ring-4 focus:ring-[#984c1f]/5"
                        )}
                      />
                    </div>
                    {fieldErrors.case_title && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.case_title[0]}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Case Number</FieldLabel>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={form.case_number}
                          onChange={e => set('case_number', e.target.value)}
                          placeholder="2026-IP-003"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel required={MANDATORY_FIELDS.case_type}>Case Type</FieldLabel>
                      <div className="relative group">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          value={form.case_type}
                          onChange={e => set('case_type', e.target.value)}
                          placeholder="e.g. Intellectual Property"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Category</FieldLabel>
                      <select
                        value={form.category}
                        onChange={e => set('category', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      >
                        <option value="pre_litigation">Pre-litigation</option>
                        <option value="court_case">Court Case</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Stage</FieldLabel>
                      <select
                        value={form.stage}
                        onChange={e => set('stage', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      >
                        <option value="initial_consultation">Initial Consultation and Case Assessment</option>
                        <option value="document_collection">Document Collection</option>
                        <option value="case_research">Case Research and Analysis</option>
                        <option value="notice_drafting">Notice / Legal Drafting</option>
                        <option value="negotiation">Negotiation / Mediation</option>
                        <option value="case_filing">Case Filing</option>
                        <option value="hearing">Hearing</option>
                        <option value="evidence">Evidence and Arguments</option>
                        <option value="judgment">Judgment / Order</option>
                        <option value="appeal">Appeal</option>
                        <option value="execution">Execution / Compliance</option>
                        <option value="closed">Case Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Personnel */}
              <Panel title="Assignments" subtitle="Clients and personnel allocation.">
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required={MANDATORY_FIELDS.client}>Client</FieldLabel>
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
                      <FieldLabel required={MANDATORY_FIELDS.assigned_advocate}>Assigned Advocate</FieldLabel>
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
                      <FieldLabel>Assigned Paralegal</FieldLabel>
                      <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={form.assigned_paralegal}
                          onChange={e => set('assigned_paralegal', e.target.value)}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        >
                          <option value="">Select Paralegal</option>
                          {options.paralegals.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel required={MANDATORY_FIELDS.branch}>Branch</FieldLabel>
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
                    <FieldLabel>Court Name</FieldLabel>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={form.court_name}
                        onChange={e => set('court_name', e.target.value)}
                        placeholder="e.g. High Court"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Filing Date</FieldLabel>
                      <input
                        type="date"
                        value={form.filing_date}
                        onChange={e => set('filing_date', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Opposing Counsel</FieldLabel>
                      <input
                        value={form.opposing_counsel}
                        onChange={e => set('opposing_counsel', e.target.value)}
                        placeholder="Counsel Name"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Respondent Name</FieldLabel>
                    <input
                      value={form.respondent_name}
                      onChange={e => set('respondent_name', e.target.value)}
                      placeholder="Opposing Party Name"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Court No.</FieldLabel>
                      <input
                        value={form.court_no}
                        onChange={e => set('court_no', e.target.value)}
                        placeholder="Room 4"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Judge Name</FieldLabel>
                      <input
                        value={form.judge_name}
                        onChange={e => set('judge_name', e.target.value)}
                        placeholder="Hon. Justice..."
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>District</FieldLabel>
                      <input
                        value={form.district}
                        onChange={e => set('district', e.target.value)}
                        placeholder="District"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>State</FieldLabel>
                      <select
                        value={form.state}
                        onChange={e => set('state', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      >
                        <option value="">Select State</option>
                        {STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>CNR Number</FieldLabel>
                      <input
                        value={form.cnr_number}
                        onChange={e => set('cnr_number', e.target.value)}
                        placeholder="CNR..."
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Representing</FieldLabel>
                      <select
                        value={form.representing}
                        onChange={e => set('representing', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      >
                        <option value="">Select Party</option>
                        <option value="petitioner">Petitioner</option>
                        <option value="respondent">Respondent</option>
                      </select>
                    </div>
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
                      <FieldLabel>Priority</FieldLabel>
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
                      <FieldLabel>Status</FieldLabel>
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
                      <FieldLabel>Billing Type</FieldLabel>
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
                      <FieldLabel>Value (Est.)</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={form.estimated_value}
                          onChange={e => set('estimated_value', sanitizeDecimalInput(e.target.value))}
                          placeholder="45000.00"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Total Fee</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={form.total_fee}
                          onChange={e => set('total_fee', sanitizeDecimalInput(e.target.value))}
                          placeholder="80000.00"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Hearing Fee</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={form.hearing_fee}
                          onChange={e => set('hearing_fee', sanitizeDecimalInput(e.target.value))}
                          placeholder="5000.00"
                          className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Payment Terms</FieldLabel>
                      <input
                        value={form.payment_terms}
                        onChange={e => set('payment_terms', e.target.value)}
                        placeholder="50% upfront"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Additional Expenses</FieldLabel>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={form.additional_expenses}
                        onChange={e => set('additional_expenses', sanitizeDecimalInput(e.target.value))}
                        placeholder="1200.00"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Description */}
              <Panel title="Documentation" subtitle="Brief summary and context.">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Matter Description</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder="e.g. Filing patent for new biotech innovation..."
                      rows={5}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Case Summary</FieldLabel>
                    <textarea
                      value={form.case_summary}
                      onChange={e => set('case_summary', e.target.value)}
                      placeholder="Legal summary for internal reference..."
                      rows={5}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>LOE Notes</FieldLabel>
                    <textarea
                      value={form.loe_notes}
                      onChange={e => set('loe_notes', e.target.value)}
                      placeholder="Letter of engagement notes..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Petitioner Name</FieldLabel>
                    <input
                      value={form.petitioner_name}
                      onChange={e => set('petitioner_name', e.target.value)}
                      placeholder="Petitioner name"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Next Hearing Date</FieldLabel>
                    <input
                      type="date"
                      value={form.next_hearing_date}
                      onChange={e => set('next_hearing_date', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all"
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