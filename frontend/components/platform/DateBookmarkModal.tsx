'use client';

import { useState, useEffect, useMemo } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  X, Calendar, Bookmark, Check, Loader2, 
  FileText, FileSpreadsheet, Search, RotateCcw, 
  Layers, FolderPlus, Folder, Sparkles, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export type FilingPackItem = {
  id: string;
  type: 'court_form' | 'document';
  title: string;
  type_display: string;
  format: 'FORM' | 'PDF' | 'PHOTO' | 'DOC' | string;
  sequence: number;
  annexure?: string;
  created_at: string;
  date?: string;
  document_date?: string;
  bookmark_group?: string;
  page_count?: number;
  start_page?: number;
  end_page?: number;
};

interface DateBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle?: string;
  accent?: string;
  preselectedItemId?: string;
  preselectedDateGroup?: string;
  onSuccess?: (result?: any) => void;
}

export default function DateBookmarkModal({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  accent = '#4a1c40',
  preselectedItemId,
  preselectedDateGroup,
  onSuccess
}: DateBookmarkModalProps) {
  const [items, setItems] = useState<FilingPackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected date & label
  const [documentDate, setDocumentDate] = useState('');
  const [bookmarkGroup, setBookmarkGroup] = useState('');
  
  // Selected items to assign
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load items when modal opens
  useEffect(() => {
    if (isOpen && caseId) {
      fetchItems();
    }
  }, [isOpen, caseId]);

  // Handle pre-selections
  useEffect(() => {
    if (preselectedItemId) {
      setSelectedIds(new Set([preselectedItemId]));
    }
    if (preselectedDateGroup) {
      // Strip leading calendar emoji if present for editing
      const cleanGroup = preselectedDateGroup.replace(/^📅\s*/, '').trim();
      setBookmarkGroup(cleanGroup);

      // Check if it's in format "Date: DD/MM/YYYY"
      const dateMatch = cleanGroup.match(/Date:\s*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/i);
      if (dateMatch) {
        const [, d, m, y] = dateMatch;
        setDocumentDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      }
    }
  }, [preselectedItemId, preselectedDateGroup]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await customFetch(API.DOCUMENTS.FILING_PACK_ITEMS(caseId));
      if (res.ok) {
        const data = await res.json();
        const list: FilingPackItem[] = Array.isArray(data) ? data : [];
        setItems(list);

        // If preselectedItemId was passed, populate its existing date/group
        if (preselectedItemId) {
          const found = list.find((it) => it.id === preselectedItemId);
          if (found) {
            if (found.document_date) {
              setDocumentDate(found.document_date.substring(0, 10));
            }
            if (found.bookmark_group) {
              setBookmarkGroup(found.bookmark_group.replace(/^📅\s*/, '').trim());
            }
          }
        }
      } else {
        toast.error('Failed to load filing pack documents.');
      }
    } catch (err) {
      console.error('Error fetching filing items:', err);
      toast.error('Could not connect to document server.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique existing groups
  const existingGroups = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      const bg = (it.bookmark_group || '').trim();
      if (bg) set.add(bg.replace(/^📅\s*/, '').trim());
    });
    return Array.from(set);
  }, [items]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (it) =>
        it.title?.toLowerCase().includes(q) ||
        it.annexure?.toLowerCase().includes(q) ||
        it.bookmark_group?.toLowerCase().includes(q) ||
        it.document_date?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((it) => it.id)));
    }
  };

  // Helper to format date as DD/MM/YYYY
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return dStr;
  };

  // Quick Preset: Today
  const handleSetToday = () => {
    const today = new Date().toISOString().substring(0, 10);
    setDocumentDate(today);
    if (!bookmarkGroup) {
      setBookmarkGroup(`Date: ${formatDisplayDate(today)}`);
    }
  };

  // Pick an existing group
  const handleSelectExistingGroup = (group: string) => {
    setBookmarkGroup(group);
    const dateMatch = group.match(/Date:\s*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/i);
    if (dateMatch) {
      const [, d, m, y] = dateMatch;
      setDocumentDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
    // Automatically preselect all items that currently belong to this group
    const matchingIds = items
      .filter((it) => (it.bookmark_group || '').replace(/^📅\s*/, '').trim() === group)
      .map((it) => it.id);
    if (matchingIds.length > 0) {
      setSelectedIds(new Set(matchingIds));
    }
  };

  // Save changes
  // Save changes (normal save, reset to auto, or set to NO sub-bookmark)
  const handleSave = async (mode: 'save' | 'reset' | 'none' = 'save') => {
    if (!selectedIds.size) {
      toast.error('Please select at least one document.');
      return;
    }

    try {
      setSaving(true);
      let targetGroup = '';
      if (mode === 'save') {
        targetGroup = bookmarkGroup.trim() || (documentDate ? `Date: ${formatDisplayDate(documentDate)}` : '');
      } else if (mode === 'none') {
        targetGroup = 'NONE';
      } else if (mode === 'reset') {
        targetGroup = '';
      }
      const targetDate = mode === 'save' ? (documentDate || null) : null;

      const payload = {
        case_id: caseId,
        bookmark_group: targetGroup,
        document_date: targetDate,
        item_ids: Array.from(selectedIds)
      };

      const res = await customFetch(API.DOCUMENTS.SET_BOOKMARK_GROUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          mode === 'none'
            ? 'Documents moved directly under Case Filings (No Sub-Bookmark)!'
            : mode === 'reset'
              ? 'Documents reset to automatic date grouping!'
              : `Sub-bookmark "${targetGroup || 'Date'}" saved! Master PDF updated.`
        );

        // Dispatch sync event for PDF viewer and case workspace
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('documind:filing-pack-reordered', {
              detail: {
                caseId,
                bookmark_group: targetGroup,
                updatedAt: new Date().toISOString(),
                timestamp: Date.now()
              }
            })
          );
        }

        if (onSuccess) onSuccess(data);
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || 'Failed to update sub-bookmarks.');
      }
    } catch (err) {
      console.error('Error setting bookmark group:', err);
      toast.error('Network error updating bookmarks.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[850px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: accent }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Date Sub-Bookmarks Organizer
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  Master PDF Bookmarks
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {caseTitle ? `Case: ${caseTitle}` : 'Group filings and court orders by date to form sub-bookmarks in the Master PDF.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/40">
          
          {/* Card 1: Sub-Bookmark Setup */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                1. Define Date or Sub-Bookmark Name
              </span>
              <button
                type="button"
                onClick={handleSetToday}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                Use Today&apos;s Date
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Court Order / Filing Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDocumentDate(val);
                      if (!bookmarkGroup || bookmarkGroup.startsWith('Date:')) {
                        setBookmarkGroup(val ? `Date: ${formatDisplayDate(val)}` : '');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select the exact court order or hearing date.
                </span>
              </div>

              {/* Bookmark Group Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sub-Bookmark Label in PDF
                </label>
                <input
                  type="text"
                  placeholder="e.g. Order Dated 07.12.2024 or Hearing 15.11.2026"
                  value={bookmarkGroup}
                  onChange={(e) => setBookmarkGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Displays in the PDF bookmarks hierarchy under &quot;📁 Case Filings&quot;.
                </span>
              </div>
            </div>

            {/* Existing Sub-Bookmark Groups Pills */}
            {existingGroups.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">
                  Existing Date Sub-Bookmarks in this Case (Click to select):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {existingGroups.map((grp) => {
                    const isSelected = bookmarkGroup.trim() === grp.trim();
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleSelectExistingGroup(grp)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{grp}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Select Documents to Assign */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  2. Select Documents to Store Under this Sub-Bookmark
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {selectedIds.size} of {items.length} documents selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  {selectedIds.size === filteredItems.length && filteredItems.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs font-semibold">Loading case filing pack...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xs font-semibold">No documents found matching filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl">
                {filteredItems.map((item, idx) => {
                  const isChecked = selectedIds.has(item.id);
                  const isCourtForm = item.type === 'court_form';
                  const currentGroup = (item.bookmark_group || '').replace(/^📅\s*/, '').trim();

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-center gap-3 p-3 transition-colors cursor-pointer select-none ${
                        isChecked
                          ? 'bg-indigo-50/50 hover:bg-indigo-50/70'
                          : 'hover:bg-slate-50 bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(item.id);
                        }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 bg-white text-transparent hover:border-indigo-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* Sequence Badge */}
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>

                      {/* Icon */}
                      {isCourtForm ? (
                        <FileSpreadsheet className="w-4 h-4 text-violet-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </span>
                          {item.annexure && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              Annexure: {item.annexure}
                            </span>
                          )}
                          {item.page_count && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.page_count} {item.page_count === 1 ? 'page' : 'pages'})
                            </span>
                          )}
                        </div>

                        {/* Current Bookmark Status */}
                        <div className="flex items-center gap-2 mt-1">
                          {currentGroup ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-md">
                              <Calendar className="w-2.5 h-2.5" />
                              Folder: {currentGroup}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Auto Date ({item.created_at ? formatDisplayDate(item.created_at.substring(0, 10)) : 'Pending'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('reset')}
              disabled={saving || !selectedIds.size}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-40 transition-colors"
              title="Reset selected documents to auto-detected dates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Auto Date
            </button>
            <button
              type="button"
              onClick={() => handleSave('none')}
              disabled={saving || !selectedIds.size}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 disabled:opacity-40 transition-colors"
              title="Remove from any sub-bookmark and place directly under Case Filings root"
            >
              <Folder className="w-3.5 h-3.5 text-amber-600" />
              No Sub-Bookmark (Direct)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('save')}
              disabled={saving || !selectedIds.size}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Master PDF...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Sub-Bookmark ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

