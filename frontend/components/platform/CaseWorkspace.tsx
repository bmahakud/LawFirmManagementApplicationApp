'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, Gavel, FileText, ClipboardList,
  CreditCard, History, Settings, Calendar,
  Upload, PenTool, Clock, Search, Filter,
  Plus, MoreVertical, Eye, Download, Edit2,
  Trash2, File, ChevronLeft, ChevronRight,
  Info, Users, Scale, FileOutput, CheckCircle2,
  ArrowRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { useTopbarTitle } from './TopbarContext';
import DocumentManager from './DocumentManager';
import DocumentVerificationSystem from './DocumentVerificationSystem';

// --- Types ---
interface CaseData {
  id: string;
  case_title: string;
  case_number: string;
  case_type: string;
  category: string;
  stage: string;
  description: string;
  status: string;
  priority: string;
  petitioner_name: string;
  respondent_name: string;
  opposing_counsel: string;
  representing: string;
  court_name: string;
  court_no: string;
  judge_name: string;
  district: string;
  state: string;
  cnr_number: string;
  filing_date: string;
  next_hearing_date: string;
  client_name: string;
  advocate_name: string;
  branch_name: string;
  paralegal_name?: string;
  billing_type: string;
  estimated_value: string;
  total_fee: string;
  hearing_fee: string;
  activities: any[];
  hearings: any[];
  drafts: any[];
  [key: string]: any;
}

// --- Helpers ---
const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (value: string | number) => {
  if (!value) return '₹ 0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatTitleCase = (str: string) => {
  if (!str) return '—';
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// --- Sub-components ---
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: string }) => {
  const variants: any = {
    default: 'bg-purple-50 text-purple-700 border-purple-100',
    open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    medium: 'bg-orange-50 text-orange-600 border-orange-100',
    high: 'bg-red-50 text-red-600 border-red-100',
    completed: 'bg-green-50 text-green-700 border-green-100',
    pending: 'bg-blue-50 text-blue-700 border-blue-100',
    draft: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant?.toLowerCase()] || variants.default}`}>
      {children}
    </span>
  );
};

const CardHeader = ({ title, icon: Icon, action }: { title: string, icon?: any, action?: boolean }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-purple-800" />}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <Info className="w-4 h-4 text-gray-400 ml-1" />
    </div>
    {action && <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-purple-700" />}
  </div>
);

const Field = ({ label, value, isBadge = false, badgeVariant = '' }: { label: string, value: React.ReactNode, isBadge?: boolean, badgeVariant?: string }) => (
  <div className="flex flex-col gap-1 mb-4">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    {isBadge ? (
      <div><Badge variant={badgeVariant}>{value}</Badge></div>
    ) : (
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    )}
  </div>
);

export function CaseWorkspace({ 
  viewBase = '/advocate/cases',
  role = 'advocate',
  accent = '#311042'
}: { 
  viewBase?: string;
  role?: 'advocate' | 'client' | 'firm-admin' | 'super-admin';
  accent?: string;
}) {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;

  const [activeTab, setActiveTab] = useState('Overview');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const endpoint = API.DOCUMENTS.TEMPLATES;
        console.log('Fetching templates from:', endpoint);
        const res = await customFetch(endpoint);
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useTopbarTitle(
    caseData?.case_title ?? 'Loading...',
    caseData ? `${formatTitleCase(caseData.category)} • ${formatTitleCase(caseData.case_type)}` : ''
  );

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        // Assuming customFetch handles the endpoint resolution properly
        const res = await customFetch(API.CASES.DETAIL(caseId));
        const data = await res.json();
        setCaseData(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (caseId) fetchCase();
  }, [caseId]);

  if (loading || !caseData) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: accent }}></div>
    </div>
  );

  const tabs = [
    { name: 'Overview', icon: Briefcase },
    { name: 'Hearings', icon: Calendar },
    { name: 'Documents', icon: FileText },
    { name: 'Court Forms', icon: ClipboardList },
    { name: 'Drafting', icon: PenTool },
    { name: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col w-full pb-12">

      {/* Top Actions & Breadcrumbs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <span className="hover:text-gray-900 cursor-pointer">Cases</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Case Detail</span>
        </div>
        <div className="flex items-center gap-3">
          {role !== 'client' && (
            <>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Hearing
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Generate Form
              </button>
            </>
          )}
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
          {role !== 'client' && (
            <button
              onClick={() => router.push(`${viewBase}/${caseId}/edit`)}
              className="px-5 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              style={{ backgroundColor: accent }}
            >
              <Edit2 className="w-4 h-4" /> Edit Case
            </button>
          )}
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-700 border border-purple-100">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{caseData.case_title}</h1>
              <div className="flex gap-2">
                <Badge variant="default">{formatTitleCase(caseData.category)}</Badge>
                <Badge variant="default">{formatTitleCase(caseData.case_type)}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col text-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Case No.</span>
              <span className="text-sm font-bold text-gray-900">{caseData.case_number}</span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Client</span>
              <span className="text-sm font-bold text-gray-900">{caseData.client_name}</span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Court</span>
              <span className="text-sm font-bold text-gray-900">{caseData.court_name}</span>
            </div>
            <div className="flex flex-col text-center items-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Status</span>
              <Badge variant={caseData.status}>{formatTitleCase(caseData.status)}</Badge>
            </div>
            <div className="flex flex-col text-center items-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Priority</span>
              <Badge variant={caseData.priority}>{formatTitleCase(caseData.priority)}</Badge>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Next Hearing</span>
              <div className="flex items-center text-sm font-bold gap-1.5" style={{ color: accent }}>
                <Calendar className="w-4 h-4" />
                {formatDate(caseData.next_hearing_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto mt-8 border-b border-gray-100 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.name
                ? 'text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={activeTab === tab.name ? { borderBottomColor: accent, color: accent } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Areas */}
      <div className="w-full">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Matter Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2">
              <CardHeader title="Matter Summary" icon={Briefcase} action />
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Case Title" value={caseData.case_title} />
                <Field label="Stage" value={formatTitleCase(caseData.stage)} isBadge badgeVariant="default" />
                <Field label="Case Number" value={caseData.case_number} />
                <Field label="Status" value={formatTitleCase(caseData.status)} isBadge badgeVariant={caseData.status} />
                <Field label="Case Type" value={formatTitleCase(caseData.case_type)} />
                <Field label="Priority" value={formatTitleCase(caseData.priority)} isBadge badgeVariant={caseData.priority} />
                <Field label="Category" value={formatTitleCase(caseData.category)} isBadge badgeVariant="default" />
                <Field label="Description" value={caseData.description} />
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CardHeader title="Parties" icon={Users} />
              <Field label="Petitioner" value={caseData.petitioner_name} />
              <Field label="Respondent" value={caseData.respondent_name} />
              <Field label="Opposing Counsel" value={caseData.opposing_counsel} />
              <Field label="Representing" value={formatTitleCase(caseData.representing)} />
            </div>

            {/* Court Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CardHeader title="Court Information" icon={Gavel} />
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Court Name" value={caseData.court_name} />
                <Field label="District" value={caseData.district} />
                <Field label="Court No." value={caseData.court_no} />
                <Field label="State" value={caseData.state} />
                <Field label="Judge" value={caseData.judge_name} />
                <Field label="Filing Date" value={formatDate(caseData.filing_date)} />
                <Field label="CNR Number" value={caseData.cnr_number} />
                <Field label="Next Hearing" value={formatDate(caseData.next_hearing_date)} />
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CardHeader title="Assignments" icon={Users} action />
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Client" value={caseData.client_name} />
                <Field label="Branch" value={caseData.branch_name} />
                <Field label="Advocate" value={caseData.advocate_name} />
                <Field label="Paralegal" value={caseData.paralegal_name || '—'} />
                <Field label="Solo Advocate" value={caseData.solo_advocate_name || '—'} />
              </div>
            </div>

            {/* Economics & Status */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <CardHeader title="Economics & Status" icon={CreditCard} />
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Billing Type" value={formatTitleCase(caseData.billing_type)} />
                <Field label="Total Fee" value={formatCurrency(caseData.total_fee)} />
                <Field label="Estimated Value" value={formatCurrency(caseData.estimated_value)} />
                <Field label="Hearing Fee" value={formatCurrency(caseData.hearing_fee)} />
              </div>
            </div>

            {/* Activity Snapshot */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader title="Activity Snapshot" icon={History} />
              <div className="mt-4">
                {caseData.activities?.length > 0 ? (
                  caseData.activities.map((act, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-700 mt-1.5" />
                        <div className="w-px h-full bg-gray-200 my-1" />
                      </div>
                      <div className="pb-4 bg-purple-50/50 p-3 rounded-lg w-full border border-purple-50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-purple-800 text-white flex items-center justify-center text-[10px] font-bold">
                            {act.performed_by_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{act.description}</span>
                        </div>
                        <span className="text-xs text-gray-500 ml-8">{formatDate(act.created_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No recent activity.</p>
                )}
                <button className="text-sm text-gray-900 font-semibold w-full text-center mt-2 flex items-center justify-center gap-1 hover:text-purple-700">
                  View Full Timeline <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* --- OTHER TABS (Structural Mockups to match photos) --- */}
        {activeTab === 'Billing' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Billing Summary</h3>
                <p className="text-sm text-gray-500 mb-6">Overview of financial details and billing information for this case.</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: 'Billing Type', val: formatTitleCase(caseData.billing_type), icon: Clock },
                    { label: 'Estimated Value', val: formatCurrency(caseData.estimated_value), icon: FileText },
                    { label: 'Total Fee', val: formatCurrency(caseData.total_fee), icon: CreditCard },
                    { label: 'Hearing Fee', val: formatCurrency(caseData.hearing_fee), icon: FileText },
                    { label: 'Additional Expenses', val: '₹ 0.00', icon: CreditCard },
                  ].map((item, i) => (
                    <div key={i} className="flex-1 min-w-[150px] p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">{item.label}</span>
                        <span className="text-base font-bold text-gray-900">{item.val}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                        <item.icon className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Invoices & Payments</h3>
                    <p className="text-sm text-gray-500">Track invoices, payments and outstanding amounts.</p>
                  </div>
                  <button className="px-4 py-2 bg-[#311042] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Invoice
                  </button>
                </div>
                {/* Mock Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Invoice No.</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Paid</th>
                        <th className="px-4 py-3">Due</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">INV-000{i}</td>
                          <td className="px-4 py-3 text-gray-500">28 Apr 2026</td>
                          <td className="px-4 py-3 text-gray-500">Initial Case Filing...</td>
                          <td className="px-4 py-3">₹ 2,000.00</td>
                          <td className="px-4 py-3">₹ 2,000.00</td>
                          <td className="px-4 py-3">₹ 0.00</td>
                          <td className="px-4 py-3"><Badge variant={i === 2 ? 'pending' : 'completed'}>{i === 2 ? 'Partial' : 'Paid'}</Badge></td>
                          <td className="px-4 py-3 text-right flex justify-end gap-2 text-gray-400">
                            <Eye className="w-4 h-4 cursor-pointer hover:text-gray-900" />
                            <Download className="w-4 h-4 cursor-pointer hover:text-gray-900" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[320px] flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Balance Overview</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Total Billed</span><span className="font-medium text-gray-900">₹ 7,500.00</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Paid</span><span className="font-medium text-green-600">₹ 3,950.00</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Outstanding</span><span className="font-medium text-orange-600">₹ 3,550.00</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Overdue</span><span className="font-medium text-red-600">₹ 750.00</span></div>
                </div>
              </div>
              <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
                <p className="text-gray-500 mb-3">For any billing related queries.</p>
                <a href="#" className="text-purple-700 font-medium hover:underline flex items-center gap-1">Contact Support <ChevronRight className="w-3 h-3" /></a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <DocumentVerificationSystem 
                caseId={caseId} 
                clientId={caseData.client || caseData.client_id}
                role={role}
                accent={accent}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" />
                Case Specific Documents
              </h3>
              <DocumentManager 
                accent={accent} 
                caseId={caseId} 
                clientId={caseData.client || caseData.client_id}
                viewBase={viewBase.replace('/cases', '/documents')}
              />
            </div>

            {(caseData.client || caseData.client_id) && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-700" />
                  General Client Documents
                </h3>
                <DocumentManager 
                  accent={accent} 
                  clientId={caseData.client || caseData.client_id} 
                  viewBase={viewBase.replace('/cases', '/documents')}
                  showUpload={false} 
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'Court Forms' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Legal Document Templates</h3>
                  <p className="text-sm text-gray-500 mt-1">Select a standardized template to generate court forms and petitions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search templates..." 
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-800/20"
                    />
                  </div>
                </div>
              </div>

              {templatesLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-800 mb-4" />
                  <p className="text-sm text-gray-500">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No templates found in library</p>
                  <p className="text-xs text-gray-400 mt-1">Please contact admin to add document templates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div 
                      key={template.id} 
                      className="group p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <Badge variant="default">{template.category || 'General'}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-purple-800 transition-colors">{template.template_title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">{template.description || 'Standardized legal form for court submissions.'}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">v{template.version || '1.0'}</span>
                        <button className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1">
                          Use Template <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mock for other tabs to keep UI populated */}
        {['Drafting', 'Hearings'].includes(activeTab) && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No {activeTab.toLowerCase()} found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}