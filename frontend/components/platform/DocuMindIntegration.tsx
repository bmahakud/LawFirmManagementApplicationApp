'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Maximize2, Minimize2, Sparkles, Loader2, RefreshCw, CheckCircle2, Zap
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

function resolveDocuMindUrl() {
  if (process.env.NEXT_PUBLIC_DOCU_MIND_URL) {
    return process.env.NEXT_PUBLIC_DOCU_MIND_URL;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }

  return 'https://mindmap.diracai.com';
}

function resolveLawfirmAppUrl() {
  if (process.env.NEXT_PUBLIC_LAWFIRM_APP_URL) {
    return process.env.NEXT_PUBLIC_LAWFIRM_APP_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'https://antlegal.anthemgt.com';
}

const DOCU_MIND_URL = resolveDocuMindUrl();
const LAWFIRM_APP_URL = resolveLawfirmAppUrl();

function getOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

interface DocuMindIntegrationProps {
  caseId: string;
  initialDraftUrl?: string | null;
}

export function DocuMindIntegration({ caseId, initialDraftUrl }: DocuMindIntegrationProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Document states fetched from APIs
  const [caseDocuments, setCaseDocuments] = useState<any[]>([]);
  const [filledForms, setFilledForms] = useState<any[]>([]);
  const [masterDoc, setMasterDoc] = useState<any | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasAutoLoadedRef = useRef(false);

  const docuMindOrigin = getOrigin(DOCU_MIND_URL);
  const lawfirmOrigin = typeof window !== 'undefined' ? window.location.origin : getOrigin(LAWFIRM_APP_URL);
  const iframeSrc = `${DOCU_MIND_URL}?caseId=${encodeURIComponent(caseId)}${lawfirmOrigin ? `&parentOrigin=${encodeURIComponent(lawfirmOrigin)}` : ''
    }`;

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => { });
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => { });
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const prevDocsCountRef = useRef<number>(0);

  // Fetch case documents and filled court forms
  const fetchCaseFiles = useCallback(async () => {
    if (!caseId) return;
    try {
      const [caseDocsRes, filledFormsRes] = await Promise.all([
        customFetch(`${API.DOCUMENTS.BY_CASE(caseId, 'all')}`).catch(() => null),
        customFetch(`${API.DOCUMENTS.FILLED_COURT_FORMS.LIST}?case=${caseId}`).catch(() => null),
      ]);

      let docs: any[] = [];
      let forms: any[] = [];
      let foundMaster: any = null;

      if (caseDocsRes && caseDocsRes.ok) {
        const data = await caseDocsRes.json();
        docs = Array.isArray(data) ? data : data.results || [];
        setCaseDocuments(docs);

        foundMaster = docs.find((d: any) =>
          d.document_title?.toLowerCase().includes('master case filing pack')
        );
        if (foundMaster) {
          setMasterDoc(foundMaster);
        }
      }

      if (filledFormsRes && filledFormsRes.ok) {
        const data = await filledFormsRes.json();
        forms = Array.isArray(data) ? data : data.results || [];
        setFilledForms(forms);
      }

      const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000' : window.location.origin);

      // Sync Master PDF and actual case documents to DocuMind
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'DOCU_MIND_SYNC_CASE_FILES',
          backendBaseUrl: backendBase,
          caseDocuments: docs,
        }, '*');

        // Check if new documents were added during this session
        if (prevDocsCountRef.current > 0 && docs.length > prevDocsCountRef.current) {
          const diff = docs.length - prevDocsCountRef.current;
          iframeRef.current.contentWindow.postMessage({
            type: 'DOCU_MIND_NEW_FILES_AVAILABLE',
            count: diff,
            masterUrl: foundMaster?.file_url || null,
          }, '*');
        }
      }
      prevDocsCountRef.current = docs.length;
    } catch (err) {
      console.error('Error fetching case documents:', err);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseFiles();
  }, [fetchCaseFiles]);

  const loadDocumentIntoEditor = async (fileUrl: string, title: string, format: string = 'pdf') => {
    if (!iframeRef.current || !fileUrl) return;
    try {
      setIsLoading(true);
      toast.loading(`Loading "${title}" into editor...`, { id: 'documind-load' });

      let fullUrl = fileUrl;
      if (fileUrl.startsWith('/')) {
        fullUrl = `${window.location.origin}${fileUrl}`;
      }

      const response = await fetch(fullUrl);
      const blob = await response.blob();

      const msg = {
        type: 'DOCU_MIND_LOAD',
        blob,
        url: fullUrl,
        format: format || 'pdf',
        filename: title,
      };

      iframeRef.current.contentWindow?.postMessage(msg, '*');
      toast.success(`Loaded "${title}" into editor!`, { id: 'documind-load' });
    } catch (error) {
      toast.error('Failed to load document into editor.', { id: 'documind-load' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMergedPdf = async () => {
    try {
      setIsMerging(true);
      toast.loading('Compiling all PDFs, Photos & Court Forms into Master PDF...', { id: 'documind-merge' });

      const res = await customFetch(API.DOCUMENTS.GENERATE_MERGED_PDF, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMasterDoc(data);
        toast.success('Master Case Filing PDF generated successfully!', { id: 'documind-merge' });
        fetchCaseFiles();

        const targetUrl = data.file_url || data.document_file;
        if (targetUrl) {
          loadDocumentIntoEditor(targetUrl, data.document_title || 'Master Case Filing Pack', 'pdf');
        }
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to generate merged PDF', { id: 'documind-merge' });
      }
    } catch (err) {
      console.error('Error generating merged PDF:', err);
      toast.error('An error occurred while compiling documents.', { id: 'documind-merge' });
    } finally {
      setIsMerging(false);
    }
  };

  const handleIframeLoad = async () => {
    if (iframeRef.current) {
      try {
        if (initialDraftUrl) {
          loadDocumentIntoEditor(initialDraftUrl, 'Document Draft', initialDraftUrl.endsWith('.json') ? 'json' : 'pdf');
        } else {
          // Open directly on Home (Documents Explorer) and sync all case files & forms
          await fetchCaseFiles();
        }
      } catch (error) {
        console.error('Error in handleIframeLoad:', error);
      }
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const { type, format, blob, filename } = event.data || {};

      if (type === 'DOCU_MIND_READY') {
        setIframeReady(true);
        if (!hasAutoLoadedRef.current) {
          hasAutoLoadedRef.current = true;
          handleIframeLoad();
        } else {
          fetchCaseFiles();
        }
      }

      if (type === 'DOCU_MIND_TOGGLE_FULLSCREEN') {
        toggleFullscreen();
      }

      if (type === 'DOCU_MIND_GET_VERSIONS') {
        try {
          const docId = event.data?.documentId;
          const url = API.DOCUMENTS.DRAFT_VERSIONS.BY_CASE(caseId, docId);
          const res = await customFetch(url);
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.results || [];
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSIONS_LIST',
              versions: list
            }, '*');
          }
        } catch (err) {
          console.error('Error in DOCU_MIND_GET_VERSIONS:', err);
        }
      }

      if (type === 'DOCU_MIND_SAVE_VERSION' && event.data?.payload) {
        try {
          const res = await customFetch(API.DOCUMENTS.DRAFT_VERSIONS.CREATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event.data.payload)
          });
          if (res.ok) {
            const saved = await res.json();
            toast.success(`Saved milestone "${event.data.payload.version_name}"!`, { id: 'documind-version-save' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_SAVED',
              success: true,
              version: saved
            }, '*');
          } else {
            const err = await res.json();
            toast.error(`Failed to save milestone: ${err.detail || 'Error'}`, { id: 'documind-version-save' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_SAVED',
              success: false,
              error: err
            }, '*');
          }
        } catch (err) {
          console.error('Error in DOCU_MIND_SAVE_VERSION:', err);
          toast.error('Network error saving milestone', { id: 'documind-version-save' });
        }
      }

      if (type === 'DOCU_MIND_RESTORE_VERSION' && event.data?.versionId) {
        try {
          const res = await customFetch(API.DOCUMENTS.DRAFT_VERSIONS.RESTORE(event.data.versionId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            const data = await res.json();
            toast.success(`Restored to Version ${data.restored_version?.version_number || ''}!`, { id: 'documind-version-restore' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_RESTORED',
              success: true,
              data
            }, '*');
          } else {
            toast.error('Failed to restore version', { id: 'documind-version-restore' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_RESTORED',
              success: false
            }, '*');
          }
        } catch (err) {
          console.error('Error in DOCU_MIND_RESTORE_VERSION:', err);
        }
      }

      if (type === 'DOCU_MIND_GET_VERSION_DETAIL' && event.data?.versionId) {
        try {
          const res = await customFetch(API.DOCUMENTS.DRAFT_VERSIONS.DETAIL(event.data.versionId));
          if (res.ok) {
            const data = await res.json();
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_DETAIL',
              success: true,
              version: data
            }, '*');
          } else {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_DETAIL',
              success: false,
              versionId: event.data.versionId
            }, '*');
          }
        } catch (err) {
          console.error('Error in DOCU_MIND_GET_VERSION_DETAIL:', err);
        }
      }

      if (type === 'DOCU_MIND_DELETE_VERSION' && event.data?.versionId) {
        try {
          const res = await customFetch(API.DOCUMENTS.DRAFT_VERSIONS.DELETE(event.data.versionId), {
            method: 'DELETE'
          });
          if (res.ok || res.status === 204) {
            toast.success('Version deleted successfully!', { id: 'documind-version-delete' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_DELETED',
              success: true,
              versionId: event.data.versionId
            }, '*');
          } else {
            toast.error('Failed to delete version', { id: 'documind-version-delete' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_DELETED',
              success: false,
              versionId: event.data.versionId
            }, '*');
          }
        } catch (err) {
          console.error('Error in DOCU_MIND_DELETE_VERSION:', err);
        }
      }

      if (type === 'DOCU_MIND_NAME_VERSION' && event.data?.versionId) {
        try {
          const res = await customFetch(API.DOCUMENTS.DRAFT_VERSIONS.NAME_VERSION(event.data.versionId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version_name: event.data.versionName })
          });
          if (res.ok) {
            const updated = await res.json();
            toast.success('Version renamed successfully!', { id: 'documind-version-name' });
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_VERSION_NAMED',
              success: true,
              version: updated
            }, '*');
          }
        } catch (err) {
          console.error('Error in DOCU_MIND_NAME_VERSION:', err);
        }
      }

      // Handled directly via client-side download/print in DocuMind editor
      if (type === 'DOCU_MIND_EXPORT' && blob) {
        // Direct exports are client-side only
      }

      // Handle byte fetching requests from DocuMind iframe to bypass CORS
      if (type === 'DOCU_MIND_FETCH_FILE_BYTES' && event.data?.url) {
        const { requestId, url } = event.data;
        try {
          let fetchUrl = url;
          if (fetchUrl.startsWith('/')) {
            fetchUrl = `${window.location.origin}${fetchUrl}`;
          } else if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fetchUrl.startsWith('http:')) {
            fetchUrl = fetchUrl.replace(/^http:/, 'https:');
          }
          const resp = await fetch(fetchUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_FILE_BYTES_RESPONSE',
              requestId,
              success: true,
              blob,
            }, '*');
          } else {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'DOCU_MIND_FILE_BYTES_RESPONSE',
              requestId,
              success: false,
              error: `HTTP ${resp.status}`,
            }, '*');
          }
        } catch (e: any) {
          console.error('Error fetching file bytes for DocuMind iframe:', e);
          iframeRef.current?.contentWindow?.postMessage({
            type: 'DOCU_MIND_FILE_BYTES_RESPONSE',
            requestId,
            success: false,
            error: e?.message || 'Fetch failed',
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [caseId, toggleFullscreen, fetchCaseFiles]);



  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-[#130310] overflow-hidden shadow-2xl flex flex-col'
          : 'w-full relative overflow-hidden rounded-2xl border border-[#3b0e31]/80 shadow-2xl bg-[#130310] flex flex-col transition-all'
      }
      style={isFullscreen ? { height: '100vh', width: '100vw' } : { height: '880px' }}
    >
      {/* Sleek Modern Header Control Bar - Advocate Plum Theme */}
      <div className="bg-[#1c0517]/95 backdrop-blur-xl border-b border-[#3b0e31]/80 px-5 py-3 flex flex-wrap items-center justify-between gap-3 z-[60] shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Action Button: Compile & Merge PDF */}
          <button
            type="button"
            onClick={handleGenerateMergedPdf}
            disabled={isMerging}
            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2d0b25] via-[#5c134d] to-[#831843] hover:from-[#3d0e32] hover:to-[#9f1239] text-white text-xs font-bold shadow-lg shadow-[#2d0b25]/50 border border-[#be185d]/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            title="Compile all PDFs, Photos and Forms into one Master Filing PDF"
          >
            {isMerging ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 transition-transform group-hover:scale-110" />
            )}
            <span>{isMerging ? 'Compiling Master PDF...' : 'Compile & Merge All Documents (PDF + Photos)'}</span>
          </button>

          {/* Quick Load Master PDF pill if generated */}
          {masterDoc && (
            <button
              type="button"
              onClick={() =>
                loadDocumentIntoEditor(
                  masterDoc.file_url || masterDoc.document_file,
                  masterDoc.document_title || 'Master Case Filing Pack',
                  'pdf'
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              title="Load Master Case Filing PDF into editor"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Master PDF</span>
            </button>
          )}
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCaseFiles}
            className="p-2 rounded-xl bg-[#2d0b25]/80 hover:bg-[#3d0e32] text-pink-200 border border-[#5c134d]/60 transition-colors"
            title="Refresh case file list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2d0b25]/80 hover:bg-[#3d0e32] text-[#fdf2f9] text-xs font-semibold border border-[#5c134d]/80 transition-all active:scale-[0.98]"
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Expand Editor to Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-pink-300" /> : <Maximize2 className="w-3.5 h-3.5 text-pink-300" />}
            <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* Saving / Merging Loading Overlay */}
      {(isSaving || isLoading || isMerging) && (
        <div className="absolute inset-0 bg-[#130310]/70 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 bg-[#1c0517]/90 border border-[#3b0e31] p-6 rounded-2xl shadow-2xl max-w-sm text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#86198f] border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-5 h-5 text-amber-300 absolute" />
            </div>
            <div>
              <p className="text-sm font-bold text-pink-100">
                {isMerging
                  ? 'Compiling Master Filing Pack PDF...'
                  : isSaving
                    ? 'Syncing to Case Database...'
                    : 'Loading Document into Editor...'}
              </p>
              <p className="text-xs text-pink-300/70 mt-1 font-medium">
                {isMerging
                  ? 'Rendering template designs, converting images & assembling pages...'
                  : 'Preparing workspace canvas...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main DocuMind Editor Iframe */}
      <iframe
        key={caseId}
        ref={iframeRef}
        onLoad={handleIframeLoad}
        src={iframeSrc}
        className="w-full flex-1 border-0 bg-white"
        title="Docu Mind Editor"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
