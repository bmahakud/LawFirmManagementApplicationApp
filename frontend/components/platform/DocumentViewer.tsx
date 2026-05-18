'use client';

import { FileText, Image as ImageIcon, FileCode, Download, ExternalLink, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface DocumentViewerProps {
  url: string;
  title: string;
  onClose?: () => void;
}

export default function DocumentViewer({ url, title, onClose }: DocumentViewerProps) {
  const extension = url.split('.').pop()?.split('?')[0].toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  const isPDF = extension === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '');

  // Helper to get the actual file URL (handling relative paths)
  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL || 'https://antlegal.anthemgt.com';
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  };

  const fullUrl = getFullUrl(url);

  const renderViewer = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full p-4 bg-gray-100/50">
          <img src={fullUrl} alt={title} className="max-w-full max-h-full object-contain rounded-lg shadow-xl animate-in zoom-in-95 duration-300" />
        </div>
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={`${fullUrl}#view=FitH`}
          className="w-full h-full border-none rounded-lg"
          title={title}
        />
      );
    }

    if (isOffice) {
      // Using Microsoft Office Viewer for docx/xlsx/pptx
      // Note: This requires the URL to be publicly accessible.
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
      return (
        <iframe
          src={officeUrl}
          className="w-full h-full border-none rounded-lg bg-white"
          title={title}
        />
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
    <div className="flex flex-col h-full min-h-[600px] bg-[#f8f9fa] rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gray-50 rounded-lg">
            {isImage ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-gray-400" />}
          </div>
          <h2 className="text-sm font-bold text-gray-900 truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-[#0e2340]"
            title="Open original in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        {renderViewer()}
      </div>
    </div>
  );
}
