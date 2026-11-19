'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, User, Phone, Mail, Search, Filter, Plus,
  ChevronRight, ArrowRight, CheckCircle2, AlertCircle, Loader2,
  Calendar, IndianRupee, Scale, FileText, Check, Clock, X,
  Building2, Briefcase, FileCheck, RefreshCw, LayoutGrid, List,
  Tag, ArrowUpRight, ShieldCheck, Sparkles, AlertTriangle, GripVertical, Pencil
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import { toast } from 'react-hot-toast';
import CaseTypeSelect from './CaseTypeSelect';

export interface CrmLead {
  id: string;
  firm?: string;
  client?: string | null;
  is_prospect?: boolean;
  prospect_name?: string;
  prospect_phone?: string;
  prospect_email?: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_profile_image?: string | null;
  assigned_advocate?: string;
  advocate_name?: string;
  title: string;
  category: 'court_case' | 'pre_litigation';
  case_type: string;
  opposing_party?: string;
  brief_summary?: string;
  source: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'contacted' | 'consultation' | 'assessment' | 'proposal' | 'converted' | 'lost';
  estimated_fee?: string | number | null;
  consultation_date?: string | null;
  intake_notes?: string;
  loss_reason?: string;
  converted_case?: string | null;
  converted_case_title?: string | null;
  converted_case_number?: string | null;
  converted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

interface PipelineStats {
  total_leads: number;
  new: number;
  contacted: number;
  consultation: number;
  assessment: number;
  proposal: number;
  converted: number;
  lost: number;
  total_estimated_value: number;
}

interface CrmLeadPipelineProps {
  baseCaseUrl?: string; // e.g. '/advocate/cases' or '/firm-admin/cases'
  userRole?: 'advocate' | 'firm-admin' | 'super-admin';
}

const STAGE_CONFIG: Array<{
  id: string;
  label: string;
  matchStatuses: Array<CrmLead['status']>;
  targetStatus: CrmLead['status'];
  color: string;
  dotColor: string;
  badgeBg: string;
  topBarColor: string;
}> = [
    {
      id: 'new',
      label: 'New Leads',
      matchStatuses: ['new'],
      targetStatus: 'new',
      color: 'text-blue-700',
      dotColor: 'bg-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      topBarColor: 'bg-blue-500'
    },
    {
      id: 'consultation',
      label: 'Consultation & Follow-up',
      matchStatuses: ['contacted', 'consultation'],
      targetStatus: 'consultation',
      color: 'text-amber-700',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      topBarColor: 'bg-amber-500'
    },
    {
      id: 'assessment',
      label: 'Case Assessment',
      matchStatuses: ['assessment'],
      targetStatus: 'assessment',
      color: 'text-purple-700',
      dotColor: 'bg-purple-500',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      topBarColor: 'bg-purple-500'
    },
    {
      id: 'proposal',
      label: 'Proposal / Engagement',
      matchStatuses: ['proposal'],
      targetStatus: 'proposal',
      color: 'text-indigo-700',
      dotColor: 'bg-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      topBarColor: 'bg-indigo-500'
    },
    {
      id: 'converted',
      label: 'Finalized / Retained Cases',
      matchStatuses: ['converted'],
      targetStatus: 'converted',
      color: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      topBarColor: 'bg-emerald-500'
    }
  ];

export default function CrmLeadPipeline({
  baseCaseUrl = '/advocate/cases',
  userRole = 'advocate'
}: CrmLeadPipelineProps) {
  const router = useRouter();

  // Data states
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'court_case' | 'pre_litigation'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Drag and Drop states
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Lead Details Slide-Over Drawer state
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<CrmLead | null>(null);

  // Modal states
  const [finalizeModalLead, setFinalizeModalLead] = useState<CrmLead | null>(null);
  const [finalizeSubmitting, setFinalizeSubmitting] = useState(false);
  const [finalizeForm, setFinalizeForm] = useState({
    case_title: '',
    category: 'court_case',
    case_type: '',
    petitioner_name: '',
    respondent_name: '',
    opposing_counsel: '',
    court_name: '',
    court_no: '',
    judge_name: '',
    district: '',
    state: '',
    billing_type: 'retainer',
    total_fee: '',
  });

  // Quick New Lead Modal State
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [intakeClientType, setIntakeClientType] = useState<'prospect' | 'existing'>('prospect');
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [newLeadSubmitting, setNewLeadSubmitting] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    prospect_name: '',
    prospect_phone: '',
    prospect_email: '',
    clientId: '',
    title: '',
    category: 'court_case' as 'court_case' | 'pre_litigation',
    case_type: 'Civil Suit',
    opposing_party: '',
    brief_summary: '',
    estimated_fee: '',
    source: 'walk_in',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'new' as CrmLead['status']
  });

  // Drawer Edit Lead State
  const [isDrawerEditing, setIsDrawerEditing] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'court_case' as 'court_case' | 'pre_litigation',
    case_type: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    estimated_fee: '',
    opposing_party: '',
    brief_summary: '',
    status: 'new' as CrmLead['status'],
    source: 'walk_in',
    is_prospect: true,
    clientId: '',
    prospect_name: '',
    prospect_phone: '',
    prospect_email: '',
  });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [leadsRes, statsRes] = await Promise.all([
        customFetch(API.LEADS.LIST),
        customFetch(API.LEADS.PIPELINE_STATS)
      ]);

      if (!leadsRes.ok) throw new Error('Failed to load CRM leads');

      const leadsData = await leadsRes.json();
      const list = Array.isArray(leadsData) ? leadsData : (leadsData.results || []);
      setLeads(list);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading leads pipeline');
      toast.error('Failed to load CRM leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Load clients list for the "+ New Lead" modal
  const loadClientsForModal = async () => {
    try {
      setClientsLoading(true);
      const res = await customFetch(API.CLIENTS.MY_CLIENTS);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      setClientsList(list);
    } catch (err) {
      console.error('Error fetching clients for lead modal', err);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleOpenNewLeadModal = (initialStage?: string | React.MouseEvent) => {
    const stage = typeof initialStage === 'string' ? (initialStage as CrmLead['status']) : 'new';
    setNewLeadForm((prev) => ({ ...prev, status: stage }));
    setShowNewLeadModal(true);
    if (clientsList.length === 0) {
      loadClientsForModal();
    }
  };

  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (intakeClientType === 'prospect') {
      if (!newLeadForm.prospect_name.trim()) {
        toast.error('Please enter the client / prospect name');
        return;
      }
      if (!newLeadForm.prospect_phone.trim()) {
        toast.error('Please enter a phone number for the prospect');
        return;
      }
    } else {
      if (!newLeadForm.clientId) {
        toast.error('Please select an existing client');
        return;
      }
    }

    if (!newLeadForm.title.trim()) {
      toast.error('Matter title is required');
      return;
    }

    try {
      setNewLeadSubmitting(true);
      const payload: any = {
        title: newLeadForm.title.trim(),
        category: newLeadForm.category,
        case_type: newLeadForm.case_type,
        opposing_party: newLeadForm.opposing_party.trim(),
        brief_summary: newLeadForm.brief_summary.trim(),
        estimated_fee: newLeadForm.estimated_fee ? parseFloat(newLeadForm.estimated_fee) : null,
        source: newLeadForm.source,
        priority: newLeadForm.priority,
        status: typeof newLeadForm.status === 'string' ? newLeadForm.status : 'new'
      };

      if (intakeClientType === 'prospect') {
        payload.prospect_name = newLeadForm.prospect_name.trim();
        payload.prospect_phone = newLeadForm.prospect_phone.trim();
        payload.prospect_email = newLeadForm.prospect_email.trim();
      } else {
        payload.client = newLeadForm.clientId;
      }

      const res = await customFetch(API.LEADS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || 'Failed to create lead');
      }

      toast.success(
        intakeClientType === 'prospect'
          ? `Prospect "${newLeadForm.prospect_name}" recorded in CRM pipeline!`
          : 'Lead created for registered client!'
      );

      setShowNewLeadModal(false);
      setNewLeadForm({
        prospect_name: '',
        prospect_phone: '',
        prospect_email: '',
        clientId: '',
        title: '',
        category: 'court_case',
        case_type: 'Civil Suit',
        opposing_party: '',
        brief_summary: '',
        estimated_fee: '',
        source: 'walk_in',
        priority: 'medium',
        status: 'new'
      });
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setNewLeadSubmitting(false);
    }
  };

  // Stage change directly from dropdown or drag-and-drop
  const handleUpdateLeadStage = async (leadId: string, nextStatus: CrmLead['status']) => {
    // If moving to converted, open the finalize modal directly!
    if (nextStatus === 'converted') {
      const target = leads.find((l) => l.id === leadId);
      if (target) {
        openFinalizeModal(target);
      }
      return;
    }

    const previousStatus = leads.find((l) => l.id === leadId)?.status;

    // Optimistically update local state for instantaneous feedback
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
    );
    setSelectedLeadDetails((prev) =>
      prev && prev.id === leadId ? { ...prev, status: nextStatus } : prev
    );

    try {
      const res = await customFetch(API.LEADS.DETAIL(leadId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) throw new Error('Failed to update stage');

      toast.success(`Lead moved to ${nextStatus.replace('_', ' ')}`);

      // Refresh pipeline stats silently in background
      customFetch(API.LEADS.PIPELINE_STATS)
        .then((r) => r.ok && r.json())
        .then((s) => s && setStats(s))
        .catch(() => { });
    } catch (err: any) {
      // Rollback on error
      if (previousStatus) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l))
        );
        setSelectedLeadDetails((prev) =>
          prev && prev.id === leadId ? { ...prev, status: previousStatus } : prev
        );
      }
      toast.error(err.message || 'Failed to update stage');
    }
  };

  // Open Edit Mode inside Side Drawer
  const handleOpenEditLead = (lead: CrmLead) => {
    if (lead.status === 'converted' || lead.converted_case) {
      toast.error('Finalized leads cannot be edited as an official case file has already been opened.');
      return;
    }

    setSelectedLeadDetails(lead);
    setIsDrawerEditing(true);
    setEditForm({
      title: lead.title || '',
      category: lead.category || 'court_case',
      case_type: lead.case_type || '',
      priority: lead.priority || 'medium',
      estimated_fee: lead.estimated_fee ? String(lead.estimated_fee) : '',
      opposing_party: lead.opposing_party || '',
      brief_summary: lead.brief_summary || '',
      status: lead.status || 'new',
      source: lead.source || 'walk_in',
      is_prospect: Boolean(lead.is_prospect || !lead.client),
      clientId: lead.client ? String(lead.client) : '',
      prospect_name: lead.client_name || lead.prospect_name || '',
      prospect_phone: lead.client_phone || lead.prospect_phone || '',
      prospect_email: lead.client_email || lead.prospect_email || '',
    });
  };

  const handleSaveEditLead = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLeadDetails) return;

    if (selectedLeadDetails.status === 'converted' || selectedLeadDetails.converted_case) {
      toast.error('Finalized leads cannot be edited.');
      setIsDrawerEditing(false);
      return;
    }

    if (!editForm.title.trim()) {
      toast.error('Matter title is required');
      return;
    }

    if (!editForm.prospect_name.trim()) {
      toast.error('Client name is required');
      return;
    }

    try {
      setEditSubmitting(true);
      const payload: any = {
        title: editForm.title.trim(),
        category: editForm.category,
        case_type: editForm.case_type.trim(),
        priority: editForm.priority,
        estimated_fee: editForm.estimated_fee ? parseFloat(editForm.estimated_fee) : 0,
        opposing_party: editForm.opposing_party.trim(),
        brief_summary: editForm.brief_summary.trim(),
        status: editForm.status,
        source: editForm.source,
        prospect_name: editForm.prospect_name.trim(),
        prospect_phone: editForm.prospect_phone.trim(),
        prospect_email: editForm.prospect_email.trim(),
      };

      const res = await customFetch(API.LEADS.UPDATE(selectedLeadDetails.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || 'Failed to update lead');
      }

      const updatedLead: CrmLead = await res.json();
      toast.success('Lead updated successfully!');

      setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
      setSelectedLeadDetails(updatedLead);
      setIsDrawerEditing(false);

      // Refresh pipeline stats
      customFetch(API.LEADS.PIPELINE_STATS)
        .then((r) => r.ok && r.json())
        .then((s) => s && setStats(s))
        .catch(() => { });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update lead');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, lead: CrmLead) => {
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(lead.id);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDragOverColumnId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const related = e.relatedTarget as HTMLElement | null;
    if (!e.currentTarget.contains(related)) {
      if (dragOverColumnId === colId) {
        setDragOverColumnId(null);
      }
    }
  };

  const handleDropOnColumn = async (e: React.DragEvent, col: (typeof STAGE_CONFIG)[number]) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);
    setDragOverColumnId(null);

    if (!leadId) return;
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    // If the lead is already in one of the statuses for this column, do nothing
    if (col.matchStatuses.includes(targetLead.status)) {
      return;
    }

    // Dropping into Converted / Finalized column: launch the Finalize Modal
    if (col.id === 'converted' || col.targetStatus === 'converted') {
      openFinalizeModal(targetLead);
      toast('Review case details to finalize and create the case file', { icon: '⚖️' });
      return;
    }

    // Otherwise update stage
    await handleUpdateLeadStage(leadId, col.targetStatus);
  };

  // Open Finalize & Convert Modal
  const openFinalizeModal = (lead: CrmLead) => {
    setFinalizeModalLead(lead);
    const clientName = lead.client_name || lead.prospect_name || 'Client';
    setFinalizeForm({
      case_title: lead.title || `${clientName}'s Case`,
      category: lead.category || 'court_case',
      case_type: lead.case_type || 'Civil Suit',
      petitioner_name: clientName,
      respondent_name: lead.opposing_party || '',
      opposing_counsel: '',
      court_name: '',
      court_no: '',
      judge_name: '',
      district: '',
      state: '',
      billing_type: 'retainer',
      total_fee: lead.estimated_fee ? String(lead.estimated_fee) : '',
    });
  };

  // Submit Finalize & Convert
  const handleFinalizeAndConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeModalLead) return;

    try {
      setFinalizeSubmitting(true);
      const res = await customFetch(API.LEADS.CONVERT(finalizeModalLead.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalizeForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Failed to finalize lead');
      }

      toast.success(
        data.client_name
          ? `Client "${data.client_name}" enrolled & case file created!`
          : 'Lead finalized! Case file created successfully.'
      );
      setFinalizeModalLead(null);

      // Immediately navigate to the created Case File!
      if (data.case_id) {
        router.push(`${baseCaseUrl}/${data.case_id}`);
      } else {
        fetchLeads();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error converting lead to case file');
    } finally {
      setFinalizeSubmitting(false);
    }
  };

  // Filtering leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Category filter
      if (categoryFilter !== 'all' && lead.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.client_name?.toLowerCase().includes(q);
        const matchesTitle = lead.title?.toLowerCase().includes(q);
        const matchesOpp = lead.opposing_party?.toLowerCase().includes(q);
        const matchesPhone = lead.client_phone?.includes(q);
        const matchesCaseType = lead.case_type?.toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesOpp && !matchesPhone && !matchesCaseType) {
          return false;
        }
      }

      return true;
    });
  }, [leads, categoryFilter, priorityFilter, searchQuery]);

  // Format currency in Rupees
  const formatRupees = (val?: string | number | null) => {
    if (val === null || val === undefined || val === '') return '₹ 0';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '₹ 0';
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const priorityBadge = (priority: CrmLead['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Med
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── FRAMELESS TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1">

            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Legal CRM & Leads Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-[#4a1c40] border border-purple-200/60">
              {leads.length} Leads
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Capture inquiries, track consultations, and convert retained clients into active case files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'kanban'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          <button
            onClick={fetchLeads}
            disabled={loading}
            title="Refresh Leads"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200/60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenNewLeadModal('new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4a1c40] hover:bg-[#3a1530] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* ─── FRAMELESS METRICS ROW ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-6 pt-1 pb-4 border-b border-slate-200/70">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_leads ?? leads.length}</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
            {stats?.new ?? leads.filter((l) => l.status === 'new').length} New Inquiries
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Consultations</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {(stats?.consultation ?? 0) + (stats?.contacted ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Scheduled / In Contact</p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assessment & Proposal</p>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {(stats?.assessment ?? 0) + (stats?.proposal ?? 0)}
          </p>
          <p className="text-[11px] text-purple-500 font-semibold mt-0.5">Pending Retainer</p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cases Finalized</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.converted ?? leads.filter((l) => l.status === 'converted').length}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <Check className="w-3 h-3" /> Active Case Files
          </p>
        </div>

        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pipeline Value</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatRupees(stats?.total_estimated_value ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Estimated Potential</p>
        </div>
      </div>

      {/* ─── FRAMELESS SEARCH & FILTERS TOOLBAR ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by client name, matter title, opposing party..."
            className="w-full h-9.5 pl-9 pr-8 bg-white text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-[#4a1c40] transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Category Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 shrink-0">
            {(['all', 'court_case', 'pre_litigation'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${categoryFilter === cat
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {cat === 'all' ? 'All Matters' : cat === 'court_case' ? 'Court Cases' : 'Pre-Litigation'}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="h-9.5 px-3 bg-white text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#4a1c40] shadow-2xs cursor-pointer shrink-0"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: Kanban vs Table */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#4a1c40] mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading CRM Pipeline...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-16 text-center">
          <div className="w-12 h-12 bg-purple-50 text-[#4a1c40] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No Leads Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try modifying search query or clearing active filters.'
              : 'Add a new client or record a prospective intake to start your CRM pipeline.'}
          </p>
          <button
            onClick={() => handleOpenNewLeadModal('new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4a1c40] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#3a1530] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create First Lead
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW - RESPONSIVE SCROLL FOR TABLET & CLEAN GRID ON DESKTOP */
        <div className="flex gap-3.5 items-start overflow-x-auto pb-4 pt-1 px-0.5 scrollbar-thin xl:grid xl:grid-cols-5 xl:overflow-x-visible xl:gap-4">
          {STAGE_CONFIG.map((col) => {
            const colLeads = filteredLeads.filter((l) => col.matchStatuses.includes(l.status));
            const isOverThisCol = dragOverColumnId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOverColumn(e, col.id)}
                onDragLeave={(e) => handleDragLeaveColumn(e, col.id)}
                onDrop={(e) => handleDropOnColumn(e, col)}
                className={`w-[290px] sm:w-[310px] shrink-0 xl:w-auto rounded-xl border transition-all duration-200 overflow-hidden flex flex-col max-h-[85vh] ${isOverThisCol
                  ? 'bg-purple-50/60 border-purple-300 ring-2 ring-[#4a1c40]/15 shadow-sm'
                  : 'bg-slate-50/50 border-slate-200/70'
                  }`}
              >
                {/* Column Header - Simple & Minimalist */}
                <div className="px-3.5 py-3 bg-white flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                    <span className="text-xs font-semibold text-slate-800 truncate">{col.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-[360px]">
                  {/* Drop Placeholder if hovered */}
                  {isOverThisCol && draggingLeadId && (
                    <div className="p-3 border-2 border-dashed border-[#4a1c40] bg-white rounded-xl text-center text-xs font-semibold text-[#4a1c40] flex items-center justify-center gap-2 shadow-2xs animate-pulse">
                      <span>Drop here to move to {col.label}</span>
                    </div>
                  )}

                  {colLeads.length === 0 && (!isOverThisCol || !draggingLeadId) ? (
                    <div className="py-8 text-center text-slate-400">
                      <p className="text-xs font-medium text-slate-400">No leads in this stage</p>
                      {col.id === 'new' && (
                        <button
                          onClick={() => handleOpenNewLeadModal('new')}
                          className="mt-2 text-xs text-[#4a1c40] font-semibold hover:underline cursor-pointer"
                        >
                          + Record new intake
                        </button>
                      )}
                    </div>
                  ) : (
                    colLeads.map((lead) => {
                      const isConverted = lead.status === 'converted' || Boolean(lead.converted_case);
                      const isThisDragging = draggingLeadId === lead.id;
                      const isProspect = lead.is_prospect || !lead.client;
                      const displayName = lead.client_name || lead.prospect_name || 'Prospect Client';
                      const initial = (displayName[0] || 'P').toUpperCase();

                      return (
                        <div
                          key={lead.id}
                          draggable={!isConverted}
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedLeadDetails(lead);
                            setIsDrawerEditing(false);
                          }}
                          className={`bg-white rounded-xl border border-slate-200/70 p-3 space-y-2 hover:border-slate-300 hover:shadow-xs transition-all relative group select-none cursor-pointer ${isConverted ? 'border-emerald-200/70 bg-emerald-50/15' : ''
                            } ${isThisDragging
                              ? 'opacity-30 scale-95 border-2 border-dashed border-[#4a1c40]'
                              : ''
                            }`}
                        >
                          {/* Card Top: Drag Handle, Badges & Priority */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!isConverted && (
                                <span
                                  className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 cursor-grab"
                                  title="Drag to change stage"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${lead.category === 'pre_litigation'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-purple-50 text-[#4a1c40]'
                                  }`}
                              >
                                {lead.category === 'pre_litigation' ? 'Pre-Lit' : 'Court Case'}
                              </span>
                              {isProspect && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700" title="Prospect client not yet enrolled">
                                  Prospect
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isConverted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditLead(lead);
                                  }}
                                  title="Edit Lead"
                                  className="w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                              {priorityBadge(lead.priority)}
                            </div>
                          </div>

                          {/* Matter Title & Classification */}
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-[#4a1c40] transition-colors line-clamp-2 leading-snug">
                              {lead.title}
                            </h4>
                            {lead.case_type && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {lead.case_type}
                              </p>
                            )}
                          </div>

                          {/* Client Information */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-[10px] shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-xs truncate leading-tight">
                                  {displayName}
                                </p>
                                {lead.client_phone && (
                                  <a
                                    href={`tel:${lead.client_phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-0.5"
                                  >
                                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{lead.client_phone}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                            {lead.estimated_fee ? (
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {formatRupees(lead.estimated_fee)}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* Opposing Party if present */}
                          {lead.opposing_party && (
                            <p className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md truncate">
                              <span className="text-slate-400 font-medium">vs.</span> {lead.opposing_party}
                            </p>
                          )}

                          {/* Stage Dropdown or Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            {isConverted ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`${baseCaseUrl}/${lead.converted_case}`);
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Open Case File</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <>
                                <select
                                  value={lead.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleUpdateLeadStage(lead.id, e.target.value as any);
                                  }}
                                  className="text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 outline-none cursor-pointer"
                                >
                                  <option value="new">New Lead</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="consultation">Consultation</option>
                                  <option value="assessment">Assessment</option>
                                  <option value="proposal">Proposal</option>
                                  <option value="converted">Finalize & Retain</option>
                                  <option value="lost">Lost</option>
                                </select>

                                {/* PROMINENT "FINALIZE & OPEN CASE FILE" BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFinalizeModal(lead);
                                  }}
                                  title="Finalize lead and generate an official Case File"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4a1c40] hover:bg-[#3a1530] text-white text-[11px] font-medium rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                  <span>Finalize</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / LIST VIEW - FRAMED */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Matter Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Stage / Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Est. Fee</th>
                  <th className="py-3.5 px-4">Opposing Party</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.map((lead) => {
                  const isConverted = lead.status === 'converted' || Boolean(lead.converted_case);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadDetails(lead);
                        setIsDrawerEditing(false);
                      }}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200/60">
                            {((lead.client_name || lead.prospect_name || 'P')[0] || 'P').toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 group-hover:text-[#4a1c40] transition-colors">{lead.client_name || lead.prospect_name}</span>
                              {(!lead.client || lead.is_prospect) && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                                  Prospect
                                </span>
                              )}
                            </div>
                            {lead.client_phone && (
                              <span className="text-[11px] text-slate-400 font-normal">{lead.client_phone}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{lead.title}</div>
                        {lead.case_type && (
                          <div className="text-[10px] text-slate-400">{lead.case_type}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-[#4a1c40]">
                          {lead.category === 'pre_litigation' ? 'Pre-Litigation' : 'Court Case'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{priorityBadge(lead.priority)}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700">
                        {formatRupees(lead.estimated_fee)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {lead.opposing_party || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isConverted && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditLead(lead);
                              }}
                              title="Edit Lead Details"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                          )}
                          {isConverted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`${baseCaseUrl}/${lead.converted_case}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <Briefcase className="w-3.5 h-3.5" /> View Case File
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openFinalizeModal(lead);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4a1c40] text-white text-xs font-semibold rounded-lg hover:bg-[#3a1530] transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Finalize & Open Case</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: FINALIZE LEAD INTO OFFICIAL CASE FILE ─── */}
      {finalizeModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-linear-to-r from-purple-50/60 to-white">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4a1c40] text-white flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Finalize & Open Case File</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Convert this CRM intake into an active Case File. All client details, opposing party, and agreed retainer will be transferred.
                </p>
              </div>
              <button
                onClick={() => setFinalizeModalLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Context Banner */}
            <div className="p-4 mx-6 mt-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client / Retainer</p>
                <p className="font-bold text-slate-900 text-sm">{finalizeModalLead.client_name}</p>
                <p className="text-slate-500">{finalizeModalLead.client_phone || finalizeModalLead.client_email}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Originating Lead</p>
                <p className="font-bold text-purple-700">{finalizeModalLead.title}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFinalizeAndConvert} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={finalizeForm.case_title}
                  onChange={(e) => setFinalizeForm({ ...finalizeForm, case_title: e.target.value })}
                  placeholder="e.g. Ramesh Kumar vs. State of Maharashtra"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={finalizeForm.category}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, category: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                  >
                    <option value="court_case">Court Case</option>
                    <option value="pre_litigation">Pre-Litigation</option>
                  </select>
                </div>
                <div>
                  <CaseTypeSelect
                    label="Case Type *"
                    required
                    value={finalizeForm.case_type}
                    onChange={(val) => setFinalizeForm({ ...finalizeForm, case_type: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Petitioner / Complainant
                  </label>
                  <input
                    type="text"
                    value={finalizeForm.petitioner_name}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, petitioner_name: e.target.value })}
                    placeholder="Petitioner name"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Respondent / Opposing Party
                  </label>
                  <input
                    type="text"
                    value={finalizeForm.respondent_name}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, respondent_name: e.target.value })}
                    placeholder="Opposing party name"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Court / Forum Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={finalizeForm.court_name}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, court_name: e.target.value })}
                    placeholder="e.g. High Court of Delhi"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Agreed Fee / Retainer (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      value={finalizeForm.total_fee}
                      onChange={(e) => setFinalizeForm({ ...finalizeForm, total_fee: e.target.value })}
                      placeholder="e.g. 50000"
                      className="w-full h-11 pl-8 pr-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-[#4a1c40]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFinalizeModalLead(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={finalizeSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#4a1c40] to-[#6b2c5c] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 disabled:opacity-50 transition-all"
                >
                  {finalizeSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Case File...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Finalize & Open Case File
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE NEW CRM LEAD ─── */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-linear-to-r from-purple-50/60 to-white">
              <div>
                <div className="flex items-center gap-2">

                  <h3 className="text-base font-bold text-slate-900">Add New CRM Lead / Intake</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Record a prospective client or new legal inquiry in your CRM pipeline.
                </p>
              </div>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewLead} className="p-6 space-y-4">
              {/* Segmented Switcher: New Prospect vs Existing Client */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Intake Client Type *
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setIntakeClientType('prospect')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${intakeClientType === 'prospect'
                      ? 'bg-white text-[#4a1c40] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#4a1c40]" />
                    <span>New Prospect / Walk-in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIntakeClientType('existing');
                      if (clientsList.length === 0) loadClientsForModal();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${intakeClientType === 'existing'
                      ? 'bg-white text-[#4a1c40] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Existing Client</span>
                  </button>
                </div>
              </div>

              {/* PROSPECT INPUTS */}
              {intakeClientType === 'prospect' ? (
                <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a1c40]">
                      Prospective Client Contact
                    </span>
                    <span className="text-[10px] text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full font-semibold">
                      CRM Lead
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Client / Prospect Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={newLeadForm.prospect_name}
                          onChange={(e) => setNewLeadForm({ ...newLeadForm, prospect_name: e.target.value })}
                          placeholder="e.g. Rajesh Kumar"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={newLeadForm.prospect_phone}
                          onChange={(e) => setNewLeadForm({ ...newLeadForm, prospect_phone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={newLeadForm.prospect_email}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, prospect_email: e.target.value })}
                        placeholder="e.g. rajesh@example.com"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    ✨ Stored directly in your CRM pipeline. Once this lead is finalized, the customer will be automatically enrolled in your official client database!
                  </p>
                </div>
              ) : (
                /* EXISTING CLIENT SELECTOR */
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Select Registered Client *
                  </label>
                  {clientsLoading ? (
                    <div className="h-10 flex items-center px-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading clients...
                    </div>
                  ) : (
                    <select
                      required
                      value={newLeadForm.clientId}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, clientId: e.target.value })}
                      className="w-full h-10 px-3 bg-white text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 outline-none focus:border-[#4a1c40] cursor-pointer"
                    >
                      <option value="">-- Choose an existing client --</option>
                      {clientsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name || `${c.first_name} ${c.last_name}`} • {c.phone_number || c.email || 'No phone'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* MATTER DETAILS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Matter Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.title}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, title: e.target.value })}
                  placeholder="e.g. Commercial Contract Dispute / Property Recovery"
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newLeadForm.category}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, category: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                  >
                    <option value="court_case">Court Case</option>
                    <option value="pre_litigation">Pre-Litigation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newLeadForm.priority}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <CaseTypeSelect
                  label="Case Type *"
                  required
                  value={newLeadForm.case_type}
                  onChange={(val) => setNewLeadForm({ ...newLeadForm, case_type: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Fee / Retainer (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      value={newLeadForm.estimated_fee}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, estimated_fee: e.target.value })}
                      placeholder="e.g. 25000"
                      className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Opposing Party (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.opposing_party}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, opposing_party: e.target.value })}
                    placeholder="e.g. State of Maharashtra or XYZ Corp"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brief Grievance / Matter Notes
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.brief_summary}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, brief_summary: e.target.value })}
                  placeholder="Summary of facts, grievance, or preliminary discussion..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newLeadSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#4a1c40] to-[#6b2c5c] text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {newLeadSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Intake...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Save to Pipeline
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER DRAWER: LEAD DETAILS & IN-PANEL EDIT ─── */}
      {selectedLeadDetails && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => {
              setSelectedLeadDetails(null);
              setIsDrawerEditing(false);
            }}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 overflow-hidden">
            {/* ── DRAWER TOP HEADER ── */}
            {isDrawerEditing ? (
              <div className="p-5 border-b border-slate-100 bg-linear-to-r from-purple-50/70 to-white flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4a1c40] text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">Edit Lead Details</h3>
                    <p className="text-[11px] text-slate-500">Edit and save changes directly in this side panel.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDrawerEditing(false)}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadDetails(null);
                      setIsDrawerEditing(false);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${selectedLeadDetails.category === 'pre_litigation'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                        : 'bg-purple-50 text-[#4a1c40] border border-purple-200/60'
                        }`}
                    >
                      {selectedLeadDetails.category === 'pre_litigation' ? 'Pre-Litigation' : 'Court Case'}
                    </span>
                    {priorityBadge(selectedLeadDetails.priority)}
                    {selectedLeadDetails.status === 'converted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Case Finalized
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Stage: {selectedLeadDetails.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug break-words">
                    {selectedLeadDetails.title}
                  </h2>
                  {selectedLeadDetails.case_type && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {selectedLeadDetails.case_type}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedLeadDetails.status !== 'converted' && !selectedLeadDetails.converted_case && (
                    <button
                      onClick={() => handleOpenEditLead(selectedLeadDetails)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
                      title="Edit this lead's details"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#4a1c40]" />
                      <span>Edit Lead</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedLeadDetails(null);
                      setIsDrawerEditing(false);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── DRAWER SCROLLABLE BODY ── */}
            {isDrawerEditing ? (
              <form id="drawer-lead-edit-form" onSubmit={handleSaveEditLead} className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* CLIENT CONTACT DETAILS */}
                <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Client Contact
                    </span>
                    {selectedLeadDetails.client ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                        Registered Client
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                        Prospect Lead
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Client / Contact Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={editForm.prospect_name}
                        onChange={(e) => setEditForm({ ...editForm, prospect_name: e.target.value })}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={editForm.prospect_phone}
                          onChange={(e) => setEditForm({ ...editForm, prospect_phone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={editForm.prospect_email}
                          onChange={(e) => setEditForm({ ...editForm, prospect_email: e.target.value })}
                          placeholder="e.g. rajesh@example.com"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MATTER DETAILS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Matter Title / Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="e.g. Commercial Contract Dispute / Property Recovery"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                    >
                      <option value="court_case">Court Case</option>
                      <option value="pre_litigation">Pre-Litigation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <CaseTypeSelect
                    label="Case Type *"
                    required
                    value={editForm.case_type}
                    onChange={(val) => setEditForm({ ...editForm, case_type: val })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Estimated Fee / Retainer (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={editForm.estimated_fee}
                        onChange={(e) => setEditForm({ ...editForm, estimated_fee: e.target.value })}
                        placeholder="e.g. 25000"
                        className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Opposing Party (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.opposing_party}
                      onChange={(e) => setEditForm({ ...editForm, opposing_party: e.target.value })}
                      placeholder="e.g. State of Maharashtra or XYZ Corp"
                      className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Current Stage / Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="consultation">Consultation</option>
                      <option value="assessment">Assessment</option>
                      <option value="proposal">Proposal</option>
                      <option value="converted">Converted / Finalized</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Intake Source
                    </label>
                    <select
                      value={editForm.source}
                      onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                    >
                      <option value="walk_in">Walk-in</option>
                      <option value="referral">Referral</option>
                      <option value="website">Website / Online</option>
                      <option value="phone">Phone Inquiry</option>
                      <option value="social">Social Media</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Brief Grievance / Matter Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.brief_summary}
                    onChange={(e) => setEditForm({ ...editForm, brief_summary: e.target.value })}
                    placeholder="Summary of facts, grievance, or preliminary discussion..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] resize-none"
                  />
                </div>
              </form>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Client Card */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Client Details
                    </span>
                    {selectedLeadDetails.is_prospect || !selectedLeadDetails.client ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                        Prospective Client
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                        Registered Client
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4a1c40]/10 text-[#4a1c40] flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200/40">
                      {((selectedLeadDetails.client_name || selectedLeadDetails.prospect_name || 'C')[0] || 'C').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {selectedLeadDetails.client_name || selectedLeadDetails.prospect_name || 'Prospect Client'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedLeadDetails.is_prospect || !selectedLeadDetails.client
                          ? 'Intake Lead (will enroll upon conversion)'
                          : 'Active Client in database'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                    {selectedLeadDetails.client_phone ? (
                      <a
                        href={`tel:${selectedLeadDetails.client_phone}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/70 hover:border-[#4a1c40] text-xs font-semibold text-slate-700 hover:text-[#4a1c40] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedLeadDetails.client_phone}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-slate-200/60 text-xs text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span>No phone recorded</span>
                      </div>
                    )}

                    {selectedLeadDetails.client_email ? (
                      <a
                        href={`mailto:${selectedLeadDetails.client_email}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/70 hover:border-[#4a1c40] text-xs font-semibold text-slate-700 hover:text-[#4a1c40] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedLeadDetails.client_email}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-slate-200/60 text-xs text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        <span>No email recorded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Matter & Financial Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estimated Fee / Retainer
                    </span>
                    <p className="text-lg font-bold text-emerald-700 mt-1">
                      {formatRupees(selectedLeadDetails.estimated_fee)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Intake Date
                    </span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {formatDate(selectedLeadDetails.created_at)}
                    </p>
                  </div>
                </div>

                {/* Case & Legal Details */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Matter & Case Metadata
                  </span>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Matter Type</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLeadDetails.category === 'pre_litigation' ? 'Pre-Litigation' : 'Court Case'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Case Classification</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLeadDetails.case_type || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Opposing Party</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLeadDetails.opposing_party || 'None recorded'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Intake Source</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedLeadDetails.source?.replace('_', ' ') || 'Walk-in'}
                    </span>
                  </div>

                  {selectedLeadDetails.advocate_name && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 font-medium">Assigned Advocate</span>
                      <span className="font-semibold text-slate-800">
                        {selectedLeadDetails.advocate_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Brief Grievance & Facts Notes */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Grievance & Matter Summary
                  </span>
                  <p className="text-xs text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">
                    {selectedLeadDetails.brief_summary || 'No grievance notes recorded during intake.'}
                  </p>
                </div>

                {/* If converted, show active case file info */}
                {selectedLeadDetails.converted_case && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Official Case File Active</span>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Converted on {formatDate(selectedLeadDetails.converted_at)}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedLeadDetails(null);
                        setIsDrawerEditing(false);
                        router.push(`${baseCaseUrl}/${selectedLeadDetails.converted_case}`);
                      }}
                      className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Go to Active Case File</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── DRAWER STICKY FOOTER ── */}
            {isDrawerEditing ? (
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditLead()}
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#4a1c40] to-[#6b2c5c] text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                {selectedLeadDetails.status !== 'converted' && !selectedLeadDetails.converted_case ? (
                  <>
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-[11px] font-bold text-slate-500 shrink-0">Stage:</label>
                      <select
                        value={selectedLeadDetails.status}
                        onChange={async (e) => {
                          const next = e.target.value as any;
                          if (next === 'converted') {
                            openFinalizeModal(selectedLeadDetails);
                          } else {
                            await handleUpdateLeadStage(selectedLeadDetails.id, next);
                            setSelectedLeadDetails((prev) => prev ? { ...prev, status: next } : null);
                          }
                        }}
                        className="w-full text-xs font-semibold bg-slate-50 text-slate-800 px-2.5 py-2 rounded-lg border border-slate-200 outline-none cursor-pointer"
                      >
                        <option value="new">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="consultation">Consultation</option>
                        <option value="assessment">Assessment</option>
                        <option value="proposal">Proposal</option>
                        <option value="converted">Finalize & Retain</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleOpenEditLead(selectedLeadDetails)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Edit lead details directly in this panel"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        const lead = selectedLeadDetails;
                        setSelectedLeadDetails(null);
                        setIsDrawerEditing(false);
                        openFinalizeModal(lead);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4a1c40] hover:bg-[#3a1530] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Finalize & Open Case</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedLeadDetails(null);
                      setIsDrawerEditing(false);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Close Details
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

