'use client';

import { FileText, Image as ImageIcon, ExternalLink, X, Loader2, ShieldAlert, Lock, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useState, useEffect } from 'react';

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose?: () => void;
}

export default function DocumentViewer({ url, title, onClose }: DocumentViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const extension = url.split('.').pop()?.split('?')[0].toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  const isPDF = extension === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '');
  const isText = ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension || '');
  
  // Check if URL is a document ID path (no extension) - assume it could be any file type
  const isDocumentPath = !extension || extension.length > 10 || url.includes('/documents/');

  // Helper to get the actual file URL (handling relative paths)
  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    const baseUrl = API_BASE_URL || 'https://antlegal.anthemgt.com';
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  };

  const fullUrl = getFullUrl(url);

  // Fetch PDF as blob to avoid CORS issues
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fullUrl, { 
          method: 'GET',
          credentials: 'include'
        });
        
        // Check if response is HTML error page (permission denied)
        const contentType = response.headers.get('content-type');
        if (response.status === 403 || response.status === 401) {
          setLoadError(true);
          setIsLoading(false);
          return;
        }
        
        // If we got HTML response, check if it's an error page
        if (contentType?.includes('text/html')) {
          const text = await response.text();
          if (text.includes('permission') || text.includes('Permission') || text.includes('not have permission') || text.includes('Alert:')) {
            setLoadError(true);
            setIsLoading(false);
            return;
          }
        }
        
        // For PDFs, create a blob URL
        if (isPDF || isDocumentPath) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching document:', err);
        setLoadError(true);
        setIsLoading(false);
      }
    };
    
    // Fetch PDFs as blobs to avoid CORS issues
    if (isPDF || isDocumentPath) {
      fetchDocument();
    } else {
      setIsLoading(false);
    }
    
    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [fullUrl, isPDF, isDocumentPath]);

  const renderViewer = () => {
    // Show permission denied error
    if (loadError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header with icon */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-8 py-6 border-b border-red-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Access Restricted</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Document verification required</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-6">
              {/* Alert message */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-5">
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

              {/* Document info */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
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
                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded uppercase">{extension}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold">
                      <Lock className="w-3 h-3" />
                      Restricted Access
                    </span>
                  </div>
                </div>
              </div>

              {/* Possible reasons */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900">Possible Reasons:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Document is assigned to a different case or client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Your role does not have viewing permissions for this document type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Document has been marked as confidential or restricted</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  Return to Library
                </button>
                <button
                  onClick={() => window.location.href = 'mailto:support@antlegal.com?subject=Document Access Request'}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#0e2340] text-white text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg"
                >
                  Request Access
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
            className="max-w-full max-h-full object-contain rounded-lg shadow-xl animate-in zoom-in-95 duration-300"
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    if (isText) {
      // For text files, use iframe with sandbox to display content
      // This avoids CORS issues when fetching from production
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
            className="w-full h-full border-none rounded-lg bg-white"
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

    if (isPDF || isDocumentPath) {
      const pdfUrl = blobUrl || fullUrl;
      return (
        <div className="w-full h-full relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                <p className="mt-3 text-sm text-gray-600 font-medium">Loading document...</p>
              </div>
            </div>
          )}
          {!isLoading && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none"
              title={title}
              style={{ minHeight: '600px' }}
            />
          )}
        </div>
      );
    }

    if (isOffice) {
      // Using Microsoft Office Viewer for docx/xlsx/pptx
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
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
            src={officeUrl}
            className="w-full h-full border-none rounded-lg bg-white"
            title={title}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4 bg-white">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Preview not available</h3>
          <p className="text-sm text-gray-500 mt-1">This file type ({extension}) cannot be previewed directly.</p>
        </div>
        <div className="flex gap-3 pt-4">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0e2340] text-white text-sm font-bold hover:opacity-90 transition-all shadow-md"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <div className="flex-1 relative bg-white overflow-auto">
        {renderViewer()}
      </div>
    </div>
  );
}
