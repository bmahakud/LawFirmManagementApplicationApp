'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Upload, FileText, Loader2, X, Eye, Download, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

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
};

type DocumentManagerProps = {
  accent: string;
  userId?: string;
  clientId?: string;
  caseId?: string;
  showUpload?: boolean;
  viewBase?: string;
  userDocuments?: Document[]; // Optional: pass documents from parent (e.g., from profile API)
};

export default function DocumentManager({ accent, userId, clientId, caseId, showUpload = true, viewBase, userDocuments }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>(userDocuments || []);
  const [loading, setLoading] = useState(!userDocuments); // Don't load if documents are provided
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [uploadData, setUploadData] = useState({
    document_type: 'other',
    document_title: '',
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
  }, [userId, clientId, caseId, userDocuments]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let url = API.DOCUMENTS.LIST; // Default: user's own documents
      const params = new URLSearchParams();
      
      // If viewing a specific user's profile documents, use the user_documents endpoint
      if (userId) {
        url = API.DOCUMENTS.USER_DOCUMENTS;
        params.set('user_id', userId);
      } 
      // If filtering by client, use by_client endpoint
      else if (clientId) {
        url = API.DOCUMENTS.BY_CLIENT;
        params.set('client_id', clientId);
      } 
      // If filtering by case, use by_case endpoint
      else if (caseId) {
        url = API.DOCUMENTS.BY_CASE;
        params.set('case_id', caseId);
      }
      // Otherwise, use default LIST endpoint which returns only user's own documents

      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

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
      if (uploadData.description) formData.append('description', uploadData.description);
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Documents</h3>
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

      {documents.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-2xl border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.document_title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Uploaded by {doc.uploaded_by_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {getStatusBadge(doc.verification_status)}
                <Link
                  href={`${viewBase || '/super-admin/documents'}/${doc.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
