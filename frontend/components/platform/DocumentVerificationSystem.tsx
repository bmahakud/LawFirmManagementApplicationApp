'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  FileText, Upload, CheckCircle, XCircle, Clock,
  AlertCircle, Loader2, Eye, Calendar, Plus, X, Trash2,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DocumentViewer from './DocumentViewer';

type Props = {
  caseId: string;
  clientId?: string;
  role?: string;
  accent?: string;
  viewBase?: string;
};

type DocumentRequest = {
  id: string;
  document_type: string;
  document_title: string;
  description: string;
  priority: string;
  due_date: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  rejection_reason?: string;
  client_notes?: string;
  uploaded_document?: any;
  created_at: string;
};



const DOCUMENT_TYPES = [
  // Identity Documents
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID Card' },
  { value: 'ration_card', label: 'Ration Card' },

  // Certificates
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'death_certificate', label: 'Death Certificate' },
  { value: 'marriage_certificate', label: 'Marriage Certificate' },
  { value: 'divorce_certificate', label: 'Divorce Certificate' },
  { value: 'domicile_certificate', label: 'Domicile Certificate' },
  { value: 'caste_certificate', label: 'Caste Certificate' },
  { value: 'income_certificate', label: 'Income Certificate' },
  { value: 'residence_certificate', label: 'Residence Certificate' },
  { value: 'character_certificate', label: 'Character Certificate' },
  { value: 'bar_certificate', label: 'Bar Council Certificate' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'disability_certificate', label: 'Disability Certificate' },

  // Educational Documents
  { value: 'degree', label: 'Educational Degree' },
  { value: 'marksheet', label: 'Marksheet' },
  { value: 'transfer_certificate', label: 'Transfer Certificate' },
  { value: 'migration_certificate', label: 'Migration Certificate' },
  { value: 'provisional_certificate', label: 'Provisional Certificate' },

  // Financial Documents
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'itr', label: 'Income Tax Return' },
  { value: 'form_16', label: 'Form 16' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'cheque', label: 'Cheque Copy' },
  { value: 'loan_documents', label: 'Loan Documents' },

  // Property Documents
  { value: 'property_documents', label: 'Property Documents' },
  { value: 'sale_deed', label: 'Sale Deed' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
  { value: 'rent_agreement', label: 'Rent Agreement' },
  { value: 'property_tax_receipt', label: 'Property Tax Receipt' },
  { value: 'encumbrance_certificate', label: 'Encumbrance Certificate' },
  { value: 'mutation_certificate', label: 'Mutation Certificate' },

  // Legal Documents
  { value: 'fir', label: 'FIR (First Information Report)' },
  { value: 'petition', label: 'Petition' },
  { value: 'plaint', label: 'Plaint' },
  { value: 'written_statement', label: 'Written Statement' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'order', label: 'Court Order' },
  { value: 'judgment', label: 'Judgment' },
  { value: 'decree', label: 'Decree' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'notice', label: 'Legal Notice' },
  { value: 'contract', label: 'Contract' },
  { value: 'mou', label: 'Memorandum of Understanding (MOU)' },
  { value: 'power_of_attorney', label: 'Power of Attorney' },
  { value: 'vakalatnama', label: 'Vakalatnama' },
  { value: 'bail_bond', label: 'Bail Bond' },
  { value: 'surety_bond', label: 'Surety Bond' },
  { value: 'undertaking', label: 'Undertaking' },
  { value: 'indemnity_bond', label: 'Indemnity Bond' },

  // Medical & Police Documents
  { value: 'medical_report', label: 'Medical Report' },
  { value: 'prescription', label: 'Medical Prescription' },
  { value: 'discharge_summary', label: 'Hospital Discharge Summary' },
  { value: 'police_report', label: 'Police Report' },
  { value: 'police_verification', label: 'Police Verification' },
  { value: 'noc', label: 'No Objection Certificate (NOC)' },

  // Employment Documents
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'experience_certificate', label: 'Experience Certificate' },
  { value: 'relieving_letter', label: 'Relieving Letter' },
  { value: 'employment_contract', label: 'Employment Contract' },

  // Witness & Statements
  { value: 'witness_statement', label: 'Witness Statement' },
  { value: 'dying_declaration', label: 'Dying Declaration' },
  { value: 'confession', label: 'Confession Statement' },

  // Business Documents
  { value: 'gst_certificate', label: 'GST Certificate' },
  { value: 'trade_license', label: 'Trade License' },
  { value: 'partnership_deed', label: 'Partnership Deed' },
  { value: 'incorporation_certificate', label: 'Certificate of Incorporation' },
  { value: 'board_resolution', label: 'Board Resolution' },

  // Miscellaneous
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'email', label: 'Email Communication' },
  { value: 'sms', label: 'SMS/Text Message' },
  { value: 'audio_transcript', label: 'Audio Transcript' },
  { value: 'video_evidence', label: 'Video Evidence' },
  { value: 'photograph', label: 'Photograph' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'application', label: 'Application' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'reply', label: 'Reply' },
  { value: 'rejoinder', label: 'Rejoinder' },
  { value: 'other', label: 'Other Document' },
];

export default function DocumentVerificationSystem({ caseId, clientId, role, accent = '#4a1c40', viewBase }: Props) {
  // Helper to check if user has advocate-level permissions
  const isAdvocateRole = role === 'advocate' || role === 'super-admin' || role === 'firm-admin';
  const isClientRole = role === 'client';

  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseDocuments, setCaseDocuments] = useState<any[]>([]);

  // Advocate: Create request
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRequest, setNewRequest] = useState({
    document_type: 'aadhar',
    document_title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  // Client: Upload document
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Advocate: Review document
  const [reviewingDoc, setReviewingDoc] = useState<{ request: DocumentRequest; document: any } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const saved = localStorage.getItem('docTablePageSize');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if ([5, 10, 20, 50].includes(parsed)) setPageSize(parsed);
    }
  }, []);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    localStorage.setItem('docTablePageSize', newSize.toString());
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this document request?')) return;

    setDeletingId(requestId);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.DETAIL(requestId), {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete document request');
      }

      toast.success('Document request deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, docRes] = await Promise.all([
        customFetch(API.DOCUMENT_REQUESTS.BY_CASE(caseId)),
        customFetch(API.DOCUMENTS.BY_CASE(caseId))
      ]);

      const reqData = await reqRes.json();
      const docData = await docRes.json();

      if (reqRes.ok) setRequests(reqData);
      if (docRes.ok) setCaseDocuments(docData);
    } catch (err: any) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Advocate: Create document request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.document_title.trim()) {
      toast.error('Document title is required');
      return;
    }

    setCreating(true);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.LIST, {
        method: 'POST',
        body: JSON.stringify({ ...newRequest, case: caseId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create request');
      }

      toast.success('Document request created');
      setShowCreateForm(false);
      setNewRequest({
        document_type: 'aadhar',
        document_title: '',
        description: '',
        priority: 'medium',
        due_date: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Upload document (Client or Advocate)
  const handleUpload = async (requestId: string) => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload document file
      const formData = new FormData();
      formData.append('document_file', uploadFile);
      formData.append('document_title', requests.find(r => r.id === requestId)?.document_title || 'Document');
      formData.append('document_type', requests.find(r => r.id === requestId)?.document_type || 'other');
      formData.append('case', caseId);
      if (clientId) {
        formData.append('client', clientId);
      }

      const uploadRes = await customFetch(API.DOCUMENTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload document file');
      const uploadedDoc = await uploadRes.json();

      // 2. Update/fulfill request with uploaded document
      const fulfillRes = await customFetch(API.DOCUMENT_REQUESTS.FULFILL(requestId), {
        method: 'POST',
        body: JSON.stringify({
          document_id: uploadedDoc.id,
          client_notes: isClientRole ? uploadNotes : undefined,
          advocate_notes: isAdvocateRole ? uploadNotes : undefined,
        }),
      });

      if (!fulfillRes.ok) {
        await customFetch(API.DOCUMENT_REQUESTS.DETAIL(requestId), {
          method: 'PATCH',
          body: JSON.stringify({
            uploaded_document: uploadedDoc.id,
            client_notes: isClientRole ? uploadNotes : undefined,
            advocate_notes: isAdvocateRole ? uploadNotes : undefined,
            status: 'uploaded',
          }),
        });
      }

      toast.success('Document uploaded successfully');
      setUploadingFor(null);
      setUploadFile(null);
      setUploadNotes('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Advocate: Verify document
  const handleVerify = async () => {
    if (!reviewingDoc) return;

    setActioning(true);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.VERIFY(reviewingDoc.request.id), {
        method: 'POST',
        body: JSON.stringify({ action: 'verify' }),
      });

      if (!res.ok) throw new Error('Failed to verify');

      toast.success('Document verified! Transferred to Case Documents library.');
      setReviewingDoc(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioning(false);
    }
  };

  // Advocate: Reject document
  const handleReject = async () => {
    if (!reviewingDoc) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActioning(true);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.VERIFY(reviewingDoc.request.id), {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', rejection_reason: reason }),
      });

      if (!res.ok) throw new Error('Failed to reject');

      toast.success('Document rejected');
      setReviewingDoc(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioning(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <Clock className="w-4 h-4" />,
        label: 'Awaiting Upload'
      },
      uploaded: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Under Review'
      },
      verified: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Verified'
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Rejected'
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Requested Documents</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isAdvocateRole
              ? 'Request and verify documents from your client'
              : 'Upload requested documents for verification'}
          </p>
        </div>

        {isAdvocateRole && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: accent }}
          >
            <Plus className="w-4 h-4" />
            Request Document
          </button>
        )}
      </div>

      {/* Document Requests List */}
      {(() => {
        const filteredRequests = requests.filter(request => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const typeLabel = (DOCUMENT_TYPES.find(t => t.value === request.document_type)?.label || request.document_type).toLowerCase();
          return (
            request.document_title.toLowerCase().includes(q) ||
            typeLabel.includes(q) ||
            request.status.toLowerCase().includes(q) ||
            (request.client_notes && request.client_notes.toLowerCase().includes(q))
          );
        });

        const totalItems = filteredRequests.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        if (requests.length === 0) {
          return (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No document requests yet</p>
              {isAdvocateRole && (
                <p className="text-sm text-gray-400 mt-2">Click "Request Document" to get started</p>
              )}
            </div>
          );
        }

        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Search & Pagination Header (Gmail/Advocate Portal Style) */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <div className="relative group max-w-xs w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-gray-400 font-normal">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-purple-300 transition-all cursor-pointer"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-gray-400">({totalItems} total)</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">SL. NO</th>
                    <th className="py-3.5 px-4">DOCUMENT TITLE</th>
                    <th className="py-3.5 px-4">DOCUMENT TYPE</th>
                    <th className="py-3.5 px-4">DUE DATE</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">UPLOADED BY</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                        No document requests match "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request, idx) => {
                      const slNo = (currentPage - 1) * pageSize + idx + 1;
                      const statusConfig = getStatusConfig(request.status);
                      const docId = typeof request.uploaded_document === 'string'
                        ? request.uploaded_document
                        : request.uploaded_document?.id;
                      const document = caseDocuments.find((d: any) => d.id === docId) || (request as any).uploaded_document_details || (request.uploaded_document && typeof request.uploaded_document === 'object' ? request.uploaded_document : null);

                      return (
                        <tr key={request.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-6 text-xs font-semibold text-gray-400">{slNo}</td>
                          <td className="py-4 px-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{request.document_title}</span>
                              {request.priority === 'high' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">HIGH</span>
                              )}
                            </div>
                            {request.client_notes && (
                              <p className="text-xs text-gray-500 font-normal mt-0.5"><span className="font-semibold">Note:</span> {request.client_notes}</p>
                            )}
                            {request.rejection_reason && (
                              <p className="text-xs text-red-600 font-normal mt-0.5"><span className="font-semibold">Rejection:</span> {request.rejection_reason}</p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            {DOCUMENT_TYPES.find(t => t.value === request.document_type)?.label || request.document_type}
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-500 font-medium">
                            {request.due_date ? new Date(request.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-600 font-medium">
                            {document?.uploaded_by_name ? (
                              <span className="font-bold text-gray-900">{document.uploaded_by_name}</span>
                            ) : (
                              <span className="text-gray-400 italic">Not Uploaded</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {document && (request.status === 'uploaded' || request.status === 'verified') && (
                                <Link
                                  href={`${viewBase || '/advocate'}/documents/${typeof document === 'object' ? document.id : document}${caseId ? `?fromCase=${caseId}&subtab=client` : ''}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </Link>
                              )}

                              {isAdvocateRole && request.status === 'uploaded' && (
                                <button
                                  type="button"
                                  onClick={() => setReviewingDoc({ request, document })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-all"
                                  style={{ backgroundColor: accent }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Review
                                </button>
                              )}

                              {(request.status === 'pending' || request.status === 'rejected') && (
                                <button
                                  type="button"
                                  onClick={() => setUploadingFor(request.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-sm hover:opacity-90"
                                  style={{ backgroundColor: isAdvocateRole ? accent : '#4f46e5' }}
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  {isAdvocateRole ? 'Upload' : (request.status === 'rejected' ? 'Re-upload' : 'Upload')}
                                </button>
                              )}

                              {isAdvocateRole && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRequest(request.id)}
                                  disabled={deletingId === request.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/50 text-red-600 text-xs font-semibold hover:bg-red-100/80 transition-colors disabled:opacity-50"
                                  title="Delete Document Request"
                                >
                                  {deletingId === request.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  Delete
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
          </div>
        );
      })()}

      {/* Create Request Modal (Advocate) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Request Document</h3>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Document Type</label>
                <select
                  value={newRequest.document_type}
                  onChange={(e) => setNewRequest({ ...newRequest, document_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                >
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Document Title *</label>
                <input
                  type="text"
                  value={newRequest.document_title}
                  onChange={(e) => setNewRequest({ ...newRequest, document_title: e.target.value })}
                  placeholder="e.g., Client's Aadhar Card"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Additional instructions or requirements..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none resize-none text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newRequest.due_date}
                    onChange={(e) => setNewRequest({ ...newRequest, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent }}
                  disabled={creating}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal (Client) */}
      {uploadingFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
              <button onClick={() => setUploadingFor(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">Supported: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none resize-none text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setUploadingFor(null)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpload(uploadingFor)}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
                  disabled={uploading || !uploadFile}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal (Advocate) */}
      {reviewingDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{reviewingDoc.document.document_title}</h3>
                <p className="text-sm text-gray-600 mt-1">Document Verification Review</p>
              </div>
              <button
                onClick={() => setReviewingDoc(null)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              <DocumentViewer
                url={reviewingDoc.document.document_file || reviewingDoc.document.file_url}
                title={reviewingDoc.document.document_title}
              />
            </div>

            {/* Action Footer */}
            {isAdvocateRole && reviewingDoc.request.status === 'uploaded' && (
              <div className="flex items-center justify-between gap-4 px-6 py-5 border-t-2 border-gray-200 bg-white">
                <p className="text-sm text-gray-600 font-medium">Review the document and take action:</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReviewingDoc(null)}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
                    disabled={actioning}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                    disabled={actioning}
                  >
                    {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </button>
                  <button
                    onClick={handleVerify}
                    className="px-8 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                    disabled={actioning}
                  >
                    {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Verify Document
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
