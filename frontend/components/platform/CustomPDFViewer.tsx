'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2,
  Search, X, Download, Printer, Hand, MousePointer,
  PanelLeftClose, PanelLeftOpen, Bookmark, FileText,
  Folder, FolderOpen, Loader2, ArrowLeftRight, ArrowUpDown,
  Filter, Check, ExternalLink, Calendar, Plus, BookmarkPlus,
  Edit2, Trash2, GripVertical, FolderPlus, FolderInput
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface OutlineItem {
  id: string;
  title: string;
  pageNumber: number | null;
  items?: OutlineItem[];
  level: number;
  fullPath?: string;
}

interface CustomPDFViewerProps {
  url: string;
  title?: string;
  onDownload?: () => void;
  onClose?: () => void;
  onSwitchToNative?: () => void;
  caseId?: string;
  caseTitle?: string;
  isMasterPdf?: boolean;
  onBookmarksUpdated?: () => void;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function CustomPDFViewer({
  url,
  title = 'Document',
  onDownload,
  onClose,
  onSwitchToNative,
  caseId,
  caseTitle,
  isMasterPdf = false,
  onBookmarksUpdated
}: CustomPDFViewerProps) {
  // Document state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInputVal, setPageInputVal] = useState<string>('1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  // Direct Bookmarks Management & Drag/Drop state
  const [filingItems, setFilingItems] = useState<any[]>([]);
  const [isUpdatingBookmarks, setIsUpdatingBookmarks] = useState<boolean>(false);
  const [draggedDoc, setDraggedDoc] = useState<{ id: string; title: string } | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderVal, setEditingFolderVal] = useState<string>('');
  const [isAddingFolder, setIsAddingFolder] = useState<boolean>(false);
  const [newFolderVal, setNewFolderVal] = useState<string>('');
  const [parentFolderSelection, setParentFolderSelection] = useState<string>('');
  const [addingSubFolderParent, setAddingSubFolderParent] = useState<string | null>(null);
  const [newSubFolderVal, setNewSubFolderVal] = useState<string>('');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [quickMoveMenuDocId, setQuickMoveMenuDocId] = useState<string | null>(null);

  // Layout & UI state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(340); // Generous default so bookmarks lie in one line
  const [activeTab, setActiveTab] = useState<'outline' | 'thumbnails'>('outline');
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Zoom & View state
  const [scale, setScale] = useState<number>(1.2);
  const [zoomMode, setZoomMode] = useState<'custom' | 'fit-width' | 'fit-page'>('fit-width');
  const [rotation, setRotation] = useState<number>(0);
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Outlines & Bookmarks
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [outlineSearch, setOutlineSearch] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Search in document
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ page: number; index: number }[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // DOM Refs
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const thumbnailRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingWidthRef = useRef<number>(sidebarWidth);

  // Page anchoring & scroll preservation refs
  const currentPageRef = useRef<number>(1);
  const isAdjustingScrollRef = useRef<boolean>(false);
  const prevScaleRef = useRef<number>(scale);
  const pendingScrollToPageRef = useRef<{ pageNum: number; ratioInPage: number } | null>(null);
  const scrollRafIdRef = useRef<number | null>(null);

  // Keep currentPageRef in sync with currentPage state
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Hand tool dragging state
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Fetch filing items to map outline elements to real DB items
  const fetchFilingItems = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await customFetch(API.DOCUMENTS.FILING_PACK_ITEMS(caseId));
      if (res.ok) {
        const data = await res.json();
        setFilingItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch filing pack items for bookmark sync:', err);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      fetchFilingItems();
    }
  }, [caseId, fetchFilingItems, reloadNonce]);

  // Match outline leaf item to database filing item
  const getFilingItemForOutline = useCallback(
    (item: OutlineItem) => {
      if (!filingItems.length) return null;

      // 1. Match by sequence number at the start: "1. 📄 others (Page 2)" -> 1
      const seqMatch = item.title.match(/^(\d+)\./);
      if (seqMatch) {
        const seq = parseInt(seqMatch[1], 10);
        const found = filingItems.find(
          (fi) => fi.sequence === seq || fi.order_index === seq
        );
        if (found) return found;
      }

      // 2. Match by start page
      if (item.pageNumber) {
        const found = filingItems.find((fi) => fi.start_page === item.pageNumber);
        if (found) return found;
      }

      // 3. Fallback: match by title text
      const cleanTitle = item.title
        .replace(/^\d+\.\s*/, '')
        .replace(/\(Page\s*\d+\)/i, '')
        .replace(/\[[^\]]*\]/g, '')
        .trim()
        .toLowerCase();

      return (
        filingItems.find(
          (fi) =>
            fi.title.toLowerCase().includes(cleanTitle) ||
            cleanTitle.includes(fi.title.toLowerCase())
        ) || null
      );
    },
    [filingItems]
  );

  // Collect all unique folder titles present in the tree or custom folders
  const allFolderTitles = useMemo(() => {
    const set = new Set<string>();
    const extractFolders = (items: OutlineItem[], parentPath: string = '') => {
      items.forEach((it) => {
        const isFolder =
          it.title.startsWith('📅') ||
          it.title.startsWith('📁') ||
          it.title.startsWith('📂') ||
          it.title.toLowerCase().startsWith('date:') ||
          Boolean(it.items && it.items.length > 0 && it.level > 0);

        if (isFolder && !it.title.includes('Case Filings & Evidence Pack')) {
          const clean = it.title
            .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
            .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
            .trim();
          const currentPath = parentPath ? `${parentPath} / ${clean}` : clean;
          set.add(currentPath);
          if (it.items) extractFolders(it.items, currentPath);
        } else if (it.items) {
          extractFolders(it.items, parentPath);
        }
      });
    };
    extractFolders(outline);
    customFolders.forEach((cf) => {
      const clean = cf
        .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
        .trim();
      if (!clean.includes('Case Filings & Evidence Pack')) {
        set.add(clean);
      }
    });
    return Array.from(set);
  }, [outline, customFolders]);

  // Move document to folder directly (drag & drop or quick move)
  const handleMoveItemToFolder = async (docId: string, folderTitle: string) => {
    if (!caseId || isUpdatingBookmarks) return;
    let cleanGroup = folderTitle.replace(/^📅\s*/, '').trim();
    if (
      cleanGroup.toLowerCase().includes('case filings & evidence pack') ||
      cleanGroup.toLowerCase().includes('no sub-bookmark') ||
      cleanGroup === 'NONE' ||
      cleanGroup === '__NONE__'
    ) {
      cleanGroup = 'NONE';
    }

    try {
      setIsUpdatingBookmarks(true);
      const isNone = cleanGroup === 'NONE';
      const toastId = toast.loading(
        isNone
          ? 'Moving file directly under Case Filings (No Sub-Bookmark)...'
          : `Moving file into "${cleanGroup || 'Auto Date'}"...`
      );
      const res = await customFetch(API.DOCUMENTS.SET_BOOKMARK_GROUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          bookmark_group: cleanGroup,
          item_ids: [docId]
        })
      });
      if (res.ok) {
        toast.success(
          isNone
            ? 'Moved directly under Case Filings (No Sub-Bookmark)! Master PDF updated.'
            : `Moved to "${cleanGroup || 'Auto Date'}"! Master PDF updated.`,
          { id: toastId }
        );
        setReloadNonce((n) => n + 1);
        if (onBookmarksUpdated) onBookmarksUpdated();
      } else {
        toast.error('Failed to move bookmark item.', { id: toastId });
      }
    } catch (err) {
      console.error('Error moving bookmark item:', err);
      toast.error('Network error moving bookmark item.');
    } finally {
      setIsUpdatingBookmarks(false);
      setDragOverFolder(null);
      setQuickMoveMenuDocId(null);
    }
  };

  // Rename folder directly inline
  const handleRenameFolder = async (oldFolderTitle: string, newFolderTitle: string, itemIds: string[]) => {
    if (!caseId || !newFolderTitle.trim() || isUpdatingBookmarks) return;
    const cleanNew = newFolderTitle.replace(/^📅\s*/, '').trim();
    const cleanOld = oldFolderTitle.replace(/^📅\s*/, '').trim();
    if (cleanNew === cleanOld) {
      setEditingFolderId(null);
      return;
    }

    try {
      setIsUpdatingBookmarks(true);
      const toastId = toast.loading(`Renaming folder to "${cleanNew}"...`);
      const res = await customFetch(API.DOCUMENTS.SET_BOOKMARK_GROUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          old_bookmark_group: oldFolderTitle,
          bookmark_group: cleanNew,
          item_ids: itemIds
        })
      });
      if (res.ok) {
        toast.success(`Renamed to "${cleanNew}"! Master PDF updated.`, { id: toastId });
        setEditingFolderId(null);
        setCustomFolders((prev) =>
          prev.map((f) => (f === oldFolderTitle || f === `📅 ${cleanOld}` ? `📅 ${cleanNew}` : f))
        );
        setReloadNonce((n) => n + 1);
        if (onBookmarksUpdated) onBookmarksUpdated();
      } else {
        toast.error('Failed to rename bookmark folder.', { id: toastId });
      }
    } catch (err) {
      console.error('Error renaming bookmark folder:', err);
      toast.error('Network error renaming bookmark folder.');
    } finally {
      setIsUpdatingBookmarks(false);
    }
  };

  // Delete bookmark folder directly
  const handleDeleteFolder = async (folderTitle: string, itemIds?: string[]) => {
    if (!caseId || isUpdatingBookmarks) return;
    const clean = folderTitle.replace(/^📅\s*/, '').trim();
    if (!window.confirm(`Delete "${clean}" bookmark? Files inside will be moved to root without a sub-bookmark.`)) return;

    try {
      setIsUpdatingBookmarks(true);
      const toastId = toast.loading(`Deleting bookmark "${clean}"...`);
      const res = await customFetch(API.DOCUMENTS.SET_BOOKMARK_GROUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          delete_bookmark_group: folderTitle,
          item_ids: itemIds || []
        })
      });
      if (res.ok) {
        toast.success(`Bookmark "${clean}" deleted! Master PDF updated.`, { id: toastId });
        setCustomFolders((prev) =>
          prev.filter((f) => f !== folderTitle && f !== clean && f !== `📅 ${clean}`)
        );
        setReloadNonce((n) => n + 1);
        if (onBookmarksUpdated) onBookmarksUpdated();
      } else {
        toast.error('Failed to delete bookmark.', { id: toastId });
      }
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      toast.error('Network error deleting bookmark.');
    } finally {
      setIsUpdatingBookmarks(false);
    }
  };

  // Create new folder directly in bookmark UI
  const handleCreateNewFolder = () => {
    const trimmed = newFolderVal.trim();
    if (!trimmed) return;
    const cleanChild = trimmed
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
      .trim();

    let fullPath = cleanChild;
    if (parentFolderSelection) {
      const cleanParent = parentFolderSelection
        .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
        .trim();
      fullPath = `${cleanParent} / ${cleanChild}`;
    }

    if (!customFolders.includes(fullPath)) {
      setCustomFolders((prev) => [...prev, fullPath]);
    }
    setNewFolderVal('');
    setParentFolderSelection('');
    setIsAddingFolder(false);
    toast.success(
      parentFolderSelection
        ? `Sub-bookmark "${cleanChild}" added under "${parentFolderSelection}"! Drag files into it below.`
        : `Sub-bookmark "${cleanChild}" created! Drag files into it below.`
    );
  };

  // Add sub-bookmark directly inside an existing folder
  const handleCreateNestedFolder = (parentItem: OutlineItem) => {
    const trimmed = newSubFolderVal.trim();
    if (!trimmed) return;
    const cleanParent = (parentItem.fullPath || parentItem.title)
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
      .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
      .trim();
    const cleanChild = trimmed
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
      .trim();

    const nestedPath = `${cleanParent} / ${cleanChild}`;
    if (!customFolders.includes(nestedPath)) {
      setCustomFolders((prev) => [...prev, nestedPath]);
    }
    setNewSubFolderVal('');
    setAddingSubFolderParent(null);
    setExpandedKeys((prev) => new Set(prev).add(parentItem.id));
    toast.success(`Sub-bookmark "${cleanChild}" added under "${cleanParent}"! Drag files into it below.`);
  };

  // Save renamed folder name (preserves full parent path for nested folders)
  const saveFolderRename = (item: OutlineItem) => {
    const cleanNewNode = editingFolderVal
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
      .trim();
    if (!cleanNewNode) {
      setEditingFolderId(null);
      return;
    }
    const fullOldPath = (item.fullPath || item.title)
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
      .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
      .trim();

    let fullNewPath = cleanNewNode;
    if (fullOldPath.includes(' / ')) {
      const parts = fullOldPath.split(' / ');
      parts[parts.length - 1] = cleanNewNode;
      fullNewPath = parts.join(' / ');
    }

    const collectChildIds = (it: OutlineItem): string[] => {
      const ids: string[] = [];
      const match = getFilingItemForOutline(it);
      if (match?.id) ids.push(match.id);
      if (it.items) {
        it.items.forEach((child) => ids.push(...collectChildIds(child)));
      }
      return ids;
    };
    const childIds = collectChildIds(item);
    handleRenameFolder(fullOldPath, fullNewPath, childIds);
  };

  // 1. Initialize PDF.js and Load Document
  useEffect(() => {
    let isMounted = true;
    let loadingTask: any = null;

    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Dynamically load PDF.js client-side from public/pdfjs
        let pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) {
          const importDynamic = new Function('modulePath', 'return import(modulePath)');
          const mod = await importDynamic('/pdfjs/pdf.min.mjs');
          pdfjs = mod.default || mod || (window as any).pdfjsLib;
          if (pdfjs && pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
          }
          (window as any).pdfjsLib = pdfjs;
        }

        if (!pdfjs || !pdfjs.getDocument) {
          throw new Error('PDF.js library failed to initialize');
        }

        loadingTask = pdfjs.getDocument({
          url,
          cMapPacked: true,
          enableXfa: false
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        const preservePage = currentPageRef.current && currentPageRef.current <= doc.numPages ? currentPageRef.current : 1;
        setCurrentPage(preservePage);
        setPageInputVal(String(preservePage));

        // Extract bookmarks / outline
        try {
          const rawOutline = await doc.getOutline();
          if (rawOutline && rawOutline.length > 0) {
            const parsed = await parseOutlineRecursive(doc, rawOutline);
            if (isMounted) {
              setOutline(parsed);
              // Expand all folders by default so all bookmarks are immediately visible
              const allKeys = new Set<string>();
              const collectKeys = (items: OutlineItem[]) => {
                items.forEach((it) => {
                  if (it.items && it.items.length > 0) {
                    allKeys.add(it.id);
                    collectKeys(it.items);
                  }
                });
              };
              collectKeys(parsed);
              setExpandedKeys(allKeys);
              setActiveTab('outline');
            }
          } else {
            if (isMounted) {
              setOutline([]);
              setActiveTab('thumbnails');
            }
          }
        } catch (outlineErr) {
          console.warn('Error reading PDF outline:', outlineErr);
          if (isMounted) {
            setOutline([]);
            setActiveTab('thumbnails');
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Unable to open PDF document');
          setIsLoading(false);
        }
      }
    };

    if (url) {
      loadDocument();
    }

    return () => {
      isMounted = false;
      if (loadingTask) {
        loadingTask.destroy?.().catch(() => { });
      }
    };
  }, [url, reloadNonce]);

  // Helper: Parse PDF.js Outline items recursively
  const parseOutlineRecursive = async (
    doc: any,
    items: any[],
    level: number = 0,
    prefix: string = 'bm',
    parentPath: string = ''
  ): Promise<OutlineItem[]> => {
    if (!items || !Array.isArray(items)) return [];
    const results: OutlineItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const id = `${prefix}-${level}-${i}-${it.title || 'item'}`;
      let pageNum: number | null = null;

      if (it.dest) {
        try {
          let explicitDest = it.dest;
          if (typeof explicitDest === 'string') {
            explicitDest = await doc.getDestination(explicitDest);
          }
          if (Array.isArray(explicitDest) && explicitDest.length > 0) {
            const pageRef = explicitDest[0];
            if (typeof pageRef === 'number') {
              pageNum = pageRef + 1;
            } else if (pageRef && typeof pageRef === 'object') {
              const pIdx = await doc.getPageIndex(pageRef);
              pageNum = pIdx + 1;
            }
          }
        } catch (e) {
          // ignore dest resolution failure
        }
      }

      // Regex fallback: Check if title has "(Page X)" or "Page X" (common in legal filing packs)
      if (!pageNum && it.title) {
        const match = it.title.match(/Page\s*(\d+)/i);
        if (match && match[1]) {
          pageNum = parseInt(match[1], 10);
        }
      }

      // Compute hierarchical fullPath for folders
      const isRoot = (it.title || '').toLowerCase().includes('case filings & evidence pack');
      const cleanTitle = (it.title || '')
        .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
        .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
        .trim();

      const itemPath = isRoot ? '' : parentPath ? `${parentPath} / ${cleanTitle}` : cleanTitle;

      const children =
        it.items && it.items.length > 0
          ? await parseOutlineRecursive(doc, it.items, level + 1, id, itemPath)
          : undefined;

      // If parent folder has no direct page target, fallback to first child page
      if (!pageNum && children && children.length > 0 && children[0].pageNumber) {
        pageNum = children[0].pageNumber;
      }

      results.push({
        id,
        title: it.title || 'Untitled Section',
        pageNumber: pageNum,
        items: children,
        level,
        fullPath: itemPath
      });
    }

    return results;
  };

  // 2. Page Anchoring & Scroll Position Preservation
  // Captures the currently viewed page and relative scroll offset inside that page
  const capturePageAnchor = useCallback(() => {
    const container = scrollContainerRef.current;
    const pageNum = currentPageRef.current;
    const targetEl = pageRefs.current.get(pageNum);

    let ratioInPage = 0;
    if (container && targetEl) {
      const elRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = containerRect.top - elRect.top;
      if (elRect.height > 0 && offset > 0) {
        ratioInPage = Math.max(0, Math.min(1, offset / elRect.height));
      }
    }

    const anchor = { pageNum, ratioInPage };
    pendingScrollToPageRef.current = anchor;
    isAdjustingScrollRef.current = true;
    return anchor;
  }, []);

  // Restores container scrollTop to keep the anchored page in the exact same view
  const restorePageAnchor = useCallback(() => {
    const anchor = pendingScrollToPageRef.current || {
      pageNum: currentPageRef.current,
      ratioInPage: 0
    };
    const container = scrollContainerRef.current;
    const targetEl = pageRefs.current.get(anchor.pageNum);

    if (container && targetEl) {
      isAdjustingScrollRef.current = true;

      const elRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const elTopInContainer = elRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = Math.max(0, elTopInContainer + (anchor.ratioInPage * targetEl.offsetHeight));

      const prevBehavior = container.style.scrollBehavior;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = targetScrollTop;
      container.style.scrollBehavior = prevBehavior;

      setCurrentPage(anchor.pageNum);
      currentPageRef.current = anchor.pageNum;
      setPageInputVal(String(anchor.pageNum));
    }

    const timer = setTimeout(() => {
      isAdjustingScrollRef.current = false;
      pendingScrollToPageRef.current = null;
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // Synchronously adjust scroll position when scale changes before browser paint
  useIsomorphicLayoutEffect(() => {
    if (prevScaleRef.current === scale) return;
    prevScaleRef.current = scale;
    restorePageAnchor();
  }, [scale, restorePageAnchor]);

  // 3. Resizable Sidebar & Fluid Grid Layout
  const COMPACT_SIDEBAR_WIDTH = 320;

  const getExpandedWidth = useCallback(() => {
    if (!viewerContainerRef.current) return 580;
    const containerWidth = viewerContainerRef.current.clientWidth || window.innerWidth;
    return Math.min(880, Math.max(480, Math.floor(containerWidth * 0.65)));
  }, []);

  const isExpandedGrid = sidebarWidth > 420;

  // Dedicated helper to reliably scroll thumbnail container to active or target page
  const scrollThumbnailIntoView = useCallback((
    pageNum?: number,
    options: { behavior?: ScrollBehavior; block?: 'center' | 'nearest' } = {}
  ) => {
    const targetPage = pageNum ?? currentPageRef.current;
    const container = thumbnailContainerRef.current;
    if (!container || !targetPage || targetPage < 1) return;

    const item = container.querySelector<HTMLElement>(`[data-thumbnail-page="${targetPage}"]`);
    if (!item) return;

    const block = options.block ?? 'nearest';
    const behavior = options.behavior ?? 'smooth';

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    if (containerRect.height <= 0) return;

    const currentScrollTop = container.scrollTop;
    const itemRelativeTop = (itemRect.top - containerRect.top) + currentScrollTop;

    if (block === 'center') {
      const targetScrollTop = itemRelativeTop - (container.clientHeight / 2) + (itemRect.height / 2);
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior,
      });
    } else {
      const itemTopRel = itemRect.top - containerRect.top;
      const itemBottomRel = itemRect.bottom - containerRect.top;
      const padding = 16;

      if (itemTopRel < padding) {
        container.scrollTo({
          top: Math.max(0, currentScrollTop + itemTopRel - padding),
          behavior,
        });
      } else if (itemBottomRel > container.clientHeight - padding) {
        container.scrollTo({
          top: currentScrollTop + (itemBottomRel - container.clientHeight) + padding,
          behavior,
        });
      }
    }
  }, []);

  const toggleExpandGrid = useCallback(() => {
    capturePageAnchor();
    const isExpanding = sidebarWidth <= 420;
    const targetWidth = isExpanding ? getExpandedWidth() : COMPACT_SIDEBAR_WIDTH;
    setSidebarWidth(targetWidth);

    // Staged sync during and right after drawer animation to keep active page centered
    const t1 = setTimeout(() => {
      scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
    }, 100);
    const t2 = setTimeout(() => {
      scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
      restorePageAnchor();
    }, 320);
    const t3 = setTimeout(() => {
      scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
      restorePageAnchor();
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [sidebarWidth, getExpandedWidth, capturePageAnchor, scrollThumbnailIntoView, restorePageAnchor]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    capturePageAnchor();
    setIsResizing(true);
  }, [capturePageAnchor]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!viewerContainerRef.current) return;
      const containerLeft = viewerContainerRef.current.getBoundingClientRect().left;
      const containerWidth = viewerContainerRef.current.clientWidth || window.innerWidth;
      const maxAllowed = Math.min(950, Math.floor(containerWidth * 0.75));
      const newWidth = Math.max(180, Math.min(maxAllowed, e.clientX - containerLeft));
      
      pendingWidthRef.current = newWidth;
      // High-performance RAF throttle: dispatches setState at display refresh rate
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          setSidebarWidth(pendingWidthRef.current);
          scrollThumbnailIntoView(currentPageRef.current, { behavior: 'auto', block: 'nearest' });
          rafIdRef.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setSidebarWidth(pendingWidthRef.current);
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      restorePageAnchor();
      setTimeout(() => {
        scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
      }, 50);
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, scrollThumbnailIntoView, restorePageAnchor]);

  // Keep thumbnail list in sync when current page changes
  useEffect(() => {
    if (activeTab === 'thumbnails' && sidebarOpen && !isResizing) {
      scrollThumbnailIntoView(currentPage, { behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage, activeTab, sidebarOpen, isResizing, scrollThumbnailIntoView]);

  // ResizeObserver on thumbnail container to maintain current page centering across any layout shift
  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let prevWidth = container.clientWidth;
    let resizeTimer: NodeJS.Timeout | null = null;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.round(entry.contentRect.width);
        if (Math.abs(newWidth - prevWidth) >= 15) {
          prevWidth = newWidth;
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
          }, 80);
        }
      }
    });

    ro.observe(container);
    return () => {
      ro.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [scrollThumbnailIntoView]);

  // 4. Zoom Calculations (Fit-Width, Fit-Page, Custom)
  const calculateFitScale = useCallback(
    async (mode: 'fit-width' | 'fit-page') => {
      if (!pdfDoc || pdfDoc.destroyed || !pdfDoc._transport || !scrollContainerRef.current) return;
      try {
        capturePageAnchor();
        const page1 = await pdfDoc.getPage(1);
        const vp = page1.getViewport({ scale: 1, rotation });
        const container = scrollContainerRef.current;
        const availableWidth = container.clientWidth - 48;
        const availableHeight = container.clientHeight - 48;

        let computedScale = scale;
        if (mode === 'fit-width') {
          computedScale = Math.max(0.4, Math.min(3.0, (availableWidth - 32) / vp.width));
          setZoomMode('fit-width');
        } else if (mode === 'fit-page') {
          const widthRatio = (availableWidth - 32) / vp.width;
          const heightRatio = (availableHeight - 32) / vp.height;
          computedScale = Math.max(0.4, Math.min(3.0, Math.min(widthRatio, heightRatio)));
          setZoomMode('fit-page');
        }

        if (Math.abs(computedScale - scale) > 0.005) {
          setScale(computedScale);
        } else {
          // Scale unchanged; directly restore anchor position
          restorePageAnchor();
        }
      } catch (err) {
        console.warn('Error computing fit scale:', err);
      }
    },
    [pdfDoc, rotation, scale, capturePageAnchor, restorePageAnchor]
  );

  // Recalculate fit-scale when zoom mode, sidebar open, or width settles
  useEffect(() => {
    // Crucial for fluidity: avoid expensive PDF canvas re-renders while dragging
    if (isResizing) return;

    // Small debounce (180ms) lets CSS transitions settle before recomputing fit
    const timer = setTimeout(() => {
      if (zoomMode === 'fit-width') {
        calculateFitScale('fit-width');
      } else if (zoomMode === 'fit-page') {
        calculateFitScale('fit-page');
      } else {
        restorePageAnchor();
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [zoomMode, sidebarWidth, sidebarOpen, rotation, isFullscreen, isResizing, calculateFitScale, restorePageAnchor]);

  // Window resize handler to maintain fit-width/fit-page
  useEffect(() => {
    const handleResize = () => {
      capturePageAnchor();
      if (zoomMode === 'fit-width') calculateFitScale('fit-width');
      else if (zoomMode === 'fit-page') calculateFitScale('fit-page');
      else restorePageAnchor();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomMode, calculateFitScale, capturePageAnchor, restorePageAnchor]);

  // 5. Page Navigation & Smooth Scrolling
  const scrollToPage = useCallback((pageNum: number, smooth: boolean = true) => {
    if (!pageNum || pageNum < 1 || !scrollContainerRef.current) return;
    const targetEl = pageRefs.current.get(pageNum);
    const container = scrollContainerRef.current;
    if (targetEl && container) {
      isAdjustingScrollRef.current = true;
      pendingScrollToPageRef.current = { pageNum, ratioInPage: 0 };

      // Far jumps (more than 2 pages away) must jump instantly to avoid rendering dozens of intermediate pages
      const isFarJump = Math.abs(currentPageRef.current - pageNum) > 2;
      const behavior = smooth && !isFarJump ? 'smooth' : 'auto';

      targetEl.scrollIntoView({
        behavior,
        block: 'start'
      });

      setCurrentPage(pageNum);
      currentPageRef.current = pageNum;
      setPageInputVal(String(pageNum));

      // Subtle flash animation to indicate jumped page
      targetEl.classList.add('ring-4', 'ring-indigo-300', 'transition-all');
      setTimeout(() => {
        targetEl.classList.remove('ring-4', 'ring-indigo-300');
        isAdjustingScrollRef.current = false;
        pendingScrollToPageRef.current = null;
      }, isFarJump ? 100 : 400);
    }
  }, []);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInputVal, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      scrollToPage(p);
    } else {
      setPageInputVal(String(currentPageRef.current));
    }
  };

  // 6. Real-time Active Page Syncing on Scroll (Deterministic Binary Search)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    const updateCurrentPageFromScroll = () => {
      // Don't override while executing a jump or scale adjustment
      if (isAdjustingScrollRef.current) return;

      const containerRect = container.getBoundingClientRect();
      // Target line is just below top toolbar (e.g. 100px from top of scroll container)
      const targetY = containerRect.top + Math.min(120, container.clientHeight * 0.25);

      // Binary search for page intersecting targetY
      let low = 1;
      let high = numPages;
      let foundPage = 1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const el = pageRefs.current.get(mid);
        if (!el) {
          high = mid - 1;
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.top <= targetY && rect.bottom >= targetY) {
          foundPage = mid;
          break;
        } else if (rect.top > targetY) {
          high = mid - 1;
        } else {
          foundPage = mid;
          low = mid + 1;
        }
      }

      if (foundPage >= 1 && foundPage <= numPages && foundPage !== currentPageRef.current) {
        setCurrentPage(foundPage);
        currentPageRef.current = foundPage;
        setPageInputVal(String(foundPage));
      }
    };

    const handleScroll = () => {
      if (scrollRafIdRef.current !== null) return;
      scrollRafIdRef.current = requestAnimationFrame(() => {
        updateCurrentPageFromScroll();
        scrollRafIdRef.current = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollRafIdRef.current !== null) {
        cancelAnimationFrame(scrollRafIdRef.current);
        scrollRafIdRef.current = null;
      }
    };
  }, [numPages, scale]);

  // 6. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentPage < numPages) scrollToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentPage > 1) scrollToPage(currentPage - 1);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        capturePageAnchor();
        setZoomMode('custom');
        setScale((prev) => Math.min(3.0, prev + 0.15));
      } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        capturePageAnchor();
        setZoomMode('custom');
        setScale((prev) => Math.max(0.4, prev - 0.15));
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        capturePageAnchor();
        calculateFitScale('fit-width');
      } else if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, searchOpen, calculateFitScale, scrollToPage, capturePageAnchor]);

  // 7. Hand Tool Pan Dragging
  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (!isHandTool || !scrollContainerRef.current) return;
    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    };
    scrollContainerRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (!isPanningRef.current || !scrollContainerRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUpPan = () => {
    if (isPanningRef.current && scrollContainerRef.current) {
      isPanningRef.current = false;
      scrollContainerRef.current.style.cursor = isHandTool ? 'grab' : 'default';
    }
  };

  // 8. Search in Document Implementation
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !pdfDoc) {
      setSearchResults([]);
      setCurrentMatchIdx(0);
      return;
    }

    setIsSearching(true);
    const matches: { page: number; index: number }[] = [];
    const normalized = query.toLowerCase();

    try {
      for (let p = 1; p <= numPages; p++) {
        if (!pdfDoc || pdfDoc.destroyed || !pdfDoc._transport) break;
        const page = await pdfDoc.getPage(p);
        const content = await page.getTextContent();
        const fullText = content.items.map((it: any) => it.str).join(' ');
        if (fullText.toLowerCase().includes(normalized)) {
          matches.push({ page: p, index: matches.length });
        }
      }
      setSearchResults(matches);
      setCurrentMatchIdx(0);
      if (matches.length > 0) {
        scrollToPage(matches[0].page);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const nextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % searchResults.length;
    setCurrentMatchIdx(nextIdx);
    scrollToPage(searchResults[nextIdx].page);
  };

  const prevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIdx(prevIdx);
    scrollToPage(searchResults[prevIdx].page);
  };

  // 9. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 10. Print
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    printFrame.src = url;
    document.body.appendChild(printFrame);
    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow?.print();
        } catch (e) {
          window.open(url, '_blank')?.print();
        }
      }, 500);
    };
  };

  // Bookmark tree toggle
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered bookmarks
  const filteredOutline = useMemo(() => {
    if (!outlineSearch.trim()) return outline;
    const q = outlineSearch.toLowerCase();

    const filterItem = (item: OutlineItem): OutlineItem | null => {
      const matchSelf = item.title.toLowerCase().includes(q);
      const filteredChildren = item.items
        ? (item.items.map(filterItem).filter(Boolean) as OutlineItem[])
        : [];
      if (matchSelf || filteredChildren.length > 0) {
        return {
          ...item,
          items: filteredChildren.length > 0 ? filteredChildren : item.items
        };
      }
      return null;
    };

    return outline.map(filterItem).filter(Boolean) as OutlineItem[];
  }, [outline, outlineSearch]);

  // Helper to parse clean Google-style outline labels
  const parseBookmarkDisplay = useCallback((rawTitle: string, isFolder: boolean = false) => {
    // 1. Table of Contents
    if (rawTitle.toLowerCase().includes('case overview & table of contents')) {
      return {
        type: 'toc' as const,
        docName: 'Case Overview & Table of Contents'
      };
    }

    // 2. Root filing pack
    if (rawTitle.toLowerCase().includes('case filings & evidence pack')) {
      return {
        type: 'root' as const,
        docName: 'Case Filings & Evidence Pack'
      };
    }

    // 3. Folder (Date or custom sub-bookmark folder)
    const isFolderTitle =
      isFolder ||
      rawTitle.startsWith('📅') ||
      rawTitle.startsWith('📁') ||
      rawTitle.startsWith('📂') ||
      rawTitle.toLowerCase().startsWith('date:');

    if (isFolderTitle) {
      const cleanFolder = rawTitle
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
        .trim();
      return {
        type: 'date' as const,
        docName: cleanFolder || 'Bookmark Folder'
      };
    }

    // 4. Leaf Document
    const isForm = rawTitle.includes('🏛️') || rawTitle.toLowerCase().includes('form');
    const isPhoto = rawTitle.includes('🖼️') || rawTitle.toLowerCase().includes('photo');

    // Strip emojis and trailing (Page X)
    let clean = rawTitle
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
      .trim();

    // Extract sequence number e.g. "4. Annexure 2 [The true copy...]"
    const seqMatch = clean.match(/^(\d+)\.\s*(.*)$/);
    let seqNumber = '';
    let rest = clean;
    if (seqMatch) {
      seqNumber = seqMatch[1];
      rest = seqMatch[2].trim();
    }

    // Extract bracket content [Annexure description]
    const bracketMatch = rest.match(/^(.*?)\s*\[(.*?)\]\s*$/);
    let docName = rest;
    let annexureText = '';
    if (bracketMatch) {
      docName = bracketMatch[1].trim();
      annexureText = bracketMatch[2].trim();
    }

    return {
      type: 'doc' as const,
      seqNumber,
      docName,
      annexureText,
      isForm,
      isPhoto
    };
  }, []);

  // Outline Tree Item Component with Direct Drag & Drop, Inline Rename, Sub-Bookmark Creator & Quick Move
  const renderOutlineItem = (item: OutlineItem) => {
    const isRootFilingFolder = item.title.includes('Case Filings & Evidence Pack');
    const isFolder =
      !isRootFilingFolder &&
      (Boolean(item.items && item.items.length > 0) ||
        item.title.startsWith('📅') ||
        item.title.startsWith('📁') ||
        item.title.startsWith('📂') ||
        item.title.toLowerCase().startsWith('date:') ||
        customFolders.includes(item.fullPath || item.title));

    const isDateFolder =
      isFolder && (item.title.startsWith('📅') || item.title.toLowerCase().startsWith('date:'));
    const isSubFolder = isFolder && !isDateFolder;

    // Clean path of this item for matching children
    const myCleanPath = (item.fullPath || item.title)
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
      .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
      .trim();

    // Any empty custom sub-folders nested inside this folder
    const matchingCustomSubFolders = isFolder
      ? customFolders.filter((cf) => {
          const parent = cf.includes(' / ') ? cf.substring(0, cf.lastIndexOf(' / ')).trim() : '';
          return (
            parent === myCleanPath &&
            !item.items?.some((ch) => (ch.fullPath || ch.title).includes(cf.split(' / ').pop()!))
          );
        })
      : [];

    const hasChildren = Boolean((item.items && item.items.length > 0) || matchingCustomSubFolders.length > 0);
    const isExpanded = expandedKeys.has(item.id);
    const isCurrentPage = item.pageNumber === currentPage;
    const targetKey = item.fullPath || item.title;
    const isDropTarget = dragOverFolder === targetKey;

    const parsed = parseBookmarkDisplay(item.title, isFolder);
    const isToc = parsed.type === 'toc';
    const isBookmarkNode = isRootFilingFolder || isFolder || isToc;

    // Is this a leaf document?
    const isLeafDocument = !isBookmarkNode;
    const matchingDoc = isLeafDocument ? getFilingItemForOutline(item) : null;
    const isQuickMoveOpen = Boolean(matchingDoc && quickMoveMenuDocId === matchingDoc.id);

    return (
      <div key={item.id} className="select-none text-xs relative group/item">
        <div
          draggable={Boolean(caseId && isLeafDocument && matchingDoc)}
          onDragStart={(e) => {
            if (matchingDoc) {
              e.dataTransfer.setData('text/plain', matchingDoc.id);
              e.dataTransfer.effectAllowed = 'move';
              setDraggedDoc({ id: matchingDoc.id, title: item.title });
            }
          }}
          onDragEnd={() => {
            setDraggedDoc(null);
            setDragOverFolder(null);
          }}
          onDragOver={(e) => {
            if (draggedDoc && (isFolder || isRootFilingFolder)) {
              e.preventDefault();
              e.stopPropagation();
              if (dragOverFolder !== targetKey) {
                setDragOverFolder(targetKey);
              }
            }
          }}
          onDragLeave={(e) => {
            if (dragOverFolder === targetKey) {
              setDragOverFolder(null);
            }
          }}
          onDrop={(e) => {
            if (isFolder || isRootFilingFolder) {
              e.preventDefault();
              e.stopPropagation();
              const docId = e.dataTransfer.getData('text/plain') || draggedDoc?.id;
              if (docId) {
                handleMoveItemToFolder(docId, isRootFilingFolder ? 'NONE' : targetKey);
              }
            }
          }}
          onClick={() => {
            if (editingFolderId === item.id) return;
            if (item.pageNumber) {
              scrollToPage(item.pageNumber);
            } else if (hasChildren) {
              setExpandedKeys((prev) => {
                const next = new Set(prev);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
              });
            }
          }}
          className={`flex items-center gap-2 py-1 px-2 mx-1 rounded-md cursor-pointer transition-colors ${
            isDropTarget
              ? 'bg-[#630515]/10 ring-2 ring-[#630515] font-bold'
              : isCurrentPage
                ? 'bg-zinc-100 text-black font-semibold'
                : 'text-black hover:bg-zinc-50'
          }`}
          style={{ paddingLeft: `${Math.max(6, item.level * 14 + 6)}px` }}
        >
          {/* Grip Icon for draggable documents */}
          {caseId && isLeafDocument && matchingDoc && (
            <div
              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 opacity-0 group-hover/item:opacity-100 hover:text-black cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
              title="Drag and drop to move"
            >
              <GripVertical className="w-3 h-3 text-black" />
            </div>
          )}

          {/* Chevron for expand/collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(item.id, e)}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-200 text-[#630515] shrink-0 transition-transform"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#630515]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#630515]" />
              )}
            </button>
          ) : !isLeafDocument ? (
            <span className="w-4 shrink-0" />
          ) : null}

          {/* Icons: Bookmark & Sub-Bookmark in #630515, Documents in black */}
          {isToc ? (
            <Bookmark className="w-4 h-4 text-[#630515] shrink-0" />
          ) : isRootFilingFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#630515] shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[#630515] shrink-0" />
            )
          ) : isDateFolder ? (
            <Calendar className="w-4 h-4 text-[#630515] shrink-0" />
          ) : isSubFolder ? (
            <Folder className="w-4 h-4 text-[#630515] shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-black shrink-0" />
          )}

          {/* Title or Inline Edit Form */}
          {editingFolderId === item.id ? (
            <div
              className="flex items-center gap-1 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                autoFocus
                value={editingFolderVal}
                onChange={(e) => setEditingFolderVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveFolderRename(item);
                  } else if (e.key === 'Escape') {
                    setEditingFolderId(null);
                  }
                }}
                className="w-full text-xs font-semibold px-2 py-1 bg-white border border-[#630515] rounded text-[#630515] outline-none"
              />
              <button
                type="button"
                onClick={() => saveFolderRename(item)}
                className="p-1 rounded text-[#630515] hover:bg-[#630515]/10 transition-colors shrink-0"
                title="Save name"
              >
                <Check className="w-3.5 h-3.5 text-[#630515]" />
              </button>
              <button
                type="button"
                onClick={() => setEditingFolderId(null)}
                className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors shrink-0"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDoubleClick={(e) => {
                if (caseId && isFolder) {
                  e.stopPropagation();
                  setEditingFolderId(item.id);
                  const nodeTitle =
                    (item.fullPath ? item.fullPath.split(' / ').pop() : item.title) || item.title;
                  setEditingFolderVal(
                    nodeTitle
                      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
                      .trim()
                  );
                }
              }}
              className="flex flex-col min-w-0 flex-1 leading-snug"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {parsed.seqNumber && (
                  <span className="text-xs font-bold font-mono shrink-0 text-black">
                    {parsed.seqNumber}.
                  </span>
                )}
                <span
                  className={`text-xs tracking-tight truncate ${
                    isBookmarkNode
                      ? 'font-bold text-[#630515]'
                      : 'font-semibold text-black'
                  }`}
                >
                  {parsed.docName}
                </span>
                {isFolder && (item.items || matchingCustomSubFolders.length > 0) && (
                  <span className="text-[11px] text-[#630515] font-semibold font-mono shrink-0">
                    ({(item.items?.length || 0) + matchingCustomSubFolders.length})
                  </span>
                )}
              </div>
              {parsed.annexureText && (
                <span
                  className="text-xs text-black font-normal truncate block text-left mt-0.5 tracking-tight"
                  title={parsed.annexureText}
                >
                  [{parsed.annexureText}]
                </span>
              )}
            </div>
          )}

          {/* Drop target badge */}
          {isDropTarget && (
            <span className="text-[10px] bg-[#630515] text-white px-2 py-0.5 rounded font-medium shrink-0">
              {isRootFilingFolder ? 'Drop here (No Sub-Bookmark)' : 'Drop here'}
            </span>
          )}

          {/* Action on Folder Hover: Add Sub-Bookmark (+), Rename (Edit2), Delete (Trash2) */}
          {caseId && isFolder && editingFolderId !== item.id && (
            <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingSubFolderParent(addingSubFolderParent === item.id ? null : item.id);
                  setNewSubFolderVal('');
                  setExpandedKeys((prev) => new Set(prev).add(item.id));
                }}
                className="p-1 text-[#630515] hover:bg-[#630515]/10 rounded transition-colors"
                title="Add sub-bookmark inside this folder"
              >
                <Plus className="w-3 h-3 text-[#630515] stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolderId(item.id);
                  const nodeTitle =
                    (item.fullPath ? item.fullPath.split(' / ').pop() : item.title) || item.title;
                  setEditingFolderVal(
                    nodeTitle
                      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
                      .trim()
                  );
                }}
                className="p-1 text-[#630515] hover:bg-[#630515]/10 rounded transition-colors"
                title="Rename bookmark folder"
              >
                <Edit2 className="w-3 h-3 text-[#630515]" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const collectChildIds = (it: OutlineItem): string[] => {
                    const ids: string[] = [];
                    const match = getFilingItemForOutline(it);
                    if (match?.id) ids.push(match.id);
                    if (it.items) it.items.forEach((child) => ids.push(...collectChildIds(child)));
                    return ids;
                  };
                  const childIds = collectChildIds(item);
                  handleDeleteFolder(item.fullPath || item.title, childIds);
                }}
                className="p-1 text-[#630515] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Delete bookmark folder"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Action on Document Leaf Hover: Simple Move button */}
          {caseId && isLeafDocument && matchingDoc && (
            <div className="opacity-0 group-hover/item:opacity-100 flex items-center shrink-0 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickMoveMenuDocId(
                    quickMoveMenuDocId === matchingDoc.id ? null : matchingDoc.id
                  );
                }}
                className="px-2 py-0.5 text-[10px] font-medium text-black bg-white hover:bg-zinc-100 border border-zinc-300 rounded shadow-2xs transition-colors"
                title="Move document into another Date Sub-Bookmark"
              >
                Move
              </button>
            </div>
          )}

          {/* Simple Page Badge */}
          {item.pageNumber && (
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-200 shrink-0">
              p. {item.pageNumber}
            </span>
          )}
        </div>

        {/* Inline Sub-Bookmark Creator under this folder */}
        {addingSubFolderParent === item.id && (
          <div
            className="my-1.5 ml-6 mr-1 p-2.5 bg-[#630515]/5 border border-[#630515]/20 rounded-lg space-y-1.5 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#630515] flex items-center gap-1">
                <FolderPlus className="w-3.5 h-3.5 text-[#630515]" />
                Add sub-bookmark under &quot;{parsed.docName}&quot;
              </span>
              <button
                type="button"
                onClick={() => setAddingSubFolderParent(null)}
                className="text-zinc-400 hover:text-[#630515] p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Pleadings, Annexures, Evidence..."
                value={newSubFolderVal}
                onChange={(e) => setNewSubFolderVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNestedFolder(item);
                  if (e.key === 'Escape') setAddingSubFolderParent(null);
                }}
                className="flex-1 text-xs px-2.5 py-1 bg-white border border-zinc-300 rounded text-black placeholder:text-zinc-400 outline-none focus:border-[#630515] font-medium"
              />
              <button
                type="button"
                onClick={() => handleCreateNestedFolder(item)}
                disabled={!newSubFolderVal.trim()}
                className="px-2.5 py-1 text-xs font-semibold bg-[#630515] text-white rounded hover:bg-[#4d0410] disabled:opacity-40 transition-colors shadow-2xs active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Quick Move Dropdown Popover */}
        {isQuickMoveOpen && matchingDoc && (
          <div
            className="my-1 ml-6 p-2 bg-white rounded-xl shadow-lg border border-zinc-200 z-30 animate-in fade-in space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                Move Document:
              </span>
              <button
                type="button"
                onClick={() => setQuickMoveMenuDocId(null)}
                className="text-black hover:text-zinc-600 p-0.5"
              >
                <X className="w-3 h-3 text-black" />
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
              {/* Option: No Sub-Bookmark (Direct under Case Filings root) */}
              <button
                type="button"
                onClick={() => handleMoveItemToFolder(matchingDoc.id, 'NONE')}
                className="w-full text-left px-2 py-1.5 text-xs font-semibold text-black hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-2 border border-zinc-200"
                title="Remove from any sub-bookmark folder and place directly under Case Filings"
              >
                <Folder className="w-3.5 h-3.5 text-black shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-bold text-black">No Sub-Bookmark</span>
                  <span className="text-[10px] text-zinc-600 font-normal">
                    Directly under Case Filings root
                  </span>
                </div>
              </button>

              <div className="my-1 border-t border-zinc-100" />
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#630515] px-1 pb-0.5">
                Sub-Bookmarks:
              </div>

              {allFolderTitles.map((fTitle) => {
                const parts = fTitle.split(' / ');
                const isNested = parts.length > 1;
                const leafName = parts[parts.length - 1];
                const parentName = parts.slice(0, -1).join(' / ');
                return (
                  <button
                    key={fTitle}
                    type="button"
                    onClick={() => handleMoveItemToFolder(matchingDoc.id, fTitle)}
                    style={{ paddingLeft: `${Math.max(8, (parts.length - 1) * 14 + 8)}px` }}
                    className="w-full text-left py-1 pr-2 text-xs font-semibold text-black hover:bg-[#630515]/5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isNested ? (
                      <Folder className="w-3 h-3 text-[#630515] shrink-0" />
                    ) : (
                      <Calendar className="w-3 h-3 text-[#630515] shrink-0" />
                    )}
                    <span className="truncate text-black">
                      {isNested ? `↳ ${leafName}` : fTitle}
                    </span>
                    {isNested && (
                      <span className="text-[10px] text-zinc-500 font-normal shrink-0 truncate ml-auto">
                        ({parentName})
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="my-1 border-t border-zinc-100" />
              <button
                type="button"
                onClick={() => handleMoveItemToFolder(matchingDoc.id, '')}
                className="w-full text-left px-2 py-1 text-xs font-semibold text-black hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Reset to Auto Date Grouping
              </button>
            </div>
          </div>
        )}

        {/* Children items with simple hierarchy guide line */}
        {hasChildren && isExpanded && (
          <div className="ml-3 pl-2 border-l border-zinc-200 space-y-0.5 my-0.5">
            {/* Any empty custom sub-folders nested inside this folder */}
            {matchingCustomSubFolders.map((cf) => {
              const subTitle = cf.split(' / ').pop()!;
              const isDropTarget = dragOverFolder === cf;
              return (
                <div
                  key={cf}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverFolder !== cf) setDragOverFolder(cf);
                  }}
                  onDragLeave={() => {
                    if (dragOverFolder === cf) setDragOverFolder(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const docId = e.dataTransfer.getData('text/plain') || draggedDoc?.id;
                    if (docId) handleMoveItemToFolder(docId, cf);
                  }}
                  className={`my-1 p-1.5 rounded-lg border border-dashed transition-all flex items-center justify-between gap-2 ${
                    isDropTarget
                      ? 'bg-[#630515]/10 ring-2 ring-[#630515] border-[#630515]'
                      : 'bg-[#630515]/5 border-[#630515]/30 hover:bg-[#630515]/10 text-[#630515]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Folder className="w-3.5 h-3.5 text-[#630515] shrink-0" />
                    <span className="text-xs font-semibold text-[#630515] truncate">{subTitle}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-semibold text-[#630515] bg-white border border-[#630515]/30 px-1.5 py-0.5 rounded shadow-2xs">
                      Drop file here
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomFolders((prev) => prev.filter((f) => f !== cf))}
                      className="p-1 text-zinc-400 hover:text-red-700 rounded"
                      title="Remove empty sub-bookmark"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            {item.items && item.items.map(renderOutlineItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={viewerContainerRef}
      className={`flex flex-col w-full bg-slate-100 select-none overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'relative rounded-2xl h-full min-h-0'
        }`}
      style={{ fontFamily: "var(--font-google), 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP TOOLBAR (Google Native PDF Style, Clean Light Theme, UI Matching)   */}
      {/* ========================================================================= */}
      <header className="h-13 bg-white border-b border-slate-200/90 px-3 flex items-center justify-between gap-2 shrink-0 z-20 shadow-xs sticky top-0">
        {/* Left Section: Sidebar Toggle & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              capturePageAnchor();
              setSidebarOpen((prev) => !prev);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${sidebarOpen
              ? 'bg-slate-100 border-slate-300 text-slate-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-2 truncate">
            <span
              className="text-xs font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[280px]"
              title={title}
            >
              {title}
            </span>
            {numPages > 0 && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                {numPages} pages
              </span>
            )}
          </div>
        </div>

        {/* Center Section: Page Navigation & Zoom Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Page Jumping */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center px-1">
              <input
                type="text"
                value={pageInputVal}
                onChange={(e) => setPageInputVal(e.target.value)}
                onBlur={() => setPageInputVal(String(currentPageRef.current))}
                className="w-9 text-center text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <span className="text-xs text-slate-500 font-medium ml-1.5">
                / {numPages || 1}
              </span>
            </form>

            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => {
                capturePageAnchor();
                setZoomMode('custom');
                setScale((prev) => Math.max(0.4, Number((prev - 0.15).toFixed(2))));
              }}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Zoom Out (Ctrl -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom presets dropdown */}
            <select
              value={zoomMode === 'custom' ? `${Math.round(scale * 100)}%` : zoomMode}
              onChange={(e) => {
                capturePageAnchor();
                const val = e.target.value;
                if (val === 'fit-width') {
                  setZoomMode('fit-width');
                  calculateFitScale('fit-width');
                } else if (val === 'fit-page') {
                  setZoomMode('fit-page');
                  calculateFitScale('fit-page');
                } else {
                  setZoomMode('custom');
                  setScale(parseInt(val, 10) / 100);
                }
              }}
              className="text-[11px] font-semibold text-slate-700 bg-transparent border-none py-0.5 px-1.5 focus:outline-none cursor-pointer"
            >
              <option value="fit-width">Fit Width</option>
              <option value="fit-page">Fit Page</option>
              <option value="50%">50%</option>
              <option value="75%">75%</option>
              <option value="100%">100%</option>
              <option value="125%">125%</option>
              <option value="150%">150%</option>
              <option value="200%">200%</option>
            </select>

            <button
              onClick={() => {
                capturePageAnchor();
                setZoomMode('custom');
                setScale((prev) => Math.min(3.0, Number((prev + 0.15).toFixed(2))));
              }}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Fit Width Button */}
          <button
            onClick={() => {
              capturePageAnchor();
              setZoomMode('fit-width');
              calculateFitScale('fit-width');
            }}
            className={`p-1.5 rounded-lg border transition-colors hidden md:flex items-center gap-1 text-[11px] font-medium ${zoomMode === 'fit-width'
              ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            title="Fit to Width"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Fit</span>
          </button>
        </div>

        {/* Right Section: Tool Mode, Rotate, Search, Print, Download, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Hand Tool vs Text Selection */}
          <button
            onClick={() => setIsHandTool((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${isHandTool
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            title={isHandTool ? 'Switch to Text Selection Tool' : 'Switch to Hand (Pan) Tool'}
          >
            {isHandTool ? (
              <Hand className="w-3.5 h-3.5" />
            ) : (
              <MousePointer className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Rotate Clockwise */}
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Rotate Clockwise 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (!searchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            className={`p-1.5 rounded-lg border transition-colors ${searchOpen
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            title="Search in Document (Ctrl + F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors hidden sm:block"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>



          {/* Download */}
          <button
            onClick={onDownload || (() => window.open(url, '_blank'))}
            className="p-1.5 rounded-lg bg-[#0e2340] text-white hover:opacity-90 shadow-xs transition-opacity flex items-center gap-1 text-[11px] font-semibold px-2.5"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Download</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FLOATING SEARCH BAR (If Active)                                        */}
      {/* ========================================================================= */}
      {searchOpen && (
        <div className="absolute top-15 right-6 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Find in document..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="text-xs text-slate-800 bg-transparent border-none focus:outline-none w-44"
          />

          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          ) : searchResults.length > 0 ? (
            <span className="text-[11px] text-slate-500 font-mono">
              {currentMatchIdx + 1} of {searchResults.length}
            </span>
          ) : searchQuery ? (
            <span className="text-[11px] text-amber-600 font-medium">No matches</span>
          ) : null}

          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
            <button
              onClick={prevMatch}
              disabled={searchResults.length === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
              title="Previous Match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextMatch}
              disabled={searchResults.length === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
              title="Next Match"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSearchOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-1"
              title="Close Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE: RESIZABLE SIDEBAR + DOCUMENT VIEW                       */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex w-full relative overflow-hidden bg-slate-200/70">
        {/* Floating Quick-Open Button when Sidebar is Minimized/Closed */}
        {!sidebarOpen && (
          <div className="absolute left-3 top-3 z-30">
            <button
              onClick={() => {
                capturePageAnchor();
                setSidebarOpen(true);
                setTimeout(() => {
                  scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
                }, 320);
              }}
              className="bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/90 shadow-md hover:shadow-lg rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm transition-all group active:scale-95"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
              <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900">
                {activeTab === 'thumbnails' ? `Pages (${numPages})` : 'Bookmarks'}
              </span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* A. FLUID RESIZABLE SIDEBAR (BOOKMARKS & THUMBNAILS)           */}
        {/* ------------------------------------------------------------- */}
        <aside
          style={{
            width: sidebarOpen ? `${sidebarWidth}px` : '0px',
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
          }}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === 'width') {
              restorePageAnchor();
              if (activeTab === 'thumbnails' && sidebarOpen) {
                scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
              }
            }
          }}
          className={`h-full bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 select-none overflow-hidden shadow-xs sticky left-0 top-0 will-change-[width,opacity] ${
            isResizing
              ? 'transition-none border-r-indigo-400'
              : 'transition-[width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
          } ${!sidebarOpen ? 'border-r-0' : ''}`}
        >
          {/* Inner fixed-width drawer prevents content squishing during glide */}
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full flex flex-col min-w-0 shrink-0"
          >
            {/* Sidebar Tab Header (Google Material 3 Segmented Control) */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg flex-1 border border-zinc-200">
                <button
                  onClick={() => setActiveTab('outline')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded text-xs font-semibold transition-all ${
                    activeTab === 'outline'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-black" />
                  <span>Bookmarks</span>
                  {outline.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      activeTab === 'outline' ? 'bg-zinc-200 text-black' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {outline.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('thumbnails');
                    setTimeout(() => {
                      scrollThumbnailIntoView(currentPageRef.current, { behavior: 'smooth', block: 'center' });
                    }, 50);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded text-xs font-semibold transition-all ${
                    activeTab === 'thumbnails'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-black" />
                  <span>Pages</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'thumbnails' ? 'bg-zinc-200 text-black' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {numPages}
                  </span>
                </button>
              </div>

              {/* Quick Actions: Expand/Minimize Grid Toggle & Sidebar Minimize */}
              <div className="flex items-center gap-1 shrink-0">
                {activeTab === 'thumbnails' && (
                  <button
                    onClick={toggleExpandGrid}
                    className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-medium ${
                      isExpandedGrid
                        ? 'bg-zinc-100 border-zinc-300 text-black hover:bg-zinc-200'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-black'
                    }`}
                    title={isExpandedGrid ? 'Minimize Grid to Compact View (3 Columns)' : 'Expand to Multi-Page Grid View (5+ Columns)'}
                  >
                    {isExpandedGrid ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold hidden sm:inline">Compact</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold hidden sm:inline">Expand</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    capturePageAnchor();
                    setSidebarOpen(false);
                  }}
                  className="p-1.5 rounded-lg border border-transparent hover:border-zinc-200 text-zinc-400 hover:text-black hover:bg-white transition-all"
                  title="Minimize Sidebar (Collapse)"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tab 1: Bookmarks / Outline Tree */}
            {activeTab === 'outline' && (
              <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
                {/* Bookmarks Search / Filter Bar & Sub-Bookmark Creator */}
                <div className="px-3 py-2 border-b border-zinc-200 bg-white shrink-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search bookmarks..."
                        value={outlineSearch}
                        onChange={(e) => setOutlineSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-zinc-300 rounded-lg text-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                      />
                      {outlineSearch && (
                        <button
                          onClick={() => setOutlineSearch('')}
                          className="absolute right-2 text-zinc-400 hover:text-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {caseId && (
                      <button
                        type="button"
                        onClick={() => setIsAddingFolder((prev) => !prev)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                          isAddingFolder
                            ? 'bg-[#630515] text-white'
                            : 'bg-white hover:bg-[#630515]/5 text-[#630515] border border-[#630515]/30'
                        }`}
                        title="Create a new Date Sub-Bookmark folder directly in the bookmark tree"
                      >
                        <Plus className="w-3.5 h-3.5 text-current" />
                        <span>Sub-Bookmark</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Add Sub-Bookmark Bar */}
                  {isAddingFolder && (
                    <div className="p-3 bg-[#630515]/5 border border-[#630515]/20 rounded-xl space-y-2 animate-in fade-in shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#630515] flex items-center gap-1.5">
                          <FolderPlus className="w-3.5 h-3.5 text-[#630515]" />
                          New Sub-Bookmark Folder
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingFolder(false);
                            setParentFolderSelection('');
                          }}
                          className="text-zinc-400 hover:text-black p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {allFolderTitles.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-black block">
                            Nest Under Parent (Optional):
                          </label>
                          <select
                            value={parentFolderSelection}
                            onChange={(e) => setParentFolderSelection(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-black outline-none font-medium focus:border-[#630515]"
                          >
                            <option value="">📁 Case Filings & Evidence Pack (Root level)</option>
                            {allFolderTitles.map((fTitle) => {
                              const depth = fTitle.split('/').length - 1;
                              return (
                                <option key={fTitle} value={fTitle}>
                                  {'\u00A0\u00A0'.repeat(depth)}↳ Sub-bookmark in: {fTitle}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          placeholder={
                            parentFolderSelection
                              ? `Sub-bookmark name in "${parentFolderSelection.split('/').pop()?.trim()}"...`
                              : "e.g. Order Dated 07.12.2024, Pleadings..."
                          }
                          value={newFolderVal}
                          onChange={(e) => setNewFolderVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateNewFolder();
                            if (e.key === 'Escape') {
                              setIsAddingFolder(false);
                              setParentFolderSelection('');
                            }
                          }}
                          className="flex-1 text-xs px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-black placeholder:text-zinc-400 outline-none focus:border-[#630515] font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewFolder}
                          disabled={!newFolderVal.trim()}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-[#630515] text-white rounded-lg hover:bg-[#4d0410] disabled:opacity-40 transition-colors shadow-xs active:scale-95"
                        >
                          Add
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        {parentFolderSelection
                          ? `Creates a sub-bookmark nested inside "${parentFolderSelection}". Drag or move files into it.`
                          : "Type folder name or date, click Add, then drag or move files into it."}
                      </span>
                    </div>
                  )}

                  {/* Real-time PDF recompilation banner */}
                  {isUpdatingBookmarks && (
                    <div className="px-3 py-1.5 bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shrink-0 animate-in fade-in rounded-lg shadow-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Updating Master PDF bookmarks...</span>
                    </div>
                  )}
                </div>

                {/* Bookmark Items List (Independently scrollable!) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                  {/* Empty Custom Folders Waiting for Files (Top level or unattached) */}
                  {customFolders
                    .filter((cf) => {
                      const parent = cf.includes(' / ') ? cf.substring(0, cf.lastIndexOf(' / ')).trim() : '';
                      const parentExistsInTree =
                        parent &&
                        outline.some(function check(it): boolean {
                          const itPath = (it.fullPath || it.title)
                            .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
                            .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
                            .trim();
                          return itPath === parent || Boolean(it.items && it.items.some(check));
                        });
                      if (parentExistsInTree) return false;

                      return !outline.some(function checkSelf(it): boolean {
                        const itPath = (it.fullPath || it.title)
                          .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '')
                          .replace(/\s*\(Page\s*\d+\)\s*$/i, '')
                          .trim();
                        return itPath === cf || Boolean(it.items && it.items.some(checkSelf));
                      });
                    })
                    .map((cf) => {
                      const isDropTarget = dragOverFolder === cf;
                      const isNested = cf.includes(' / ');
                      const parts = cf.split(' / ');
                      const leaf = parts[parts.length - 1];
                      const parent = parts.slice(0, -1).join(' / ');
                      return (
                        <div
                          key={cf}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragOverFolder !== cf) setDragOverFolder(cf);
                          }}
                          onDragLeave={() => {
                            if (dragOverFolder === cf) setDragOverFolder(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const docId = e.dataTransfer.getData('text/plain') || draggedDoc?.id;
                            if (docId) handleMoveItemToFolder(docId, cf);
                          }}
                          className={`my-1 mx-1.5 p-2 rounded-lg border border-dashed transition-all flex items-center justify-between gap-2 ${
                            isDropTarget
                              ? 'bg-[#630515]/10 ring-2 ring-[#630515] border-[#630515]'
                              : 'bg-[#630515]/5 border-[#630515]/30 hover:bg-[#630515]/10 text-[#630515]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isNested ? (
                              <Folder className="w-4 h-4 text-[#630515] shrink-0" />
                            ) : (
                              <Calendar className="w-4 h-4 text-[#630515] shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-[#630515] truncate">{leaf}</span>
                              {isNested && (
                                <span className="text-[10px] text-zinc-500 truncate">
                                  under {parent}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-semibold text-[#630515] bg-white border border-[#630515]/30 px-2 py-0.5 rounded shadow-2xs">
                              Drop file here
                            </span>
                            <button
                              type="button"
                              onClick={() => setCustomFolders((prev) => prev.filter((f) => f !== cf))}
                              className="p-1 text-zinc-400 hover:text-red-600 rounded"
                              title="Remove empty folder"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {filteredOutline.length > 0 ? (
                    filteredOutline.map(renderOutlineItem)
                  ) : (
                    <div className="text-center py-10 px-4">
                      <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No Bookmarks Found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        This PDF doesn&apos;t contain an index outline. You can use page thumbnails instead.
                      </p>
                      <button
                        onClick={() => setActiveTab('thumbnails')}
                        className="mt-3 text-xs font-semibold text-black underline hover:text-zinc-700"
                      >
                        Switch to Page Thumbnails →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Page Thumbnails (Independently scrollable multi-column grid!) */}
            {activeTab === 'thumbnails' && (
              <div
                ref={thumbnailContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-2.5 custom-scrollbar bg-slate-100/60"
              >
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 items-start transition-all">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <ThumbnailItem
                      key={`${reloadNonce}-${pageNum}`}
                      pdfDoc={pdfDoc}
                      pageNum={pageNum}
                      rotation={rotation}
                      isCurrent={currentPage === pageNum}
                      onClick={() => scrollToPage(pageNum)}
                      containerRef={thumbnailContainerRef}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------------- */}
        {/* B. DRAGGABLE SPLITTER HANDLE WITH QUICK ACTIONS               */}
        {/* ------------------------------------------------------------- */}
        {sidebarOpen && (
          <div
            onMouseDown={startResizing}
            onDoubleClick={toggleExpandGrid}
            className={`group relative z-20 shrink-0 h-full flex items-center justify-center cursor-col-resize select-none transition-colors ${
              isResizing ? 'w-2 bg-indigo-500/20' : 'w-2 hover:w-2.5 hover:bg-indigo-50/70 active:bg-indigo-500/30'
            }`}
            title="Drag to resize | Double-click to toggle Expand/Compact"
          >
            {/* Splitter pill with grip dots */}
            <div
              className={`w-1 rounded-full transition-all flex flex-col items-center justify-center gap-1 ${
                isResizing
                  ? 'h-20 bg-indigo-500 shadow-sm'
                  : 'h-12 bg-slate-300 group-hover:h-20 group-hover:bg-indigo-400'
              }`}
            >
              <div className="w-0.5 h-0.5 rounded-full bg-white opacity-80" />
              <div className="w-0.5 h-0.5 rounded-full bg-white opacity-80" />
              <div className="w-0.5 h-0.5 rounded-full bg-white opacity-80" />
            </div>

            {/* Quick minimize chevron on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                capturePageAnchor();
                setSidebarOpen(false);
              }}
              className="absolute left-1/2 -translate-x-1/2 top-4 opacity-0 group-hover:opacity-100 transition-all bg-white hover:bg-slate-50 border border-slate-300 text-slate-500 hover:text-slate-800 rounded-full p-1 shadow-md hover:scale-105 active:scale-95"
              title="Minimize sidebar"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* C. MAIN SCROLL CONTAINER WITH PDF PAGES                       */}
        {/* ------------------------------------------------------------- */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDownPan}
          onMouseMove={handleMouseMovePan}
          onMouseUp={handleMouseUpPan}
          className={`flex-1 min-h-0 h-full overflow-y-auto overflow-x-auto p-4 sm:p-6 flex flex-col items-center gap-6 relative ${isHandTool ? 'cursor-grab' : 'cursor-default'
            }`}
        >
          {/* Cold initial load */}
          {isLoading && !pdfDoc && (
            <div className="flex flex-col items-center justify-center my-auto py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-black mb-3" />
              <p className="text-xs font-semibold text-black">Rendering document...</p>
            </div>
          )}

          {/* Refreshing overlay: little blur so contents stay visible */}
          {isLoading && pdfDoc && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-6 bg-white/20 backdrop-blur-[2px] pointer-events-none transition-all">
              <div className="px-4 py-2 bg-white/95 backdrop-blur-sm border border-zinc-200 rounded-full shadow-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span className="text-xs font-semibold text-black">Updating document...</span>
              </div>
            </div>
          )}

          {loadError && (
            <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-lg border border-red-200 text-center my-auto">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Document Display Error</h3>
              <p className="text-xs text-slate-600 mt-1.5">{loadError}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="flex-1 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  Open Direct URL
                </button>
              </div>
            </div>
          )}

          {!loadError &&
            pdfDoc &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <PDFPageCanvas
                key={`${reloadNonce}-${pageNum}`}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el);
                  else pageRefs.current.delete(pageNum);
                }}
                pdfDoc={pdfDoc}
                pageNum={pageNum}
                scale={scale}
                rotation={rotation}
                scrollContainer={scrollContainerRef.current}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: PDF PAGE CANVAS (Lazy Viewport Render + High DPI)
// =========================================================================
interface PDFPageCanvasProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  rotation: number;
  scrollContainer: HTMLDivElement | null;
}

const PDFPageCanvas = React.forwardRef<HTMLDivElement, PDFPageCanvasProps>(
  ({ pdfDoc, pageNum, scale, rotation, scrollContainer }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [pageDims, setPageDims] = useState<{ width: number; height: number }>({
      width: 595,
      height: 842
    });
    const renderTaskRef = useRef<any>(null);

    // Initial page dimension measurement
    useEffect(() => {
      let isMounted = true;
      if (!pdfDoc || pdfDoc.destroyed || !pdfDoc._transport || !pdfDoc._transport?.messageHandler) return;
      try {
        pdfDoc
          .getPage(pageNum)
          .then((page: any) => {
            if (!isMounted) return;
            const vp = page.getViewport({ scale: 1, rotation });
            setPageDims({ width: vp.width, height: vp.height });
          })
          .catch(() => { });
      } catch (e) {
        // synchronously caught if worker transport was destroyed
      }
      return () => {
        isMounted = false;
      };
    }, [pdfDoc, pageNum, rotation]);

    // Viewport Intersection Observer for lazy rendering (critical for large 100+ page docs!)
    useEffect(() => {
      const el = canvasRef.current?.parentElement;
      if (!el || !scrollContainer) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        {
          root: scrollContainer,
          rootMargin: '700px 0px 700px 0px',
          threshold: 0.01
        }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [scrollContainer]);

    // Render Canvas & Text Layer when visible
    useEffect(() => {
      if (!isVisible || !pdfDoc || pdfDoc.destroyed || !pdfDoc._transport || !pdfDoc._transport?.messageHandler) return;
      let isMounted = true;

      const renderPage = async () => {
        try {
          if (!pdfDoc || pdfDoc.destroyed || !pdfDoc._transport || !pdfDoc._transport?.messageHandler) return;
          if (renderTaskRef.current) {
            try {
              renderTaskRef.current.cancel();
            } catch (e) { }
          }

          let page: any = null;
          try {
            page = await pdfDoc.getPage(pageNum);
          } catch (e) {
            return;
          }
          if (!isMounted || !page || page.destroyed || !page._transport?.messageHandler) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const viewport = page.getViewport({ scale, rotation });
          const outputScale = window.devicePixelRatio || 1;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.backgroundColor = '#ffffff';

          // Sync exact dimensions
          setPageDims({ width: viewport.width / scale, height: viewport.height / scale });

          // Standard 2D context with pure white canvas fill to eliminate any black background/borders
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.scale(outputScale, outputScale);

          const renderContext = {
            canvasContext: ctx,
            viewport,
            background: 'rgb(255, 255, 255)'
          };

          const task = page.render(renderContext);
          renderTaskRef.current = task;
          await task.promise.catch((err: any) => {
            if (err?.name !== 'RenderingCancelledException') {
              // ignore
            }
          });

          if (isMounted) {
            setIsRendered(true);

            // Render Text Selection Layer
            const textDiv = textLayerRef.current;
            if (textDiv) {
              textDiv.innerHTML = '';
              textDiv.style.width = `${Math.floor(viewport.width)}px`;
              textDiv.style.height = `${Math.floor(viewport.height)}px`;

              try {
                if (!page.destroyed && page._transport?.messageHandler) {
                  const textContent = await page.getTextContent();
                  const pdfjs = (window as any).pdfjsLib;
                  if (pdfjs && pdfjs.TextLayer) {
                    const textLayer = new pdfjs.TextLayer({
                      textContentSource: textContent,
                      container: textDiv,
                      viewport
                    });
                    await textLayer.render();
                  }
                }
              } catch (textErr) {
                // Text layer fallback / ignore
              }
            }
          }
        } catch (err: any) {
          if (err?.name !== 'RenderingCancelledException') {
            console.warn(`Render error on page ${pageNum}:`, err);
          }
        }
      };

      renderPage().catch(() => {});

      return () => {
        isMounted = false;
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) { }
        }
      };
    }, [isVisible, pdfDoc, pageNum, scale, rotation]);

    const computedWidth = Math.floor(pageDims.width * scale);
    const computedHeight = Math.floor(pageDims.height * scale);

    return (
      <div
        ref={ref}
        data-page-number={pageNum}
        style={{
          width: `${computedWidth}px`,
          height: `${computedHeight}px`,
          backgroundColor: '#ffffff'
        }}
        className="relative bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center transition-shadow hover:shadow-md shrink-0 my-3"
      >
        <canvas ref={canvasRef} style={{ backgroundColor: '#ffffff' }} className="block select-none bg-white" />

        {/* Text Layer for Select & Copy */}
        <div
          ref={textLayerRef}
          className="pdf-text-layer absolute inset-0 select-text overflow-hidden pointer-events-auto"
          style={{
            transformOrigin: '0 0',
            lineHeight: 1
          }}
        />

        {/* Placeholder before page comes into view */}
        {!isRendered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs font-semibold">Page {pageNum}</span>
          </div>
        )}
      </div>
    );
  }
);
PDFPageCanvas.displayName = 'PDFPageCanvas';

// =========================================================================
// SUB-COMPONENT: THUMBNAIL ITEM (Page Thumbnail Preview with Lazy Loading)
// =========================================================================
interface ThumbnailItemProps {
  pdfDoc: any;
  pageNum: number;
  rotation?: number;
  isCurrent: boolean;
  onClick: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

function ThumbnailItem({ pdfDoc, pageNum, rotation = 0, isCurrent, onClick, containerRef }: ThumbnailItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const renderTaskRef = useRef<any>(null);

  // Lazy render when scrolled into viewport or near it
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    if (!containerRef?.current || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: containerRef.current,
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  // Render thumbnail canvas once visible
  useEffect(() => {
    if (!isVisible || !pdfDoc || pdfDoc.destroyed || !pdfDoc._transport || !pdfDoc._transport?.messageHandler) return;
    let isMounted = true;

    try {
      pdfDoc
        .getPage(pageNum)
        .then((page: any) => {
          if (!isMounted || !page || page.destroyed || !page._transport?.messageHandler) return;
          const vp = page.getViewport({ scale: 0.25, rotation });
          const canvas = canvasRef.current;
          if (!canvas) return;

          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          canvas.style.backgroundColor = '#ffffff';
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (renderTaskRef.current) {
            try {
              renderTaskRef.current.cancel();
            } catch (e) {}
          }

          const task = page.render({ canvasContext: ctx, viewport: vp, background: 'rgb(255, 255, 255)' });
          renderTaskRef.current = task;

          task.promise
            .then(() => {
              if (isMounted) setRendered(true);
            })
            .catch((err: any) => {
              if (err?.name !== 'RenderingCancelledException') {
                console.warn(`Thumbnail render failed for page ${pageNum}:`, err);
              }
            });
        })
        .catch(() => { });
    } catch (e) {
      // synchronously caught if transport was destroyed
    }

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [isVisible, pdfDoc, pageNum, rotation]);

  return (
    <div
      ref={itemRef}
      data-thumbnail-page={pageNum}
      onClick={onClick}
      className={`group relative flex flex-col items-center p-1.5 rounded-lg cursor-pointer transition-all duration-200 ease-out select-none transform-gpu ${
        isCurrent
          ? 'bg-indigo-50/80 ring-2 ring-indigo-600 shadow-sm scale-[1.02]'
          : 'hover:bg-slate-200/50 hover:scale-[1.01]'
      }`}
      title={`Page ${pageNum}`}
    >
      <div className={`w-full aspect-[1/1.414] bg-white rounded-[2px] shadow-xs border overflow-hidden flex items-center justify-center relative transition-all duration-200 ease-out ${
        isCurrent
          ? 'border-indigo-400 ring-1 ring-indigo-300'
          : 'border-slate-300 group-hover:border-slate-400'
      }`}>
        <canvas
          ref={canvasRef}
          style={{ backgroundColor: '#ffffff' }}
          className={`w-full h-full object-contain block bg-white transition-opacity duration-200 ${
            rendered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
          </div>
        )}
      </div>
      <span
        className={`text-[10px] font-semibold mt-1 tracking-tight leading-tight ${
          isCurrent ? 'text-indigo-900 font-extrabold' : 'text-slate-600 group-hover:text-slate-900'
        }`}
      >
        {pageNum}
      </span>
    </div>
  );
}

