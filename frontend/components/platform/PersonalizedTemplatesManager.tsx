'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  FileText, Plus, Search, Eye, Download, Trash2, Copy, Sparkles,
  CheckCircle, ArrowLeft, RefreshCw, Layers, Check, FileCheck,
  AlertCircle, AlertTriangle, ExternalLink, ShieldCheck, Tag, HelpCircle,
  ChevronLeft, ChevronRight, Clock, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  FileUp, Upload, ChevronUp, ChevronDown, ArrowUp, ArrowDown, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export type PersonalizedTemplateItem = {
  id: string;
  case?: string;
  case_number?: string;
  case_title?: string;
  client?: string;
  client_name?: string;
  firm?: string;
  title: string;
  template_type: string;
  custom_type_name?: string;
  type_display: string;
  description?: string;
  content: string;
  fields?: any[];
  field_values?: Record<string, any>;
  status: string;
  is_added_to_all_docs: boolean;
  generated_document?: string;
  generated_document_url?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
};

type Props = {
  caseId: string;
  clientId?: string;
  caseData?: any;
  role?: string;
  accent?: string;
  onAddedToAllDocuments?: () => void;
};

// Standard starter presets for 1-click initialization
const STARTER_PRESETS = [
  {
    id: 'blank',
    title: 'Blank Document',
    type: 'custom',
    custom_type_name: 'Custom Template',
    description: 'Start from an empty canvas with standard legal layout',
    content: `IN THE COURT OF {{court_name}}
CASE NO: {{case_number}}

IN THE MATTER OF:
{{client_name}} ... PETITIONER / APPLICANT

VERSUS

... OPPOSITE PARTY / RESPONDENT

APPLICATION UNDER PROVISIONS OF LAW

MOST RESPECTFULLY SHOWETH:
1. That the Applicant has filed the present matter before this Hon'ble Court.
2. That the facts and circumstances of the case are as set out hereunder.
3. That this application is made bonafide and in the interest of justice.

PRAYER:
Wherefore, in light of the above facts, it is most respectfully prayed that this Hon'ble Court may be pleased to:
a) Grant appropriate relief as prayed for;
b) Pass any other order(s) as this Hon'ble Court may deem fit.

DATED: {{today}}
PLACE: Bhubaneswar

ADVOCATE FOR APPLICANT
{{advocate_name}}`
  },
  {
    id: 'affidavit',
    title: 'General Supporting Affidavit',
    type: 'affidavit',
    custom_type_name: 'Affidavit',
    description: 'Standard sworn affidavit in support of petition or application',
    content: `BEFORE THE HON'BLE COURT OF {{court_name}}
IN CASE NO: {{case_number}}

AFFIDAVIT

I, {{client_name}}, aged about ___ years, resident of _________________________________, do hereby solemnly affirm and state on oath as under:

1. That I am the Petitioner/Deponent in the above-mentioned case and am fully conversant with the facts of the case.
2. That the contents of the accompanying petition/application have been drafted under my instructions and the facts stated therein are true and correct to my personal knowledge.
3. That no part of it is false and nothing material has been concealed therefrom.
4. That the annexures attached herewith are true copies of their respective originals.

DEPONENT

VERIFICATION:
Verified at Bhubaneswar on this {{today}}, that the contents of the above affidavit are true and correct to the best of my knowledge, and no part of it is false.

DEPONENT
Identified by me:
{{advocate_name}} (Advocate)`
  },
  {
    id: 'legal_notice',
    title: 'Formal Legal Demand Notice',
    type: 'legal_notice',
    custom_type_name: 'Legal Notice',
    description: 'Statutory demand notice issued under advocate instructions',
    content: `SPEED POST / REGISTERED A.D.

To,
[Recipient / Opposite Party Name]
[Address Line 1]
[Address Line 2]

SUBJECT: LEGAL NOTICE FOR AND ON BEHALF OF MY CLIENT {{client_name}}

Sir / Madam,

Under instructions from and on behalf of my client {{client_name}} (hereinafter referred to as "my Client"), I do hereby serve upon you this Legal Notice:

1. That my Client is a law-abiding citizen having legitimate legal claims and rights.
2. That pursuant to agreed terms and applicable laws, you were legally obligated to perform your commitments, but you have failed and neglected to do so.
3. That due to your unilateral acts and omission, my Client has suffered significant hardship and monetary damages.

NOW THEREFORE, through this legal notice, you are hereby called upon to comply with the demands within a period of 15 (fifteen) days from the receipt of this notice, failing which my Client shall be constrained to initiate appropriate civil and criminal proceedings against you in the competent Court of {{court_name}}, at your sole risk, cost, and consequences.

A copy of this notice is retained in my office for future legal reference.

Date: {{today}}

{{advocate_name}}
Advocate for the Client`
  },
  {
    id: 'power_of_attorney',
    title: 'Special Power of Attorney',
    type: 'power_of_attorney',
    custom_type_name: 'Power of Attorney',
    description: 'Authorization deed for case representation and signing',
    content: `SPECIAL POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS that I, {{client_name}}, do hereby nominate, constitute, and appoint {{advocate_name}}, Advocate, to be my true and lawful attorney in respect of Case No. {{case_number}} pending before {{court_name}}.

I hereby empower my said attorney to:
1. Appear, plead, and act on my behalf before the Court, tribunals, and authorities.
2. Present, file, verify, sign petitions, affidavits, rejoinders, and applications.
3. Receive summons, notices, documents, and copies of orders.
4. Take all necessary legal steps for the effective conduct of the aforesaid case.

AND I hereby agree that all acts, deeds, and things lawfully done by my said attorney shall be deemed to have been done by me personally.

IN WITNESS WHEREOF, I have executed this Special Power of Attorney on this {{today}}.

EXECUTANT / PRINCIPAL:
{{client_name}}

ACCEPTED:
{{advocate_name}} (Advocate)`
  },
  {
    id: 'agreement',
    title: 'Mutual Settlement / Legal Agreement',
    type: 'agreement',
    custom_type_name: 'Agreement',
    description: 'Contractual agreement outlining mutual covenants between parties',
    content: `MEMORANDUM OF AGREEMENT / SETTLEMENT

This Agreement is made and entered into on this {{today}} at Bhubaneswar:

BY AND BETWEEN:
{{client_name}} (hereinafter referred to as the "FIRST PARTY")

AND

[Second Party Name] (hereinafter referred to as the "SECOND PARTY").

WHEREAS the parties are desirous of resolving and formalizing their legal rights and obligations in relation to Case No. {{case_number}} before {{court_name}}.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:
1. The Parties acknowledge that this agreement is executed voluntarily and without any coercion or undue influence.
2. The First Party and Second Party mutually agree to adhere strictly to the terms covenants enumerated herein.
3. Any dispute arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the competent courts in {{court_name}}.

IN WITNESS WHEREOF, the parties hereto have signed this Agreement on the day and year first above written.

FIRST PARTY:                              SECOND PARTY:
{{client_name}}                           [Name]

WITNESS 1:                                WITNESS 2:
_________________________                 _________________________`
  }
];

// Dynamic visual line capacity limits per A4 page (synchronized 1-to-1 with ReportLab PDF):
// - Page 1 (with Header & Caption Box):
//     - If single/last page (includes Signature block): 26 lines (~570px)
//     - If multi-page (no signature on Page 1, fills completely to bottom): 36 lines (~790px)
// - Subsequent pages:
//     - If last page (includes Signature block): 36 lines (~790px)
//     - If middle page (fills completely to bottom): 42 lines (~920px)
export const PAGE_1_MAX_LINES = 26;
export const PAGE_N_MAX_LINES = 36;

export const getPageMaxLines = (pageIndex: number, isLastPage: boolean): number => {
  if (pageIndex === 0) {
    return isLastPage ? 26 : 36;
  }
  return isLastPage ? 36 : 42;
};

export const getPageMaxScrollHeight = (pageIndex: number, isLastPage: boolean): number => {
  if (pageIndex === 0) {
    return isLastPage ? 570 : 790;
  }
  return isLastPage ? 790 : 920;
};

/**
 * Estimates visual rendered line count taking soft wrapping into account (~76 chars/line matching A4 paper width)
 */
export const estimateVisualLines = (rawLine: string, charsPerLine = 76): number => {
  if (rawLine.length === 0) return 1;
  return Math.max(1, Math.ceil(rawLine.length / charsPerLine));
};

/**
 * Counts total visual lines in a block of text.
 */
export const countTotalVisualLines = (text: string): number => {
  if (!text) return 0;
  const rawLines = text.split('\n');
  return rawLines.reduce((acc, line) => acc + estimateVisualLines(line), 0);
};

/**
 * Splits text into [fit, overflow] based on visual line capacity.
 * Splits cleanly at paragraph or word boundaries without breaking words.
 */
export const splitTextByLineCapacity = (
  text: string,
  maxLines: number,
  charsPerLine = 76
): { fit: string; overflow: string } => {
  if (!text) return { fit: '', overflow: '' };

  const rawLines = text.split('\n');
  let currentLines = 0;
  const fitLines: string[] = [];
  const overflowLines: string[] = [];
  let isOverflowing = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const visualLines = estimateVisualLines(line, charsPerLine);

    if (!isOverflowing) {
      if (currentLines + visualLines <= maxLines) {
        fitLines.push(line);
        currentLines += visualLines;
      } else {
        // Line pushes past maxLines
        const linesRemaining = maxLines - currentLines;
        if (linesRemaining > 0 && line.length > charsPerLine) {
          const maxCharsCanFit = linesRemaining * charsPerLine;
          const spaceIdx = line.lastIndexOf(' ', maxCharsCanFit);
          if (spaceIdx > 15) {
            fitLines.push(line.substring(0, spaceIdx));
            overflowLines.push(line.substring(spaceIdx + 1));
          } else {
            overflowLines.push(line);
          }
        } else {
          overflowLines.push(line);
        }
        isOverflowing = true;
      }
    } else {
      overflowLines.push(line);
    }
  }

  return {
    fit: fitLines.join('\n'),
    overflow: overflowLines.join('\n')
  };
};

/**
 * Automatically paginates long text across A4 pages respecting line limits.
 * Synchronized 1-to-1 with backend ReportLab PDF engine:
 * - If total content fits on Page 1 with signature block (<= 36 lines): renders as 1 single page!
 * - If multi-page: Page 1 fills completely down to bottom boundary (41 lines), Page 2+ up to 46 lines (44 on last page).
 */
export const autoPaginateDocument = (text: string): string[] => {
  if (!text) return [''];

  // Strip artificial page break markers to extract the natural continuous stream of lines
  const rawContent = text.split(/\n*---PAGE_BREAK---\n*/).join('\n');
  const allLines = rawContent.split('\n');

  // Trim trailing empty lines
  while (allLines.length > 0 && allLines[allLines.length - 1].trim() === '') {
    allLines.pop();
  }
  if (allLines.length === 0) return [''];

  const estLineVisual = (l: string): number => {
    if (!l || !l.trim()) return 1;
    return Math.max(1, Math.ceil(l.length / 76));
  };

  const totalVisual = allLines.reduce((acc, l) => acc + estLineVisual(l), 0);

  // Single page check: fits comfortably on Page 1 with signature block (<= 26 lines)
  if (totalVisual <= 26) {
    return [allLines.join('\n')];
  }

  // If totalVisual is between 27 and 36 lines:
  // All lines fit comfortably on Page 1 (which holds up to 36 lines), but signature block moves to Page 2!
  if (totalVisual <= 36) {
    return [allLines.join('\n'), ''];
  }

  // Multi-page layout: Page 1 fills completely down to bottom (36 lines), Page 2+ up to 42 lines (36 on last page)
  const resultPages: string[] = [];
  let currentPageLines: string[] = [];
  let currentVisual = 0;
  let pageIdx = 0;

  let i = 0;
  while (i < allLines.length) {
    const line = allLines[i];
    const lineVisual = estLineVisual(line);

    const remainingVisual = allLines.slice(i).reduce((acc, l) => acc + estLineVisual(l), 0);
    const capWithSig = pageIdx === 0 ? 26 : 36;
    const capWithoutSig = pageIdx === 0 ? 36 : 42;

    if (currentVisual + remainingVisual <= capWithSig) {
      currentPageLines.push(...allLines.slice(i));
      resultPages.push(currentPageLines.join('\n'));
      currentPageLines = [];
      break;
    }

    if (currentVisual + lineVisual <= capWithoutSig) {
      currentPageLines.push(line);
      currentVisual += lineVisual;
      i++;
    } else {
      // Current page is full down to bottom boundary!
      if (currentPageLines.length > 0) {
        resultPages.push(currentPageLines.join('\n'));
      }
      currentPageLines = [line];
      currentVisual = lineVisual;
      pageIdx++;
      i++;
    }
  }

  if (currentPageLines.length > 0) {
    resultPages.push(currentPageLines.join('\n'));
  }

  return resultPages.length > 0 ? resultPages : [''];
};

/**
 * Maps (pageIndex, localCaret) to global character offset across continuous document stream
 */
export const getGlobalCaret = (pagesList: string[], pageIndex: number, localCaret: number): number => {
  let global = 0;
  for (let i = 0; i < pageIndex && i < pagesList.length; i++) {
    global += (pagesList[i] || '').length + 1; // +1 for boundary newline
  }
  return global + Math.max(0, Math.min(localCaret, (pagesList[pageIndex] || '').length));
};

/**
 * Maps global character offset back to a specific page and local caret
 */
export const getLocalCaret = (pagesList: string[], globalCaret: number): { pageIndex: number; localCaret: number } => {
  if (pagesList.length === 0) return { pageIndex: 0, localCaret: 0 };
  let accum = 0;
  for (let i = 0; i < pagesList.length; i++) {
    const pageLen = (pagesList[i] || '').length;
    if (globalCaret <= accum + pageLen || i === pagesList.length - 1) {
      return {
        pageIndex: i,
        localCaret: Math.max(0, Math.min(pageLen, globalCaret - accum))
      };
    }
    accum += pageLen + 1;
  }
  return { pageIndex: 0, localCaret: 0 };
};

export default function PersonalizedTemplatesManager({
  caseId,
  clientId,
  caseData,
  role = 'advocate',
  accent = '#7c3aed',
  onAddedToAllDocuments
}: Props) {
  const [templates, setTemplates] = useState<PersonalizedTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Editor modal/view state
  const [isEditing, setIsEditing] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<PersonalizedTemplateItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Snapshot to detect unsaved changes when navigating back
  const initialDataRef = useRef<{
    title: string;
    template_type: string;
    custom_type_name: string;
    description: string;
    content: string;
  }>({
    title: '',
    template_type: 'affidavit',
    custom_type_name: '',
    description: '',
    content: ''
  });

  // Editor form state
  const [formData, setFormData] = useState({
    title: '',
    template_type: 'affidavit',
    custom_type_name: '',
    description: '',
    content: ''
  });

  // Multi-page state for A4 document editing
  const [pages, setPages] = useState<string[]>(['']);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [visiblePageIndex, setVisiblePageIndex] = useState<number>(0);
  const [isSideRailCollapsed, setIsSideRailCollapsed] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const pageTextareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});
  const htmlEditorRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const caretPositionsRef = useRef<{ [key: number]: { start: number; end: number } }>({});
  const autoRebalanceDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Word document (.docx/.doc) import state & ref
  const wordFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingWord, setIsImportingWord] = useState<boolean>(false);
  // Layout Preservation is always ON — mammoth renders rich HTML per page on every .docx import
  const [importedHtmlPages, setImportedHtmlPages] = useState<string[]>([]);
  const [htmlContentRevision, setHtmlContentRevision] = useState<number>(0);
  // Signature block toggle — user-controlled via side panel (off by default)
  const [showSignatureBlock, setShowSignatureBlock] = useState<boolean>(false);

  // History stack for Undo / Redo
  type HistoryEntry = {
    pages: string[];
    content: string;
    activePageIndex: number;
    title: string;
  };
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryNavigatingRef = useRef(false);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // When a fresh import or edit load brings new HTML pages, push them into the contentEditable DOM nodes
  // (needed because the ref-based editor doesn't re-render on state changes — intentionally)
  useEffect(() => {
    if (importedHtmlPages.length === 0) return;
    importedHtmlPages.forEach((html, idx) => {
      const el = htmlEditorRefs.current[idx];
      if (el && el.innerHTML !== html) {
        el.innerHTML = html || '';
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedHtmlPages.length, htmlContentRevision]);

  const recordHistory = (
    newPages: string[],
    newContent: string,
    newPageIndex: number,
    title: string,
    immediate: boolean = false
  ) => {
    if (isHistoryNavigatingRef.current) return;

    const performRecord = () => {
      setHistory(prevHistory => {
        const sliced = historyIndex >= 0 ? prevHistory.slice(0, historyIndex + 1) : [];
        if (
          sliced.length > 0 &&
          sliced[sliced.length - 1].content === newContent &&
          sliced[sliced.length - 1].pages.join('---') === newPages.join('---') &&
          sliced[sliced.length - 1].title === title
        ) {
          return prevHistory;
        }
        const newEntry: HistoryEntry = {
          pages: [...newPages],
          content: newContent,
          activePageIndex: newPageIndex,
          title
        };
        const updated = [...sliced, newEntry];
        if (updated.length > 60) updated.shift();
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    };

    if (immediate) {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = null;
      }
      performRecord();
    } else {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
      }
      historyDebounceRef.current = setTimeout(() => {
        performRecord();
      }, 350);
    }
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const targetIndex = historyIndex - 1;
    const entry = history[targetIndex];
    if (!entry) return;

    isHistoryNavigatingRef.current = true;
    setHistoryIndex(targetIndex);
    setPages(entry.pages);
    setActivePageIndex(entry.activePageIndex);
    setFormData(prev => ({
      ...prev,
      title: entry.title !== undefined ? entry.title : prev.title,
      content: entry.content
    }));

    setTimeout(() => {
      isHistoryNavigatingRef.current = false;
      const textarea = pageTextareaRefs.current[entry.activePageIndex];
      if (textarea) {
        try {
          textarea.focus({ preventScroll: true });
        } catch (e) { }
      }
    }, 50);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || historyIndex === -1) return;
    const targetIndex = historyIndex + 1;
    const entry = history[targetIndex];
    if (!entry) return;

    isHistoryNavigatingRef.current = true;
    setHistoryIndex(targetIndex);
    setPages(entry.pages);
    setActivePageIndex(entry.activePageIndex);
    setFormData(prev => ({
      ...prev,
      title: entry.title !== undefined ? entry.title : prev.title,
      content: entry.content
    }));

    setTimeout(() => {
      isHistoryNavigatingRef.current = false;
      const textarea = pageTextareaRefs.current[entry.activePageIndex];
      if (textarea) {
        try {
          textarea.focus({ preventScroll: true });
        } catch (e) { }
      }
    }, 50);
  };

  // Keyboard shortcut listener for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z)
  useEffect(() => {
    if (!isEditing) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          e.stopPropagation();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, [isEditing, history, historyIndex]);

  // Dynamically track which page is currently in the viewport center as user scrolls ("which no of the page")
  useEffect(() => {
    if (!isEditing || pages.length === 0) return;

    const checkVisiblePage = () => {
      // Use 35% from top of viewport as active reading/editing focus line
      const focusY = window.innerHeight * 0.35;
      let bestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < pages.length; i++) {
        const el = document.getElementById(`a4-page-card-${i}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= focusY && rect.bottom >= focusY) {
            bestIndex = i;
            break;
          }
          const dist = Math.abs(rect.top - focusY);
          if (dist < minDistance) {
            minDistance = dist;
            bestIndex = i;
          }
        }
      }
      setVisiblePageIndex(bestIndex);
    };

    checkVisiblePage();
    window.addEventListener('scroll', checkVisiblePage, { passive: true });
    window.addEventListener('resize', checkVisiblePage, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkVisiblePage);
      window.removeEventListener('resize', checkVisiblePage);
    };
  }, [isEditing, pages.length]);

  // Jump to specific page with smooth scroll & focus
  const jumpToPage = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    setActivePageIndex(targetIndex);
    setVisiblePageIndex(targetIndex);

    const el = document.getElementById(`a4-page-card-${targetIndex}`);
    if (el) {
      const topOffset = 85;
      const targetY = el.getBoundingClientRect().top + window.pageYOffset - topOffset;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });

      setTimeout(() => {
        const textarea = pageTextareaRefs.current[targetIndex];
        if (textarea) {
          try {
            textarea.focus({ preventScroll: true });
          } catch (e) {
            textarea.focus();
          }
        }
      }, 350);
    }
  };

  const jumpToTop = () => jumpToPage(0);
  const jumpToEnd = () => jumpToPage(pages.length - 1);
  const jumpToPrevPage = () => jumpToPage(Math.max(0, visiblePageIndex - 1));
  const jumpToNextPage = () => jumpToPage(Math.min(pages.length - 1, visiblePageIndex + 1));

  const isAdvocateRole = role === 'advocate' || role === 'super-admin' || role === 'firm-admin' || role === 'admin';

  // Available case variables for insertion
  const caseVariables = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return [
      { key: 'client_name', label: 'Client Name', value: caseData?.client_name || caseData?.client?.full_name || 'Client' },
      { key: 'case_number', label: 'Case Number', value: caseData?.case_number || 'MURD999' },
      { key: 'court_name', label: 'Court Name', value: caseData?.court_name || caseData?.court || 'District Court' },
      { key: 'case_title', label: 'Case Title', value: caseData?.title || caseData?.case_title || 'Case Title' },
      { key: 'advocate_name', label: 'Advocate Name', value: caseData?.assigned_advocate_name || 'Advocate' },
      { key: 'today', label: 'Current Date', value: todayStr },
    ];
  }, [caseData]);

  // Helper to substitute {{var}} placeholders with real case values
  const substituteVariables = (text: string) => {
    if (!text) return '';
    let result = text;
    caseVariables.forEach(v => {
      const reg = new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, 'gi');
      result = result.replace(reg, v.value);
    });
    return result;
  };

  // Helper to split document content into A4 pages (with intelligent auto-pagination)
  const splitContentIntoPages = (text: string): string[] => {
    if (!text) return [''];
    return autoPaginateDocument(text);
  };

  // Continuous real-time document rebalancer across all A4 pages:
  // - Consolidates extra pages when text shrinks or fits on a single page (<= 36 lines)
  // - Eliminates bottom gaps by pulling words up from following pages
  // - Splits overflows cleanly across pages with smooth caret handover
  const performContinuousRebalance = (
    currentPagesList: string[],
    activePageIdx: number,
    localCaretPos?: number
  ) => {
    // Safety guard 1: If user is actively typing or editing on Page 2+ (activePageIdx > 0),
    // NEVER collapse the document to fewer pages than the active page index!
    if (activePageIdx > 0 && currentPagesList.length > activePageIdx) {
      const activeText = currentPagesList[activePageIdx] || '';
      // If the active page is empty (just created via Enter or Add Page), do not collapse!
      if (!activeText.trim()) {
        return;
      }
    }

    const fullText = currentPagesList.join('\n\n---PAGE_BREAK---\n\n');
    const repaginated = autoPaginateDocument(fullText);

    // Safety guard 2: Never delete the active page the user is currently focused on!
    if (activePageIdx >= repaginated.length) {
      return;
    }

    // If repaginated matches currentPagesList exactly, no update needed
    if (
      repaginated.length === currentPagesList.length &&
      repaginated.every((p, idx) => p === currentPagesList[idx])
    ) {
      return;
    }

    const curLocal = localCaretPos !== undefined
      ? localCaretPos
      : (caretPositionsRef.current[activePageIdx]?.start ?? (currentPagesList[activePageIdx] || '').length);

    const globalPos = getGlobalCaret(currentPagesList, activePageIdx, curLocal);
    const { pageIndex: targetPage, localCaret: targetLocalCaret } = getLocalCaret(repaginated, globalPos);

    setPages(repaginated);
    const combined = repaginated.join('\n\n---PAGE_BREAK---\n\n');
    setFormData(f => ({ ...f, content: combined }));
    recordHistory(repaginated, combined, targetPage, formData.title, false);

    // Only transfer focus if the target page actually changed (i.e. cross-page boundary handover)
    // If typing on the same page, do not steal or re-set selection to preserve native browser typing
    if (targetPage !== activePageIdx) {
      setActivePageIndex(targetPage);
      setTimeout(() => {
        const el = pageTextareaRefs.current[targetPage];
        if (el) {
          try {
            el.focus({ preventScroll: false });
            el.setSelectionRange(targetLocalCaret, targetLocalCaret);
          } catch (e) { }
        }
      }, 40);
    }
  };

  // Google Docs style continuous typing & live auto-paging:
  // 1. Instantly auto-flows to next page when text touches/exceeds page bottom boundary
  // 2. Automatically pulls text up to eliminate bottom gaps when text is deleted
  // 3. Automatically collapses extra pages into a single page when document fits
  const handlePageContentChange = (pageIndex: number, newPageContent: string, explicitCaret?: number) => {
    const isLastPage = pageIndex === pages.length - 1;
    const maxAllowedLines = getPageMaxLines(pageIndex, isLastPage);
    const currentLines = countTotalVisualLines(newPageContent);
    const currentCaret = explicitCaret !== undefined ? explicitCaret : (caretPositionsRef.current[pageIndex]?.start ?? newPageContent.length);

    // 1. ALWAYS update the current page text immediately for crisp, native 0-lag typing!
    const nextPages = [...pages];
    nextPages[pageIndex] = newPageContent;
    setPages(nextPages);

    const combined = nextPages.join('\n\n---PAGE_BREAK---\n\n');
    setFormData(f => ({ ...f, content: combined }));
    recordHistory(nextPages, combined, pageIndex, formData.title, false);

    // 2. Check if text has exceeded page bottom boundary:
    // If Page 1 alone exceeds 26 lines (signature needs its own page), or if pageIndex exceeds maxAllowedLines:
    const totalDocLines = nextPages.reduce((acc, p) => acc + countTotalVisualLines(p), 0);
    const singlePageNeedsSplit = pages.length === 1 && totalDocLines > 26;
    const pageExceedsBottom = currentLines > maxAllowedLines;

    if (singlePageNeedsSplit || pageExceedsBottom) {
      if (autoRebalanceDebounceRef.current) clearTimeout(autoRebalanceDebounceRef.current);
      performContinuousRebalance(nextPages, pageIndex, currentCaret);
      return;
    }

    // 3. Debounced silent rebalance (when text deleted / shrunk):
    // Only if there are multiple pages, to pull text up or collapse pages when idle (500ms)
    if (nextPages.length > 1) {
      if (autoRebalanceDebounceRef.current) clearTimeout(autoRebalanceDebounceRef.current);
      autoRebalanceDebounceRef.current = setTimeout(() => {
        performContinuousRebalance(nextPages, pageIndex, currentCaret);
      }, 500);
    }
  };

  // Dedicated paste handler: distributes pasted text cleanly across A4 pages without cutting off anything
  const handlePagePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, pageIndex: number) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    e.preventDefault();
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + pastedText + currentVal.substring(end);
    const newCaret = start + pastedText.length;

    const nextPages = [...pages];
    nextPages[pageIndex] = newVal;

    if (autoRebalanceDebounceRef.current) clearTimeout(autoRebalanceDebounceRef.current);
    performContinuousRebalance(nextPages, pageIndex, newCaret);
  };

  // Handle Keyboard navigation & Enter / Backspace across pages (Google Docs behavior)
  const handlePageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, pageIndex: number) => {
    const textarea = e.currentTarget;
    const isLastPage = pageIndex === pages.length - 1;
    const maxAllowedLines = getPageMaxLines(pageIndex, isLastPage);
    const maxAllowedHeight = getPageMaxScrollHeight(pageIndex, isLastPage);
    const currentLines = countTotalVisualLines(textarea.value);
    const scrollH = textarea.scrollHeight;

    // 1. Enter key: If at or reaching the bottom boundary of Page 1 (or any page):
    // Automatically transition to the next page!
    if (e.key === 'Enter') {
      const caret = textarea.selectionStart;
      const textVal = textarea.value;
      const isAtEnd = caret >= textVal.trimEnd().length;

      // Check if current lines reached capacity OR if scroll height reached bottom boundary OR if pressing Enter would push it over:
      const reachedLineLimit = currentLines >= maxAllowedLines || (currentLines + 1 >= maxAllowedLines && isAtEnd);
      const reachedHeightLimit = scrollH >= maxAllowedHeight;
      const wouldOverflow = reachedLineLimit || reachedHeightLimit;

      if (wouldOverflow) {
        e.preventDefault();
        const nextIdx = pageIndex + 1;

        if (isAtEnd) {
          // Cursor is at end of page: create / focus Page 2 at position 0
          setPages(prev => {
            const nextPages = [...prev];
            if (nextIdx >= nextPages.length) {
              nextPages.push('');
            }
            const combined = nextPages.join('\n\n---PAGE_BREAK---\n\n');
            setFormData(f => ({ ...f, content: combined }));
            recordHistory(nextPages, combined, nextIdx, formData.title, true);
            return nextPages;
          });

          setActivePageIndex(nextIdx);
          setTimeout(() => {
            const nextEl = pageTextareaRefs.current[nextIdx];
            if (nextEl) {
              try {
                nextEl.focus({ preventScroll: false });
                nextEl.setSelectionRange(0, 0);
                nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } catch (err) { }
            }
          }, 40);
        } else {
          // Cursor is in the middle of text: split cleanly at cursor position
          const textBefore = textVal.substring(0, caret);
          const textAfter = textVal.substring(textarea.selectionEnd);

          setPages(prev => {
            const nextPages = [...prev];
            nextPages[pageIndex] = textBefore;
            if (nextIdx < nextPages.length) {
              nextPages[nextIdx] = textAfter + (nextPages[nextIdx] ? '\n' + nextPages[nextIdx] : '');
            } else {
              nextPages.push(textAfter);
            }
            const combined = nextPages.join('\n\n---PAGE_BREAK---\n\n');
            setFormData(f => ({ ...f, content: combined }));
            recordHistory(nextPages, combined, nextIdx, formData.title, true);
            return nextPages;
          });

          setActivePageIndex(nextIdx);
          setTimeout(() => {
            const nextEl = pageTextareaRefs.current[nextIdx];
            if (nextEl) {
              try {
                nextEl.focus({ preventScroll: false });
                nextEl.setSelectionRange(0, 0);
                nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } catch (err) { }
            }
          }, 40);
        }
        return;
      }
    }

    // 2. Backspace key: If at start of page (selectionStart === 0) and pageIndex > 0, merge with previous page
    if (e.key === 'Backspace' && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && pageIndex > 0) {
      e.preventDefault();
      const prevIdx = pageIndex - 1;
      const prevText = pages[prevIdx] || '';
      const currText = pages[pageIndex] || '';
      const mergedText = prevText + (prevText && currText ? '\n' : '') + currText;
      const caretTarget = prevText.length + (prevText && currText ? 1 : 0);

      setPages(prev => {
        const filtered = prev.filter((_, idx) => idx !== pageIndex);
        const nextPages = filtered.length > 0 ? filtered : [''];
        nextPages[prevIdx] = mergedText;
        const combined = nextPages.join('\n\n---PAGE_BREAK---\n\n');
        setFormData(f => ({ ...f, content: combined }));
        recordHistory(nextPages, combined, prevIdx, formData.title, true);
        return nextPages;
      });

      setActivePageIndex(prevIdx);
      setTimeout(() => {
        const prevEl = pageTextareaRefs.current[prevIdx];
        if (prevEl) {
          try {
            prevEl.focus({ preventScroll: false });
            prevEl.setSelectionRange(caretTarget, caretTarget);
            prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (err) { }
        }
      }, 50);
      return;
    }

    // 3. ArrowDown key: If at the very end of text on this page, jump cursor to start of next page
    if (e.key === 'ArrowDown' && textarea.selectionStart === textarea.value.length && pageIndex < pages.length - 1) {
      e.preventDefault();
      const nextIdx = pageIndex + 1;
      setActivePageIndex(nextIdx);
      setTimeout(() => {
        const nextEl = pageTextareaRefs.current[nextIdx];
        if (nextEl) {
          try {
            nextEl.focus({ preventScroll: false });
            nextEl.setSelectionRange(0, 0);
          } catch (err) { }
        }
      }, 30);
      return;
    }

    // 4. ArrowUp key: If at the very beginning of text on this page, jump cursor to end of previous page
    if (e.key === 'ArrowUp' && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && pageIndex > 0) {
      e.preventDefault();
      const prevIdx = pageIndex - 1;
      setActivePageIndex(prevIdx);
      setTimeout(() => {
        const prevEl = pageTextareaRefs.current[prevIdx];
        if (prevEl) {
          try {
            const prevLen = prevEl.value.length;
            prevEl.focus({ preventScroll: false });
            prevEl.setSelectionRange(prevLen, prevLen);
          } catch (err) { }
        }
      }, 30);
      return;
    }
  };

  // Add an extra page (e.g. Page 2, Page 3...)
  const handleAddPage = () => {
    const nextIdx = pages.length;
    const nextPages = [...pages, ''];
    if (importedHtmlPages.length > 0) {
      setImportedHtmlPages(prev => [...prev, '<p><br/></p>']);
    }
    const combined = nextPages.join('\n\n---PAGE_BREAK---\n\n');
    setPages(nextPages);
    setFormData(f => ({ ...f, content: combined }));
    setActivePageIndex(nextIdx);
    recordHistory(nextPages, combined, nextIdx, formData.title, true);
    toast.success(`Page ${nextIdx + 1} added!`);
    setTimeout(() => {
      if (importedHtmlPages.length > 0) {
        const el = htmlEditorRefs.current[nextIdx];
        if (el) el.focus();
      } else {
        const el = pageTextareaRefs.current[nextIdx];
        if (el) el.focus();
      }
    }, 100);
  };

  // Auto-flow all pages on demand
  const handleAutoFlowAllPages = () => {
    const currentContent = pages.join('\n\n---PAGE_BREAK---\n\n');
    const repaginated = autoPaginateDocument(currentContent);
    setPages(repaginated);
    const combined = repaginated.join('\n\n---PAGE_BREAK---\n\n');
    setFormData(f => ({ ...f, content: combined }));
    recordHistory(repaginated, combined, activePageIndex, formData.title, true);
    toast.success(`Content auto-balanced across ${repaginated.length} ${repaginated.length === 1 ? 'page' : 'pages'}!`);
  };

  // Remove a page
  const handleRemovePage = (pageIndex: number) => {
    if (pages.length <= 1) return;
    if (!confirm(`Are you sure you want to remove Page ${pageIndex + 1}? Any text on this page will be removed.`)) return;
    const nextPages = pages.filter((_, idx) => idx !== pageIndex);
    if (importedHtmlPages.length > 0) {
      setImportedHtmlPages(prev => prev.filter((_, idx) => idx !== pageIndex));
    }
    const combined = nextPages.join('\n\n---PAGE_BREAK---\n\n');
    const targetIdx = Math.max(0, pageIndex - 1);
    setPages(nextPages);
    setFormData(f => ({ ...f, content: combined }));
    setActivePageIndex(targetIdx);
    recordHistory(nextPages, combined, targetIdx, formData.title, true);
    toast.success(`Page ${pageIndex + 1} removed`);
  };

  // Directly insert real case value (NO BRACKETS!) at cursor position in active page
  const handleInsertVariable = (valToInsert: string) => {
    const targetIdx = activePageIndex < pages.length ? activePageIndex : 0;
    const textarea = pageTextareaRefs.current[targetIdx];
    const currentPageText = pages[targetIdx] || '';

    // Record exact window scroll position before insertion
    const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    let start = currentPageText.length;
    let end = currentPageText.length;

    if (textarea) {
      const savedPos = caretPositionsRef.current[targetIdx];
      if (document.activeElement === textarea) {
        start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : currentPageText.length;
        end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : currentPageText.length;
      } else if (savedPos && typeof savedPos.start === 'number' && savedPos.start <= currentPageText.length) {
        start = savedPos.start;
        end = savedPos.end;
      }
    }

    const newText = currentPageText.substring(0, start) + valToInsert + currentPageText.substring(end);
    const newPos = start + valToInsert.length;

    // Update saved caret position
    caretPositionsRef.current[targetIdx] = { start: newPos, end: newPos };

    handlePageContentChange(targetIdx, newText);
    toast.success(`Inserted "${valToInsert}"`);

    // Prevent any unwanted automatic page jumping or scrolling
    if (textarea) {
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(newPos, newPos);
        } catch (e) {
          // ignore
        }
        // Force viewport to stay pinned at current scroll position
        if (typeof window !== 'undefined') {
          window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
          requestAnimationFrame(() => {
            window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
          });
        }
      }, 0);
    }
  };

  // Replace any existing {{brackets}} in all pages with real case values
  const handleReplaceAllBrackets = () => {
    const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    const updatedPages = pages.map(p => substituteVariables(p));
    setPages(updatedPages);
    const combined = updatedPages.join('\n\n---PAGE_BREAK---\n\n');
    setFormData(prev => ({ ...prev, content: combined }));
    recordHistory(updatedPages, combined, activePageIndex, formData.title, true);
    toast.success('All placeholder brackets replaced with actual case details!');

    if (typeof window !== 'undefined') {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      });
    }
  };

  // Auto-resize on-paper textareas smoothly without collapsing or scroll jumps
  useEffect(() => {
    pages.forEach((_, idx) => {
      const el = pageTextareaRefs.current[idx];
      if (el) {
        el.style.height = 'auto';
        const minH = idx === 0 ? 540 : 820;
        const targetHeight = Math.max(minH, el.scrollHeight);
        el.style.height = `${targetHeight}px`;
      }
    });
  }, [pages, isEditing]);

  // Fetch templates for this case
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await customFetch(API.DOCUMENTS.PERSONALIZED_TEMPLATES.BY_CASE(caseId));
      if (!res.ok) {
        throw new Error('Failed to load personalized templates');
      }
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : (data.results || []));
    } catch (err: any) {
      console.error('Error fetching personalized templates:', err);
      toast.error(err.message || 'Error fetching personalized templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchTemplates();
    }
    const handleSync = (e: any) => {
      if (!e?.detail?.caseId || e.detail.caseId === caseId) {
        fetchTemplates();
      }
    };
    window.addEventListener('documind:personalized-templates-updated', handleSync);
    return () => {
      window.removeEventListener('documind:personalized-templates-updated', handleSync);
    };
  }, [caseId]);

  // Filtered templates list
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        (tpl.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.type_display || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'all' || tpl.template_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [templates, searchQuery, typeFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setActiveTemplate(null);
    const content = substituteVariables(STARTER_PRESETS[1].content);
    const initData = {
      title: '',
      template_type: 'affidavit',
      custom_type_name: '',
      description: '',
      content: content
    };
    initialDataRef.current = initData;
    setFormData(initData);
    const initialPages = splitContentIntoPages(content);
    setPages(initialPages);
    setActivePageIndex(0);
    setHistory([{
      pages: initialPages,
      content: content,
      activePageIndex: 0,
      title: ''
    }]);
    setHistoryIndex(0);
    setIsEditing(true);
  };

  // Handle Word Document (.docx / .doc) File Import into Editor
  const handleWordFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same file can be selected again
    e.target.value = '';

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'doc') {
      toast.error('Please upload a Word document (.docx or .doc)');
      return;
    }

    const toastId = toast.loading(`Importing "${file.name}" into editor...`);
    setIsImportingWord(true);

    try {
      // ── Layout Preservation Mode (mammoth.js, client-side) — always active for .docx ──
      if (ext === 'docx') {
        const mammoth = (await import('mammoth')).default;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "b => strong",
              "i => em",
              "u => u",
            ],
          }
        );
        const fullHtml = result.value;

        // Split HTML at Word page-break markers (<!--nextpage-->, or w:lastRenderedPageBreak)
        // Fallback: split by multiple blank paragraphs or <hr /> inserted by mammoth for page-break runs
        const PAGE_BREAK_RE = /(?:<p[^>]*>\s*<\/p>\s*){3,}|<hr\s*\/?>|<!--\s*nextpage\s*-->/gi;
        const rawSegments = fullHtml.split(PAGE_BREAK_RE).filter(seg => seg && seg.trim().replace(/<[^>]+>/g, '').trim().length > 0);

        // If no page breaks detected, keep as single page
        const htmlPages = rawSegments.length > 0 ? rawSegments : [fullHtml];

        const importedTitle = file.name.replace(/\.[^/.]+$/, '');
        const combinedHtml = htmlPages.join('\n\n---PAGE_BREAK---\n\n');

        const initData = {
          title: importedTitle,
          template_type: 'custom' as const,
          custom_type_name: 'Imported Template',
          description: `Imported from Word file: ${file.name}`,
          content: combinedHtml
        };

        initialDataRef.current = initData;
        setActiveTemplate(null);
        setFormData(initData);
        setImportedHtmlPages(htmlPages);
        setPages(htmlPages);
        setActivePageIndex(0);
        setShowSignatureBlock(false);
        setHtmlContentRevision(r => r + 1);
        setHistory([{ pages: htmlPages, content: combinedHtml, activePageIndex: 0, title: importedTitle }]);
        setHistoryIndex(0);
        setIsEditing(true);
        toast.success(`"${file.name}" imported with layout preserved (${htmlPages.length} page${htmlPages.length > 1 ? 's' : ''})!`, { id: toastId });
        return;
      }

      // ── Standard Plain-Text Mode (backend API) ─────────────────────────────
      setImportedHtmlPages([]);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await customFetch(API.DOCUMENTS.PERSONALIZED_TEMPLATES.IMPORT_WORD, {
        method: 'POST',
        body: uploadFormData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to import Word document');
      }

      const data = await res.json();
      const importedTitle = data.title || file.name.replace(/\.[^/.]+$/, '');
      const importedContent = substituteVariables(data.content || '');
      const importedType = data.template_type || 'custom';
      const importedTypeName = data.custom_type_name || 'Imported Template';

      const initData = {
        title: importedTitle,
        template_type: importedType,
        custom_type_name: importedTypeName,
        description: `Imported from Word file: ${file.name}`,
        content: importedContent
      };

      initialDataRef.current = initData;
      setActiveTemplate(null);
      setFormData(initData);

      const initialPages = splitContentIntoPages(importedContent);
      setPages(initialPages);
      setActivePageIndex(0);
      setHistory([{
        pages: initialPages,
        content: importedContent,
        activePageIndex: 0,
        title: importedTitle
      }]);
      setHistoryIndex(0);
      setIsEditing(true);

      toast.success(`"${file.name}" imported into editor successfully!`, { id: toastId });
    } catch (err: any) {
      console.error('Word import error:', err);
      toast.error(err.message || 'Failed to import Word document', { id: toastId });
    } finally {
      setIsImportingWord(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (template: PersonalizedTemplateItem) => {
    setActiveTemplate(template);
    const content = template.content || '';
    const initData = {
      title: template.title || '',
      template_type: template.template_type || 'custom',
      custom_type_name: template.custom_type_name || '',
      description: template.description || '',
      content: content
    };
    initialDataRef.current = initData;
    setFormData(initData);

    // Restore signature block preference if stored
    if (template.field_values && typeof template.field_values === 'object') {
      setShowSignatureBlock(Boolean((template.field_values as any).show_signature_block));
    } else {
      setShowSignatureBlock(false);
    }

    // Detect if content is rich HTML (from imported Word doc or HTML editor)
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      const splitHtml = content.split(/\s*---PAGE_BREAK---\s*/);
      const htmlPages = splitHtml.length > 0 ? splitHtml : [content];
      setImportedHtmlPages(htmlPages);
      setPages(htmlPages);
      setActivePageIndex(0);
      setHtmlContentRevision(r => r + 1);
      setHistory([{
        pages: htmlPages,
        content: content,
        activePageIndex: 0,
        title: initData.title
      }]);
    } else {
      setImportedHtmlPages([]);
      const initialPages = splitContentIntoPages(content);
      setPages(initialPages);
      setActivePageIndex(0);
      setHistory([{
        pages: initialPages,
        content: content,
        activePageIndex: 0,
        title: initData.title
      }]);
    }
    setHistoryIndex(0);
    setIsEditing(true);
  };

  // Detect dirty / unsaved changes when clicking Back
  const hasUnsavedChanges = () => {
    let currentContent: string;
    if (importedHtmlPages.length > 0) {
      const currentHtmlPages = importedHtmlPages.map((html, idx) => {
        const refEl = htmlEditorRefs.current[idx];
        return refEl ? refEl.innerHTML : html;
      });
      currentContent = currentHtmlPages.join('\n\n---PAGE_BREAK---\n\n');
    } else {
      currentContent = pages.join('\n\n---PAGE_BREAK---\n\n');
    }
    return (
      formData.title.trim() !== (initialDataRef.current.title || '').trim() ||
      formData.template_type !== initialDataRef.current.template_type ||
      formData.custom_type_name.trim() !== (initialDataRef.current.custom_type_name || '').trim() ||
      formData.description.trim() !== (initialDataRef.current.description || '').trim() ||
      currentContent.trim() !== (initialDataRef.current.content || '').trim()
    );
  };

  // Handle Back arrow click
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      setIsEditing(false);
      setActiveTemplate(null);
    }
  };

  // Discard changes and close editor
  const handleDiscardAndClose = () => {
    setShowUnsavedModal(false);
    setIsEditing(false);
    setActiveTemplate(null);
    toast('Changes discarded (not saved in draft)', { icon: 'ℹ️' });
  };

  // Load Preset into editor with variables substituted
  const handleApplyPreset = (presetId: string) => {
    const preset = STARTER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const substituted = substituteVariables(preset.content);
    const newTitle = formData.title || preset.title;
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      template_type: preset.type,
      custom_type_name: preset.custom_type_name || '',
      content: substituted
    }));
    const newPages = splitContentIntoPages(substituted);
    setPages(newPages);
    setActivePageIndex(0);
    recordHistory(newPages, substituted, 0, newTitle, true);
    toast.success(`Loaded "${preset.title}" with case details`);
  };

  // Save template (Save Draft or Save & Finalize to Case Filing Pack)
  const handleSave = async (andFinalize: boolean = false, andClose: boolean = false): Promise<boolean> => {
    if (!formData.title.trim()) {
      toast.error('Please enter a Template Title before saving');
      return false;
    }

    setIsSaving(true);
    let combinedContent: string;
    if (importedHtmlPages.length > 0) {
      const currentHtmlPages = importedHtmlPages.map((html, idx) => {
        const refEl = htmlEditorRefs.current[idx];
        return refEl ? refEl.innerHTML : html;
      });
      combinedContent = currentHtmlPages.join('\n\n---PAGE_BREAK---\n\n');
    } else {
      combinedContent = pages.join('\n\n---PAGE_BREAK---\n\n');
    }

    try {
      const payload: any = {
        case: caseId,
        client: clientId || null,
        title: formData.title.trim(),
        template_type: formData.template_type,
        custom_type_name: formData.template_type === 'custom' ? formData.custom_type_name.trim() : '',
        description: formData.description.trim(),
        content: combinedContent,
        field_values: {
          show_signature_block: showSignatureBlock
        },
        status: andFinalize ? 'completed' : 'draft'
      };

      let savedTpl: PersonalizedTemplateItem;
      if (activeTemplate) {
        // Update existing
        const res = await customFetch(API.DOCUMENTS.PERSONALIZED_TEMPLATES.DETAIL(activeTemplate.id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to update template');
        }
        savedTpl = await res.json();
      } else {
        // Create new
        const res = await customFetch(API.DOCUMENTS.PERSONALIZED_TEMPLATES.CREATE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to create template');
        }
        savedTpl = await res.json();
      }

      if (andFinalize) {
        // Finalize: compile PDF & merge to Case Filing Pack & Master Filing Pack
        await handleToggleAddToAllDocs(savedTpl.id, true);
      } else {
        // Save as Draft:
        // If it was previously in Case Filing Pack, remove it so it's purely a draft
        if (activeTemplate?.is_added_to_all_docs) {
          await handleToggleAddToAllDocs(savedTpl.id, false);
        } else {
          toast.success('Template saved as draft successfully (not in Case Filing Pack)');
        }
      }

      // Update snapshot so not dirty
      initialDataRef.current = {
        title: savedTpl.title || formData.title.trim(),
        template_type: savedTpl.template_type || formData.template_type,
        custom_type_name: savedTpl.custom_type_name || formData.custom_type_name.trim(),
        description: savedTpl.description || formData.description.trim(),
        content: combinedContent
      };

      await fetchTemplates();
      setShowUnsavedModal(false);

      if (andClose) {
        setIsEditing(false);
        setActiveTemplate(null);
      } else {
        setActiveTemplate(savedTpl);
      }
      return true;
    } catch (err: any) {
      console.error('Error saving template:', err);
      toast.error(err.message || 'Failed to save template');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Add / Remove from Case Filing Pack (Finalize / Unfinalize)
  const handleToggleAddToAllDocs = async (templateId: string, add: boolean) => {
    setActionInProgressId(templateId);
    const toastId = toast.loading(add ? 'Compiling PDF & finalizing to Case Filing Pack...' : 'Removing from Case Filing Pack...');

    try {
      const endpoint = add
        ? API.DOCUMENTS.PERSONALIZED_TEMPLATES.ADD_TO_ALL_DOCUMENTS(templateId)
        : API.DOCUMENTS.PERSONALIZED_TEMPLATES.REMOVE_FROM_ALL_DOCUMENTS(templateId);

      const res = await customFetch(endpoint, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Action failed');
      }

      const updated = await res.json();
      toast.success(
        add
          ? 'Template finalized and merged into Case Filing Pack!'
          : 'Template removed from Case Filing Pack (reverted to Draft)',
        { id: toastId }
      );

      // Refresh list
      setTemplates(prev => prev.map(t => (t.id === templateId ? updated : t)));

      if (onAddedToAllDocuments) {
        onAddedToAllDocuments();
      }
    } catch (err: any) {
      console.error('Error toggling Case Filing Pack status:', err);
      toast.error(err.message || 'Failed to update Case Filing Pack status', { id: toastId });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Duplicate template
  const handleDuplicate = async (templateId: string) => {
    try {
      const res = await customFetch(API.DOCUMENTS.PERSONALIZED_TEMPLATES.DUPLICATE(templateId), {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to duplicate template');
      const copy = await res.json();
      toast.success(`Created copy: "${copy.title}"`);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate template');
    }
  };

  // Delete template
  const handleDelete = async (templateId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the personalized template "${title}"?`)) return;
    try {
      const res = await customFetch(API.DOCUMENTS.PERSONALIZED_TEMPLATES.DETAIL(templateId), {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete template');
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      if (typeof window !== 'undefined' && caseId) {
        window.dispatchEvent(new CustomEvent('documind:filing-pack-reordered', { detail: { caseId, timestamp: Date.now() } }));
      }
      if (onAddedToAllDocuments) {
        onAddedToAllDocuments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template');
    }
  };

  // Download PDF
  const handleDownloadPdf = (templateId: string, title: string) => {
    const url = API.DOCUMENTS.PERSONALIZED_TEMPLATES.DOWNLOAD_PDF(templateId);
    window.open(url, '_blank');
  };

  // ---------------- Render Editor View ----------------
  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Hidden Word Document File Input */}
        <input
          type="file"
          ref={wordFileInputRef}
          onChange={handleWordFileSelect}
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="hidden"
        />

        {/* Editor Top Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
              title="Back to Templates"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {activeTemplate ? 'Edit Personalized Template' : 'Create Personalized Template'}
                </h3>
                {activeTemplate && (
                  activeTemplate.is_added_to_all_docs || activeTemplate.status === 'added_to_documents' || activeTemplate.status === 'completed' ? (
                    <span className="text-xs text-green-700 font-semibold flex items-center gap-1 bg-green-50 px-2.5 py-0.5 rounded-md border border-green-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Finalized &bull; In Case Filing Pack
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      Draft
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Draft directly on A4 legal sheet &bull; Insert dynamic case variables &bull; Save as Draft or Finalize into Case Filing Pack
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false, false)}
              className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs sm:text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Saves as draft (will not appear in Case Filing Pack until finalized)"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true, false)}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Finalizes template and adds it to Case Filing Pack"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save & Finalize
            </button>
          </div>
        </div>

        {/* Form Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
              Template Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Special Power of Attorney for High Court / Interim Stay Application"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold !text-gray-900 bg-white placeholder:!text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-xs"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
              Template Type / Category *
            </label>
            <select
              value={formData.template_type}
              onChange={e => setFormData({ ...formData, template_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold !text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-xs cursor-pointer"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            >
              <option value="affidavit" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Affidavit</option>
              <option value="legal_notice" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Legal Notice</option>
              <option value="petition" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Petition / Plaint</option>
              <option value="agreement" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Agreement / Contract</option>
              <option value="power_of_attorney" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Power of Attorney</option>
              <option value="vakalatnama" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Vakalatnama</option>
              <option value="application" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Application / Motion</option>
              <option value="written_statement" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Written Statement</option>
              <option value="undertaking" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Undertaking / Bond</option>
              <option value="memo" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Memorandum</option>
              <option value="custom" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Other / Custom Type...</option>
            </select>
          </div>

          {formData.template_type === 'custom' && (
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Custom Type Name
              </label>
              <input
                type="text"
                value={formData.custom_type_name}
                onChange={e => setFormData({ ...formData, custom_type_name: e.target.value })}
                placeholder="Enter any custom type (e.g. Rental Deed, Bail Surety, Mediation Note)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-purple-300 bg-white text-sm font-semibold !text-gray-900 placeholder:!text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-xs"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>
          )}
        </div>

        {/* Starter Presets Selector */}
        {!activeTemplate && (
          <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900">Load a Starter Template:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={isImportingWord}
                onClick={() => wordFileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-md bg-purple-600 text-white text-xs hover:bg-purple-700 font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Import a Word document (.docx / .doc) directly into this editor"
              >
                {isImportingWord ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                Import Word File (.docx)
              </button>
              <span className="text-purple-300 font-bold text-xs mx-0.5">|</span>
              {STARTER_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="px-2.5 py-1 rounded-md bg-white border border-purple-200 text-xs text-purple-800 hover:bg-purple-100 font-medium transition-all cursor-pointer"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Variables Ribbon - Direct Value Insertion (NO BRACKETS!) */}
        <div className="bg-white/80 rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-600" />
              Insert Case Information (Click to insert direct name/value):
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {caseVariables.map(v => (
              <button
                key={v.key}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleInsertVariable(v.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-slate-400 hover:bg-slate-100 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs group cursor-pointer"
                title={`Click to insert "${v.value}" directly onto current page`}
              >
                <span className="text-slate-500 font-medium group-hover:text-slate-700">{v.label}:</span>
                <span className="font-bold text-slate-900 group-hover:text-black font-sans">{v.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Canvas Row: Paper Desk + Sticky Side Panel Outside */}
        <div className="w-full flex items-start gap-4 xl:gap-6 relative">
          {/* Direct A4 Size Multi-Page Paper Desk (The Gray Box - completely separate from side panel) */}
          <div className="flex-1 min-w-0 bg-[#f1f4f8] rounded-2xl border border-slate-300/80 p-4 sm:p-6 lg:p-8 flex flex-col items-center shadow-inner relative overflow-x-auto">
            {/* Zoomable Pages Container */}
            <div
              className="w-full max-w-[820px] flex flex-col items-center space-y-8 origin-top transition-[zoom] duration-150 min-w-0 mx-auto"
              style={{
                zoom: `${zoomLevel}%`,
              }}
            >
              {/* Render Every A4 Page */}
              {pages.map((pageText, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === pages.length - 1;
                const isActivePage = activePageIndex === pageIndex;
                const isVisibleInView = visiblePageIndex === pageIndex;

                return (
                  <div
                    key={pageIndex}
                    id={`a4-page-card-${pageIndex}`}
                    data-page-index={pageIndex}
                    className="w-full max-w-[820px] flex flex-col space-y-2 scroll-mt-24"
                  >
                    {/* Sheet Controls Bar OUTSIDE the A4 Paper */}
                    <div className="w-full flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md border font-semibold text-[11px] uppercase tracking-wider shadow-2xs transition-all ${
                          isVisibleInView
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          Page {pageIndex + 1} of {pages.length}
                        </span>
                        {isVisibleInView && (
                          <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                            &bull; In View
                          </span>
                        )}
                        {isActivePage && !isVisibleInView && (
                          <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                            &bull; Cursor Focused
                          </span>
                        )}
                      </div>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePage(pageIndex);
                          }}
                          className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Remove Page ${pageIndex + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Page {pageIndex + 1}
                        </button>
                      )}
                    </div>

                {/* Pure A4 Legal Paper - Exact Real-Life Preview */}
                <div
                  onClick={(e) => {
                    setActivePageIndex(pageIndex);
                    if (e.target === e.currentTarget) {
                      const el = pageTextareaRefs.current[pageIndex];
                      if (el) {
                        el.focus();
                        const len = el.value.length;
                        el.setSelectionRange(len, len);
                      }
                    }
                  }}
                  className={`w-full min-h-[1123px] bg-white shadow-2xl rounded-[2px] border ${isActivePage ? 'border-slate-400 ring-2 ring-slate-400/20' : 'border-gray-300/80'
                    } px-8 py-8 sm:px-12 sm:py-9 flex flex-col relative transition-all text-gray-900 cursor-text`}
                >
                  {/* Page 1 Header & Caption — only for standard templates, NOT for imported Word documents */}
                  {isFirstPage && importedHtmlPages.length === 0 ? (
                    <>
                      <div className="text-center border-b-2 border-gray-900 pb-4 mb-4 space-y-1.5">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-700 font-bold font-sans">
                          {formData.template_type === 'custom'
                            ? (formData.custom_type_name || 'Personalized Document')
                            : formData.template_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-950 uppercase tracking-wide">
                          {formData.title || 'UNTITLED LEGAL DOCUMENT'}
                        </h1>
                      </div>

                      {/* Formal Case Details Caption Box on Paper */}
                      {caseData && (
                        <div className="bg-slate-50/90 border border-gray-300 rounded p-3 mb-4 text-xs font-sans grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-800">
                          <div>
                            <span className="font-bold text-gray-900">Court / Authority: </span>
                            {caseData.court_name || caseData.court || 'District Court'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">Case Reference: </span>
                            {caseData.case_number || 'MURD999'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">Client / Deponent: </span>
                            {caseData.client_name || caseData.client?.full_name || 'Client'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">Advocate / Counsel: </span>
                            {caseData.assigned_advocate_name || 'Counsel for Applicant'}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* Direct On-Paper Body Editor — or Rich HTML Layout when preserve mode is on */}
                  <div className="w-full flex flex-col">
                    {importedHtmlPages.length > 0 && importedHtmlPages[pageIndex] !== undefined ? (
                      /* ─ Rich HTML Layout Editor (mammoth-rendered, fully editable — Google Docs style) ─ */
                      <div className="relative w-full">
                        <style>{`
                          .word-doc-editor table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                          .word-doc-editor th, .word-doc-editor td { border: 1px solid #cbd5e1; padding: 6px 10px; }
                          .word-doc-editor th { background-color: #f8fafc; font-weight: bold; }
                          .word-doc-editor h1 { font-size: 1.35rem; font-weight: bold; margin-bottom: 0.5rem; text-align: center; }
                          .word-doc-editor h2 { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.4rem; }
                          .word-doc-editor h3 { font-size: 1.05rem; font-weight: bold; margin-bottom: 0.3rem; }
                          .word-doc-editor p { margin-bottom: 0.5rem; }
                          .word-doc-editor ul, .word-doc-editor ol { padding-left: 24px; margin-bottom: 0.5rem; }
                        `}</style>
                        <div
                          ref={el => {
                            htmlEditorRefs.current[pageIndex] = el;
                            // Set innerHTML only on initial mount or if empty to avoid cursor reset on re-render
                            if (el && !el.innerHTML && importedHtmlPages[pageIndex]) {
                              el.innerHTML = importedHtmlPages[pageIndex] || '';
                            }
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => setActivePageIndex(pageIndex)}
                          onInput={e => {
                            const el = e.currentTarget;
                            const updatedHtml = el.innerHTML;
                            // Update state without re-rendering the div (browser owns DOM)
                            setImportedHtmlPages(prev => {
                              const next = [...prev];
                              next[pageIndex] = updatedHtml;
                              return next;
                            });
                            setPages(prev => {
                              const next = [...prev];
                              next[pageIndex] = updatedHtml;
                              return next;
                            });
                            const plain = el.innerText || '';
                            setFormData(prev => ({ ...prev, content: plain }));
                          }}
                          className="w-full outline-none focus:outline-none min-h-[60px] text-slate-800 tracking-normal cursor-text word-doc-editor"
                          style={{
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            fontSize: '14px',
                            lineHeight: '22px',
                            color: '#1E293B',
                            caretColor: '#334155',
                            wordBreak: 'break-word',
                          }}
                          spellCheck
                        />
                      </div>
                    ) : (
                      /* ─ Standard Editable Textarea ─ */
                      <textarea
                        ref={el => {
                          pageTextareaRefs.current[pageIndex] = el;
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = `${Math.max(60, el.scrollHeight)}px`;
                          }
                        }}
                        value={pageText}
                        onFocus={() => setActivePageIndex(pageIndex)}
                        onClick={e => {
                          const t = e.currentTarget;
                          caretPositionsRef.current[pageIndex] = { start: t.selectionStart, end: t.selectionEnd };
                        }}
                        onKeyUp={e => {
                          const t = e.currentTarget;
                          caretPositionsRef.current[pageIndex] = { start: t.selectionStart, end: t.selectionEnd };
                        }}
                        onSelect={e => {
                          const t = e.currentTarget;
                          caretPositionsRef.current[pageIndex] = { start: t.selectionStart, end: t.selectionEnd };
                        }}
                        onKeyDown={e => handlePageKeyDown(e, pageIndex)}
                        onPaste={e => handlePagePaste(e, pageIndex)}
                        onBlur={e => {
                          const t = e.currentTarget;
                          caretPositionsRef.current[pageIndex] = { start: t.selectionStart, end: t.selectionEnd };
                        }}
                        onChange={e => {
                          const target = e.target;
                          target.style.height = 'auto';
                          target.style.height = `${Math.max(60, target.scrollHeight)}px`;
                          handlePageContentChange(pageIndex, target.value, target.selectionStart);
                        }}
                        placeholder={
                          isFirstPage
                            ? "Type or paste your personalized legal text directly onto this A4 paper...\n\nClick any case variable button above to insert real names/values directly."
                            : `Continue drafting on Page ${pageIndex + 1}...`
                        }
                        className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 p-0 font-sans text-[14px] sm:text-[14.5px] leading-[22px] text-slate-800 tracking-normal resize-none placeholder:text-gray-400 placeholder:font-sans placeholder:italic overflow-hidden"
                        style={{ minHeight: '60px', color: '#1E293B', overflow: 'hidden', resize: 'none' }}
                      />
                    )}
                  </div>

                  {/* Signature Block — only rendered when user enables it from the side panel */}
                  {isLastPage && showSignatureBlock && (
                    <div className="mt-8 pt-4 pb-2 border-t-2 border-gray-300 flex justify-between items-end text-xs font-sans text-gray-700 shrink-0">
                      <div className="space-y-1">
                        <p><span className="font-semibold text-gray-900">Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
                        <p><span className="font-semibold text-gray-900">Place:</span> Bhubaneswar / District</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-gray-900">Advocate / Deponent Signature</p>
                        <div className="h-10 border-b border-dashed border-gray-400 w-48 ml-auto"></div>
                        <p className="text-[11px] text-gray-500 pt-0.5">Authorized Signatory</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

              {/* Bottom Optional Action */}
              <div className="w-full max-w-[820px] flex items-center justify-center pt-2 pb-6 mx-auto">
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="py-2 px-4 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  Insert Page Break (New A4 Page)
                </button>
              </div>
            </div>
          </div>
          {/* End of Direct A4 Size Multi-Page Paper Desk */}

          {/* Sticky Side Rail OUTSIDE the Desk Container */}
          <aside
            className={`sticky top-20 z-30 shrink-0 hidden lg:flex flex-col transition-all duration-200 select-none ${
              isSideRailCollapsed ? 'w-14' : 'w-72 xl:w-80'
            }`}
            style={{
              maxHeight: 'calc(100vh - 5.5rem)',
            }}
          >
            {isSideRailCollapsed ? (
              /* Collapsed Compact Strip */
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-2 flex flex-col items-center gap-2 text-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSideRailCollapsed(false)}
                  className="w-10 h-10 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center justify-center border border-slate-200/70 shadow-2xs transition-all cursor-pointer"
                  title="Expand side options panel"
                >
                  <PanelRightOpen className="w-4 h-4 text-slate-700" />
                </button>

                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  {visiblePageIndex + 1}
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  /{pages.length}
                </span>

                <div className="w-8 h-px bg-slate-200 my-0.5" />

                <button
                  type="button"
                  disabled={visiblePageIndex <= 0}
                  onClick={jumpToPrevPage}
                  className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                  title="Previous Page (Up)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={visiblePageIndex >= pages.length - 1}
                  onClick={jumpToNextPage}
                  className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                  title="Next Page (Down)"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                <div className="w-8 h-px bg-slate-200 my-0.5" />

                <button
                  type="button"
                  onClick={handleAutoFlowAllPages}
                  className="p-1.5 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Auto-Flow All Pages"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleAddPage}
                  className="p-1.5 rounded-md text-white bg-slate-900 hover:bg-slate-800 cursor-pointer shadow-2xs"
                  title="Add Page"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Full Expanded Sticky Inspector Panel */
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col text-slate-800">
                {/* Panel Header */}
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 truncate tracking-tight">
                      Desk Options
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSideRailCollapsed(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90 shadow-2xs transition-all cursor-pointer font-medium text-[11px]"
                    title="Minimize side options panel"
                  >
                    <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                    <span>Minimize</span>
                  </button>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-9.5rem)]">
                  {/* 1. Page Tracker ("which no of the page") - Professional Slate Card */}
                  <div className="bg-slate-900 rounded-xl p-3 text-white shadow-sm space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Current Page
                      </span>
                      <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded text-slate-200 border border-white/5">
                        {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tracking-tight text-white">
                          Page {visiblePageIndex + 1}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          of {pages.length}
                        </span>
                      </div>
                    </div>

                    {/* Visual Page Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                      <div
                        className="bg-slate-200 h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${((visiblePageIndex + 1) / Math.max(1, pages.length)) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Prev / Next Page Steppers */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        disabled={visiblePageIndex <= 0}
                        onClick={jumpToPrevPage}
                        className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/5"
                        title="Scroll up to Previous Page"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={visiblePageIndex >= pages.length - 1}
                        onClick={jumpToNextPage}
                        className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/5"
                        title="Scroll down to Next Page"
                      >
                        Next
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Interactive Page Jumper Pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Jump to Page:</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={jumpToTop}
                          className="hover:text-slate-900 font-medium cursor-pointer"
                          title="Scroll to Top of Document"
                        >
                          Top
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={jumpToEnd}
                          className="hover:text-slate-900 font-medium cursor-pointer"
                          title="Scroll to End (Signatures)"
                        >
                          End
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pages.map((_, pIdx) => {
                        const isCurrent = visiblePageIndex === pIdx;
                        return (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => jumpToPage(pIdx)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                            title={`Jump directly to Page ${pIdx + 1}`}
                          >
                            {pIdx + 1}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleAddPage}
                        className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                        title="Add a new page at the end"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3. Insert Case Information (Direct 1-Click Caret Insertion) */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-600" />
                        Insert Case Information:
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Click to insert real value at current cursor:
                    </p>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      {caseVariables.map(v => (
                        <button
                          key={v.key}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleInsertVariable(v.value)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-xs transition-all flex items-center justify-between gap-2 active:scale-[0.98] cursor-pointer group shadow-2xs"
                          title={`Click to insert "${v.value}" directly onto Page ${activePageIndex + 1}`}
                        >
                          <span className="text-[11px] text-slate-500 font-medium shrink-0 group-hover:text-slate-700">
                            {v.label}:
                          </span>
                          <span className="text-[11px] font-bold text-slate-900 font-sans text-right">
                            {v.value}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. History & Zoom Toolset */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">
                      History & Zoom
                    </div>
                    {/* Undo & Redo buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={historyIndex <= 0}
                        onClick={handleUndo}
                        className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-35 disabled:hover:bg-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Undo
                      </button>
                      <button
                        type="button"
                        disabled={historyIndex >= history.length - 1 || historyIndex === -1}
                        onClick={handleRedo}
                        className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-35 disabled:hover:bg-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Redo (Ctrl+Y)"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                        Redo
                      </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center justify-between gap-1 shadow-2xs">
                      <button
                        type="button"
                        disabled={zoomLevel <= 50}
                        onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                        title="Zoom Out (-10%)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1">
                        <select
                          value={zoomLevel}
                          onChange={e => setZoomLevel(Number(e.target.value))}
                          className="bg-transparent text-xs font-bold text-slate-800 rounded cursor-pointer focus:outline-none border-0 py-0.5 px-1"
                          title="Zoom Level"
                        >
                          <option value={50}>50%</option>
                          <option value={65}>65%</option>
                          <option value={75}>75%</option>
                          <option value={85}>85%</option>
                          <option value={90}>90%</option>
                          <option value={100}>100%</option>
                          <option value={110}>110%</option>
                          <option value={125}>125%</option>
                          <option value={150}>150%</option>
                        </select>
                        {zoomLevel !== 100 && (
                          <button
                            type="button"
                            onClick={() => setZoomLevel(100)}
                            className="text-[10px] text-slate-600 font-bold hover:text-slate-900 hover:underline cursor-pointer"
                            title="Reset Zoom to 100%"
                          >
                            100%
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={zoomLevel >= 150}
                        onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                        title="Zoom In (+10%)"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 5. Page Operations */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">
                      Page Operations
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFlowAllPages}
                      className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                      title="Continuously balances and distributes text cleanly across pages"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                      Auto-Flow Pages
                    </button>

                    <button
                      type="button"
                      onClick={handleAddPage}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                      title="Add a new blank A4 page"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {pages.length === 1 ? 'Add 2nd Page' : `Add Page ${pages.length + 1}`}
                    </button>
                  </div>

                  {/* 5b. Document Options — Signature Block Toggle */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">Document Options</div>
                    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[12px] font-semibold text-slate-800 truncate">Signature Block</span>
                        <span className="text-[10px] text-slate-500 leading-tight">
                          Show date, place &amp; sign line on last page
                        </span>
                      </div>
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showSignatureBlock}
                        onClick={() => setShowSignatureBlock(prev => !prev)}
                        className={`relative inline-flex shrink-0 h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showSignatureBlock ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                        title={showSignatureBlock ? 'Hide signature block' : 'Show signature block on last page'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                            showSignatureBlock ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 6. Document Word & Character Statistics */}
                  <div className="pt-2 border-t border-slate-100 bg-slate-50/80 -mx-3 -mb-3 p-3 rounded-b-2xl border-t text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-500">Document Total:</span>
                      <span className="text-slate-900 font-bold">
                        {formData.content ? formData.content.trim().split(/\s+/).filter(Boolean).length : 0} words
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Characters:</span>
                      <span className="text-slate-700 font-medium">
                        {formData.content.length.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-800 font-semibold">
                      <span>Page {visiblePageIndex + 1} Words:</span>
                      <span className="font-bold text-slate-900">
                        {pages[visiblePageIndex] ? pages[visiblePageIndex].trim().split(/\s+/).filter(Boolean).length : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
          </div>

          {/* Mobile / Tablet Floating Sticky Pill (< lg) */}
          <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-300 rounded-full shadow-2xl px-3.5 py-1.5 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]">
              Page {visiblePageIndex + 1} / {pages.length}
            </span>
            <button
              type="button"
              disabled={visiblePageIndex <= 0}
              onClick={jumpToPrevPage}
              className="p-1 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={visiblePageIndex >= pages.length - 1}
              onClick={jumpToNextPage}
              className="p-1 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              title="Next Page"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleAutoFlowAllPages}
              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold text-[11px] flex items-center gap-1 border border-slate-200 cursor-pointer"
              title="Auto-Flow"
            >
              <Sparkles className="w-3 h-3 text-slate-600" /> Auto
            </button>
            <button
              type="button"
              onClick={handleAddPage}
              className="p-1 rounded-full bg-slate-900 text-white cursor-pointer"
              title="Add Page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Unsaved Changes Confirmation Modal (Court Form System Style) */}
          {showUnsavedModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900">
                      Do you want to save changes?
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      You have unsaved changes in this template. Your changes will be lost if you don't save them.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowUnsavedModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardAndClose}
                    className="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                    title="Discard all changes without saving anything into draft"
                  >
                    Don't Save
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(false, true)}
                    className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-sm font-semibold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Saves template as draft"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(true, true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Finalizes template and adds it to Case Filing Pack"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save & Finalize
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
  }

  // ---------------- Render List View ----------------
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Personalized Templates
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length > 0
              ? `${templates.length} personalized template${templates.length !== 1 ? 's' : ''} created for this case`
              : 'Create custom legal templates of any type (Affidavits, Notices, Deeds, Petitions) and add them to Case Filing Pack'}
          </p>
        </div>

        {isAdvocateRole && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Hidden Word Document File Input for List View */}
            <input
              type="file"
              ref={wordFileInputRef}
              onChange={handleWordFileSelect}
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              className="hidden"
            />

            <button
              type="button"
              disabled={isImportingWord}
              onClick={() => wordFileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 text-purple-700 text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Import Word document (.docx / .doc) to automatically create a new template"
            >
              {isImportingWord ? (
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
              ) : (
                <FileUp className="w-4 h-4 text-purple-600" />
              )}
              Import Word File
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'affidavit', label: 'Affidavits' },
            { id: 'legal_notice', label: 'Notices' },
            { id: 'petition', label: 'Petitions' },
            { id: 'agreement', label: 'Agreements' },
            { id: 'power_of_attorney', label: 'POA' },
            { id: 'custom', label: 'Custom' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => { setTypeFilter(f.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${typeFilter === f.id
                  ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Table / Empty State */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
          <p className="text-sm">Loading personalized templates...</p>
        </div>
      ) : templates.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8 space-y-4">
          <div className="mx-auto w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-gray-900">No Personalized Templates Yet</h4>
            <p className="text-xs text-gray-500">
              Create customized legal documents (Affidavits, Demand Notices, Petitions, Power of Attorney) with pre-filled case details, and optionally include them in the final filing pack.
            </p>
          </div>
          {isAdvocateRole && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                disabled={isImportingWord}
                onClick={() => wordFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold inline-flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Import Word document (.docx / .doc) to start your first template"
              >
                {isImportingWord ? <RefreshCw className="w-4 h-4 animate-spin text-purple-600" /> : <FileUp className="w-4 h-4 text-purple-600" />}
                Import Word File
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create First Template
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search & Pagination Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="relative group max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-gray-400 text-gray-900"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-gray-400 font-normal">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-purple-300 transition-all cursor-pointer"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-gray-400">({filteredTemplates.length} total)</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">SL. NO</th>
                  <th className="py-3.5 px-4">DOCUMENT TITLE</th>
                  <th className="py-3.5 px-4">DOCUMENT TYPE</th>
                  <th className="py-3.5 px-4">ANNEXURE</th>
                  <th className="py-3.5 px-4">UPLOADED BY</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                      {searchQuery ? `No personalized templates match "${searchQuery}"` : 'No personalized templates available'}
                    </td>
                  </tr>
                ) : (
                  paginatedTemplates.map((template, idx) => {
                    const slNo = (currentPage - 1) * pageSize + idx + 1;
                    const isAdded = template.is_added_to_all_docs;
                    const isActioning = actionInProgressId === template.id;

                    return (
                      <tr
                        key={template.id}
                        className="bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent transition-colors"
                      >
                        {/* Sl. No */}
                        <td className="py-4 px-6 text-xs font-semibold text-gray-400">
                          {slNo}
                        </td>

                        {/* Document Title */}
                        <td className="py-4 px-4 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            <span
                              onClick={() => handleOpenEdit(template)}
                              className="text-gray-900 font-bold hover:text-purple-600 cursor-pointer transition-colors"
                            >
                              {template.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-normal">
                            <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                            {template.description && (
                              <span className="text-gray-500">• {template.description}</span>
                            )}
                          </div>
                        </td>

                        {/* Document Type */}
                        <td className="py-4 px-4 text-xs font-medium">
                          <span className="font-bold text-purple-800 bg-purple-100/60 px-2 py-0.5 rounded-md text-xs">
                            {template.type_display}
                          </span>
                        </td>

                        {/* Annexure Column */}
                        <td className="py-4 px-4 text-xs font-semibold">
                          <span className="text-gray-300 font-medium">—</span>
                        </td>

                        {/* Uploaded By */}
                        <td className="py-4 px-4 text-xs font-medium">
                          <span className="font-bold text-gray-900">{template.created_by_name || 'Advocate'}</span>
                          <span className="block text-[11px] text-gray-400 mt-0.5">
                            {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold" title="In Case Filing Pack">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Finalized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold" title="Draft (not in Case Filing Pack)">
                              <Clock className="w-3.5 h-3.5" />
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Open/Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(template)}
                              className="w-[82px] h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
                              title="Open & Edit"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-700" />
                              Open
                            </button>

                            {/* Finalize or Remove */}
                            {isAdvocateRole && (
                              isAdded ? (
                                <button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => handleToggleAddToAllDocs(template.id, false)}
                                  className="h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold px-2.5 transition-colors shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                                  title="Remove from Case Filing Pack (reverts to Draft)"
                                >
                                  {isActioning ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                  )}
                                  Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => handleToggleAddToAllDocs(template.id, true)}
                                  className="h-8 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold px-3 transition-colors shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                                  title="Finalize this template and add it to Case Filing Pack"
                                >
                                  {isActioning ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  Finalize
                                </button>
                              )
                            )}

                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(template.id, template.title)}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-xs shrink-0"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate */}
                            {isAdvocateRole && (
                              <button
                                type="button"
                                onClick={() => handleDuplicate(template.id)}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-xs shrink-0"
                                title="Duplicate Template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            {isAdvocateRole && (
                              <button
                                type="button"
                                onClick={() => handleDelete(template.id, template.title)}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100/80 transition-colors shadow-xs shrink-0"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
