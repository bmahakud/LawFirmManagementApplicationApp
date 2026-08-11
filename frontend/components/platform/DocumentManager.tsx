'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Upload, FileText, Loader2, X, Eye, Download, Trash2, CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight, FolderOutput, FolderInput, Copy, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Document = {
  id: string;
  document_title: string;
  document_type: string;
  document_type_display: string;
  document_category: string | null;
  document_file: string;
  file_url?: string;
  uploaded_by_name: string;
  uploaded_at: string;
  verification_status: string;
  description?: string;
  is_deleted: boolean;
  version: number;
  is_in_all_documents?: boolean;
  is_in_other_documents?: boolean;
  is_copied?: boolean;
};

type DocumentManagerProps = {
  accent: string;
  userId?: string;
  clientId?: string;
  caseId?: string;
  showUpload?: boolean;
  viewBase?: string;
  userDocuments?: Document[]; // Optional: pass documents from parent (e.g., from profile API)
  role?: string; // User role to determine if they can verify documents
  onDocumentVerified?: () => void; // Callback after verification
  section?: 'all' | 'other';
};

export default function DocumentManager({ accent, userId, clientId, caseId, showUpload = true, viewBase, userDocuments, role, onDocumentVerified, section = 'all' }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>(userDocuments || []);
  const [loading, setLoading] = useState(!userDocuments); // Don't load if documents are provided
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null); // Document ID being verified
  const [deleting, setDeleting] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId && !(e.target as HTMLElement).closest('.row-action-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

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

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDeleting(documentId);
    try {
      const response = await customFetch(API.DOCUMENTS.DETAIL(documentId), {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete document');
      }
      await fetchDocuments();
      if (onDocumentVerified) onDocumentVerified();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const isAdvocateRole = role === 'advocate' || role === 'super-admin' || role === 'firm-admin';

  const [uploadData, setUploadData] = useState({
    document_type: 'other',
    document_title: '',
    document_number: '',
    document_category: 'legal',
    description: '',
    document_file: null as File | null,
  });

  const documentTypes = [
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'bar_certificate', label: 'Bar Council Certificate' },
    { value: 'degree', label: 'Educational Degree' },
    { value: 'fir', label: 'FIR' },
    { value: 'petition', label: 'Petition' },
    { value: 'evidence', label: 'Evidence' },
    { value: 'order', label: 'Court Order' },
    { value: 'agreement', label: 'Agreement' },
    { value: 'affidavit', label: 'Affidavit' },
    { value: 'notice', label: 'Legal Notice' },
    { value: 'contract', label: 'Contract' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'medical_report', label: 'Medical Report' },
    { value: 'police_report', label: 'Police Report' },
    { value: 'witness_statement', label: 'Witness Statement' },
    { value: 'power_of_attorney', label: 'Power of Attorney' },
    { value: 'vakalatnama', label: 'Vakalatnama' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    // If documents are provided via props, use them
    if (userDocuments) {
      setDocuments(userDocuments);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, clientId, caseId, section, userDocuments]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setDocuments([]); // Reset documents so previous section state is cleared
      let url = API.DOCUMENTS.LIST; // Default: user's own documents
      const params = new URLSearchParams();
      
      // Priority order: userId > caseId > clientId > default
      // If viewing a specific user's profile documents, use the user_documents endpoint
      if (userId) {
        url = `${API.DOCUMENTS.USER_DOCUMENTS}?user_id=${userId}`;
      } 
      // If filtering by case, use by_case endpoint (higher priority than clientId)
      else if (caseId) {
        url = typeof API.DOCUMENTS.BY_CASE === 'function' 
          ? API.DOCUMENTS.BY_CASE(caseId, section) 
          : `${API.DOCUMENTS.BY_CASE}?case_id=${caseId}&section=${section}`;
      } 
      // If filtering by client, use by_client endpoint
      else if (clientId) {
        url = typeof API.DOCUMENTS.BY_CLIENT === 'function' 
          ? API.DOCUMENTS.BY_CLIENT(clientId) 
          : `${API.DOCUMENTS.BY_CLIENT}?client_id=${clientId}`;
      }

      console.log('DocumentManager - Fetching documents from:', url);
      const response = await customFetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Failed to fetch documents');

      // Handle both paginated and non-paginated responses
      const fetchedDocs = Array.isArray(data) ? data : (data.results || []);
      
      console.log('DocumentManager - Fetched documents:', fetchedDocs);
      setDocuments(fetchedDocs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToOther = async (documentId: string) => {
    if (!confirm('Are you sure you want to move this document to Other Documents?')) return;
    setMoving(documentId);
    try {
      const response = await customFetch(API.DOCUMENTS.MOVE_TO_OTHER(documentId), {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to move document');
      }
      toast.success('Document moved to Other Documents');
      await fetchDocuments();
      if (onDocumentVerified) onDocumentVerified();
    } catch (err: any) {
      toast.error(err.message || 'Failed to move document');
    } finally {
      setMoving(null);
    }
  };

  const handleCopyToOther = async (documentId: string) => {
    if (!confirm('Are you sure you want to copy this document to Other Documents?')) return;
    setMoving(documentId);
    try {
      const response = await customFetch(API.DOCUMENTS.COPY_TO_OTHER(documentId), {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to copy document');
      }
      toast.success('Document copied to Other Documents');
      await fetchDocuments();
      if (onDocumentVerified) onDocumentVerified();
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy document');
    } finally {
      setMoving(null);
    }
  };

  const handleMoveToAll = async (documentId: string) => {
    if (!confirm('Are you sure you want to move this document back to All Documents?')) return;
    setMoving(documentId);
    try {
      const response = await customFetch(API.DOCUMENTS.MOVE_TO_ALL(documentId), {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to move document');
      }
      toast.success('Document moved back to All Documents');
      await fetchDocuments();
      if (onDocumentVerified) onDocumentVerified();
    } catch (err: any) {
      toast.error(err.message || 'Failed to move document');
    } finally {
      setMoving(null);
    }
  };

  const handleVerifyDocument = async (documentId: string, action: 'verify' | 'reject') => {
    setVerifying(documentId);
    try {
      const response = await customFetch(API.DOCUMENTS.DETAIL(documentId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: action === 'verify' ? 'verified' : 'rejected'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to update document');
      }

      // Refresh documents
      await fetchDocuments();
      if (onDocumentVerified) onDocumentVerified();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.document_file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document_file', uploadData.document_file);
      formData.append('document_type', uploadData.document_type);
      formData.append('document_title', uploadData.document_title || uploadData.document_file.name);
      if (uploadData.document_number) formData.append('document_number', uploadData.document_number);
      if (uploadData.document_category) formData.append('document_category', uploadData.document_category);
      if (uploadData.description) formData.append('description', uploadData.description);
      
      // Handle IDs (ensuring they are sent as strings)
      if (clientId) formData.append('client', clientId);
      if (caseId) formData.append('case', caseId);

      const response = await customFetch(API.DOCUMENTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to upload document');
      }

      setUploadData({
        document_type: 'other',
        document_title: '',
        document_number: '',
        document_category: 'legal',
        description: '',
        document_file: null,
      });
      setShowUploadForm(false);
      fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-400">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showUpload && (
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">All Documents</h3>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
            style={{ backgroundColor: accent }}
          >
            {showUploadForm ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {showUploadForm ? 'Cancel' : 'Upload Document'}
          </button>
        </div>
      )}

      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Document Type
              </label>
              <select
                value={uploadData.document_type}
                onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-gray-900 font-semibold outline-none focus:border-[#0e2340] transition-colors"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Document Title
              </label>
              <input
                type="text"
                value={uploadData.document_title}
                onChange={(e) => setUploadData({ ...uploadData, document_title: e.target.value })}
                placeholder="Enter document title"
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-gray-900 font-semibold outline-none focus:border-[#0e2340] transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Document Number
              </label>
              <input
                type="text"
                value={uploadData.document_number}
                onChange={(e) => setUploadData({ ...uploadData, document_number: e.target.value })}
                placeholder="e.g. PET-2026-001"
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-gray-900 font-semibold outline-none focus:border-[#0e2340] transition-colors placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Document Category
              </label>
              <select
                value={uploadData.document_category}
                onChange={(e) => setUploadData({ ...uploadData, document_category: e.target.value })}
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-gray-900 font-semibold outline-none focus:border-[#0e2340] transition-colors"
              >
                <option value="legal">Legal</option>
                <option value="personal">Personal</option>
                <option value="evidence">Evidence</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Description (Optional)
            </label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              placeholder="Add notes or description"
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 py-2.5 text-sm text-gray-900 font-semibold outline-none focus:border-[#0e2340] transition-colors resize-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Select File
            </label>
            <input
              type="file"
              onChange={(e) => setUploadData({ ...uploadData, document_file: e.target.files?.[0] || null })}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs font-semibold text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </button>
        </form>
      )}

      {(() => {
        const filteredDocs = documents.filter(doc => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            doc.document_title.toLowerCase().includes(q) ||
            (doc.document_type_display || '').toLowerCase().includes(q) ||
            doc.document_type.toLowerCase().includes(q) ||
            (doc.uploaded_by_name || '').toLowerCase().includes(q) ||
            doc.verification_status.toLowerCase().includes(q)
          );
        });

        const totalItems = filteredDocs.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        if (documents.length === 0) {
          return (
            <div className="text-center p-12 bg-gray-50 rounded-2xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No documents uploaded yet</p>
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
                    <th className="py-3.5 px-4">UPLOADED BY</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                        No documents match "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc, idx) => {
                      const slNo = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-6 text-xs font-semibold text-gray-400">{slNo}</td>
                          <td className="py-4 px-4 font-bold text-gray-900">
                            <div>{doc.document_title}</div>
                            {doc.description && (
                              <p className="text-xs text-gray-500 font-normal mt-0.5">{doc.description}</p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-600">
                            {doc.document_type_display || doc.document_type}
                          </td>
                          <td className="py-4 px-4 text-xs text-gray-600 font-medium">
                            <span className="font-bold text-gray-900">{doc.uploaded_by_name}</span>
                            <span className="block text-[11px] text-gray-400 mt-0.5">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(doc.verification_status)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Verification actions for advocates on pending documents */}
                              {isAdvocateRole && doc.verification_status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyDocument(doc.id, 'verify')}
                                    disabled={verifying === doc.id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                  >
                                    {verifying === doc.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    )}
                                    Verify
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyDocument(doc.id, 'reject')}
                                    disabled={verifying === doc.id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                </>
                              )}

                              {section === 'other' && !doc.is_copied && !doc.is_in_all_documents && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveToAll(doc.id)}
                                  disabled={moving === doc.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-colors disabled:opacity-50"
                                  title="Move back to All Documents"
                                >
                                  {moving === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderInput className="w-3.5 h-3.5" />}
                                  Move to All
                                </button>
                              )}

                              <Link
                                href={`${viewBase || '/super-admin/documents'}/${doc.id}${caseId ? `?fromCase=${caseId}&subtab=${section}` : ''}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deleting === doc.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100/80 transition-colors disabled:opacity-50"
                                title="Delete Document"
                              >
                                {deleting === doc.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Delete
                              </button>

                              {/* 3-Dots Action Dropdown Menu for All Documents */}
                              {section === 'all' && (
                                <div className="relative inline-block text-left row-action-menu">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                    }}
                                    className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                    title="More Actions"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openMenuId === doc.id && (
                                    <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleMoveToOther(doc.id);
                                        }}
                                        disabled={moving === doc.id}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-purple-900 hover:bg-purple-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                                      >
                                        {moving === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOutput className="w-3.5 h-3.5 text-purple-600" />}
                                        Move to Other
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleCopyToOther(doc.id);
                                        }}
                                        disabled={moving === doc.id}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-blue-900 hover:bg-blue-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                                      >
                                        {moving === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                                        Copy to Other
                                      </button>
                                    </div>
                                  )}
                                </div>
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
    </div>
  );
}
