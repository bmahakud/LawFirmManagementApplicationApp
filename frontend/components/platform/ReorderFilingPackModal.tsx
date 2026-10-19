'use client';

import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  X, ArrowUp, ArrowDown, GripVertical, Check, Loader2, 
  FileText, Image as ImageIcon, FileSpreadsheet, RefreshCw, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export type FilingItem = {
  id: string;
  type: 'court_form' | 'document';
  title: string;
  type_display: string;
  format: 'FORM' | 'PDF' | 'PHOTO' | 'DOC' | string;
  sequence: number;
  annexure?: string;
  created_at: string;
  date?: string;
  order_index?: number;
  page_count?: number;
  start_page?: number;
  end_page?: number;
};

export function computeRunningPageRanges(rawItems: FilingItem[]): FilingItem[] {
  const totalItems = rawItems.length;
  // If rawItems already has an existing start_page for the first document, preserve that exact cover page count
  const existingCoverPages = (rawItems.length > 0 && typeof rawItems[0].start_page === 'number' && rawItems[0].start_page > 1)
    ? rawItems[0].start_page - 1
    : null;
  const coverPageCount = existingCoverPages !== null ? existingCoverPages : (totalItems <= 10 ? 1 : (totalItems <= 25 ? 2 : 3));
  let currentPage = coverPageCount + 1;

  return rawItems.map((item, index) => {
    const pCount = Math.max(1, item.page_count || 1);
    const start = currentPage;
    const end = start + pCount - 1;
    currentPage += pCount;
    return {
      ...item,
      order_index: index + 1,
      page_count: pCount,
      start_page: start,
      end_page: end,
    };
  });
}

interface ReorderFilingPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle?: string;
  accent?: string;
  onReordered?: (masterDoc?: any) => void;
}

export default function ReorderFilingPackModal({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  accent = '#4a1c40',
  onReordered
}: ReorderFilingPackModalProps) {
  const [items, setItems] = useState<FilingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && caseId) {
      fetchItems();
    }
  }, [isOpen, caseId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await customFetch(API.DOCUMENTS.FILING_PACK_ITEMS(caseId));
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setItems(computeRunningPageRanges(list));
      } else {
        toast.error('Failed to load case filing items.');
      }
    } catch (err) {
      console.error('Error fetching filing items:', err);
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(computeRunningPageRanges(updated));
  };

  const handleAnnexureChange = (idx: number, val: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], annexure: val };
    setItems(updated);
  };

  const handleAutoNumberAnnexures = () => {
    let num = 1;
    const updated = items.map((item) => {
      const tLower = (item.title || '').toLowerCase();
      const isCourtPleading =
        item.type === 'court_form' ||
        tLower.includes('synopsis') ||
        tLower.includes('list of dates') ||
        tLower.includes('dates and events') ||
        tLower.includes('petition') ||
        tLower.includes('vakalatnama');
      if (isCourtPleading) {
        return { ...item, annexure: '' };
      }
      const itemWithAnn = { ...item, annexure: String(num) };
      num++;
      return itemWithAnn;
    });
    setItems(updated);
    toast.success('Assigned sequential annexures (1, 2, 3...) to evidence documents');
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    moveItem(draggedIdx, idx);
    setDraggedIdx(idx);
  };

  const handleSave = async () => {
    if (!items.length) return;
    try {
      setSaving(true);
      const payload = {
        case_id: caseId,
        ordered_items: items.map((item, index) => ({
          id: item.id,
          type: item.type,
          page_count: item.page_count || 1,
          sequence: index + 1,
          annexure: item.annexure || ''
        }))
      };

      const res = await customFetch(API.DOCUMENTS.REORDER_FILING_PACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const masterDoc = data.master_document;
        const oldManifest = data.old_manifest || [];
        const newManifest = data.new_manifest || [];
        const pageMapping = data.page_mapping || {};
        const pageMappingId = data.page_mapping_id || null;
        const masterUrl = masterDoc?.file_url || null;
        const updatedAt = data.updated_at || masterDoc?.updated_at || new Date().toISOString();

        // Dispatch window event so DocuMind / LiquidText receives immediate notification
        if (typeof window !== 'undefined') {
          const detail = {
            caseId,
            oldManifest,
            newManifest,
            pageMapping,
            pageMappingId,
            masterUrl,
            updatedAt,
            timestamp: Date.now()
          };
          window.dispatchEvent(new CustomEvent('documind:filing-pack-reordered', { detail }));
          try {
            localStorage.setItem(`filing_pack_reordered_${caseId}`, JSON.stringify(detail));
            localStorage.setItem(`documind_last_master_updated_${caseId}`, updatedAt);
          } catch {}
        }

        toast.success('Filing index reordered and Master PDF recompiled!');
        if (onReordered) onReordered(masterDoc);
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || 'Failed to save reordered filing pack.');
      }
    } catch (err) {
      console.error('Error saving reordered items:', err);
      toast.error('Network error saving reordered items.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const totalPages = items.reduce((sum, item) => sum + (item.page_count || 1), 0);
  const annexureCount = items.filter(item => (item.annexure || '').trim() !== '').length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl xl:max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[920px] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-200 shrink-0"
              style={{ backgroundColor: accent }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Reorder Filing Index & Annexures
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {items.length} {items.length === 1 ? 'Document' : 'Documents'}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  {totalPages} Total Pages
                </span>
                {annexureCount > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                    {annexureCount} {annexureCount === 1 ? 'Annexure' : 'Annexures'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {caseTitle ? `Case: ${caseTitle}` : 'Adjust filing sequence, assign Annexure numbers, and recompile Master PDF'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Instructions & List */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4">
          
          {/* Informational Guidance Banner */}
          <div className="bg-gradient-to-r from-amber-50/90 to-amber-50/40 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">🏛️</span>
              <div className="leading-relaxed">
                <span className="font-bold text-amber-900">High Court Filing Order:</span> Court forms (Synopsis, List of Dates, Writ Petition, Vakalatnama) appear first with <span className="font-bold underline">blank annexures</span>. Evidentiary documents have assigned <span className="font-bold underline">Annexure labels</span> (e.g. <b>1</b>, <b>2 series</b>, <b>3</b>). Annexures remain permanent with each file when dragged.
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoNumberAnnexures}
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-xs border border-amber-300 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span>⚡</span> Auto-Number Annexures (1, 2, 3...)
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-9 h-9 animate-spin text-slate-500 mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading case filing documents...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-14 h-14 mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">No documents found in this case yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload case files or draft court forms first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table Column Headers */}
              <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="w-24 shrink-0 flex items-center gap-1.5 pl-1">
                  <span>Order</span>
                </div>
                <div className="flex-1 min-w-[240px]">
                  <span>Document Details</span>
                </div>
                <div className="w-36 shrink-0 text-center">
                  <span>Court Annexure</span>
                </div>
                <div className="w-48 shrink-0 text-center">
                  <span>Master Index Pages</span>
                </div>
                <div className="w-20 shrink-0 text-right pr-2">
                  <span>Move</span>
                </div>
              </div>

              {/* Items List */}
              {items.map((item, idx) => {
                const isForm = item.format === 'FORM';
                const isPhoto = item.format === 'PHOTO';
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3.5 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all select-none"
                  >
                    {/* 1. Drag Handle & Position Dropdown */}
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-1 rounded-md hover:bg-slate-100 transition-colors">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <select
                        value={idx + 1}
                        onChange={(e) => moveItem(idx, Number(e.target.value) - 1)}
                        className="w-14 h-9 font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-center cursor-pointer border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        title="Change Position"
                      >
                        {items.map((_, posIdx) => (
                          <option key={posIdx + 1} value={posIdx + 1}>
                            #{posIdx + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Document Icon & Full Title / Details */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-[240px]">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs bg-slate-800 shadow-2xs">
                        {isForm ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        ) : isPhoto ? (
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-sky-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isForm 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : isPhoto 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-sky-50 text-sky-800 border border-sky-200'
                          }`}>
                            {item.type_display || item.format}
                          </span>
                          {item.date && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {item.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Annexure Input Field */}
                    <div className="w-36 shrink-0 flex flex-col items-center justify-center">
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={item.annexure || ''}
                          onChange={(e) => handleAnnexureChange(idx, e.target.value)}
                          placeholder="e.g. 1, 2 series"
                          className="w-full h-9 px-3 text-xs font-bold text-center bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 placeholder:font-normal transition-all"
                          title="Court Annexure label (e.g. 1, 2 series, 3, or leave blank for court forms)"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
                        {item.annexure ? 'Assigned' : 'Blank (Form)'}
                      </span>
                    </div>

                    {/* 4. Page Range Display */}
                    <div className="w-48 shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                      <span className="text-xs font-black text-slate-900 tracking-tight font-mono">
                        {item.start_page === item.end_page ? (
                          `Page ${item.start_page}`
                        ) : (
                          `Pages ${item.start_page} – ${item.end_page}`
                        )}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                        {item.page_count} {item.page_count === 1 ? 'page' : 'pages'}
                      </span>
                    </div>

                    {/* 5. Move Up / Down Buttons */}
                    <div className="w-20 shrink-0 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, idx - 1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-25 disabled:pointer-events-none transition-colors flex items-center justify-center"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, idx + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-25 disabled:pointer-events-none transition-colors flex items-center justify-center"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="text-xs text-slate-500 hidden md:block">
            Page numbers continuously synchronize with the <b>High Court Index</b> on Page 1 of the Master PDF.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={fetchItems}
              disabled={loading || saving}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || items.length === 0}
              className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Recompiling Master PDF...' : 'Save & Recompile PDF'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
