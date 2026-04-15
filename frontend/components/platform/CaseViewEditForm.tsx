'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Briefcase, User, Users, Store, AlertCircle, Loader2, CheckCircle2,
  ChevronDown, Save, X, Hash, Building2, Scale, ArrowLeft, Pencil,
  Calendar, Activity, FileText, Gavel, Clock, Copy, Check,
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Panel, SplitPanels, classNames } from './ui';
import Link from 'next/link';
import { useTopbarTitle } from './TopbarContext';

// ─── types ───────────────────────────────────────────────────────────────────
interface Option { value: string; label: string }

const STATE_OPTIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ─── Mandatory Fields ──────────────────────────────────────────────────────
const MANDATORY_FIELDS = {
  case_title: true,
  case_type: true,
  client: true,
  assigned_advocate: true,
  branch: true,
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const BADGE: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
  pre_litigation: 'bg-purple-50 text-purple-700 border-purple-200',
  court_case: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  case_filing: 'bg-sky-50 text-sky-700 border-sky-200',
  evidence: 'bg-orange-50 text-orange-700 border-orange-200',
  arguments: 'bg-rose-50 text-rose-700 border-rose-200',
  judgment: 'bg-violet-50 text-violet-700 border-violet-200',
  disposed: 'bg-gray-50 text-gray-600 border-gray-200',
  hourly: 'bg-blue-50 text-blue-700 border-blue-200',
  flat_fee: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  retainer: 'bg-purple-50 text-purple-700 border-purple-200',
  contingency: 'bg-pink-50 text-pink-700 border-pink-200',
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={classNames(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize',
      BADGE[value] ?? 'bg-gray-100 text-gray-500 border-gray-200',
    )}>
      {value?.replace(/_/g, ' ')}
    </span>
  );
}

function InfoRow({ label, value, copyable = false }: { label: string; value?: React.ReactNode; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          {value || <span className="text-gray-300 italic text-xs">—</span>}
        </span>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function fmt(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

function formatCurrency(value?: string | number | null) {
  if (!value) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeDateInput(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0];
}

function ensureOption(options: Option[], value?: string | null, label?: string | null): Option[] {
  if (!value) return options;
  if (options.some((o) => o.value === value)) return options;
  return [...options, { value, label: label || value }];
}

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

function normalizeNumericInput(value?: string | number | null): string {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return /^\d*\.?\d*$/.test(text) ? text : '';
}

async function fetchDropdownOptions() {
  const [clientsRes, advocatesRes, paralegalsRes, branchesRes] = await Promise.all([
    customFetch(`${API.USERS.LIST}?user_type=client`),
    customFetch(`${API.USERS.LIST}?user_type=advocate`),
    customFetch(`${API.USERS.LIST}?user_type=paralegal`),
    customFetch(API.FIRMS.BRANCHES.LIST),
  ]);
  const [clientsData, advocatesData, paralegalsData, branchesData] = await Promise.all([
    clientsRes.json(), advocatesRes.json(), paralegalsRes.json(), branchesRes.json(),
  ]);
  const format = (list: any): Option[] =>
    (list.results || list).map((item: any) => ({
      value: item.id || item.uuid,
      label: optionLabel(item),
    }));
  return {
    clients: format(clientsData),
    advocates: format(advocatesData),
    paralegals: format(paralegalsData),
    branches: format(branchesData),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CaseViewForm  — read-only detail view with complete metadata
// ═══════════════════════════════════════════════════════════════════════════
export function CaseViewForm({ editBase }: { editBase: string }) {
  const params = useParams();
  const caseId = params?.caseId as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [paralegalName, setParalegalName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Push dynamic title into topbar once case is loaded
  useTopbarTitle(
    caseData?.case_title ?? '',
    caseData ? `Case • ${(caseData.category ?? '').replace('_', ' ')}` : '',
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await customFetch(API.CASES.DETAIL(caseId));
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to fetch case.');
        setCaseData(data);
        if (data.assigned_paralegal) {
          if (data.paralegal_name) {
            setParalegalName(data.paralegal_name);
          } else {
            try {
              const userRes = await customFetch(API.USERS.DETAIL(data.assigned_paralegal));
              const userData = await userRes.json();
              if (userRes.ok) {
                setParalegalName(
                  userData.full_name ||
                  `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
                  userData.username ||
                  data.assigned_paralegal,
                );
              } else {
                setParalegalName(data.assigned_paralegal);
              }
            } catch {
              setParalegalName(data.assigned_paralegal);
            }
          }
        } else {
          setParalegalName(null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (caseId) load();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-[#984c1f]" />
        <p className="mt-4 text-sm font-semibold text-gray-500 tracking-wide">Loading Case…</p>
      </div>
    );
  }
  if (error || !caseData) {
    return (
      <div className="p-12 text-center bg-red-50 border border-red-100 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-red-600">{error ?? 'Case not found.'}</p>
      </div>
    );
  }

  const c = caseData;

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/super-admin/cases/${c.category === 'pre_litigation' ? 'pre-litigation' : 'court-case'}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>
        <Link
          href={`${editBase}/${caseId}/edit`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0e2340] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#162d4d] transition-all shadow-sm"
        >
          <Pencil className="w-4 h-4" />
          Edit Case
        </Link>
      </div>

      <SplitPanels
        left={
          <div className="space-y-6">
            {/* Matter Identity */}
            <Panel title="Matter Identity" subtitle="Primary title and legal classification.">
              <div className="space-y-4">
                <InfoRow label="Case Title" value={c.case_title} copyable />
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Case Number" value={c.case_number} copyable />
                  <InfoRow label="Case Type" value={c.case_type} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Category" value={<StatusBadge value={c.category} />} />
                  <InfoRow label="Stage" value={<StatusBadge value={c.stage} />} />
                </div>
                {c.description && <InfoRow label="Description" value={<span className="whitespace-pre-line leading-relaxed text-sm">{c.description}</span>} />}
                {c.case_summary && <InfoRow label="Case Summary" value={<span className="whitespace-pre-line leading-relaxed text-sm">{c.case_summary}</span>} />}
              </div>
            </Panel>

            {/* Assignments */}
            <Panel title="Assignments" subtitle="Clients and personnel allocation.">
              <div className="grid md:grid-cols-2 gap-5">
                <InfoRow label="Client" value={c.client_name} />
                <InfoRow label="Assigned Advocate" value={c.advocate_name} />
                <InfoRow label="Branch" value={c.branch_name} />
                {c.assigned_paralegal && <InfoRow label="Paralegal" value={c.paralegal_name || paralegalName || c.assigned_paralegal} />}
              </div>
            </Panel>

            {/* Court Information */}
            <Panel title="Court Information" subtitle="Legal jurisdiction and timeline.">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Court Name" value={c.court_name} />
                  <InfoRow label="Court No." value={c.court_no} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="CNR Number" value={c.cnr_number} copyable />
                  <InfoRow label="Judge Name" value={c.judge_name} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="District" value={c.district} />
                  <InfoRow label="State" value={c.state} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Representing" value={c.representing} />
                  <InfoRow label="Filing Date" value={fmt(c.filing_date)} />
                </div>
                <InfoRow label="Next Hearing" value={fmt(c.next_hearing_date)} />
              </div>
            </Panel>

            {/* Parties */}
            <Panel title="Parties" subtitle="Petitioner, respondent, and opposing parties.">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Petitioner Name" value={c.petitioner_name} />
                  <InfoRow label="Respondent Name" value={c.respondent_name} />
                </div>
                <InfoRow label="Opposing Counsel" value={c.opposing_counsel} />
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-6">
            {/* Status & Priority */}
            <Panel title="Economics & Status" subtitle="Priority, billing, and financial details.">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Priority" value={<StatusBadge value={c.priority} />} />
                  <InfoRow label="Status" value={<StatusBadge value={c.status} />} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Billing Type" value={<StatusBadge value={c.billing_type} />} />
                  <InfoRow label="Est. Value" value={formatCurrency(c.estimated_value)} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Total Fee" value={formatCurrency(c.total_fee)} />
                  <InfoRow label="Hearing Fee" value={formatCurrency(c.hearing_fee)} />
                </div>
                {c.additional_expenses && <InfoRow label="Additional Expenses" value={formatCurrency(c.additional_expenses)} />}
                {c.payment_terms && <InfoRow label="Payment Terms" value={c.payment_terms} />}
                {c.loe_notes && <InfoRow label="LOE Notes" value={<span className="whitespace-pre-line leading-relaxed text-sm">{c.loe_notes}</span>} />}
              </div>
            </Panel>

            {/* Activity Feed */}
            {c.activities?.length > 0 && (
              <Panel title="Activity Log" subtitle="Case activity and status changes.">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {c.activities.map((act: any) => (
                    <div key={act.id} className="flex gap-3 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                      <div className="mt-0.5 w-7 h-7 bg-[#0e2340]/10 rounded-full flex items-center justify-center shrink-0">
                        <Activity className="w-3.5 h-3.5 text-[#0e2340]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-snug">{act.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{fmt(act.created_at)} · By {act.performed_by_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Hearings */}
            {c.hearings?.length > 0 ? (
              <Panel title="Hearings" subtitle="Scheduled and past court dates.">
                <div className="space-y-3">
                  {c.hearings.map((h: any) => (
                    <div key={h.id} className="flex gap-3 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                      <Gavel className="w-4 h-4 text-[#984c1f] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{fmt(h.hearing_date)}</p>
                        {h.notes && <p className="text-[10px] text-gray-500 mt-0.5">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : (
              <Panel title="Hearings" subtitle="Scheduled and past court dates.">
                <p className="text-xs text-gray-400 italic py-2">No hearings scheduled yet.</p>
              </Panel>
            )}

            {/* Drafts */}
            {c.drafts?.length > 0 && (
              <Panel title="Drafts" subtitle="Documents and petition drafts for this case.">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {c.drafts.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-2 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-xs font-semibold text-gray-800 truncate">{d.title || d.id}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Metadata */}
            <Panel title="Record Metadata" subtitle="Timestamps and system information.">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-5">
                  <InfoRow label="Created At" value={fmt(c.created_at)} />
                  <InfoRow label="Updated At" value={fmt(c.updated_at)} />
                </div>
                <InfoRow label="Case ID" value={<span className="font-mono text-[10px] text-gray-500 break-all">{c.id}</span>} copyable />
                <InfoRow label="Firm ID" value={<span className="font-mono text-[10px] text-gray-500 break-all">{c.firm}</span>} copyable />
                <InfoRow label="Branch ID" value={<span className="font-mono text-[10px] text-gray-500 break-all">{c.branch}</span>} copyable />
                <InfoRow label="Client ID" value={<span className="font-mono text-[10px] text-gray-500 break-all">{c.client}</span>} copyable />
                <InfoRow label="Advocate ID" value={<span className="font-mono text-[10px] text-gray-500 break-all">{c.assigned_advocate}</span>} copyable />
                {c.assigned_paralegal && <InfoRow label="Paralegal ID" value={<span className="font-mono text-[10px] text-gray-500 break-all">{c.assigned_paralegal}</span>} copyable />}
              </div>
            </Panel>
          </div>
        }
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CaseEditForm — editable PATCH form with mandatory field indicators
// ═══════════════════════════════════════════════════════════════════════════
export function CaseEditForm({ viewBase }: { viewBase: string }) {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.caseId as string;

  const [form, setForm] = useState<any>(null);
  const [options, setOptions] = useState<{ clients: Option[]; advocates: Option[]; paralegals: Option[]; branches: Option[] }>({
    clients: [],
    advocates: [],
    paralegals: [],
    branches: [],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [caseRes, opts] = await Promise.all([
          customFetch(API.CASES.DETAIL(caseId)),
          fetchDropdownOptions(),
        ]);
        const data = await caseRes.json();
        if (!caseRes.ok) throw new Error(data.detail || 'Failed to fetch case.');

        setForm({
          case_title: data.case_title ?? '',
          case_number: data.case_number ?? '',
          case_type: data.case_type ?? '',
          description: data.description ?? '',
          case_summary: data.case_summary ?? '',
          category: data.category ?? 'pre_litigation',
          status: data.status ?? 'open',
          priority: data.priority ?? 'medium',
          stage: data.stage ?? 'case_filing',
          client: data.client ?? '',
          assigned_advocate: data.assigned_advocate ?? '',
          assigned_paralegal: data.assigned_paralegal ?? '',
          branch: data.branch ?? '',
          billing_type: data.billing_type ?? 'hourly',
          estimated_value: data.estimated_value ?? '',
          total_fee: data.total_fee ?? '',
          hearing_fee: data.hearing_fee ?? '',
          additional_expenses: normalizeNumericInput(data.additional_expenses),
          payment_terms: data.payment_terms ?? '',
          loe_notes: data.loe_notes ?? '',
          petitioner_name: data.petitioner_name ?? '',
          respondent_name: data.respondent_name ?? '',
          opposing_counsel: data.opposing_counsel ?? '',
          court_name: data.court_name ?? '',
          court_no: data.court_no ?? '',
          judge_name: data.judge_name ?? '',
          district: data.district ?? '',
          state: data.state ?? '',
          representing: data.representing ?? '',
          cnr_number: data.cnr_number ?? '',
          filing_date: normalizeDateInput(data.filing_date),
          next_hearing_date: normalizeDateInput(data.next_hearing_date),
        });
        setOptions({
          clients: ensureOption(opts.clients, data.client, data.client_name),
          advocates: ensureOption(opts.advocates, data.assigned_advocate, data.advocate_name),
          paralegals: ensureOption(opts.paralegals, data.assigned_paralegal, data.paralegal_name),
          branches: ensureOption(opts.branches, data.branch, data.branch_name),
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (caseId) loadAll();
  }, [caseId]);

  const set = (key: string, val: any) => {
    setForm((p: any) => ({ ...p, [key]: val }));
    if (fieldErrors[key]) {
      const e = { ...fieldErrors };
      delete e[key];
      setFieldErrors(e);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      const nullableStrings = [
        'court_name', 'court_no', 'judge_name', 'district', 'state', 'representing',
        'cnr_number', 'description', 'case_summary', 'opposing_counsel',
        'respondent_name', 'petitioner_name', 'case_number', 'payment_terms',
        'loe_notes', 'next_hearing_date', 'assigned_paralegal',
      ];
      const nullableDecimals = ['estimated_value', 'total_fee', 'hearing_fee', 'additional_expenses'];

      const payload: Record<string, any> = { ...form };

      nullableStrings.forEach(f => { if (payload[f] === '') payload[f] = null; });

      nullableDecimals.forEach(f => {
        if (payload[f] === '' || payload[f] === null) {
          payload[f] = null;
        } else {
          const p = parseFloat(payload[f]);
          payload[f] = isNaN(p) ? null : p;
        }
      });

      const response = await customFetch(API.CASES.DETAIL(caseId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (typeof data === 'object' && !data.detail) {
          setFieldErrors(data);
          throw new Error('Please check the highlighted fields.');
        }
        throw new Error(data.detail || 'Failed to update case.');
      }

      setSuccess(true);
      setTimeout(() => router.push(`${viewBase}/${caseId}`), 1400);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-[#984c1f]" />
        <p className="mt-4 text-sm font-semibold text-gray-500 tracking-wide">Loading Case…</p>
      </div>
    );
  }
  if (!form) {
    return (
      <div className="p-12 text-center bg-red-50 border border-red-100 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-red-600">{error ?? 'Case not found.'}</p>
      </div>
    );
  }
  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Case Updated Successfully</h3>
        <p className="text-sm text-gray-400 mt-2">Redirecting to case view…</p>
      </div>
    );
  }

  const inp = (extra = '') =>
    `h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none transition-all focus:bg-white focus:border-[#984c1f] focus:ring-4 focus:ring-[#984c1f]/5 ${extra}`;
  const sel = () =>
    'h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-900 outline-none transition-all focus:bg-white focus:border-[#984c1f]';

  const FieldLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
      {children}
      {required && <span className="text-red-500 text-xs">*</span>}
    </label>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`${viewBase}/${caseId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to View
        </Link>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          Editing Case
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <SplitPanels
          left={
            <div className="space-y-6">
              {/* Matter Identity */}
              <Panel title="Matter Identity" subtitle="Primary title and legal classification.">
                <div className="space-y-4">
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
                          'h-11 w-full rounded-xl border pl-11 px-4 text-sm font-semibold text-gray-900 outline-none transition-all',
                          fieldErrors.case_title
                            ? 'border-red-200 bg-red-50/50'
                            : 'border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#984c1f] focus:ring-4 focus:ring-[#984c1f]/5',
                        )}
                      />
                    </div>
                    {fieldErrors.case_title && <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.case_title[0]}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Case Number</FieldLabel>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="2026-IP-003" className={inp('pl-11')} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel required={MANDATORY_FIELDS.case_type}>Case Type</FieldLabel>
                      <div className="relative">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input required value={form.case_type} onChange={e => set('case_type', e.target.value)} placeholder="e.g. Intellectual Property" className={inp('pl-11')} />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Category</FieldLabel>
                      <select value={form.category} onChange={e => set('category', e.target.value)} className={sel()}>
                        <option value="pre_litigation">Pre-litigation</option>
                        <option value="court_case">Court Case</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Stage</FieldLabel>
                      <select value={form.stage} onChange={e => set('stage', e.target.value)} className={sel()}>
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

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Description</FieldLabel>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                      placeholder="Brief overview of the matter..." className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Case Summary</FieldLabel>
                    <textarea value={form.case_summary} onChange={e => set('case_summary', e.target.value)} rows={3}
                      placeholder="Legal summary for internal reference..." className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none" />
                  </div>
                </div>
              </Panel>

              {/* Assignments */}
              <Panel title="Assignments" subtitle="Clients and personnel allocation.">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required={MANDATORY_FIELDS.client}>Client</FieldLabel>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select required value={form.client} onChange={e => set('client', e.target.value)} className={classNames(sel(), 'pl-11 pr-10')}>
                        <option value="">Select a Client</option>
                        {options.clients.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel required={MANDATORY_FIELDS.assigned_advocate}>Assigned Advocate</FieldLabel>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={form.assigned_advocate} onChange={e => set('assigned_advocate', e.target.value)} className={classNames(sel(), 'pl-11 pr-10')}>
                          <option value="">Select Advocate</option>
                          {options.advocates.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Assigned Paralegal</FieldLabel>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={form.assigned_paralegal || ''} onChange={e => set('assigned_paralegal', e.target.value)} className={classNames(sel(), 'pl-11 pr-10')}>
                          <option value="">Select Paralegal</option>
                          {options.paralegals.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel required={MANDATORY_FIELDS.branch}>Branch</FieldLabel>
                      <div className="relative">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={form.branch} onChange={e => set('branch', e.target.value)} className={classNames(sel(), 'pl-11 pr-10')}>
                          <option value="">Select Branch</option>
                          {options.branches.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Court Information */}
              <Panel title="Court Information" subtitle="Legal jurisdiction and timeline.">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Court Name</FieldLabel>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={form.court_name} onChange={e => set('court_name', e.target.value)} placeholder="e.g. High Court" className={inp('pl-11')} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Court No.</FieldLabel>
                      <input value={form.court_no} onChange={e => set('court_no', e.target.value)} placeholder="e.g. Room 4" className={inp()} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>CNR Number</FieldLabel>
                      <input value={form.cnr_number} onChange={e => set('cnr_number', e.target.value)} placeholder="CNR..." className={inp()} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Judge Name</FieldLabel>
                      <input value={form.judge_name} onChange={e => set('judge_name', e.target.value)} placeholder="Hon. Justice..." className={inp()} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>District</FieldLabel>
                      <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="District" className={inp()} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>State</FieldLabel>
                      <select value={form.state} onChange={e => set('state', e.target.value)} className={sel()}>
                        <option value="">Select State</option>
                        {STATE_OPTIONS.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Representing</FieldLabel>
                      <select value={form.representing} onChange={e => set('representing', e.target.value)} className={sel()}>
                        <option value="">Select Party</option>
                        <option value="petitioner">Petitioner</option>
                        <option value="respondent">Respondent</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Filing Date</FieldLabel>
                      <input type="date" value={form.filing_date} onChange={e => set('filing_date', e.target.value)} className={inp()} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Next Hearing Date</FieldLabel>
                    <input type="date" value={form.next_hearing_date || ''} onChange={e => set('next_hearing_date', e.target.value)} className={inp()} />
                  </div>
                </div>
              </Panel>

              {/* Parties */}
              <Panel title="Parties" subtitle="Petitioner, respondent, and opposing counsel.">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Petitioner Name</FieldLabel>
                    <input value={form.petitioner_name} onChange={e => set('petitioner_name', e.target.value)} placeholder="Petitioner" className={inp()} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Respondent Name</FieldLabel>
                      <input value={form.respondent_name} onChange={e => set('respondent_name', e.target.value)} placeholder="Respondent" className={inp()} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Opposing Counsel</FieldLabel>
                      <input value={form.opposing_counsel} onChange={e => set('opposing_counsel', e.target.value)} placeholder="Counsel Name" className={inp()} />
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          }
          right={
            <div className="space-y-6">
              {/* Status & Priority */}
              <Panel title="Status & Priority" subtitle="Case priority and current status.">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Priority</FieldLabel>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                      {['low', 'medium', 'high'].map(p => (
                        <button key={p} type="button" onClick={() => set('priority', p)}
                          className={classNames(
                            'flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all',
                            form.priority === p ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600',
                          )}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Status</FieldLabel>
                    <select value={form.status} onChange={e => set('status', e.target.value)} className={sel()}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </Panel>

              {/* Economics */}
              <Panel title="Economics & Billing" subtitle="Financial structure for this matter.">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Billing Type</FieldLabel>
                    <select value={form.billing_type} onChange={e => set('billing_type', e.target.value)} className={sel()}>
                      <option value="hourly">Hourly</option>
                      <option value="flat_fee">Flat Fee</option>
                      <option value="retainer">Retainer</option>
                      <option value="contingency">Contingency</option>
                    </select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Estimated Value (₹)</FieldLabel>
                      <input type="text" inputMode="decimal" value={form.estimated_value} onChange={e => set('estimated_value', sanitizeDecimalInput(e.target.value))} placeholder="45000.00" className={inp()} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Total Fee (₹)</FieldLabel>
                      <input type="text" inputMode="decimal" value={form.total_fee} onChange={e => set('total_fee', sanitizeDecimalInput(e.target.value))} placeholder="e.g. 80000" className={inp()} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Hearing Fee (₹)</FieldLabel>
                      <input type="text" inputMode="decimal" value={form.hearing_fee} onChange={e => set('hearing_fee', sanitizeDecimalInput(e.target.value))} placeholder="e.g. 5000" className={inp()} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Additional Expenses</FieldLabel>
                      <input type="text" inputMode="decimal" value={form.additional_expenses} onChange={e => set('additional_expenses', sanitizeDecimalInput(e.target.value))} placeholder="e.g. 1200.00" className={inp()} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Payment Terms</FieldLabel>
                    <input value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="e.g. 50% upfront" className={inp()} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>LOE Notes</FieldLabel>
                    <textarea value={form.loe_notes} onChange={e => set('loe_notes', e.target.value)} rows={3}
                      placeholder="Letter of engagement notes..." className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#984c1f] transition-all resize-none" />
                  </div>
                </div>
              </Panel>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`${viewBase}/${caseId}`)}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] h-12 flex items-center justify-center gap-2 rounded-xl bg-[#0e2340] text-white font-bold text-sm hover:bg-[#162d4d] transition-all shadow-lg shadow-[#0e2340]/10 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </div>
          }
        />
      </form>
    </div>
  );
}