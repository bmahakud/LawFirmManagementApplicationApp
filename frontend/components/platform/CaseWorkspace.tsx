'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase, Gavel, FileText, ClipboardList,
  CreditCard, History, Settings, Calendar,
  Upload, PenTool, Clock, Search, Filter,
  Plus, MoreVertical, Eye, Download, Edit2,
  Trash2, File, ChevronLeft, ChevronRight,
  Info, Users, Scale, FileOutput, CheckCircle2,
  ArrowRight, Loader2, UserCheck, Folder, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { useTopbarTitle } from './TopbarContext';
import DocumentManager from './DocumentManager';
import DocumentVerificationSystem from './DocumentVerificationSystem';
import PDFCourtFormEditor from './PDFCourtFormEditor';
import PersonalizedTemplatesManager from './PersonalizedTemplatesManager';
import { DocuMindIntegration } from './DocuMindIntegration';

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
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    registered: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    unregistered: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant?.toLowerCase()] || variants.default}`}>
      {children}
    </span>
  );
};

const CARD_SECTION_DESCRIPTIONS: Record<string, string> = {
  'Matter Summary': 'Provides an executive overview of this legal matter, including case title, advocate reference number, court registration / diary status, case category, priority level, and substantive case description.',
  'Parties': 'Lists all key individuals and legal entities involved in the dispute, including the petitioner/complainant, respondent/accused, opposing legal counsel, and the client representation capacity.',
  'Court Information': 'Contains the judicial jurisdiction details such as court name and bench, district, state, court hall number, presiding judge, formal filing date, CNR number, and next hearing date.',
  'Assignments': 'Shows the internal law firm staffing for this matter, including the primary client account, firm branch location, handling lead advocate, assigned paralegal, or solo advocate in charge.',
  'Economics & Status': 'Displays the commercial and fee structure for the case, including billing type (hourly/retainer/flat fee), total fees, estimated dispute value, and hearing appearance charges.',
  'Activity Snapshot': 'Shows an audit trail of chronological case updates, status transitions, hearing adjustments, and recent case file modifications.'
};

const CardHeader = ({ title, icon: Icon, description }: { title: string; icon?: any; description?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<any>(null);
  const desc = description || CARD_SECTION_DESCRIPTIONS[title] || `Details and information regarding ${title.toLowerCase()}.`;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-purple-800" />}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        
        {/* Info button with interactive hover tooltip */}
        <div 
          className="relative inline-flex items-center"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsOpen(true);
          }}
          onMouseLeave={() => {
            timeoutRef.current = setTimeout(() => setIsOpen(false), 120);
          }}
        >
          <button
            type="button"
            className="p-1 rounded-md text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer focus:outline-none"
            aria-label={`About ${title}`}
          >
            <Info className="w-4 h-4" />
          </button>

          {isOpen && (
            <div 
              className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-purple-100 shadow-xl shadow-purple-950/10 text-gray-800 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 mt-0.5 shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-gray-900">{title}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/50">
                      Section Guide
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-normal">
                    {desc}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

// --- Subtab Detailed Information Guides ---
const TAB_DESCRIPTIONS: Record<string, { title: string; desc: string }> = {
  case: {
    title: 'Case Filing Pack',
    desc: 'Official documents compiled into the case\'s Master Filing PDF with court sequence numbers and annexures, which you can also open, edit, and annotate within the Drafting tool.'
  },
  client: {
    title: 'Client Requests',
    desc: 'Request documents directly from your client. Once the client uploads them, you can review and verify them here to automatically move them into the Case Filing Pack. If the client cannot upload from their portal, you can also upload and verify on their behalf.'
  },
  other: {
    title: 'Supporting Files',
    desc: 'Store standalone reference documents, evidence, and research files that are not merged into the Master Filing PDF. You can also copy or move any file between Case Filing Pack and Supporting Files whenever needed.'
  },
  court_forms: {
    title: 'Court Forms',
    desc: 'Generate, draft, finalize, and edit case-specific official court forms for this case before filing.'
  },
  personalized_templates: {
    title: 'Personalized Templates',
    desc: 'Create and customize your own personalized legal templates (such as Affidavits, Petitions, or Notices) tailored for this case file, with the option to add them to the Case Filing Pack.'
  }
};

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

  const searchParams = useSearchParams();
  const initialTabFromUrl = searchParams.get('tab');
  const initialSubTabFromUrl = searchParams.get('subtab');
  const initialFormId = searchParams.get('formId');
  const newBlank = searchParams.get('newBlank') === 'true';

  const [activeFormId, setActiveFormId] = useState<string | null>(initialFormId);

  // --- Subtab Tooltip Info State ---
  const [tabInfoTooltip, setTabInfoTooltip] = useState<{
    id: string;
    title: string;
    desc: string;
    x: number;
    y: number;
  } | null>(null);

  const hideTabInfoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShowTabInfo = (key: string, e: React.MouseEvent<HTMLElement>) => {
    if (hideTabInfoTimeoutRef.current) {
      clearTimeout(hideTabInfoTimeoutRef.current);
      hideTabInfoTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const info = TAB_DESCRIPTIONS[key];
    if (!info) return;

    const width = 340;
    let left = rect.left + rect.width / 2 - width / 2;
    if (left < 16) left = 16;
    if (typeof window !== 'undefined' && left + width > window.innerWidth - 16) {
      left = window.innerWidth - width - 16;
    }

    setTabInfoTooltip({
      id: key,
      title: info.title,
      desc: info.desc,
      x: left,
      y: rect.bottom + 8
    });
  };

  const handleHideTabInfo = () => {
    hideTabInfoTimeoutRef.current = setTimeout(() => {
      setTabInfoTooltip(null);
    }, 150);
  };

  useEffect(() => {
    const handleDismissTooltip = () => setTabInfoTooltip(null);
    window.addEventListener('scroll', handleDismissTooltip, true);
    window.addEventListener('resize', handleDismissTooltip);
    return () => {
      window.removeEventListener('scroll', handleDismissTooltip, true);
      window.removeEventListener('resize', handleDismissTooltip);
      if (hideTabInfoTimeoutRef.current) clearTimeout(hideTabInfoTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setActiveFormId(initialFormId);
  }, [initialFormId]);

  const [activeTab, setActiveTab] = useState(() => {
    if (initialTabFromUrl === 'Court Forms') return 'Documents';
    const tab = initialTabFromUrl || (caseId && typeof window !== 'undefined' ? sessionStorage.getItem(`lastCaseTab_${caseId}`) : null) || 'Overview';
    if (role === 'client' && tab === 'Drafting') return 'Overview';
    return tab;
  });
  const [docSubTab, setDocSubTab] = useState<'client' | 'case' | 'other' | 'court_forms' | 'personalized_templates'>(() => {
    const validSubTabs = role === 'client'
      ? ['client', 'case']
      : ['client', 'case', 'other', 'court_forms', 'personalized_templates'];
    const fromUrl = initialSubTabFromUrl && validSubTabs.includes(initialSubTabFromUrl) ? (initialSubTabFromUrl as any) : null;
    const fromSession = caseId && typeof window !== 'undefined' ? (sessionStorage.getItem(`lastCaseSubTab_${caseId}`) as any) : null;
    if (role !== 'client' && (initialFormId || newBlank || initialTabFromUrl === 'Court Forms')) return 'court_forms';
    return fromUrl || (fromSession && validSubTabs.includes(fromSession) ? fromSession : null) || 'case';
  });
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    if (role === 'client' && activeTab === 'Drafting') {
      setActiveTab('Overview');
    }
  }, [role, activeTab]);

  useEffect(() => {
    if (role === 'client' && !['case', 'client'].includes(docSubTab)) {
      setDocSubTab('case');
    }
  }, [role, docSubTab]);

  useEffect(() => {
    if (initialTabFromUrl === 'Court Forms') {
      setActiveTab('Documents');
      setDocSubTab(role === 'client' ? 'case' : 'court_forms');
    } else if (initialTabFromUrl) {
      if (role === 'client' && initialTabFromUrl === 'Drafting') {
        setActiveTab('Overview');
      } else {
        setActiveTab(initialTabFromUrl);
      }
    }
    const validSubTabs = role === 'client'
      ? ['client', 'case']
      : ['client', 'case', 'other', 'court_forms', 'personalized_templates'];
    if (initialSubTabFromUrl && validSubTabs.includes(initialSubTabFromUrl)) {
      setDocSubTab(initialSubTabFromUrl as any);
    }
  }, [initialTabFromUrl, initialSubTabFromUrl, role]);

  useEffect(() => {
    if (caseId && activeTab && typeof window !== 'undefined') {
      sessionStorage.setItem(`lastCaseTab_${caseId}`, activeTab);
    }
  }, [caseId, activeTab]);

  useEffect(() => {
    if (caseId && docSubTab && typeof window !== 'undefined') {
      sessionStorage.setItem(`lastCaseSubTab_${caseId}`, docSubTab);
    }
  }, [caseId, docSubTab]);

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
    ...(role !== 'client' ? [{ name: 'Drafting', icon: PenTool }] : []),
    { name: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col w-full pb-12">

      {/* Top Actions & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <Link
            href={viewBase}
            className="text-slate-600 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
          >
            Cases
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-slate-400" />
          <span className="text-gray-900 font-bold">Case Detail</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {role !== 'client' && (
            <>

            </>
          )}

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
              <div className="flex flex-wrap gap-2">
                <Badge variant={caseData.is_registered === false || caseData.case_number?.toUpperCase().startsWith('D_') ? 'unregistered' : 'registered'}>
                  {caseData.is_registered === false || caseData.case_number?.toUpperCase().startsWith('D_') ? 'Unregistered (Diary)' : 'Registered Case'}
                </Badge>
                <Badge variant="default">{formatTitleCase(caseData.category)}</Badge>
                <Badge variant="default">{formatTitleCase(caseData.case_type)}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col text-center items-center">
              <span className="text-xs text-gray-500 font-medium mb-1">Case No.</span>
              <span className="text-sm font-bold text-gray-900">{caseData.case_number || '—'}</span>
              <span className="text-[10px] text-gray-400 font-medium">Advocate Ref</span>
            </div>
            <div className="flex flex-col text-center items-center">
              <span className="text-xs text-gray-500 font-medium mb-1">
                {caseData.is_registered === false ? 'Diary No. (Unreg)' : 'Court Reg No.'}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {caseData.registration_number || (caseData.is_registered === false ? '—' : 'Pending')}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {caseData.is_registered === false ? 'Unregistered Diary' : 'Court Registered'}
              </span>
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
              <CardHeader title="Matter Summary" icon={Briefcase} />
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Case Title" value={caseData.case_title} />
                <Field label="Case Number (Advocate Ref)" value={caseData.case_number || '—'} />
                <Field 
                  label="Registration Status" 
                  value={caseData.is_registered === false ? "Unregistered (Diary Stage)" : "Registered Case"} 
                />
                <Field 
                  label={caseData.is_registered === false ? "Diary / Unregistered No." : "Court Registration No."} 
                  value={caseData.registration_number || (caseData.is_registered === false ? '—' : 'Pending Filing')} 
                />
                <Field label="Stage" value={formatTitleCase(caseData.stage)} />
                <Field label="Status" value={formatTitleCase(caseData.status)} />
                <Field label="Priority" value={formatTitleCase(caseData.priority)} />
                <Field label="Case Type" value={formatTitleCase(caseData.case_type)} />
                <Field label="Category" value={formatTitleCase(caseData.category)} />
                <div className="col-span-2">
                  <Field label="Description" value={caseData.description} />
                </div>
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
              <CardHeader title="Assignments" icon={Users} />
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
          role === 'client' ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-14 text-center max-w-3xl mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-5 border border-purple-100 shadow-inner">
                <CreditCard className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-4 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Coming Soon
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Client Billing & Invoicing
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto mb-8">
                Online fee payments, invoice tracking, and downloadable tax receipts are coming soon to your client portal. All case billing milestones and retainers are currently managed directly by your legal counsel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left border-t border-gray-100 pt-8">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="font-bold text-xs text-gray-900 mb-1">Instant Online Payments</div>
                  <div className="text-xs text-gray-500">Secure UPI, NetBanking, and Card payments directly through your client dashboard.</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="font-bold text-xs text-gray-900 mb-1">Itemized Invoices</div>
                  <div className="text-xs text-gray-500">Transparent breakdowns of professional fees, court filing charges, and disbursements.</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="font-bold text-xs text-gray-900 mb-1">Tax Receipts</div>
                  <div className="text-xs text-gray-500">Download official payment acknowledgment certificates and GST receipts anytime.</div>
                </div>
              </div>

              {caseData.advocate_name && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span>Assigned Advocate:</span>
                  <span className="font-bold text-gray-900">{caseData.advocate_name}</span>
                </div>
              )}
            </div>
          ) : (
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
          )
        )}

        {activeTab === 'Documents' && (
          <div className="space-y-6">
            {/* Top Sub-Nav Tabs for Documents */}
            <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar mb-6">
              <button
                type="button"
                onClick={() => {
                  setDocSubTab('case');
                  setActiveFormId(null);
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'Documents');
                    url.searchParams.set('subtab', 'case');
                    url.searchParams.delete('formId');
                    url.searchParams.delete('newBlank');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${docSubTab === 'case'
                    ? 'text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                style={docSubTab === 'case' ? { borderBottomColor: accent, color: accent } : {}}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span>Case Filing Pack</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Case Filing Pack information"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowTabInfo('case', e);
                  }}
                  onMouseEnter={(e) => handleShowTabInfo('case', e)}
                  onMouseLeave={handleHideTabInfo}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-100 transition-colors ml-0.5 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDocSubTab('client');
                  setActiveFormId(null);
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'Documents');
                    url.searchParams.set('subtab', 'client');
                    url.searchParams.delete('formId');
                    url.searchParams.delete('newBlank');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${docSubTab === 'client'
                    ? 'text-gray-900 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                style={docSubTab === 'client' ? { borderBottomColor: accent, color: accent } : {}}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Client Requests</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Client Requests information"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowTabInfo('client', e);
                  }}
                  onMouseEnter={(e) => handleShowTabInfo('client', e)}
                  onMouseLeave={handleHideTabInfo}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-100 transition-colors ml-0.5 cursor-help"
                >
                  <Info className="w-3.5 h-3.5" />
                </span>
              </button>

              {role !== 'client' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDocSubTab('other');
                      setActiveFormId(null);
                      if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', 'Documents');
                        url.searchParams.set('subtab', 'other');
                        url.searchParams.delete('formId');
                        url.searchParams.delete('newBlank');
                        window.history.replaceState({}, '', url.toString());
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${docSubTab === 'other'
                        ? 'text-gray-900 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    style={docSubTab === 'other' ? { borderBottomColor: accent, color: accent } : {}}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Supporting Files</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Supporting Files information"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowTabInfo('other', e);
                      }}
                      onMouseEnter={(e) => handleShowTabInfo('other', e)}
                      onMouseLeave={handleHideTabInfo}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-100 transition-colors ml-0.5 cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDocSubTab('court_forms');
                      setActiveFormId(null);
                      if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', 'Documents');
                        url.searchParams.set('subtab', 'court_forms');
                        url.searchParams.delete('formId');
                        url.searchParams.delete('newBlank');
                        window.history.replaceState({}, '', url.toString());
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${docSubTab === 'court_forms'
                        ? 'text-gray-900 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    style={docSubTab === 'court_forms' ? { borderBottomColor: accent, color: accent } : {}}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>Court Forms</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Court Forms information"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowTabInfo('court_forms', e);
                      }}
                      onMouseEnter={(e) => handleShowTabInfo('court_forms', e)}
                      onMouseLeave={handleHideTabInfo}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-100 transition-colors ml-0.5 cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDocSubTab('personalized_templates');
                      setActiveFormId(null);
                      if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', 'Documents');
                        url.searchParams.set('subtab', 'personalized_templates');
                        url.searchParams.delete('formId');
                        url.searchParams.delete('newBlank');
                        window.history.replaceState({}, '', url.toString());
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${docSubTab === 'personalized_templates'
                        ? 'text-gray-900 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    style={docSubTab === 'personalized_templates' ? { borderBottomColor: accent, color: accent } : {}}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Personalized Templates</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Personalized Templates information"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowTabInfo('personalized_templates', e);
                      }}
                      onMouseEnter={(e) => handleShowTabInfo('personalized_templates', e)}
                      onMouseLeave={handleHideTabInfo}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-purple-700 hover:bg-purple-100 transition-colors ml-0.5 cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Tab Info Tooltip Popup */}
            {tabInfoTooltip && (
              <div
                className="fixed z-[99999] transition-all duration-150 shadow-xl rounded-xl p-3.5 bg-white/95 backdrop-blur-md text-gray-800 border border-purple-100 shadow-purple-900/10 pointer-events-auto"
                style={{
                  top: `${tabInfoTooltip.y}px`,
                  left: `${tabInfoTooltip.x}px`,
                  width: '330px',
                  maxWidth: 'calc(100vw - 32px)',
                }}
                onMouseEnter={() => {
                  if (hideTabInfoTimeoutRef.current) {
                    clearTimeout(hideTabInfoTimeoutRef.current);
                    hideTabInfoTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={handleHideTabInfo}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 mt-0.5 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 mb-1 flex items-center justify-between">
                      <span>{tabInfoTooltip.title}</span>
                      <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                        Guide
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      {tabInfoTooltip.desc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle View Content */}
            {docSubTab === 'case' ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-700" />
                  Case Filing Pack
                </h3>
                <DocumentManager
                  key="all-docs-manager"
                  accent={accent}
                  caseId={caseId}
                  clientId={caseData.client || caseData.client_id}
                  viewBase={viewBase.replace('/cases', '/documents')}
                  role={role}
                  showUpload={role !== 'client'}
                  section="all"
                />
              </div>
            ) : docSubTab === 'other' && role !== 'client' ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-700" />
                  Supporting Files
                </h3>
                <DocumentManager
                  key="other-docs-manager"
                  accent={accent}
                  caseId={caseId}
                  clientId={caseData.client || caseData.client_id}
                  viewBase={viewBase.replace('/cases', '/documents')}
                  role={role}
                  showUpload={true}
                  section="other"
                />
              </div>
            ) : docSubTab === 'court_forms' && role !== 'client' ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <PDFCourtFormEditor
                  key={activeFormId ? `form-${activeFormId}` : 'court-forms-list'}
                  caseId={caseId}
                  clientId={caseData.client || caseData.client_id}
                  role={role}
                  accent={accent}
                  initialFormId={activeFormId}
                  newBlank={activeFormId ? false : newBlank}
                />
              </div>
            ) : docSubTab === 'personalized_templates' && role !== 'client' ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <PersonalizedTemplatesManager
                  caseId={caseId}
                  clientId={caseData.client || caseData.client_id}
                  caseData={caseData}
                  role={role}
                  accent={accent}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <DocumentVerificationSystem
                  caseId={caseId}
                  clientId={caseData.client || caseData.client_id}
                  role={role}
                  accent={accent}
                  viewBase={viewBase.replace('/cases', '/documents')}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'Drafting' && role !== 'client' && (
          <div className="bg-white rounded-xl shadow-sm">
            <DocuMindIntegration caseId={caseId} />
          </div>
        )}

        {/* Mock for other tabs to keep UI populated */}
        {['Hearings'].includes(activeTab) && (
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