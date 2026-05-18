'use client';

import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  FileText, Upload, Plus, X, CheckCircle, XCircle, Clock, 
  AlertCircle, Check, Loader2, Edit2, Trash2, Eye 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DocumentViewer from './DocumentViewer';

type DocumentRequest = {
  id: string;
  document_type: string;
  document_type_display?: string;
  document_title: string;
  description: string;
  priority: string;
  due_date: string;
  status: string;
  rejection_reason?: string;
  client_notes?: string;
  created_at: string;
  document?: any; // The fulfilled document
  fulfilled_document?: any;
  uploaded_document?: any;
  document_file?: any;
  document_id?: string;
};

type DocumentRequestsProps = {
  caseId: string;
  clientId?: string;
  role: 'advocate' | 'client' | 'firm-admin' | 'super-admin';
  accent?: string;
};

const documentTypes = [
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'contract', label: 'Contract' },
  { value: 'medical_report', label: 'Medical Report' },
  { value: 'police_report', label: 'Police Report' },
  { value: 'witness_statement', label: 'Witness Statement' },
  { value: 'power_of_attorney', label: 'Power of Attorney' },
  { value: 'vakalatnama', label: 'Vakalatnama' },
  { value: 'other', label: 'Other' },
];

export default function DocumentRequests({ caseId, clientId, role, accent = '#311042' }: DocumentRequestsProps) {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Advocate state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRequest, setNewRequest] = useState({
    document_type: 'other',
    document_title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  // Advocate Edit state
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editRequestData, setEditRequestData] = useState({
    description: '',
    due_date: '',
  });
  const [updating, setUpdating] = useState(false);

  // Advocate Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Client state
  const [fulfillModal, setFulfillModal] = useState<string | null>(null); // Request ID
  const [uploading, setUploading] = useState(false);
  const [fulfillData, setFulfillData] = useState({
    document_file: null as File | null,
    client_notes: '',
  });

  // Advocate Verify/Reject state
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Document viewing/reviewing state
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [reviewingDoc, setReviewingDoc] = useState<{ request: DocumentRequest; document: any } | null>(null);

  // Store case documents to resolve direct file URLs
  const [caseDocuments, setCaseDocuments] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetching all requests for the case. We could append &status=pending if we wanted only pending ones,
      // but usually seeing the history (fulfilled/verified) is useful.
      const url = API.DOCUMENT_REQUESTS.BY_CASE(caseId);
      const res = await customFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch requests');
      setRequests(Array.isArray(data) ? data : (data.results || []));

      // Also fetch case documents to get direct file URLs for uploaded documents
      try {
        const docsRes = await customFetch(API.DOCUMENTS.BY_CASE(caseId));
        const docsData = await docsRes.json();
        if (docsRes.ok) {
          setCaseDocuments(Array.isArray(docsData) ? docsData : (docsData.results || []));
        }
      } catch (e) {
        console.error("Failed to fetch case documents for URL resolution", e);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchRequests();
  }, [caseId]);

  // --- ADVOCATE ACTIONS ---

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...newRequest,
        case: caseId,
      };
      const res = await customFetch(API.DOCUMENT_REQUESTS.LIST, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create request');
      
      toast.success('Document request created successfully!');
      setShowCreateForm(false);
      setNewRequest({
        document_type: 'other',
        document_title: '',
        description: '',
        priority: 'medium',
        due_date: '',
      });
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRequest = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.DETAIL(id), {
        method: 'PATCH',
        body: JSON.stringify(editRequestData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update request');
      
      toast.success('Request updated successfully!');
      setEditRequestId(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document request?')) return;
    setDeletingId(id);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.DETAIL(id), {
        method: 'DELETE',
      });
      if (!res.ok) {
        // Handle non-empty delete response if needed
        if (res.status !== 204) {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to delete request');
        }
      }
      
      toast.success('Request deleted successfully!');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleVerifyRequest = async (id: string, action: 'verify' | 'reject') => {
    if (action === 'reject' && !rejectReason) {
      alert('Please provide a rejection reason');
      return;
    }
    setActioningId(id);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.VERIFY(id), {
        method: 'POST',
        body: JSON.stringify({ action, rejection_reason: action === 'reject' ? rejectReason : undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || `Failed to ${action} request`);
      }
      toast.success(`Request ${action === 'verify' ? 'verified' : 'rejected'}!`);
      setShowRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioningId(null);
    }
  };

  // --- CLIENT ACTIONS ---

  const handleFulfillRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillModal || !fulfillData.document_file) return;
    setUploading(true);
    try {
      // 1. Upload the document
      const formData = new FormData();
      formData.append('document_file', fulfillData.document_file);
      // We need to infer type and title from the request if possible, or just send defaults
      const requestDetails = requests.find(r => r.id === fulfillModal);
      formData.append('document_type', requestDetails?.document_type || 'other');
      formData.append('document_title', requestDetails?.document_title || fulfillData.document_file.name);
      formData.append('document_category', 'legal'); // Defaulting to legal for requests
      if (clientId) formData.append('client', clientId);
      if (caseId) formData.append('case', caseId);

      const docRes = await customFetch(API.DOCUMENTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });
      const docData = await docRes.json();
      if (!docRes.ok) throw new Error(docData.detail || 'Failed to upload document');

      // 2. Fulfill the request with the new document ID
      const fulfillRes = await customFetch(API.DOCUMENT_REQUESTS.FULFILL(fulfillModal), {
        method: 'POST',
        body: JSON.stringify({
          document_id: docData.id || docData.uuid, // Check API response structure
          client_notes: fulfillData.client_notes,
        }),
      });
      if (!fulfillRes.ok) {
        const fData = await fulfillRes.json();
        throw new Error(fData.detail || 'Failed to submit fulfilled request');
      }

      toast.success('Document uploaded and request fulfilled!');
      setFulfillModal(null);
      setFulfillData({ document_file: null, client_notes: '' });
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // --- RENDER HELPERS ---

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold"><Clock className="w-3 h-3" /> Pending</span>;
      case 'fulfilled':
      case 'uploaded':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold"><CheckCircle className="w-3 h-3" /> Under Review</span>;
      case 'verified':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold"><CheckCircle className="w-3 h-3" /> Verified</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider">Medium</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">Low</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Document Requests</h3>
          <p className="text-xs text-gray-500 mt-1">Manage documents requested from the client.</p>
        </div>
        {(role === 'advocate' || role === 'firm-admin' || role === 'super-admin') && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
            style={{ backgroundColor: accent }}
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'Request Document'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* ADVOCATE CREATE FORM */}
      {showCreateForm && (
        <form onSubmit={handleCreateRequest} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-gray-900 mb-4">New Document Request</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Document Type</label>
              <select
                required
                value={newRequest.document_type}
                onChange={(e) => setNewRequest({ ...newRequest, document_type: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-purple-800"
              >
                {documentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Current Aadhar Card"
                value={newRequest.document_title}
                onChange={(e) => setNewRequest({ ...newRequest, document_title: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-purple-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Description / Instructions</label>
            <textarea
              required
              rows={2}
              placeholder="Explain exactly what you need the client to provide..."
              value={newRequest.description}
              onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-purple-800 resize-none"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Priority</label>
              <select
                value={newRequest.priority}
                onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-purple-800"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Due Date</label>
              <input
                type="date"
                value={newRequest.due_date}
                onChange={(e) => setNewRequest({ ...newRequest, due_date: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold outline-none focus:border-purple-800 text-gray-600"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Send Request
            </button>
          </div>
        </form>
      )}

      {/* REQUESTS LIST */}
      <div className={requests.length === 0 ? "space-y-4" : "grid gap-4 lg:grid-cols-2"}>
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No document requests found.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                
                {/* Info Section / Edit Form */}
                <div className="w-full">
                  {editRequestId === request.id ? (
                    <form onSubmit={(e) => handleUpdateRequest(request.id, e)} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Update Description</label>
                        <textarea
                          required
                          rows={2}
                          value={editRequestData.description}
                          onChange={(e) => setEditRequestData({ ...editRequestData, description: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-purple-800 resize-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Update Due Date</label>
                        <input
                          type="date"
                          value={editRequestData.due_date}
                          onChange={(e) => setEditRequestData({ ...editRequestData, due_date: e.target.value })}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium outline-none focus:border-purple-800 text-gray-600"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditRequestId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updating}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-colors"
                          style={{ backgroundColor: accent }}
                        >
                          {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-bold text-gray-900">{request.document_title}</h4>
                        {getPriorityBadge(request.priority)}
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Type: {documentTypes.find(t => t.value === request.document_type)?.label || request.document_type}
                        </span>
                        {request.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due: {new Date(request.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-xs font-bold uppercase text-red-800 block mb-0.5">Rejection Reason</span>
                            <span className="text-sm text-red-700">{request.rejection_reason}</span>
                          </div>
                        </div>
                      )}

                      {request.client_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                          <span className="font-semibold text-gray-900 block mb-1">Client Note:</span>
                          {request.client_notes}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions Section (Bottom of Card) */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-50">
                  {/* Client Action: Upload to Fulfill */}
                  {role === 'client' && (request.status === 'pending' || request.status === 'rejected') && (
                    <button
                      onClick={() => setFulfillModal(request.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm"
                      style={{ backgroundColor: accent }}
                    >
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                  )}

                  {/* Advocate Action: Verify/Reject */}
                  {(role === 'advocate' || role === 'firm-admin') && (request.status === 'fulfilled' || request.status === 'uploaded') && (
                    <>
                      <button
                        onClick={() => handleVerifyRequest(request.id, 'verify')}
                        disabled={actioningId === request.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                      >
                        {actioningId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Verify
                      </button>
                      <button
                        onClick={() => setShowRejectModal(request.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {/* View Document for Uploaded/Under Review (Advocate can verify/reject) */}
                  {(role === 'advocate' || role === 'firm-admin') && request.status === 'uploaded' && (
                    <button
                      onClick={() => {
                        // Open modal to review document
                        const docField = request.uploaded_document;
                        if (docField) {
                          const docId = typeof docField === 'string' ? docField : docField.id;
                          // Find the document details
                          const matchedDoc = caseDocuments.find((d: any) => d.id === docId);
                          if (matchedDoc) {
                            setReviewingDoc({ request, document: matchedDoc });
                          } else {
                            toast.error('Document not found');
                          }
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                    >
                      <Eye className="w-4 h-4" />
                      Review Document
                    </button>
                  )}

                  {/* View Document for Verified/Rejected States (Read-only) */}
                  {(request.status === 'verified' || request.status === 'rejected') && (
                    <button
                      onClick={() => {
                        const docField = request.uploaded_document;
                        if (docField) {
                          const docId = typeof docField === 'string' ? docField : docField.id;
                          const matchedDoc = caseDocuments.find((d: any) => d.id === docId);
                          if (matchedDoc) {
                            setViewingDoc(matchedDoc);
                          } else {
                            toast.error('Document not found');
                          }
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      <Eye className="w-4 h-4" />
                      View Doc
                    </button>
                  )}

                  {/* Advocate Action: Edit/Delete (Only for pending requests) */}
                  {(role === 'advocate' || role === 'firm-admin') && (request.status === 'pending' || request.status === 'rejected') && (
                    <>
                      <button
                        onClick={() => {
                          setEditRequestId(request.id);
                          setEditRequestData({ description: request.description, due_date: request.due_date || '' });
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={deletingId === request.id}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === request.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reject Reason Input (Inline for simplicity) */}
              {showRejectModal === request.id && (
                <div className="mt-3 flex flex-col gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <textarea
                    autoFocus
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-lg border border-red-200 p-2 text-xs bg-white focus:border-red-400 outline-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleVerifyRequest(request.id, 'reject')}
                      disabled={!rejectReason || actioningId === request.id}
                      className="flex-1 bg-red-600 text-white rounded-lg py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-red-700 transition-colors"
                    >
                      Confirm Reject
                    </button>
                    <button 
                      onClick={() => setShowRejectModal(null)}
                      className="flex-1 bg-white text-gray-700 border border-gray-200 rounded-lg py-1.5 text-xs font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CLIENT FULFILL MODAL / FORM (Inline for simplicity) */}
      {role === 'client' && fulfillModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Upload Requested Document</h3>
              <button onClick={() => setFulfillModal(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFulfillRequest} className="p-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Select File</label>
                <input
                  required
                  type="file"
                  onChange={(e) => setFulfillData({ ...fulfillData, document_file: e.target.files?.[0] || null })}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any additional notes for the advocate..."
                  value={fulfillData.client_notes}
                  onChange={(e) => setFulfillData({ ...fulfillData, client_notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillModal(null)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fulfillData.document_file}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: accent }}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Review Modal (for advocates to verify/reject) */}
      {reviewingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{reviewingDoc.document.document_title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">Review and verify this document</p>
              </div>
              <button
                onClick={() => setReviewingDoc(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <DocumentViewer 
                url={reviewingDoc.document.document_file || reviewingDoc.document.file_url}
                title={reviewingDoc.document.document_title}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setReviewingDoc(null)}
                className="px-6 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to reject this document?')) {
                    const reason = prompt('Rejection reason:');
                    if (reason) {
                      setRejectReason(reason);
                      await handleVerifyRequest(reviewingDoc.request.id, 'reject');
                      setReviewingDoc(null);
                    }
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg"
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                Reject
              </button>
              <button
                onClick={async () => {
                  if (confirm('Verify this document?')) {
                    await handleVerifyRequest(reviewingDoc.request.id, 'verify');
                    setReviewingDoc(null);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-lg"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal (read-only for verified/rejected docs) */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewingDoc.document_title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">Document preview</p>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <DocumentViewer 
                url={viewingDoc.document_file || viewingDoc.file_url}
                title={viewingDoc.document_title}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-6 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-bold hover:bg-gray-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
