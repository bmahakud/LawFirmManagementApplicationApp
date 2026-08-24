'use client';

import { 
  FileText, Image as ImageIcon, ExternalLink, X, Loader2, 
  ShieldAlert, Lock, AlertCircle, Download, FileArchive, ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { customFetch } from '@/lib/fetch';
import { useState, useEffect } from 'react';

interface DocumentViewerProps {
  url?: string | null;
  title: string;
  onClose?: () => void;
}

export default function DocumentViewer({ url, title, onClose }: DocumentViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const safeUrl = url || '';

  const getFileExtension = (urlStr: string) => {
    if (!urlStr) return '';
    const cleanUrl = urlStr.split('?')[0].replace(/\/+$/, '');
    if (cleanUrl.toLowerCase().endsWith('/pdf') || cleanUrl.toLowerCase().endsWith('.pdf') || cleanUrl.toLowerCase().includes('/pdf/')) {
      return 'pdf';
    }
    const lastDot = cleanUrl.lastIndexOf('.');
    if (lastDot !== -1) {
      const ext = cleanUrl.substring(lastDot + 1).toLowerCase();
      if (ext.length <= 6 && /^[a-z0-9]+$/i.test(ext)) {
        return ext;
      }
    }
    return '';
  };

  const extension = getFileExtension(safeUrl);

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension || '');
  const isPDF = extension === 'pdf' || safeUrl.toLowerCase().includes('/pdf/') || safeUrl.toLowerCase().endsWith('/pdf');
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '');
  const isText = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'html', 'htm'].includes(extension || '');
  
  // A document is previewable in-browser only if it matches one of the known formats
  const isViewable = isImage || isPDF || isOffice || isText;

  // Helper to get the actual file URL (handling relative paths)
  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    const baseUrl = API_BASE_URL || 'https://antlegal.anthemgt.com';
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  };

  const fullUrl = safeUrl ? getFullUrl(safeUrl) : '';

  // Only fetch PDF as blob to avoid CORS issues for PDF iframe rendering
  useEffect(() => {
    if (!safeUrl || !isPDF) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPdfBlob = async () => {
      try {
        setIsLoading(true);
        let response;
        if (safeUrl.startsWith('/api/') || safeUrl.startsWith('api/')) {
          response = await customFetch(safeUrl);
        } else {
          response = await fetch(fullUrl, { 
            method: 'GET',
            credentials: 'include'
          });
        }
        
        if (response.status === 403 || response.status === 401) {
          if (isMounted) {
            setLoadError(true);
            setIsLoading(false);
          }
          return;
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          const text = await response.text();
          if (text.includes('permission') || text.includes('Permission') || text.includes('not have permission') || text.includes('Alert:')) {
            if (isMounted) {
              setLoadError(true);
              setIsLoading(false);
            }
            return;
          }
        }
        
        const blob = await response.blob();
        if (isMounted) {
          const u = URL.createObjectURL(blob);
          setBlobUrl(u);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching PDF document:', err);
        if (isMounted) {
          setLoadError(true);
          setIsLoading(false);
        }
      }
    };
    
    fetchPdfBlob();
    
    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [fullUrl, safeUrl, isPDF]);

  const handleManualDownload = async () => {
    try {
      setIsDownloading(true);
      const filename = title || 'document';
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(fullUrl)}&filename=${encodeURIComponent(filename)}`;
      window.location.href = proxyUrl;
    } catch (err) {
      console.error('Manual download error:', err);
      window.open(fullUrl, '_blank');
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  const renderViewer = () => {
    if (!safeUrl) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-amber-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">No Physical File Attached</h3>
                  <p className="text-sm text-amber-700 mt-0.5">Placeholder Metadata Entry</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8 space-y-6">
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Document File Pending</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This case document entry (&quot;{title}&quot;) was recorded in the database, but no physical PDF or image file has been uploaded to it yet.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Document Title:</span>
                  <span className="font-semibold text-gray-900">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-amber-600 font-semibold">Pending File Upload</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  Return to Case Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show permission denied error
    if (loadError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-8 py-6 border-b border-red-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Access Restricted</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Document verification required</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Permission Denied</p>
                    <p className="text-sm text-red-700 mt-1">
                      You do not have permission to access this document. This file may be restricted to specific users or roles.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-bold text-gray-900">Document Information</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document Name:</span>
                    <span className="font-semibold text-gray-900">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Type:</span>
                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded uppercase">{extension || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  Return to Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full p-4 bg-gray-100/50">
          <img 
            src={fullUrl} 
            alt={title} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-xl animate-in zoom-in-95 duration-300"
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    if (isText) {
      return (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                <p className="mt-3 text-sm text-gray-600 font-medium">Loading document...</p>
              </div>
            </div>
          )}
          <iframe
            src={fullUrl}
            className="w-full h-full border-none rounded-2xl bg-white"
            title={title}
            sandbox="allow-same-origin"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </>
      );
    }

    if (isPDF) {
      let pdfUrl = blobUrl || fullUrl;
      if (pdfUrl && !pdfUrl.includes('#')) {
        pdfUrl = `${pdfUrl}#view=FitH&pagemode=thumbs`;
      }
      return (
        <div className="w-full h-full relative min-h-[85vh]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                <p className="mt-3 text-sm text-gray-600 font-medium">Loading PDF document...</p>
              </div>
            </div>
          )}
          {!isLoading && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none rounded-2xl shadow-inner"
              title={title}
              style={{ minHeight: 'calc(100vh - 180px)', height: '100%', width: '100%' }}
            />
          )}
        </div>
      );
    }

    if (isOffice) {
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
      return (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                <p className="mt-3 text-sm text-gray-600 font-medium">Loading office document...</p>
              </div>
            </div>
          )}
          <iframe
            src={officeUrl}
            className="w-full h-full border-none rounded-2xl bg-white"
            title={title}
            style={{ minHeight: 'calc(100vh - 180px)', height: '100%', width: '100%' }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </>
      );
    }

    // UNSUPPORTED DOCUMENT FORMAT (e.g. .dmg, .zip, .rar, .bin, .tar, etc.)
    // Prompts user before downloading instead of triggering an automatic background download
    const formatName = extension ? extension.toUpperCase() : 'NON-PREVIEWABLE';

    return (
      <div className="flex items-center justify-center min-h-[500px] h-full p-6 bg-slate-50/50">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center animate-in zoom-in-95 duration-300 space-y-6">
          
          {/* Icon Badge */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 rounded-3xl flex items-center justify-center shadow-inner">
              <FileArchive className="w-10 h-10 text-indigo-600" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white rounded-lg shadow">
              {formatName}
            </span>
          </div>

          {/* Titles */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Preview Not Supported
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Files with extension <span className="font-bold text-slate-800">.{extension || 'file'}</span> cannot be viewed inline in the browser.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Document:</span>
              <span className="font-bold text-slate-800 truncate max-w-[240px]">{title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Original Format:</span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                .{formatName}
              </span>
            </div>
          </div>

          {/* Question / Prompt */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-amber-900 font-medium text-left">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Do you wish to download and save this file to your computer?</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleManualDownload}
              disabled={isDownloading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0e2340] text-white text-xs font-bold hover:opacity-90 shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? 'Downloading...' : `Download ${formatName}`}
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex-1 relative bg-white overflow-auto w-full min-h-[calc(100vh-180px)]">
        {renderViewer()}
      </div>
    </div>
  );
}
