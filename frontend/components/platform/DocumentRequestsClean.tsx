'use client';

import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  FileText, Upload, CheckCircle, XCircle, Clock, 
  AlertCircle, Loader2, Eye, Calendar, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DocumentViewer from './DocumentViewer';

type DocumentRequest = {
  id: string;
  document_type: string;
  document_title: string;
  description: string;
  priority: string;
  due_date: string;
  status: string;
  rejection_reason?: string;
  client_notes?: string;
  uploaded_document?: any;
};

type Props = {
  caseId: string;
  role: 'advocate' | 'client';
  accent?: string;
};

export default function DocumentRequestsClean({ caseId, role, accent = '#4a1c40' }: Props) {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseDocuments, setCaseDocuments] = useState<any[]>([]);
  
  // Review modal state
  const [reviewingDoc, setReviewingDoc] = useState<{ request: DocumentRequest; document: any } | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchCaseDocuments();
  }, [caseId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await customFetch(API.DOCUMENT_REQUESTS.BY_CASE(caseId));
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch requests');
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDocuments = async () => {
    try {
      const res = await customFetch(`${API.DOCUMENTS.BY_CASE}?case_id=${caseId}`);
      const data = await res.json();
      if (res.ok) setCaseDocuments(data);
    } catch (err) {
      console.error('Failed to fetch case documents:', err);
    }
  };

  const handleVerify = async (requestId: string) => {
    if (!confirm('Verify this document?')) return;
    
    setActioningId(requestId);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.VERIFY(requestId), {
        method: 'POST',
        body: JSON.stringify({ action: 'verify' }),
      });
      if (!res.ok) throw new Error('Failed to verify');
      toast.success('Document verified!');
      setReviewingDoc(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    setActioningId(requestId);
    try {
      const res = await customFetch(API.DOCUMENT_REQUESTS.VERIFY(requestId), {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', rejection_reason: reason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      toast.success('Document rejected');
      setReviewingDoc(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      uploaded: 'bg-blue-50 text-blue-700 border-blue-200',
      verified: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    
    const icons = {
      pending: <Clock className="w-3.5 h-3.5" />,
      uploaded: <Upload className="w-3.5 h-3.5" />,
      verified: <CheckCircle className="w-3.5 h-3.5" />,
      rejected: <XCircle className="w-3.5 h-3.5" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-orange-100 text-orange-700',
      low: 'bg-gray-100 text-gray-700',
    };
    
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colors[priority as keyof typeof colors]}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Document Requests</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage documents requested from the client</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No document requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const docId = typeof request.uploaded_document === 'string' ? request.uploaded_document : request.uploaded_document?.id;
            const document = caseDocuments.find((d: any) => d.id === docId);

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base font-bold text-gray-900">{request.document_title}</h4>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {request.due_date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {request.client_notes && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>Note: {request.client_notes}</span>
                          </div>
                        )}
                      </div>

                      {request.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                          <p className="text-xs font-semibold text-red-900">Rejection Reason:</p>
                          <p className="text-xs text-red-700 mt-1">{request.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {role === 'advocate' && request.status === 'uploaded' && document && (
                        <button
                          onClick={() => setReviewingDoc({ request, document })}
                          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      )}

                      {request.status === 'verified' && document && (
                        <button
                          onClick={() => setReviewingDoc({ request, document })}
                          className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Review Modal */}
      {reviewingDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{reviewingDoc.document.document_title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">Document Verification</p>
              </div>
              <button
                onClick={() => setReviewingDoc(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Document Viewer */}
            <div className="flex-1 overflow-auto bg-gray-100">
              <DocumentViewer 
                url={reviewingDoc.document.document_file || reviewingDoc.document.file_url}
                title={reviewingDoc.document.document_title}
              />
            </div>

            {/* Action Footer */}
            {role === 'advocate' && reviewingDoc.request.status === 'uploaded' && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setReviewingDoc(null)}
                  className="px-6 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
                  disabled={actioningId === reviewingDoc.request.id}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(reviewingDoc.request.id)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                  disabled={actioningId === reviewingDoc.request.id}
                >
                  {actioningId === reviewingDoc.request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handleVerify(reviewingDoc.request.id)}
                  className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                  disabled={actioningId === reviewingDoc.request.id}
                >
                  {actioningId === reviewingDoc.request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Verify
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
