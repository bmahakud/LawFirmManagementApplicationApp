'use client';

import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  FileText, Upload, CheckCircle, XCircle, Clock, 
  AlertCircle, Loader2, Eye, Calendar, Plus, X
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
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  rejection_reason?: string;
  client_notes?: string;
  uploaded_document?: any;
  created_at: string;
};

type Props = {
  caseId: string;
  clientId?: string;
  role: 'advocate' | 'client' | 'super-admin' | 'firm-admin';
  accent?: string;
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

export default function DocumentVerificationSystem({ caseId, clientId, role, accent = '#4a1c40' }: Props) {
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

  // Client: Upload document
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

      const uploadRes = await customFetch(API.DOCUMENTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload document');
      const uploadedDoc = await uploadRes.json();

      // 2. Update request with uploaded document
      const updateRes = await customFetch(API.DOCUMENT_REQUESTS.DETAIL(requestId), {
        method: 'PATCH',
        body: JSON.stringify({
          uploaded_document: uploadedDoc.id,
          client_notes: uploadNotes,
          status: 'uploaded',
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update request');

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
      
      toast.success('Document verified successfully');
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
          <h2 className="text-lg font-bold text-gray-900">Document Verification</h2>
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
      {requests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No document requests yet</p>
          {isAdvocateRole && (
            <p className="text-sm text-gray-400 mt-2">Click "Request Document" to get started</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const docId = typeof request.uploaded_document === 'string' 
              ? request.uploaded_document 
              : request.uploaded_document?.id;
            const document = caseDocuments.find((d: any) => d.id === docId);

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-gray-300 transition-all"
              >
                <div className="p-4">
                  {/* Compact Header Row */}
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{request.document_title}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                      {request.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">HIGH</span>
                      )}
                    </div>
                  </div>

                  {/* Compact Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="font-medium">{DOCUMENT_TYPES.find(t => t.value === request.document_type)?.label || request.document_type}</span>
                    {request.due_date && (
                      <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Uploaded Document Chip + Actions in same row */}
                  {document && (request.status === 'uploaded' || request.status === 'verified') && (
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                          request.status === 'verified' 
                            ? 'bg-emerald-50 border-emerald-300' 
                            : 'bg-gray-100 border-gray-300'
                        }`}
                      >
                        <FileText className={`w-4 h-4 flex-shrink-0 ${request.status === 'verified' ? 'text-emerald-600' : 'text-gray-600'}`} />
                        <span className={`text-sm font-medium truncate max-w-[180px] ${request.status === 'verified' ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {document.document_file?.split('/').pop()?.substring(0, 25) || document.document_title}
                        </span>
                        {request.status === 'verified' && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>

                      {/* View Button */}
                      <button
                        onClick={() => setReviewingDoc({ request, document })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>

                      {/* Action Buttons */}
                      {isClientRole && request.status === 'uploaded' && (
                        <button
                          onClick={() => setUploadingFor(request.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Update
                        </button>
                      )}

                      {isAdvocateRole && request.status === 'uploaded' && (
                        <button
                          onClick={() => setReviewingDoc({ request, document })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-all"
                          style={{ backgroundColor: accent }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {request.rejection_reason && (
                    <div className="mb-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <p className="text-xs font-bold text-red-900">Rejection: {request.rejection_reason}</p>
                    </div>
                  )}

                  {/* Client Notes */}
                  {request.client_notes && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800"><span className="font-semibold">Note:</span> {request.client_notes}</p>
                    </div>
                  )}

                  {/* Upload Button (for pending/rejected) */}
                  {isClientRole && (request.status === 'pending' || request.status === 'rejected') && (
                    <button
                      onClick={() => setUploadingFor(request.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      {request.status === 'rejected' ? 'Re-upload' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
