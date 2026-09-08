'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  Upload, FileText, Loader2, X, Eye, Download, Trash2, 
  CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight, 
  FolderOutput, FolderInput, Copy, MoreVertical, Layers, ArrowUp, ArrowDown, 
  GripVertical, FileSpreadsheet, Sparkles
} from 'lucide-react';
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
  is_court_form?: boolean;
  custom_sequence?: number;
  item_type?: 'court_form' | 'document';
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
  const [loading, setLoading] = useState(!userDocuments);
  const [uploading, setUploading] = useState(false);
  const [uploadStepText, setUploadStepText] = useState('');
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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
    if (userDocuments) {
      setDocuments(userDocuments);
      setLoading(false);
    } else {
      fetchDocuments();
    }
  }, [userId, clientId, caseId, section, userDocuments]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setDocuments([]);
      let url = API.DOCUMENTS.LIST;
      
      if (userId) {
        url = `${API.DOCUMENTS.USER_DOCUMENTS}?user_id=${userId}`;
      } else if (caseId) {
        url = typeof API.DOCUMENTS.BY_CASE === 'function' 
          ? API.DOCUMENTS.BY_CASE(caseId, section) 
          : `${API.DOCUMENTS.BY_CASE}?case_id=${caseId}&section=${section}`;
      } else if (clientId) {
        url = typeof API.DOCUMENTS.BY_CLIENT === 'function' 
          ? API.DOCUMENTS.BY_CLIENT(clientId) 
          : `${API.DOCUMENTS.BY_CLIENT}?client_id=${clientId}`;
      }

      const response = await customFetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Failed to fetch documents');

      const fetchedDocs = Array.isArray(data) ? data : (data.results || []);
      setDocuments(fetchedDocs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorderRow = async (fromNonMasterIdx: number, toNonMasterIdx: number) => {
    const masterDoc = documents.find(d => d.document_title.toLowerCase().includes('master case filing pack'));
    const nonMasterList = documents.filter(d => !d.document_title.toLowerCase().includes('master case filing pack'));

    if (toNonMasterIdx < 0 || toNonMasterIdx >= nonMasterList.length || fromNonMasterIdx === toNonMasterIdx) return;

    const updated = [...nonMasterList];
    const [moved] = updated.splice(fromNonMasterIdx, 1);
    updated.splice(toNonMasterIdx, 0, moved);

    const fullUpdated = masterDoc ? [masterDoc, ...updated] : updated;
    setDocuments(fullUpdated);

    if (caseId) {
      try {
        setReordering(true);
        const payload = {
          case_id: caseId,
          ordered_items: updated.map((item, idx) => ({
            id: item.id,
            type: item.is_court_form || item.document_type === 'court_form' ? 'court_form' : 'document',
            sequence: idx + 1
          }))
        };

        const res = await customFetch(API.DOCUMENTS.REORDER_FILING_PACK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          toast.success('Master PDF recompiled with new document order!');
          await fetchDocuments();
          if (onDocumentVerified) onDocumentVerified();
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to update filing sequence');
        }
      } catch (err: any) {
        console.error('Error saving reordered items:', err);
        toast.error(err.message || 'Failed to update filing sequence.');
        await fetchDocuments();
      } finally {
        setReordering(false);
      }
    }
  };

  const handleDeleteDocument = async (documentId: string, isCourtForm?: boolean) => {
    if (isCourtForm) {
      if (!confirm('Are you sure you want to delete this filled court form?')) return;
      setDeleting(documentId);
      try {
        const response = await customFetch(`${API.DOCUMENTS.FILLED_COURT_FORMS.DETAIL(documentId)}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to delete court form');
        }
        await fetchDocuments();
        if (onDocumentVerified) onDocumentVerified();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setDeleting(null);
      }
      return;
    }

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
      const status = action === 'verify' ? 'verified' : 'rejected';
      const response = await customFetch(API.DOCUMENTS.DETAIL(documentId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to ${action} document`);
      }

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
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadStepText('Uploading document...');
    setError('');
    toast.loading('Uploading document...', { id: 'doc-upload-progress' });

    try {
      const formData = new FormData();
      formData.append('document_type', uploadData.document_type);
      formData.append('document_title', uploadData.document_title || uploadData.document_file.name);
      formData.append('document_number', uploadData.document_number);
      formData.append('document_category', uploadData.document_category);
      formData.append('description', uploadData.description);
      formData.append('document_file', uploadData.document_file);
      formData.append('is_in_all_documents', section === 'all' ? 'true' : 'false');
      formData.append('is_in_other_documents', section === 'other' ? 'true' : 'false');
      if (clientId) formData.append('client', clientId);
      if (caseId) formData.append('case', caseId);

      const response = await customFetch(API.DOCUMENTS.LIST, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || Object.values(data).flat().join(', ') || 'Failed to upload document');
      }

      const newDoc = await response.json();

      // Automatically organize in order and recompile Master PDF via /api/documents/reorder-filing-pack/
      if (caseId && section === 'all') {
        setUploadStepText('Arranging in filing sequence & compiling Master PDF...');
        toast.loading('Arranging sequence & merging into Master PDF...', { id: 'doc-upload-progress' });

        const nonMasterList = documents.filter(d => !d.document_title?.toLowerCase().includes('master case filing pack'));
        const alreadyInList = nonMasterList.some(d => d.id === newDoc.id);
        const updatedList = alreadyInList ? nonMasterList : [...nonMasterList, newDoc];

        const payload = {
          case_id: caseId,
          ordered_items: updatedList.map((item, idx) => ({
            id: item.id,
            type: item.is_court_form || item.document_type === 'court_form' ? 'court_form' : 'document',
            sequence: idx + 1
          }))
        };

        const reorderRes = await customFetch(API.DOCUMENTS.REORDER_FILING_PACK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!reorderRes.ok) {
          const reorderData = await reorderRes.json().catch(() => ({}));
          console.warn('Reorder compilation warning:', reorderData);
        }
      }

      toast.success('Document uploaded and merged into Master PDF in sequence!', { id: 'doc-upload-progress' });

      setShowUploadForm(false);
      setUploadData({
        document_type: 'other',
        document_title: '',
        document_number: '',
        document_category: 'legal',
        description: '',
        document_file: null,
      });
      await fetchDocuments();
      if (onDocumentVerified) onDocumentVerified();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to upload document', { id: 'doc-upload-progress' });
    } finally {
      setUploading(false);
      setUploadStepText('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-semibold">
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              {section === 'all' ? 'All Documents' : 'Other Documents'}
            </h3>
            {reordering && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating Master PDF...
              </span>
            )}
          </div>
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
                {uploadStepText || 'Uploading & Compiling...'}
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

        // Ensure single Master Case Filing Pack is always pinned at the very top (Row #1)
        const masterDoc = filteredDocs.find(d => d.document_title.toLowerCase().includes('master case filing pack'));
        const nonMasterDocs = filteredDocs.filter(d => !d.document_title.toLowerCase().includes('master case filing pack'));
        const orderedDocs = masterDoc && section === 'all' ? [masterDoc, ...nonMasterDocs] : filteredDocs;

        const totalItems = orderedDocs.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const paginatedDocs = orderedDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        if (documents.length === 0) {
          return (
            <div className="text-center p-12 bg-gray-50 rounded-2xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No documents uploaded yet</p>
            </div>
          );
        }

        const isReorderingEnabled = section === 'all' && Boolean(caseId) && isAdvocateRole;

        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Search & Pagination Header */}
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
                {isReorderingEnabled && (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200/70 px-2.5 py-1 rounded-lg mr-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    Organize filing order directly in table
                  </span>
                )}

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
                    <th className="py-3.5 px-6">
                      {isReorderingEnabled ? 'SEQUENCE / SL. NO' : 'SL. NO'}
                    </th>
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
                        No documents match &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map((doc, idx) => {
                      const isMaster = doc.document_title.toLowerCase().includes('master case filing pack');
                      const isCourtForm = Boolean(doc.is_court_form || doc.document_type === 'court_form' || doc.document_category === 'court_form');
                      
                      // Calculate non-master index for reordering
                      const nonMasterIdx = nonMasterDocs.findIndex(d => d.id === doc.id);
                      const slNo = isMaster ? 1 : (nonMasterIdx >= 0 ? nonMasterIdx + 2 : idx + 1);

                      return (
                        <tr 
                          key={doc.id}
                          draggable={isReorderingEnabled && !isMaster && !reordering}
                          onDragStart={(e) => {
                            setDraggedIdx(nonMasterIdx);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverIdx !== nonMasterIdx) {
                              setDragOverIdx(nonMasterIdx);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverIdx === nonMasterIdx) {
                              setDragOverIdx(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedIdx !== null && draggedIdx !== nonMasterIdx && nonMasterIdx >= 0) {
                              handleReorderRow(draggedIdx, nonMasterIdx);
                            }
                            setDraggedIdx(null);
                            setDragOverIdx(null);
                          }}
                          onDragEnd={() => {
                            setDraggedIdx(null);
                            setDragOverIdx(null);
                          }}
                          className={`transition-all duration-150 ${
                            isMaster 
                              ? "bg-emerald-50/40 hover:bg-emerald-50/60 border-l-4 border-l-emerald-600" 
                              : isCourtForm
                                ? "bg-violet-50/75 hover:bg-violet-100/80 border-l-4 border-l-violet-600"
                                : "bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent"
                          } ${
                            draggedIdx === nonMasterIdx ? "opacity-35 bg-slate-100 ring-2 ring-indigo-400" : ""
                          } ${
                            dragOverIdx === nonMasterIdx && draggedIdx !== nonMasterIdx ? "border-t-2 border-t-indigo-600 bg-indigo-50/70 shadow-inner" : ""
                          }`}
                        >
                          {/* Sequence / Sl. No Column */}
                          <td className="py-4 px-6 text-xs font-semibold">
                            {isMaster ? (
                              <div className="flex items-center gap-2 pl-4 text-emerald-800 font-bold">
                                <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-[10px]">📌</span>
                                <span className="font-extrabold">#1</span>
                              </div>
                            ) : isReorderingEnabled && nonMasterIdx >= 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <select
                                  value={nonMasterIdx + 1}
                                  onChange={(e) => handleReorderRow(nonMasterIdx, Number(e.target.value) - 1)}
                                  className={`w-11 h-7 font-bold text-xs rounded-lg text-center cursor-pointer border focus:outline-none transition-colors ${
                                    isCourtForm 
                                      ? 'bg-violet-100/80 hover:bg-violet-200 border-violet-300 text-violet-950 font-black' 
                                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                                  }`}
                                  title="Change document position sequence"
                                >
                                  {nonMasterDocs.map((_, pIdx) => (
                                    <option key={pIdx + 1} value={pIdx + 1}>
                                      {pIdx + 1}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    disabled={nonMasterIdx === 0 || reordering}
                                    onClick={() => handleReorderRow(nonMasterIdx, nonMasterIdx - 1)}
                                    className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                    title="Move Up in Master PDF"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={nonMasterIdx === nonMasterDocs.length - 1 || reordering}
                                    onClick={() => handleReorderRow(nonMasterIdx, nonMasterIdx + 1)}
                                    className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                    title="Move Down in Master PDF"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-semibold">{slNo}</span>
                            )}
                          </td>

                          {/* Document Title Column */}
                          <td className="py-4 px-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              {isCourtForm ? (
                                <FileSpreadsheet className="w-4 h-4 text-violet-600 shrink-0" />
                              ) : isMaster ? (
                                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              
                              <span className={isCourtForm ? "text-violet-950 font-bold" : "text-gray-900"}>
                                {doc.document_title}
                              </span>

                              {isMaster && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                                  Master PDF
                                </span>
                              )}

                              {isCourtForm && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-violet-200/80 text-violet-900 border border-violet-300 uppercase tracking-wider shadow-xs">
                                  Court Form
                                </span>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-xs text-gray-500 font-normal mt-0.5">{doc.description}</p>
                            )}
                          </td>

                          {/* Document Type Column */}
                          <td className="py-4 px-4 text-xs font-medium">
                            {isCourtForm ? (
                              <span className="font-bold text-violet-800 bg-violet-100/60 px-2 py-0.5 rounded-md">
                                Court Form
                              </span>
                            ) : (
                              <span className="text-gray-600">
                                {doc.document_type_display || doc.document_type}
                              </span>
                            )}
                          </td>

                          {/* Uploaded By Column */}
                          <td className="py-4 px-4 text-xs font-medium">
                            <span className="font-bold text-gray-900">{doc.uploaded_by_name}</span>
                            <span className="block text-[11px] text-gray-400 mt-0.5">
                              {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-4">
                            {getStatusBadge(doc.verification_status)}
                          </td>

                          {/* Action Column */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Verification actions */}
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

                              {/* View Action Link */}
                              <Link
                                href={`${viewBase || '/advocate/documents'}/${doc.id}${caseId ? `?fromCase=${caseId}&subtab=${section}` : ''}`}
                                className={`w-[96px] h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-colors shadow-xs shrink-0 ${
                                  isCourtForm
                                    ? "border-violet-200 bg-violet-100/80 text-violet-900 hover:bg-violet-200"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <Eye className={`w-3.5 h-3.5 ${isCourtForm ? 'text-violet-700' : ''}`} />
                                {isCourtForm ? 'View Form' : 'View'}
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id, isCourtForm)}
                                disabled={deleting === doc.id}
                                className="w-[82px] h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 text-xs font-semibold text-red-600 hover:bg-red-100/80 transition-colors disabled:opacity-50 shrink-0"
                                title="Delete"
                              >
                                {deleting === doc.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Delete
                              </button>

                              {/* 3-Dots Action Dropdown Menu for non-master and non-court form */}
                              {section === 'all' && !isMaster && !isCourtForm ? (
                                <div className="relative inline-block text-left row-action-menu shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                    }}
                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
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
                              ) : section === 'all' ? (
                                <div className="w-8 h-8 shrink-0" aria-hidden="true" />
                              ) : null}
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

      {/* Full-screen Loading Animation Overlay during Upload & Auto-Merge / Drag & Reorder */}
      {(uploading || reordering) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full mx-4 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <Sparkles className="w-5 h-5 text-amber-500 absolute" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">
                {uploading ? (uploadStepText || 'Uploading & Compiling...') : 'Reordering Filing Pack...'}
              </h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {uploading
                  ? 'Saving new file, assigning filing sequence, and automatically compiling Master PDF. Please wait...'
                  : 'Updating document sequence and regenerating Master PDF with synchronized bookmarks. Please wait...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
