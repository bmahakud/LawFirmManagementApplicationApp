'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Briefcase, Save, X, Loader2, AlertCircle, 
  ChevronRight, Calendar, Hash, Scale, 
  Building2, Users, CreditCard, FileText,
  User, CheckCircle2, Info, Trash2, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { useTopbarTitle } from './TopbarContext';
import CaseTypeSelect from './CaseTypeSelect';

// --- Types ---
interface Option { value: string; label: string }

const STATE_OPTIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// --- Helpers ---
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

  const optionLabel = (item: any): string => {
    const fullName = item.full_name || item.get_full_name;
    const firstLast = [item.first_name, item.last_name].filter(Boolean).join(' ').trim();
    return fullName || firstLast || item.username || item.branch_name || item.name || item.id || item.uuid || 'Unknown';
  };

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

const Input = ({ label, required, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <input 
      {...props} 
      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#311042] focus:ring-4 focus:ring-purple-50 placeholder:text-gray-400"
    />
  </div>
);

const Select = ({ label, required, options, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <select 
      {...props}
      className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#311042] focus:ring-4 focus:ring-purple-50"
    >
      <option value="">Select {label}</option>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-xs font-semibold text-gray-700">{label}</label>
    <textarea 
      {...props}
      rows={3}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#311042] focus:ring-4 focus:ring-purple-50 resize-none placeholder:text-gray-400"
    />
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-800">
      <Icon className="w-4 h-4" />
    </div>
    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{title}</h3>
  </div>
);

// --- Main Component ---
export function CaseEditWorkspace({ viewBase }: { viewBase: string }) {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.caseId as string;

  const [form, setForm] = useState<any>(null);
  const [options, setOptions] = useState<any>({ clients: [], advocates: [], paralegals: [], branches: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useTopbarTitle('Edit Case', 'Update matter details');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [caseRes, opts] = await Promise.all([
          customFetch(API.CASES.DETAIL(caseId)),
          fetchDropdownOptions(),
        ]);
        const data = await caseRes.json();
        if (!caseRes.ok) throw new Error(data.detail || 'Failed to fetch case.');

        const isUnreg = data.is_registered === false;
        setForm({
          case_title: data.case_title ?? '',
          case_number: data.case_number ?? '',
          is_registered: !isUnreg,
          registration_number: data.registration_number ?? '',
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
          additional_expenses: data.additional_expenses ?? '',
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
          filing_date: data.filing_date?.split('T')[0] ?? '',
          next_hearing_date: data.next_hearing_date?.split('T')[0] ?? '',
          solo_advocate: data.solo_advocate ?? '',
        });
        setOptions(opts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (caseId) load();
  }, [caseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = { ...form };
      // Clean up empty strings for nullable backend fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });

      const res = await customFetch(API.CASES.DETAIL(caseId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update case.');
      }

      router.push(`${viewBase}/${caseId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCase = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await customFetch(API.CASES.DETAIL(caseId), {
        method: 'DELETE',
      });

      if (!res.ok) {
        let errMessage = 'Failed to delete case.';
        try {
          const data = await res.json();
          if (data?.detail) errMessage = data.detail;
        } catch {}
        throw new Error(errMessage);
      }

      setDeleteSuccess(true);
      toast.success('Case deleted successfully');

      // Auto redirect to cases list after confirmation dialog
      setTimeout(() => {
        router.push(viewBase);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete case.');
      setError(err.message || 'Failed to delete case.');
      setDeleting(false);
    }
  };

  if (loading || !form) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800"></div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto p-6 min-h-screen bg-[#f8f9fc]">
      
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <span className="hover:text-gray-900 cursor-pointer" onClick={() => router.push(viewBase)}>Cases</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="hover:text-gray-900 cursor-pointer" onClick={() => router.push(`${viewBase}/${caseId}`)}>Case Detail</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-medium">Edit Case</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-700">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Case</h1>
              <p className="text-sm text-gray-500">Update case information and details.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => {
                setDeleteSuccess(false);
                setShowDeleteModal(true);
              }}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              Delete Case
            </button>
            <button 
              type="button" 
              onClick={() => router.push(`${viewBase}/${caseId}`)}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-[#311042] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#461a5e] transition-all disabled:opacity-50 shadow-lg shadow-purple-900/10"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* --- FORM SECTIONS --- */}
        <div className="space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          
          {/* Section: Case Information */}
          <div className="space-y-6">
            <SectionHeader title="Case Information" icon={Info} />
            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">Registration Status</span>
                <span className="text-xs text-gray-500">Specify whether this matter is formally registered in court or at unregistered diary stage.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      is_registered: true,
                      registration_number: form.registration_number?.startsWith('D_') ? '' : form.registration_number
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    form.is_registered
                      ? 'bg-[#311042] text-white border-[#311042] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Registered Case
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const year = new Date().getFullYear();
                    const baseRef = form.case_number?.trim() || '101';
                    setForm({
                      ...form,
                      is_registered: false,
                      registration_number: form.registration_number && form.registration_number.startsWith('D_')
                        ? form.registration_number
                        : `D_${baseRef}_${year}`
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    !form.is_registered
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  Unregistered (Diary)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <CaseTypeSelect
                required
                value={form.case_type}
                onChange={(val: string) => setForm({ ...form, case_type: val })}
              />
              <Input label="Case Title" required value={form.case_title} onChange={(e: any) => setForm({...form, case_title: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Field 1: Advocate Case Number */}
              <div className="flex flex-col gap-1 w-full">
                <Input 
                  label="Case Number (Advocate Ref)" 
                  value={form.case_number} 
                  placeholder="e.g. 2026-TS-67 or MURD999"
                  onChange={(e: any) => {
                    const val = e.target.value;
                    const year = new Date().getFullYear();
                    const isAutoDiary = !form.is_registered && (!form.registration_number || form.registration_number.startsWith('D_'));
                    setForm({
                      ...form, 
                      case_number: val,
                      registration_number: isAutoDiary ? `D_${val.trim() || '101'}_${year}` : form.registration_number
                    });
                  }} 
                />
                <span className="text-[10px] text-gray-400 pl-1">
                  Advocate internal case / matter reference number
                </span>
              </div>

              {/* Field 2: Court Registration / Diary Number */}
              <div className="flex flex-col gap-1 w-full">
                <Input 
                  label={form.is_registered ? "Court Registration No. (Optional)" : "Diary / Unregistered No."} 
                  value={form.registration_number} 
                  placeholder={form.is_registered ? "e.g. WP/452/2026 or leave blank" : `D_${form.case_number?.trim() || '101'}_${new Date().getFullYear()}`}
                  onChange={(e: any) => setForm({ ...form, registration_number: e.target.value })} 
                />
                <span className="text-[10px] text-gray-400 pl-1">
                  {form.is_registered ? 'Official court case number (optional)' : 'Auto-formatted as (D_case no_case year), editable'}
                </span>
              </div>
              <Select label="Category" required value={form.category} onChange={(e: any) => setForm({...form, category: e.target.value})} options={[{value: 'court_case', label: 'Court Case'}, {value: 'pre_litigation', label: 'Pre-litigation'}]} />
              <Select label="Stage" required value={form.stage} onChange={(e: any) => setForm({...form, stage: e.target.value})} options={[{value: 'case_filing', label: 'Case Filing'}, {value: 'notice', label: 'Notice'}, {value: 'evidence', label: 'Evidence'}, {value: 'arguments', label: 'Arguments'}, {value: 'judgment', label: 'Judgment'}]} />
              <div className="lg:col-span-2">
                <Input label="Description" value={form.description} onChange={(e: any) => setForm({...form, description: e.target.value})} />
              </div>
              <Select label="Status" required value={form.status} onChange={(e: any) => setForm({...form, status: e.target.value})} options={[{value: 'open', label: 'Open'}, {value: 'in_progress', label: 'In Progress'}, {value: 'closed', label: 'Closed'}]} />
              <Select label="Priority" required value={form.priority} onChange={(e: any) => setForm({...form, priority: e.target.value})} options={[{value: 'low', label: 'Low'}, {value: 'medium', label: 'Medium'}, {value: 'high', label: 'High'}]} />
            </div>
          </div>

          {/* Section: Parties Information */}
          <div className="space-y-6">
            <SectionHeader title="Parties Information" icon={Users} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Select label="Client" required value={form.client} onChange={(e: any) => setForm({...form, client: e.target.value})} options={options.clients} />
              <Input label="Petitioner Name" value={form.petitioner_name} onChange={(e: any) => setForm({...form, petitioner_name: e.target.value})} />
              <Input label="Respondent Name" value={form.respondent_name} onChange={(e: any) => setForm({...form, respondent_name: e.target.value})} />
              <Input label="Opposing Counsel" value={form.opposing_counsel} onChange={(e: any) => setForm({...form, opposing_counsel: e.target.value})} />
              <Select label="Representing" required value={form.representing} onChange={(e: any) => setForm({...form, representing: e.target.value})} options={[{value: 'petitioner', label: 'Petitioner'}, {value: 'respondent', label: 'Respondent'}]} />
            </div>
          </div>

          {/* Section: Court Information */}
          <div className="space-y-6">
            <SectionHeader title="Court Information" icon={Building2} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Input label="Court Name" required value={form.court_name} onChange={(e: any) => setForm({...form, court_name: e.target.value})} />
              <Input label="Court No." required value={form.court_no} onChange={(e: any) => setForm({...form, court_no: e.target.value})} />
              <Input label="Judge Name" value={form.judge_name} onChange={(e: any) => setForm({...form, judge_name: e.target.value})} />
              <Input label="District" value={form.district} onChange={(e: any) => setForm({...form, district: e.target.value})} />
              <Select label="State" value={form.state} onChange={(e: any) => setForm({...form, state: e.target.value})} options={STATE_OPTIONS.map(s => ({value: s, label: s}))} />
              <Input label="CNR Number" value={form.cnr_number} onChange={(e: any) => setForm({...form, cnr_number: e.target.value})} />
              <Input label="Filing Date" type="date" value={form.filing_date} onChange={(e: any) => setForm({...form, filing_date: e.target.value})} />
              <Input label="Next Hearing Date" type="date" value={form.next_hearing_date} onChange={(e: any) => setForm({...form, next_hearing_date: e.target.value})} />
            </div>
          </div>

          {/* Section: Assignment */}
          <div className="space-y-6">
            <SectionHeader title="Assignment" icon={User} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Select label="Branch" required value={form.branch} onChange={(e: any) => setForm({...form, branch: e.target.value})} options={options.branches} />
              <Select label="Assigned Advocate" required value={form.assigned_advocate} onChange={(e: any) => setForm({...form, assigned_advocate: e.target.value})} options={options.advocates} />
              <Select label="Assigned Paralegal" value={form.assigned_paralegal} onChange={(e: any) => setForm({...form, assigned_paralegal: e.target.value})} options={options.paralegals} />
              <Select label="Solo Advocate" value={form.solo_advocate} onChange={(e: any) => setForm({...form, solo_advocate: e.target.value})} options={options.advocates} />
            </div>
          </div>

          {/* Section: Financial Information */}
          <div className="space-y-6">
            <SectionHeader title="Financial Information" icon={CreditCard} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Select label="Billing Type" required value={form.billing_type} onChange={(e: any) => setForm({...form, billing_type: e.target.value})} options={[{value: 'hourly', label: 'Hourly'}, {value: 'flat_fee', label: 'Flat Fee'}]} />
              <Input label="Estimated Value (₹)" type="number" value={form.estimated_value} onChange={(e: any) => setForm({...form, estimated_value: e.target.value})} />
              <Input label="Total Fee (₹)" type="number" value={form.total_fee} onChange={(e: any) => setForm({...form, total_fee: e.target.value})} />
              <Input label="Hearing Fee (₹)" type="number" value={form.hearing_fee} onChange={(e: any) => setForm({...form, hearing_fee: e.target.value})} />
              <Input label="Additional Expenses (₹)" type="number" value={form.additional_expenses} onChange={(e: any) => setForm({...form, additional_expenses: e.target.value})} />
              <div className="lg:col-span-1">
                <Input label="Payment Terms" value={form.payment_terms} onChange={(e: any) => setForm({...form, payment_terms: e.target.value})} />
              </div>
              <div className="lg:col-span-2">
                <Input label="LOE Notes" value={form.loe_notes} onChange={(e: any) => setForm({...form, loe_notes: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Section: Additional Notes */}
          <div className="space-y-6">
            <SectionHeader title="Additional Notes" icon={FileText} />
            <TextArea label="Case Summary / Notes (Optional)" placeholder="Enter case summary or any additional notes..." value={form.case_summary} onChange={(e: any) => setForm({...form, case_summary: e.target.value})} />
          </div>

        </div>
      </form>

      {/* Delete Confirmation Dialogue */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
            {!deleteSuccess ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Are you sure you want to delete this case? This action cannot be undone and will permanently remove this matter and all its associated records.
                </p>

                {form && (
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 mb-6 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Case Title:</span>
                      <strong className="text-gray-800 text-right truncate max-w-[200px]">{form.case_title || 'Untitled Case'}</strong>
                    </div>
                    {form.case_number && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Case Ref:</span>
                        <span className="text-gray-700 font-semibold">{form.case_number}</span>
                      </div>
                    )}
                    {form.case_type && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Case Type:</span>
                        <span className="text-gray-700 font-semibold">{form.case_type}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDeleteCase}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Confirm Delete
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Case Deleted Successfully</h3>
                  <p className="text-xs text-gray-500">
                    The case has been permanently deleted from the system. Redirecting you to the cases list...
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => router.push(viewBase)}
                    className="w-full px-6 py-2.5 rounded-xl bg-[#311042] text-white text-sm font-bold hover:bg-[#461a5e] transition-colors cursor-pointer"
                  >
                    Back to Cases
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
