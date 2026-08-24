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
  format: 'FORM' | 'PDF' | 'PHOTO' | 'DOC';
  sequence: number;
  created_at: string;
  date?: string;
  order_index?: number;
};

interface ReorderFilingPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle?: string;
  accent?: string;
  onReordered?: () => void;
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
        setItems(Array.isArray(data) ? data : []);
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
    setItems(updated);
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
          sequence: index + 1
        }))
      };

      const res = await customFetch(API.DOCUMENTS.REORDER_FILING_PACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Filing index reordered and Master PDF recompiled!');
        if (onReordered) onReordered();
        onClose();
      } else {
        const data = await res.json();
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-200"
              style={{ backgroundColor: accent }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Reorder Document Filing Index
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {caseTitle ? `Case: ${caseTitle}` : 'Adjust document sequence and Table of Contents order'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Instructions & List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-600 shrink-0 text-sm">💡</span>
            <div>
              <span className="font-bold">How to move:</span> Use the <span className="font-semibold underline">dropdown position number</span> (e.g. change 4 to 2), click the <span className="font-semibold">⬆️ / ⬇️ arrow buttons</span>, or drag the handle to adjust sequence. The compiled Master PDF will regenerate with this exact Table of Contents.
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500 mb-3" />
              <p className="text-sm font-medium">Loading case filing documents...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No documents found in this case yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload case files or generate court forms first.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const isForm = item.format === 'FORM';
                const isPhoto = item.format === 'PHOTO';
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    className="group flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all select-none"
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-1">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Position Selector Dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No.</span>
                      <select
                        value={idx + 1}
                        onChange={(e) => moveItem(idx, Number(e.target.value) - 1)}
                        className="w-12 h-8 font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-center cursor-pointer border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      >
                        {items.map((_, posIdx) => (
                          <option key={posIdx + 1} value={posIdx + 1}>
                            {posIdx + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Icon & Details */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs bg-slate-800">
                      {isForm ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      ) : isPhoto ? (
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-sky-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isForm 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isPhoto 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {item.type_display || item.format}
                        </span>
                        {item.date && (
                          <span className="text-[11px] text-slate-400">
                            {item.date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Move Up / Down Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, idx - 1)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, idx + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchItems}
              disabled={loading || saving}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reset Order
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || items.length === 0}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
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
