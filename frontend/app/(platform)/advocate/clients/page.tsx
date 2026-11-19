'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Phone, Mail, FileText, Download, Eye, Search, Loader2,
  AlertCircle, ChevronLeft, ChevronRight, MapPin, UserCheck, Plus, ArrowRight,
  Scale, Briefcase, Sparkles, CheckCircle2, IndianRupee, X, Check, UserPlus,
  Pencil
} from 'lucide-react';
import Link from 'next/link';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Client {
  id: string;
  firm?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  profile_image?: string | null;
  brief_summary?: string;
  assigned_advocate?: string;
  advocate_name?: string;
  user_account?: string;
  created_at: string;
  updated_at?: string;
}

interface Document {
  id: string;
  document_title: string;
  document_type: string;
  document_type_display: string;
  document_category: string;
  uploaded_by_name: string;
  verification_status: string;
  uploaded_at: string;
  is_deleted: boolean;
}

interface ClientDocuments {
  client: Client;
  documents: Document[];
  total_documents: number;
}

const STATE_OPTIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function AdvocateClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDocuments, setClientDocuments] = useState<ClientDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Client Details Modal State
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editClientSubmitting, setEditClientSubmitting] = useState(false);
  const [clientEditForm, setClientEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    brief_summary: '',
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const handleOpenEditModal = (client: any) => {
    setEditingClientId(client.id);
    let firstName = client.first_name || '';
    let lastName = client.last_name || '';
    if (!firstName && client.full_name) {
      const parts = client.full_name.trim().split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    setClientEditForm({
      first_name: firstName,
      last_name: lastName,
      email: client.email || '',
      phone_number: client.phone_number || '',
      address_line_1: client.address || '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      brief_summary: client.brief_summary || '',
    });
    setShowEditClientModal(true);
  };

  const handleSaveClientDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = editingClientId || selectedClient?.id || clientDocuments?.client?.id;
    if (!targetId) return;

    if (!clientEditForm.first_name.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!clientEditForm.phone_number.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      setEditClientSubmitting(true);
      const payload = {
        first_name: clientEditForm.first_name.trim(),
        last_name: clientEditForm.last_name.trim(),
        email: clientEditForm.email.trim(),
        phone_number: clientEditForm.phone_number.trim(),
        address_line_1: clientEditForm.address_line_1.trim(),
        address_line_2: clientEditForm.address_line_2.trim(),
        city: clientEditForm.city.trim(),
        state: clientEditForm.state.trim(),
        postal_code: clientEditForm.postal_code.trim(),
        brief_summary: clientEditForm.brief_summary.trim(),
      };

      const res = await customFetch(API.CLIENTS.DETAIL(targetId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.detail || updated.error || 'Failed to update client details');
      }

      // Update selectedClient & clientDocuments if the currently viewed client was modified
      if (selectedClient && selectedClient.id === targetId) {
        setSelectedClient((prev) => (prev ? { ...prev, ...updated } : updated));
      }
      if (clientDocuments && clientDocuments.client && clientDocuments.client.id === targetId) {
        setClientDocuments((prev) =>
          prev
            ? {
                ...prev,
                client: { ...prev.client, ...updated },
              }
            : null
        );
      }

      // Update in main clients list
      setClients((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, ...updated } : c))
      );

      setShowEditClientModal(false);
      setEditingClientId(null);
      toast.success('Client details updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error updating client details');
    } finally {
      setEditClientSubmitting(false);
    }
  };

  // Client Detail Tabs: Cases, Leads, Documents
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [clientLeads, setClientLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'cases' | 'leads' | 'documents'>('cases');

  // Main Directory Tab: Retained Clients vs Prospective Leads
  const [directoryTab, setDirectoryTab] = useState<'retained' | 'leads'>('retained');
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [allLeadsLoading, setAllLeadsLoading] = useState(false);

  // Finalize Lead Modal State
  const [finalizeModalLead, setFinalizeModalLead] = useState<any | null>(null);
  const [finalizeSubmitting, setFinalizeSubmitting] = useState(false);
  const [finalizeForm, setFinalizeForm] = useState({
    case_title: '',
    category: 'court_case',
    case_type: 'Civil Suit',
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

  // Search & Pagination States (Backend driven)
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchAllLeads = useCallback(async () => {
    try {
      setAllLeadsLoading(true);
      const res = await customFetch(API.LEADS.LIST);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        setAllLeads(list);
      }
    } catch (e) {
      console.error('Error fetching CRM leads for client directory', e);
    } finally {
      setAllLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllLeads();
  }, [fetchAllLeads]);

  const openFinalizeModal = (lead: any) => {
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
          ? `Client "${data.client_name}" enrolled into database & Case File created!`
          : 'Lead finalized! Case file created successfully.'
      );
      setFinalizeModalLead(null);
      fetchMyClients(searchQuery, page);
      fetchAllLeads();
    } catch (err: any) {
      toast.error(err.message || 'Error converting lead to case file');
    } finally {
      setFinalizeSubmitting(false);
    }
  };

  // Only in-progress / prospective leads (exclude already finalized / converted case files)
  const inProgressCrmLeads = useMemo(() => {
    return allLeads.filter((l) => l.status !== 'converted' && !l.converted_case);
  }, [allLeads]);

  const filteredCrmLeads = useMemo(() => {
    if (!searchQuery.trim()) return inProgressCrmLeads;
    const q = searchQuery.toLowerCase().trim();
    return inProgressCrmLeads.filter((l) => {
      const name = (l.client_name || l.prospect_name || '').toLowerCase();
      const phone = (l.client_phone || l.prospect_phone || '').toLowerCase();
      const email = (l.client_email || l.prospect_email || '').toLowerCase();
      const title = (l.title || '').toLowerCase();
      const opp = (l.opposing_party || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || title.includes(q) || opp.includes(q);
    });
  }, [inProgressCrmLeads, searchQuery]);

  const fetchMyClients = useCallback(async (query: string, pageNum: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      params.set('page', String(pageNum));
      params.set('page_size', String(pageSize));

      const response = await customFetch(`${API.CLIENTS.MY_CLIENTS}?${params.toString()}`);
      const data = await response.json();

      if (data && Array.isArray(data.results)) {
        setClients(data.results);
        setTotalCount(data.count || 0);
      } else if (Array.isArray(data)) {
        setClients(data);
        setTotalCount(data.length);
      } else {
        setClients([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyClients(searchQuery, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, page, fetchMyClients]);

  const fetchClientDocuments = async (clientId: string) => {
    try {
      setDocumentsLoading(true);
      const response = await customFetch(API.CLIENTS.CLIENT_DOCUMENTS(clientId));
      const data = await response.json();
      setClientDocuments(data);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load client documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: string) => {
    fetchClientDocuments(clientId);

    // Fetch client cases
    setCasesLoading(true);
    customFetch(API.CLIENTS.CLIENT_CASES(clientId))
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.cases)) setClientCases(d.cases);
        else if (Array.isArray(d)) setClientCases(d);
        else setClientCases([]);
      })
      .catch((e) => console.error(e))
      .finally(() => setCasesLoading(false));

    // Fetch client CRM leads (only in-progress leads, as finalized ones are already under Cases)
    setLeadsLoading(true);
    customFetch(`${API.LEADS.LIST}?client_id=${clientId}`)
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.results || []);
        setClientLeads(list.filter((l: any) => l.status !== 'converted' && !l.converted_case));
      })
      .catch((e) => console.error(e))
      .finally(() => setLeadsLoading(false));
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    fetchClientDetails(client.id);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setClientDocuments(null);
    setClientCases([]);
    setClientLeads([]);
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);

  const getVerificationBadge = (status: string) => {
    const badges = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
      verified: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      rejected: 'bg-red-50 text-red-700 border-red-200/60'
    };
    return badges[status as keyof typeof badges] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'N/A'
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderEditClientModal = () => {
    if (!showEditClientModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full my-8 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-100 bg-linear-to-r from-purple-50/70 via-white to-amber-50/40 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4a1c40] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Client Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update profile, contact info, address, and legal summary.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowEditClientModal(false);
                setEditingClientId(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSaveClientDetails} className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientEditForm.first_name}
                  onChange={(e) => setClientEditForm({ ...clientEditForm, first_name: e.target.value })}
                  placeholder="e.g. Rajesh"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={clientEditForm.last_name}
                  onChange={(e) => setClientEditForm({ ...clientEditForm, last_name: e.target.value })}
                  placeholder="e.g. Kumar"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={clientEditForm.phone_number}
                    onChange={(e) => setClientEditForm({ ...clientEditForm, phone_number: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 pl-8 pr-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={clientEditForm.email}
                    onChange={(e) => setClientEditForm({ ...clientEditForm, email: e.target.value })}
                    placeholder="e.g. rajesh@example.com"
                    className="w-full h-10 pl-8 pr-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Address Details
              </label>
              <input
                type="text"
                value={clientEditForm.address_line_1}
                onChange={(e) => setClientEditForm({ ...clientEditForm, address_line_1: e.target.value })}
                placeholder="Street / House No / Area"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={clientEditForm.city}
                  onChange={(e) => setClientEditForm({ ...clientEditForm, city: e.target.value })}
                  placeholder="City"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                />
                <select
                  value={clientEditForm.state}
                  onChange={(e) => setClientEditForm({ ...clientEditForm, state: e.target.value })}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] bg-white cursor-pointer"
                >
                  <option value="">State</option>
                  {STATE_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={clientEditForm.postal_code}
                  onChange={(e) => setClientEditForm({ ...clientEditForm, postal_code: e.target.value })}
                  placeholder="PIN Code"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Brief Legal Matter Summary
              </label>
              <textarea
                rows={3}
                value={clientEditForm.brief_summary}
                onChange={(e) => setClientEditForm({ ...clientEditForm, brief_summary: e.target.value })}
                placeholder="Summary of the legal problem, background, or client facts..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] focus:ring-2 focus:ring-[#4a1c40]/10 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowEditClientModal(false);
                  setEditingClientId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editClientSubmitting}
                className="px-5 py-2 bg-[#4a1c40] hover:bg-[#381430] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {editClientSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (error && clients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-bold mb-1">Error Loading Clients</p>
        <p className="text-slate-500 text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchMyClients(searchQuery, page)}
          className="px-4 py-2 bg-[#4a1c40] text-white text-xs font-bold rounded-xl hover:bg-[#3a1530] transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Client Details & Documents View
  if (selectedClient && clientDocuments) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#4a1c40] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Client List
        </button>

        {/* Client Header Info */}
        {(() => {
          const detailClient = clientDocuments?.client || selectedClient;
          const rawImg = detailClient.profile_image || selectedClient.profile_image;
          const detailAvatarUrl = rawImg
            ? (rawImg.startsWith('http') ? rawImg : `${API_BASE_URL}${rawImg}`)
            : null;

          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                <div className="flex items-center gap-4">
                  {detailAvatarUrl ? (
                    <img
                      src={detailAvatarUrl}
                      alt={detailClient.full_name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#4a1c40]/10 text-[#4a1c40] rounded-2xl flex items-center justify-center font-black text-xl shrink-0">
                      {(detailClient.first_name?.[0] || detailClient.full_name?.[0] || 'C').toUpperCase()}
                      {(detailClient.last_name?.[0] || '').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{detailClient.full_name}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Assigned Advocate: <span className="font-bold text-slate-700">{detailClient.advocate_name || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">Onboarded: {formatDate(detailClient.created_at)}</span>
                  <button
                    onClick={() => handleOpenEditModal(detailClient)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4a1c40] hover:bg-[#381430] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Client Details</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                      {detailClient.email ? (
                        <a href={`mailto:${detailClient.email}`} className="text-xs font-bold text-slate-800 hover:text-[#4a1c40] truncate block">
                          {detailClient.email}
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400">Not provided</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(detailClient)}
                    title={detailClient.email ? "Edit email" : "Add email"}
                    className="text-xs font-semibold text-[#4a1c40] hover:underline p-1 shrink-0 cursor-pointer"
                  >
                    {detailClient.email ? <Pencil className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" /> : "+ Add"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                      {detailClient.phone_number ? (
                        <a href={`tel:${detailClient.phone_number}`} className="text-xs font-bold text-slate-800 hover:text-[#4a1c40] truncate block">
                          {detailClient.phone_number}
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400">Not provided</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(detailClient)}
                    title={detailClient.phone_number ? "Edit phone" : "Add phone"}
                    className="text-xs font-semibold text-[#4a1c40] hover:underline p-1 shrink-0 cursor-pointer"
                  >
                    {detailClient.phone_number ? <Pencil className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" /> : "+ Add"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p>
                      {detailClient.address ? (
                        <p className="text-xs font-bold text-slate-800 truncate" title={detailClient.address}>
                          {detailClient.address}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400">Not provided</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(detailClient)}
                    title={detailClient.address ? "Edit address" : "Add address"}
                    className="text-xs font-semibold text-[#4a1c40] hover:underline p-1 shrink-0 cursor-pointer"
                  >
                    {detailClient.address ? <Pencil className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" /> : "+ Add"}
                  </button>
                </div>
              </div>

              {detailClient.brief_summary ? (
                <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#4a1c40] mb-1">Brief Summary</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{detailClient.brief_summary}</p>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(detailClient)}
                    className="text-slate-400 hover:text-[#4a1c40] p-1 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Edit Brief Summary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>No brief legal matter summary added yet.</span>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(detailClient)}
                    className="text-xs text-[#4a1c40] font-semibold hover:underline cursor-pointer"
                  >
                    + Add Summary
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Client Detail Tabs: Cases, Leads, Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs Navigation Header */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto">
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'cases'
                  ? 'bg-white text-[#4a1c40] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Active Case Files</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-[#4a1c40] border border-purple-100">
                {clientCases.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'leads'
                  ? 'bg-white text-[#4a1c40] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>CRM Leads & Inquiries</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100">
                {clientLeads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'documents'
                  ? 'bg-white text-[#4a1c40] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                {clientDocuments?.total_documents || 0}
              </span>
            </button>
          </div>

          {/* TAB 1: ACTIVE CASE FILES */}
          {activeTab === 'cases' && (
            <div>
              {casesLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4a1c40] mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Loading client cases...</p>
                </div>
              ) : clientCases.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No active cases opened for this client yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    Convert a CRM lead or add a new court case to create their first case file.
                  </p>
                  <Link
                    href={`/advocate/cases/new?client=${selectedClient.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4a1c40] text-white text-xs font-bold rounded-xl hover:bg-[#3a1530] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Open New Case File
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Case Title</th>
                        <th className="py-3 px-6">Case Number / Reg</th>
                        <th className="py-3 px-6">Category</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Total Fee</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {clientCases.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-900">
                            {c.case_title || 'Untitled Case'}
                          </td>
                          <td className="py-3.5 px-6 text-slate-600 font-medium">
                            {c.case_number || c.registration_number || 'Unregistered'}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#4a1c40] border border-purple-100">
                              {c.category === 'pre_litigation' ? 'Pre-Litigation' : 'Court Case'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-700">
                            {c.total_fee ? `₹ ${parseFloat(c.total_fee).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <Link
                              href={`/advocate/cases/${c.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4a1c40] text-white text-xs font-bold rounded-lg hover:bg-[#3a1530] transition-colors"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Open Case File</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CRM LEADS & INTAKES */}
          {activeTab === 'leads' && (
            <div>
              {leadsLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4a1c40] mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Loading CRM leads...</p>
                </div>
              ) : clientLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No CRM leads recorded for this client</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    Track consultation inquiries and convert them to active cases.
                  </p>
                  <Link
                    href="/advocate/crm"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4a1c40] text-white text-xs font-bold rounded-xl hover:bg-[#3a1530] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Open CRM Pipeline
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Matter Title</th>
                        <th className="py-3 px-6">Category</th>
                        <th className="py-3 px-6">CRM Status</th>
                        <th className="py-3 px-6">Est. Fee</th>
                        <th className="py-3 px-6">Opposing Party</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {clientLeads.map((lead: any) => {
                        const isConverted = lead.status === 'converted' && Boolean(lead.converted_case);

                        return (
                          <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-6 font-bold text-slate-900">
                              {lead.title}
                            </td>
                            <td className="py-3.5 px-6">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#4a1c40] border border-purple-100">
                                {lead.category === 'pre_litigation' ? 'Pre-Litigation' : 'Court Case'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConverted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 font-bold text-emerald-700">
                              {lead.estimated_fee ? `₹ ${parseFloat(lead.estimated_fee).toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="py-3.5 px-6 text-slate-500">
                              {lead.opposing_party || '—'}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              {isConverted ? (
                                <Link
                                  href={`/advocate/cases/${lead.converted_case}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span>View Case File</span>
                                </Link>
                              ) : (
                                <Link
                                  href="/advocate/crm"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4a1c40] text-white text-xs font-bold rounded-lg hover:bg-[#3a1530] transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Manage & Finalize</span>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLIENT DOCUMENTS */}
          {activeTab === 'documents' && (
            <div>
              {documentsLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4a1c40] mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Loading documents...</p>
                </div>
              ) : clientDocuments.documents.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Document Title</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Uploaded By</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientDocuments.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-[#4a1c40] shrink-0" />
                              <span className="text-xs font-bold text-slate-900">{doc.document_title}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-600">{doc.document_type_display}</td>
                          <td className="py-3.5 px-6 text-xs text-slate-600">{doc.uploaded_by_name}</td>
                          <td className="py-3.5 px-6">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getVerificationBadge(doc.verification_status)}`}>
                              {doc.verification_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-500">{formatDate(doc.uploaded_at)}</td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        {renderEditClientModal()}
      </div>
    );
  }

  // Clients List View (Matching /advocate/cases DataTable)
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Clients</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Unified directory of registered active clients and prospective CRM inquiry leads.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/advocate/crm"
            className="inline-flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-[#4a1c40] border border-purple-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-2xs"
          >
            <Scale className="w-4 h-4" />
            <span>CRM Pipeline</span>
          </Link>
          <Link href="/advocate/add-client">
            <button className="flex items-center gap-2 bg-[#4a1c40] hover:bg-[#371530] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Main DataTable Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full">
        {/* Top Directory Tabs: Retained Clients vs Prospective Leads */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-4 bg-white overflow-x-auto">
          <button
            onClick={() => setDirectoryTab('retained')}
            className={`flex items-center gap-2 pb-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${directoryTab === 'retained'
                ? 'border-[#4a1c40] text-[#4a1c40]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Retained Clients</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${directoryTab === 'retained' ? 'bg-purple-100 text-[#4a1c40]' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setDirectoryTab('leads')}
            className={`flex items-center gap-2 pb-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${directoryTab === 'leads'
                ? 'border-[#4a1c40] text-[#4a1c40]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
          >
            <Scale className="w-4 h-4" />
            <span>Prospective & CRM Leads</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${directoryTab === 'leads' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {inProgressCrmLeads.length}
            </span>
          </button>
        </div>

        {/* Search Bar & Pagination Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                directoryTab === 'retained'
                  ? 'Search clients by name, email, phone, address...'
                  : 'Search prospective leads by name, phone, matter...'
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-[#4a1c40] shadow-sm placeholder:text-slate-400"
            />
          </div>

          {directoryTab === 'retained' && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all bg-white shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="px-2 text-xs font-bold text-slate-600">
                  Page {safePage} of {pageCount}
                </span>
                <button
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all bg-white shadow-sm cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <span className="text-xs font-bold text-slate-400">{totalCount} total</span>
            </div>
          )}
        </div>

        {/* TAB 1: RETAINED CLIENTS TABLE */}
        {directoryTab === 'retained' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SL. NO</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client Name</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Details</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Address</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Added</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-6" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-44" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-5 text-right"><div className="h-6 bg-slate-100 rounded w-28 ml-auto" /></td>
                    </tr>
                  ))
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 font-semibold text-xs">
                      {searchQuery ? 'No clients match your search' : 'No clients assigned to you yet'}
                    </td>
                  </tr>
                ) : (
                  clients.map((client, index) => {
                    const clientName = client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A';
                    const avatarUrl = client.profile_image
                      ? (client.profile_image.startsWith('http') ? client.profile_image : `${API_BASE_URL}${client.profile_image}`)
                      : null;

                    return (
                      <tr
                        key={client.id ? `client-${client.id}` : `client-${index}`}
                        onClick={() => handleClientClick(client)}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-5 text-xs font-semibold text-slate-500">
                          {(safePage - 1) * pageSize + index + 1}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={clientName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-[#4a1c40]/10 text-[#4a1c40] rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                {(client.first_name?.[0] || clientName[0] || 'C').toUpperCase()}
                              </div>
                            )}
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#4a1c40] transition-colors">
                              {clientName}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{client.phone_number || 'N/A'}</p>
                            <p className="text-[11px] font-medium text-slate-500 truncate">{client.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs font-medium text-slate-600 max-w-[240px] truncate" title={client.address}>
                          {client.address || 'N/A'}
                        </td>
                        <td className="py-4 px-5 text-xs font-medium text-slate-500">
                          {formatDate(client.created_at)}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(client);
                              }}
                              title="Edit Client Details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#4a1c40] hover:bg-[#4a1c40]/10 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientClick(client);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4a1c40]/10 text-[#4a1c40] hover:bg-[#4a1c40] hover:text-white transition-all shadow-2xs cursor-pointer"
                            >
                              <span>View Details & Documents</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: PROSPECTIVE & CRM LEADS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SL. NO</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prospect / Client</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Matter Title</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CRM Stage</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Est. Fee</th>
                  <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {allLeadsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={`lead-skel-${i}`} className="animate-pulse">
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-6" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-44" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-5 text-right"><div className="h-6 bg-slate-100 rounded w-28 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredCrmLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold text-xs">
                      {searchQuery ? 'No prospective leads match your search' : 'No CRM leads or prospective clients recorded yet'}
                    </td>
                  </tr>
                ) : (
                  filteredCrmLeads.map((lead: any, idx: number) => {
                    const isConverted = lead.status === 'converted' && Boolean(lead.converted_case);
                    const isProspect = lead.is_prospect || !lead.client;
                    const name = lead.client_name || lead.prospect_name || 'Prospect Client';
                    const initial = (name[0] || 'P').toUpperCase();

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#4a1c40]/10 to-[#6b2c5c]/20 text-[#4a1c40] flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200/40">
                              {initial}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{name}</span>
                                {isProspect ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Prospect
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Enrolled Client
                                  </span>
                                )}
                              </div>
                              {lead.client_phone && (
                                <a
                                  href={`tel:${lead.client_phone}`}
                                  className="text-[11px] text-slate-500 hover:text-[#4a1c40] flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{lead.client_phone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-800 line-clamp-1">{lead.title}</p>
                          {lead.case_type && (
                            <p className="text-[10px] text-slate-400">{lead.case_type}</p>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${lead.category === 'pre_litigation'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-purple-50 text-[#4a1c40] border border-purple-100'
                              }`}
                          >
                            {lead.category === 'pre_litigation' ? 'Pre-Litigation' : 'Court Case'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConverted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : lead.status === 'new'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                          >
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${lead.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : lead.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {lead.priority}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-bold text-emerald-700">
                          {lead.estimated_fee ? `₹ ${parseFloat(lead.estimated_fee).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href="/advocate/crm"
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                            >
                              CRM Pipeline
                            </Link>
                            {isConverted ? (
                              <Link
                                href={`/advocate/cases/${lead.converted_case}`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Case File</span>
                              </Link>
                            ) : (
                              <button
                                onClick={() => openFinalizeModal(lead)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-linear-to-r from-[#4a1c40] to-[#6b2c5c] text-white text-xs font-bold rounded-lg hover:opacity-95 shadow-2xs transition-all cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Finalize & Retain</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: FINALIZE LEAD INTO CASE FILE & ENROLL CLIENT ─── */}
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
                  <h3 className="text-lg font-bold text-slate-900">Finalize & Open Official Case File</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolls this prospective client into your client database and opens their official Case File.
                </p>
              </div>
              <button
                onClick={() => setFinalizeModalLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Banner */}
            <div className="p-4 mx-6 mt-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prospect / Client</p>
                <p className="font-bold text-slate-900 text-sm">
                  {finalizeModalLead.client_name || finalizeModalLead.prospect_name}
                </p>
                <p className="text-slate-500">
                  {finalizeModalLead.client_phone || finalizeModalLead.prospect_phone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Originating Matter</p>
                <p className="font-bold text-purple-700">{finalizeModalLead.title}</p>
              </div>
            </div>

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
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40] cursor-pointer bg-white"
                  >
                    <option value="court_case">Court Case</option>
                    <option value="pre_litigation">Pre-Litigation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Case Classification *
                  </label>
                  <input
                    type="text"
                    required
                    value={finalizeForm.case_type}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, case_type: e.target.value })}
                    placeholder="e.g. Civil Suit, Writ"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-[#4a1c40]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Petitioner Name
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
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={finalizeSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#4a1c40] to-[#6b2c5c] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {finalizeSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Case File...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Finalize & Enroll Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renderEditClientModal()}
    </div>
  );
}

