'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Gavel, User, Users, Store, AlertCircle, Loader2, CheckCircle2, FileText, ChevronDown, Save, X, Hash, MapPin, Layers, Building2, Check, Scale, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Panel, classNames } from './ui';
import CaseTypeSelect from './CaseTypeSelect';

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
  branch: false, // optional for solo advocates
};

const STEPS = [
  { id: 'court', title: 'Court', description: 'Jurisdiction', icon: Building2 },
  { id: 'identity', title: 'Identity', description: 'Legal Classification', icon: Scale },
  { id: 'assignments', title: 'Personnel', description: 'Branch & Staff', icon: Users },
  { id: 'economics', title: 'Finalize', description: 'Financials & Docs', icon: FileCheck },
];

export default function CaseAddForm({ 
  initialCategory,
  redirectBase = '/super-admin/cases'
}: { 
  initialCategory?: 'pre_litigation' | 'court_case',
  redirectBase?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // -- Determine initial category --
  const urlCategory = searchParams.get('category') as any;
  const targetCategory = initialCategory || urlCategory || 'court_case';

  // -- Wizard State --
  const [currentStep, setCurrentStep] = useState(0);

  // -- State --
  const [form, setForm] = useState({
    case_title: '',
    case_number: '',
    is_registered: true,
    registration_number: '',
    case_type: '',
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

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdvocate, setIsAdvocate] = useState(false);
  const [isFirmAdmin, setIsFirmAdmin] = useState(false);

  // Get current user details
  useEffect(() => {
    const userStr = localStorage.getItem('user_details');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsAdvocate(user.user_type === 'advocate');
        setIsFirmAdmin(user.user_type === 'admin');
        
        // If user is advocate, auto-assign them
        if (user.user_type === 'advocate' && user.id) {
          setForm(p => ({ ...p, assigned_advocate: user.id }));
        }
      } catch (e) {
        console.error('Error parsing user details:', e);
      }
    }
  }, []);

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

        // Advocates see only their own clients; others see all
        const clientsUrl = isAdvocate
          ? API.CLIENTS.MY_CLIENTS
          : `${API.USERS.LIST}?user_type=client`;

        const [clientsRes, advocatesRes, paralegalsRes, branchesRes] = await Promise.all([
          customFetch(clientsUrl),
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

        const formatUser = (list: any) =>
          (list.results || list).map((item: any) => ({
            value: item.id || item.uuid,
            label: optionLabel(item)
          }));

        // my-clients returns Client records with user_account nested
        const formatClients = (list: any) => {
          const arr = list.results || list;
          return arr.map((item: any) => {
            const name = [item.first_name, item.last_name].filter(Boolean).join(' ').trim()
              || item.user_account?.first_name + ' ' + item.user_account?.last_name
              || item.email || 'Unknown';
            const id = item.user_account?.id || item.id;
            return { value: id, label: name };
          });
        };

        const branchOptions = formatUser(branchesData);
        setOptions({
          clients: isAdvocate ? formatClients(clientsData) : formatUser(clientsData),
          advocates: formatUser(advocatesData),
          paralegals: formatUser(paralegalsData),
          branches: branchOptions
        });

        // Auto-select branch
        if (!form.branch && branchOptions.length > 0) {
          // 1. Check if user has an assigned branch in their details
          const userBranchId = currentUser?.branch_id || 
                             currentUser?.branch ||
                             currentUser?.branch_uuid ||
                             currentUser?.available_firms?.find((m: any) => m.is_active || m.branch)?.branch ||
                             currentUser?.available_firms?.find((m: any) => m.is_active)?.branch_id;
          
          if (userBranchId) {
            const match = branchOptions.find((b: Option) => b.value === userBranchId);
            if (match) {
              setForm(p => ({ ...p, branch: match.value }));
            }
          } 
          // 2. Fallback: Auto-select if only one branch exists
          else if (branchOptions.length === 1) {
            setForm(p => ({ ...p, branch: branchOptions[0].value }));
          }
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to load necessary form data. Please try again.");
      } finally {
        setFetchingData(false);
      }
    };
    // Wait until we know if user is advocate
    if (currentUser !== null) fetchData();
  }, [currentUser, isAdvocate]);

  const set = (key: string, val: any) => {
    setForm(p => ({ ...p, [key]: val }));
    if (fieldErrors[key]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[key];
      setFieldErrors(newErrors);
    }
  };

  const nextStep = () => {
    setError(null);
    setFieldErrors({});
    let hasError = false;
    const newErrors: Record<string, string[]> = {};
    const missing: string[] = [];

    if (currentStep === 1) {
      if (!form.case_title) {
        newErrors.case_title = ["Case Title is required."];
        missing.push("Case Title");
        hasError = true;
      }
      if (!form.case_type) {
        newErrors.case_type = ["Case Type is required."];
        missing.push("Case Type");
        hasError = true;
      }
    } else if (currentStep === 2) {
      if (!form.client) {
        newErrors.client = ["Client is required."];
        missing.push("Client");
        hasError = true;
      }
      if (!form.assigned_advocate) {
        newErrors.assigned_advocate = ["Assigned Advocate is required."];
        missing.push("Assigned Advocate");
        hasError = true;
      }
      // Branch is only required for firm advocates (who have branches)
      if (!isAdvocate && !form.branch && options.branches.length > 0) {
        newErrors.branch = ["Branch is required."];
        missing.push("Branch");
        hasError = true;
      }
    }

    if (hasError) {
      setFieldErrors(newErrors);
      setError(`Please fill ${missing.join(', ')} to continue.`);
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    setCurrentStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const optionalStringFields = [
        'court_name', 'description', 'opposing_counsel',
        'respondent_name', 'case_number', 'registration_number', 'court_no', 'judge_name',
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
          const errorKeys = Object.keys(data);
          
          const formatField = (key: string) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const missingFields = errorKeys.map(formatField).join(', ');

          if (errorKeys.some(k => ['court_name', 'filing_date', 'respondent_name'].includes(k))) {
            setCurrentStep(0);
          } else if (errorKeys.some(k => ['case_title', 'case_type', 'case_number', 'category'].includes(k))) {
            setCurrentStep(1);
          } else if (errorKeys.some(k => ['client', 'assigned_advocate', 'branch'].includes(k))) {
            setCurrentStep(2);
          } else {
            setCurrentStep(3);
          }
          throw new Error(`Please fill ${missingFields} to continue.`);
        }
        throw new Error(data.detail || 'Failed to register case.');
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect to the detail page of the newly created case
        router.push(`${redirectBase}/${data.id || data.uuid}`);
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
        <Loader2 className="h-10 w-10 animate-spin text-[#0e2340]" />
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

  const StepIndicator = () => (
    <div className="mb-20">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-[#0e2340] -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          const Icon = step.icon;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isCompleted && !isActive}
                onClick={() => isCompleted && setCurrentStep(idx)}
                className={classNames(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
                  isActive 
                    ? "bg-[#0e2340] border-[#0e2340] text-white shadow-xl shadow-[#0e2340]/20 scale-110" 
                    : isCompleted 
                      ? "bg-white border-[#0e2340] text-[#0e2340]" 
                      : "bg-white border-gray-100 text-gray-300"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </button>
              <div className="absolute top-16 text-center w-32">
                <p className={classNames(
                  "text-[10px] font-bold uppercase tracking-widest transition-colors",
                  isActive ? "text-[#0e2340]" : "text-gray-400"
                )}>
                  {step.title}
                </p>
                {isActive && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] text-gray-400 mt-0.5 font-medium">
                    {step.description}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <Panel title="Matter Identity" subtitle="Primary title and legal classification.">
              <div className="space-y-5">
                {/* Field 1: Case Type (Dropdown at Top) */}
                <CaseTypeSelect
                  required={MANDATORY_FIELDS.case_type}
                  value={form.case_type}
                  onChange={val => set('case_type', val)}
                  error={fieldErrors.case_type ? fieldErrors.case_type[0] : undefined}
                />

                {/* Field 2: Case Title */}
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required={MANDATORY_FIELDS.case_title}>Case Title</FieldLabel>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <input
                      required
                      value={form.case_title}
                      onChange={e => set('case_title', e.target.value)}
                      placeholder="e.g. IP Case - Emily Chen"
                      className={classNames(
                        "h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold text-gray-900 outline-none transition-all",
                        fieldErrors.case_title ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                      )}
                    />
                  </div>
                  {fieldErrors.case_title && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.case_title[0]}</p>}
                </div>

                {/* Field 3: Advocate Internal Case Number */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Case Number</FieldLabel>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      Advocate / Matter Ref
                    </span>
                  </div>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <input
                      value={form.case_number}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(prev => {
                          const year = new Date().getFullYear();
                          // If user is unregistered and hasn't manually customized diary no, auto-reflect base ref
                          const isAutoDiary = !prev.is_registered && (!prev.registration_number || prev.registration_number.startsWith('D_'));
                          return {
                            ...prev,
                            case_number: val,
                            registration_number: isAutoDiary ? `D_${val.trim() || '101'}_${year}` : prev.registration_number
                          };
                        });
                      }}
                      placeholder="e.g. 2026-TS-67 or MURD999"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 pl-1">
                    Internal advocate matter / case number (shown in Assigned Matters list).
                  </p>
                </div>

                {/* Field 2: Registration Status & Court / Diary No. (Completely Optional) */}
                <div className="flex flex-col gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <FieldLabel>Court Registration Status & Filing No.</FieldLabel>
                      <p className="text-[11px] text-slate-500 mt-0.5">Completely optional at case creation — can be added or updated later.</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 uppercase tracking-wider">
                      Optional
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          is_registered: true,
                          registration_number: prev.registration_number?.startsWith('D_') ? '' : prev.registration_number
                        }));
                      }}
                      className={classNames(
                        "h-10 rounded-xl px-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border",
                        form.is_registered
                          ? "bg-[#0e2340] text-white border-[#0e2340] shadow-sm shadow-[#0e2340]/10"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Registered Case
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const year = new Date().getFullYear();
                        const baseRef = form.case_number?.trim() || '101';
                        setForm(prev => ({
                          ...prev,
                          is_registered: false,
                          registration_number: prev.registration_number && prev.registration_number.startsWith('D_')
                            ? prev.registration_number
                            : `D_${baseRef}_${year}`
                        }));
                      }}
                      className={classNames(
                        "h-10 rounded-xl px-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border",
                        !form.is_registered
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/10"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <Hash className="w-3.5 h-3.5" />
                      Unregistered (Diary)
                    </button>
                  </div>

                  {/* Registration / Diary Number input */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <FieldLabel>
                        {form.is_registered ? 'Court Registration / Case No. (Optional)' : 'Diary / Unregistered No. (Auto D_ Prefix)'}
                      </FieldLabel>
                      {!form.is_registered && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          Prefix D_ applied (Editable)
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                      <input
                        value={form.registration_number}
                        onChange={e => setForm(prev => ({ ...prev, registration_number: e.target.value }))}
                        placeholder={form.is_registered ? "e.g. WP/452/2026 or leave blank for now" : `D_${form.case_number?.trim() || '101'}_${new Date().getFullYear()}`}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-white pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 pl-1">
                      {form.is_registered
                        ? 'Leave blank if not yet registered in court, or enter the formal court number.'
                        : 'Auto-formatted as (D_case no_case year). You can freely edit this number.'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Category</FieldLabel>
                    <select
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                      className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
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
                      className={classNames(
                        "h-11 w-full appearance-none rounded-xl border pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none transition-all",
                        fieldErrors.client ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                      )}
                    >
                      <option value="">Select a Client</option>
                      {options.clients.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {fieldErrors.client && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.client[0]}</p>}
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
                        disabled={isAdvocate}
                        className={classNames(
                          "h-11 w-full appearance-none rounded-xl border pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none transition-all",
                          isAdvocate ? 'bg-gray-100 cursor-not-allowed opacity-75' : '',
                          fieldErrors.assigned_advocate ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                        )}
                      >
                        <option value="">Select Advocate</option>
                        {options.advocates.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {fieldErrors.assigned_advocate && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.assigned_advocate[0]}</p>}
                    {isAdvocate && (
                      <p className="text-xs text-gray-500 mt-1">
                        You are automatically assigned as the advocate for this case
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Assigned Paralegal</FieldLabel>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={form.assigned_paralegal}
                        onChange={e => set('assigned_paralegal', e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                      >
                        <option value="">Select Paralegal</option>
                        {options.paralegals.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {options.branches.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Branch</FieldLabel>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={form.branch}
                        onChange={e => set('branch', e.target.value)}
                        disabled={isFirmAdmin && !!form.branch}
                        className={classNames(
                          "h-11 w-full appearance-none rounded-xl border pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none transition-all",
                          (isFirmAdmin && !!form.branch) ? 'bg-gray-100 cursor-not-allowed opacity-75' : '',
                          fieldErrors.branch ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5"
                        )}
                      >
                        <option value="">Select Branch</option>
                        {options.branches.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {fieldErrors.branch && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.branch[0]}</p>}
                    {isFirmAdmin && form.branch && (
                      <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                        Matter locked to your assigned branch
                      </p>
                    )}
                  </div>
                  )}
                </div>
              </div>
            </Panel>
          </motion.div>
        );
      case 0:
        return (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
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
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Opposing Counsel</FieldLabel>
                    <input
                      value={form.opposing_counsel}
                      onChange={e => set('opposing_counsel', e.target.value)}
                      placeholder="Counsel Name"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Respondent Name</FieldLabel>
                  <input
                    value={form.respondent_name}
                    onChange={e => set('respondent_name', e.target.value)}
                    placeholder="Opposing Party Name"
                    className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Court No.</FieldLabel>
                    <input
                      value={form.court_no}
                      onChange={e => set('court_no', e.target.value)}
                      placeholder="Room 4"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Judge Name</FieldLabel>
                    <input
                      value={form.judge_name}
                      onChange={e => set('judge_name', e.target.value)}
                      placeholder="Hon. Justice..."
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>State</FieldLabel>
                    <select
                      value={form.state}
                      onChange={e => set('state', e.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Representing</FieldLabel>
                    <select
                      value={form.representing}
                      onChange={e => set('representing', e.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    >
                      <option value="">Select Party</option>
                      <option value="petitioner">Petitioner</option>
                      <option value="respondent">Respondent</option>
                    </select>
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <Panel title="Economics & Documentation" subtitle="Priority, billing, and summary.">
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
                      className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                      className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
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
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Matter Description</FieldLabel>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="e.g. Filing patent for new biotech innovation..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Petitioner Name</FieldLabel>
                    <input
                      value={form.petitioner_name}
                      onChange={e => set('petitioner_name', e.target.value)}
                      placeholder="Petitioner name"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Next Hearing Date</FieldLabel>
                    <input
                      type="date"
                      value={form.next_hearing_date}
                      onChange={e => set('next_hearing_date', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#0e2340] transition-all"
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 mt-8">
      <StepIndicator />

      <div className="mt-12">
        {error && (
          <div className="mb-6 px-6 py-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={currentStep === 0 ? () => router.back() : prevStep}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-[#0e2340] hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>

          <button
            type="button"
            onClick={nextStep}
            disabled={loading}
            className="px-8 py-3.5 rounded-xl shadow-lg text-[15px] font-bold text-white bg-[#0e2340] hover:bg-[#1a3a5c] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentStep === STEPS.length - 1 ? (
              <>Register Matter <Check className="w-4 h-4" /></>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}