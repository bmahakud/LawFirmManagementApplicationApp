'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceDefaultTemplate from '@/components/InvoiceDefaultTemplate';
import {
  FileText, Plus, Search, Filter,
  Eye, Send, X, Trash2, FileDown, Edit,
  ChevronRight, ChevronLeft, Clock, Loader2, FileSpreadsheet, CreditCard, Ban
} from 'lucide-react';

export default function PlatformOwnerBillingPage() {
  useTopbarTitle('Platform Invoices', 'Manage firm subscriptions, view billing history, and record payments.');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'full' | 'split'>('full');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Search + Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'overdue' | 'unpaid' | 'paid'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const [platformLogo, setPlatformLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformOwnerProfile = async () => {
      try {
        const res = await customFetch(API.USERS.DETAIL('ce8ce90c-be9b-49de-a959-f8459663593a'));
        if (res.ok) {
          const user = await res.json();
          if (user.profile_image) {
            setPlatformLogo(user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}${user.profile_image}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch platform owner profile", err);
      }
    };
    fetchPlatformOwnerProfile();
  }, []);

  const fetchInvoices = async (page = 1, filter: string = activeFilter) => {
    setLoading(true);
    try {
      let url = `${API.SUBSCRIPTIONS.PLATFORM_INVOICES.LIST}?page=${page}`;
      // In a real app we'd map "unpaid" to "status=sent" or something, but let's use the explicit statuses
      if (filter !== 'all' && filter !== 'unpaid') {
        url += `&status=${filter}`;
      } else if (filter === 'unpaid') {
        // Just an example mapping, depending on backend
        url += `&status=sent`;
      }
      const res = await customFetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setInvoices(results);
        setCount(Array.isArray(data) ? results.length : (data.count || 0));
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await customFetch(API.SUBSCRIPTIONS.PLATFORM_INVOICES.DETAIL(id));
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
        setViewMode('split');
      }
    } catch (err) {
      console.error('Failed to fetch invoice details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(currentPage, activeFilter);
  }, [currentPage, activeFilter]);

  // Client-side search across the current page
  const displayedInvoices = invoices.filter(inv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.firm_name?.toLowerCase().includes(q)
    );
  });

  const applyFilter = (f: any) => {
    setActiveFilter(f);
    setFilterOpen(false);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Helper for status colors
  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (s === 'overdue') return 'bg-red-100 text-red-700';
    if (s === 'draft') return 'bg-slate-100 text-slate-600';
    if (s === 'sent') return 'bg-blue-100 text-blue-700';
    if (s === 'cancelled') return 'bg-gray-200 text-gray-700';
    return 'bg-amber-100 text-amber-700';
  };

  // How many days overdue (positive = overdue)
  const getOverdueDays = (dueDateStr: string) => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await customFetch(API.SUBSCRIPTIONS.PLATFORM_INVOICES.SEND(selectedInvoice.id), { method: 'POST' });
      if (res.ok) {
        alert("Invoice sent successfully!");
        fetchInvoiceDetail(selectedInvoice.id);
        fetchInvoices(currentPage, activeFilter);
      } else {
        alert("Failed to send invoice.");
      }
    } catch (err) {
      alert("Error sending invoice");
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return;
    const amountStr = prompt("Enter payment amount:", selectedInvoice.balance_due);
    if (!amountStr) return;
    const transaction_id = prompt("Enter transaction ID (optional):", "") || "";

    try {
      const res = await customFetch(API.SUBSCRIPTIONS.PLATFORM_INVOICES.MARK_PAID(selectedInvoice.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amountStr),
          payment_method: "bank_transfer",
          transaction_id,
          payment_notes: "Manual payment marked by platform owner",
          payment_date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        alert("Invoice marked as paid!");
        fetchInvoiceDetail(selectedInvoice.id);
        fetchInvoices(currentPage, activeFilter);
      } else {
        const errorData = await res.json();
        alert(`Failed to mark paid: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Error marking invoice as paid");
    }
  };

  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return;
    if (!confirm("Are you sure you want to cancel this invoice?")) return;
    try {
      const res = await customFetch(API.SUBSCRIPTIONS.PLATFORM_INVOICES.CANCEL(selectedInvoice.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: "Manually cancelled by platform owner" })
      });
      if (res.ok) {
        alert("Invoice cancelled!");
        fetchInvoiceDetail(selectedInvoice.id);
        fetchInvoices(currentPage, activeFilter);
      } else {
        alert("Failed to cancel invoice");
      }
    } catch (err) {
      alert("Error cancelling invoice");
    }
  };

  return (
    <div className={`font-sans ${viewMode === 'split' ? 'h-[calc(100vh-64px)] overflow-hidden flex' : 'min-h-[calc(100vh-64px)] bg-[#fafafa] p-2 md:p-4 lg:p-1'}`}>

      {/* -------------------- FULL MODE -------------------- */}
      {viewMode === 'full' && (
        <div className="w-full max-w-[1600px] mx-auto h-[calc(100vh-120px)] flex flex-col">

          {/* Fixed header */}
          <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 px-2 pt-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Invoices</h2>
              <p className="text-sm font-semibold text-slate-400">View and manage firm subscriptions and billings</p>
            </div>
            <Link
              href="/platform-owner/billing/new"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all text-sm"
            >
              <Plus className="w-5 h-5" />
              Generate New Invoice
            </Link>
          </div>

          {/* Scrollable card */}
          <div className="flex-1 min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full"
            >
              {/* Filter bar */}
              <div className="shrink-0 p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
                {/* Left: search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoices or firms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400"
                  />
                </div>

                {/* Right: filter + page size + pagination */}
                <div className="flex items-center gap-2 flex-wrap">

                  {/* Active filter badge */}
                  {activeFilter !== 'all' && (
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg ${activeFilter === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                      <button onClick={() => applyFilter('all')} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  )}

                  {/* Filter dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setFilterOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold shadow-sm transition-all ${activeFilter !== 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <Filter className="w-3.5 h-3.5" /> Filter
                    </button>
                    <AnimatePresence>
                      {filterOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                          className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                        >
                          {([
                            { key: 'all', label: 'All Invoices', dot: 'bg-slate-400' },
                            { key: 'sent', label: 'Sent', dot: 'bg-blue-500' },
                            { key: 'overdue', label: 'Overdue', dot: 'bg-red-500' },
                            { key: 'paid', label: 'Paid', dot: 'bg-emerald-500' }
                          ] as const).map(opt => (
                            <button key={opt.key} onClick={() => applyFilter(opt.key)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left transition-colors ${activeFilter === opt.key ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                }`}>
                              <span className={`w-2 h-2 rounded-full ${opt.dot}`} />{opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="w-px h-5 bg-slate-200" />

                  {/* Inline pagination */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all"
                    ><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                    <span className="px-2 text-xs font-bold text-slate-600">Page {currentPage}</span>
                    <button
                      disabled={invoices.length < 10 || loading}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all"
                    ><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                  </div>

                  <span className="text-xs font-medium text-slate-400">{count} total</span>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Firm</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {[...Array(6)].map((_, j) => <td key={j} className="p-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>)}
                        </tr>
                      ))
                    ) : displayedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 font-bold">
                            {searchQuery ? 'No invoices match your search' : 'No invoices found'}
                          </p>
                        </td>
                      </tr>
                    ) : displayedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-6">
                          <p className="text-sm font-medium text-slate-700">{new Date(inv.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          {inv.due_date && (
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Due: {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-700 max-w-[200px] truncate">{inv.firm_name}</td>
                        <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">₹{parseFloat(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-6">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center justify-center w-24 uppercase tracking-wider ${getStatusStyle(inv.status)}`}>
                            {inv.status}
                          </span>
                          {inv.status?.toLowerCase() === 'overdue' && inv.due_date && (() => {
                            const days = getOverdueDays(inv.due_date);
                            return days > 0 ? (
                              <p className="text-[10px] font-bold text-red-500 mt-1 text-center">{days}d overdue</p>
                            ) : null;
                          })()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-right self-end">
                            <button
                              onClick={() => fetchInvoiceDetail(inv.id)}
                              disabled={detailLoading}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50" title="View Detail">
                              {detailLoading && selectedInvoice?.id === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this invoice?")) {
                                  try {
                                    const res = await customFetch(API.SUBSCRIPTIONS.PLATFORM_INVOICES.DETAIL(inv.id), { method: 'DELETE' });
                                    if (res.ok || res.status === 204) {
                                      alert("Invoice deleted");
                                      fetchInvoices(currentPage, activeFilter);
                                    } else {
                                      alert("Failed to delete");
                                    }
                                  } catch (err) {
                                    alert("Error deleting invoice");
                                  }
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="PDF">
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </motion.div>
          </div>
        </div>
      )}

      {/* -------------------- DETAIL VIEW (SPLIT) -------------------- */}
      {viewMode === 'split' && selectedInvoice && (
        <>
          {/* Master List (Sticky Left) */}
          <div className="w-[380px] shrink-0 border-r border-slate-200 flex flex-col bg-[#fdfdfd] z-10 shadow-xl relative">
            <div className="p-4 border-b border-slate-100 bg-white">
              <button
                onClick={() => { setViewMode('full'); setSelectedInvoice(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-3"
              >
                <ChevronLeft className="w-4 h-4" /> Back to List
              </button>
              <h2 className="text-[22px] font-black text-slate-900 leading-tight">Invoices</h2>
              <p className="text-[13px] text-slate-500 font-semibold mb-4">{count} total records</p>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
              {invoices.map(inv => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => fetchInvoiceDetail(inv.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                      ? 'bg-blue-50 border-blue-600/20 shadow-sm'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-[15px] font-black tracking-tight text-slate-900">₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</h3>
                      {detailLoading && isSelected ? <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> : (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusStyle(inv.status)}`}>
                          {inv.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-bold text-slate-700 line-clamp-1 mb-1">{inv.firm_name}</p>
                    <p className="text-[11px] font-bold text-slate-400">{inv.invoice_number}</p>
                    <div className="flex justify-between items-end mt-3">
                      <p className="text-[11px] text-slate-400 font-bold">{inv.invoice_date}</p>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Panel: Document Preview */}
          <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedInvoice.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col h-full absolute inset-0 font-sans"
              >
                <div className="bg-white border-b border-slate-200 shadow-sm flex flex-col shrink-0">
                  {/* Top Row: Navigation + Identity + Actions */}
                  <div className="px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => { setViewMode('full'); setSelectedInvoice(null); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black tracking-tight text-slate-900">{selectedInvoice.invoice_number}</h2>
                        <span className="text-[13px] font-bold text-slate-500 max-w-[280px] truncate">
                          {selectedInvoice.firm_name}
                        </span>
                        {getOverdueDays(selectedInvoice.due_date) > 0 && selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                          <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[11px] font-black border border-red-100">
                            <Clock className="w-3.5 h-3.5" /> Overdue by {getOverdueDays(selectedInvoice.due_date)} days
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                        <Link
                          href={`/platform-owner/billing/new?id=${selectedInvoice.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </Link>
                      )}
                      <button
                        onClick={handleSendInvoice}
                        disabled={selectedInvoice.status === 'paid' || selectedInvoice.status === 'sent'}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" /> {selectedInvoice.status === 'sent' ? 'Sent' : 'Send'}
                      </button>
                      <button
                        onClick={handleMarkPaid}
                        disabled={selectedInvoice.status === 'paid' || selectedInvoice.status === 'cancelled'}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-100 disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" /> Mark Paid
                      </button>
                      <button
                        onClick={handleCancelInvoice}
                        disabled={selectedInvoice.status === 'paid' || selectedInvoice.status === 'cancelled'}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                      >
                        <Ban className="w-4 h-4" /> Cancel
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                        <FileDown className="w-4 h-4" /> Save PDF
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Metadata + Totals */}
                  <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        Created: <span className="text-slate-900 font-bold">{selectedInvoice.invoice_date}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5">
                        Due: <span className="text-slate-900 font-bold">{selectedInvoice.due_date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 normal-case tracking-normal">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold">Paid:</span>
                        <span className="text-green-600 font-black text-[14px]">₹{parseFloat(selectedInvoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold">Due:</span>
                        <span className="text-red-500 font-black text-[14px]">₹{parseFloat(selectedInvoice.balance_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Total:</span>
                        <span className="text-slate-900 font-black text-lg">₹{parseFloat(selectedInvoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable invoice preview panel */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                  <div className="min-h-full flex flex-col items-center py-6 px-4">
                    <div style={{ zoom: '100%', flexShrink: 0 }}>
                      <InvoiceDefaultTemplate
                        data={{
                          number: selectedInvoice.invoice_number,
                          date: selectedInvoice.invoice_date,
                          due: selectedInvoice.due_date,
                          currency: 'INR',
                          to: {
                            name: selectedInvoice.firm_name,
                            email: selectedInvoice.firm_email
                          },
                          taxTypes: {},
                          discountMode: 'AMOUNT',
                          discountAmountManual: 0,
                          notes: selectedInvoice.notes,
                          terms: "Please pay within 30 days.",
                          placeOfSupply: "Online",
                          items: [
                            {
                              id: selectedInvoice.subscription_plan,
                              name: selectedInvoice.plan_name || 'Subscription',
                              desc: `Billing Period: ${selectedInvoice.period_start || 'N/A'} to ${selectedInvoice.period_end || 'N/A'}`,
                              qty: 1,
                              price: Number(selectedInvoice.plan_amount || 0),
                            }
                          ],
                        }}
                        profile={{
                          company: 'Anthem Global Technology',
                          address: '123 Tech Park, Innovation Hub',
                          email: 'billing@anthemgt.com',
                          phone: '+91 9876543210',
                          gstin: '29ABCDE1234F1Z5',
                        }}
                        logo={platformLogo as any}
                        subtotal={parseFloat(selectedInvoice.plan_amount) || 0}
                        perLineTax={[]}
                        taxOverride={(parseFloat(selectedInvoice.tax_amount) || null) as any}
                        taxLabelOverride={`Tax (${parseFloat(selectedInvoice.tax_percentage) || 0}%)` as any}
                        totalAmountOverride={(parseFloat(selectedInvoice.total_amount) || null) as any}
                        fmt={(v: number) =>
                          `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        }
                        previewOpen={true}
                        showTotals={true}
                        paymentInfo={{
                          paid_amount: parseFloat(selectedInvoice.paid_amount) || 0,
                          outstanding_amount: parseFloat(selectedInvoice.balance_due) || 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
