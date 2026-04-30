'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceDefaultTemplate from '@/components/InvoiceDefaultTemplate';
import {
  FileText, Plus, Search, Filter, Download,
  MoreHorizontal, Eye, Send, X, PlusCircle,
  Trash2, Mail, FileDown, Edit, DollarSign,
  AlertCircle, ChevronRight, CheckCircle2, ChevronLeft,
  Clock, Receipt, Loader2, FileSpreadsheet, CreditCard
} from 'lucide-react';



export default function ClientInvoicesPage() {
  useTopbarTitle('Client Invoices', 'Manage invoicing history and generate new client bills.');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'full' | 'split'>('full');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [firmProfile, setFirmProfile] = useState<any>(null);

  // Search + Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'unpaid'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchInvoices = async (page = 1, filter: 'all' | 'overdue' | 'unpaid' = activeFilter) => {
    setLoading(true);
    try {
      let url = '';
      if (filter === 'overdue') {
        url = API.BILLING.INVOICES.OVERDUE;
      } else if (filter === 'unpaid') {
        url = API.BILLING.INVOICES.UNPAID;
      } else {
        url = `${API.BILLING?.INVOICES?.LIST || '/api/billing/invoices/'}?page=${page}`;
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
      const res = await customFetch(API.BILLING.INVOICES.DETAIL(id));
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
        setViewMode('split');
        // Fetch the firm profile for the header
        if (data.firm) {
          const firmRes = await customFetch(API.FIRMS.DETAIL(data.firm));
          if (firmRes.ok) {
            const firmData = await firmRes.json();
            setFirmProfile(firmData);
          }
        }
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
      inv.client_name?.toLowerCase().includes(q)
    );
  });

  const applyFilter = (f: 'all' | 'overdue' | 'unpaid') => {
    setActiveFilter(f);
    setFilterOpen(false);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Helper for status colors
  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (s === 'overdue') return 'bg-red-100 text-red-700';
    if (s === 'draft') return 'bg-slate-100 text-slate-600';
    if (s === 'sent') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  // How many days overdue (positive = overdue)
  const getOverdueDays = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={`font-sans ${viewMode === 'split' ? 'h-[calc(100vh-64px)] overflow-hidden flex' : 'min-h-[calc(100vh-64px)] bg-[#fafafa] p-2 md:p-4 lg:p-1'}`}>

      {/* -------------------- FULL MODE -------------------- */}
      {viewMode === 'full' && (
        <div className="w-full max-w-[1600px] mx-auto h-[calc(100vh-120px)] flex flex-col">

          {/* Fixed header */}
          <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 px-2 pt-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Invoice History</h2>
              <p className="text-sm font-semibold text-slate-400">View and manage all client billings</p>
            </div>
            <Link
              href="/super-admin/finance/client-invoices/new"
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
              {/* Filter bar — fixed, with inline pagination + page size */}
              <div className="shrink-0 p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
                {/* Left: search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoices or clients..."
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
                      {activeFilter === 'overdue' ? 'Overdue' : 'Unpaid'}
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
                          {([{ key: 'all', label: 'All Invoices', dot: 'bg-slate-400' }, { key: 'overdue', label: 'Overdue', dot: 'bg-red-500' }, { key: 'unpaid', label: 'Unpaid', dot: 'bg-amber-500' }] as const).map(opt => (
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

                  {/* Separator */}
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

              {/* Table — only this scrolls */}
              <div className="flex-1 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
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
                        <td className="py-4 px-6 text-sm font-bold text-slate-700 max-w-[200px] truncate">{inv.client_name}</td>
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
                                    const res = await customFetch(API.BILLING.INVOICES.DETAIL(inv.id), { method: 'DELETE' });
                                    if (res.ok) {
                                      alert("Invoice deleted");
                                      fetchInvoices(currentPage);
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
                    <p className="text-[13px] font-bold text-slate-700 line-clamp-1 mb-1">{inv.client_name}</p>
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

          {/* Right Panel: The Document Preview */}
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
                          {firmProfile?.name || firmProfile?.firm_name || 'Anthem Global Technology'}
                        </span>
                        {getOverdueDays(selectedInvoice.due_date) > 0 && (
                          <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[11px] font-black border border-red-100">
                            <Clock className="w-3.5 h-3.5" /> Overdue by {getOverdueDays(selectedInvoice.due_date)} days
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/super-admin/finance/client-invoices/new?id=${selectedInvoice.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </Link>
                      <button className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-100">
                        <CreditCard className="w-4 h-4" /> Payment
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                        <FileDown className="w-4 h-4" /> Save PDF
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                        <FileSpreadsheet className="w-4 h-4" /> CSV
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this invoice?")) {
                            try {
                              const res = await customFetch(API.BILLING.INVOICES.DETAIL(selectedInvoice.id), { method: 'DELETE' });
                              if (res.ok) {
                                alert("Invoice deleted");
                                setSelectedInvoice(null);
                                setViewMode('full');
                                fetchInvoices(currentPage);
                              } else {
                                alert("Failed to delete");
                              }
                            } catch (err) {
                              alert("Error deleting invoice");
                            }
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
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
                  {/* Centering wrapper */}
                  <div className="min-h-full flex flex-col items-center  py-6 px-4">
                    <div style={{ zoom: '100 %', flexShrink: 0 }}>
                      <InvoiceDefaultTemplate
                        data={{
                          number: selectedInvoice.invoice_number,
                          date: selectedInvoice.invoice_date,
                          due: selectedInvoice.due_date,
                          currency: 'INR',
                          to: { name: selectedInvoice.client_name },
                          taxTypes: {},
                          discountMode: 'AMOUNT',
                          discountAmountManual: Number(selectedInvoice.discount_amount) || 0,
                          notes: selectedInvoice.notes,
                          terms: selectedInvoice.terms_and_conditions,
                          placeOfSupply: selectedInvoice.branch_name,
                          items: [
                            ...(selectedInvoice.time_entries_detail || []).map((t: any) => ({
                              id: t.id, name: t.description,
                              desc: `Activity: ${t.activity_type}`,
                              qty: Number(t.hours), price: Number(t.hourly_rate),
                            })),
                            ...(selectedInvoice.expenses_detail || []).map((e: any) => ({
                              id: e.id, name: e.description,
                              desc: `Expense: ${e.expense_type}`,
                              qty: 1, price: Number(e.amount),
                            })),
                          ],
                        }}
                        profile={{
                          company: firmProfile?.name || firmProfile?.firm_name || 'Law Firm',
                          address: [
                            firmProfile?.address_line_1,
                            firmProfile?.city,
                            firmProfile?.state,
                          ].filter(Boolean).join(', ') || 'Address not provided',
                          email: firmProfile?.email || '',
                          phone: firmProfile?.phone_number || firmProfile?.phone || '',
                          gstin: firmProfile?.gstin || '',
                        }}
                        logo={firmProfile?.logo || firmProfile?.profile_image || null}
                        subtotal={parseFloat(selectedInvoice.subtotal) || 0}
                        perLineTax={[]}
                        taxOverride={parseFloat(selectedInvoice.tax_amount) || 0}
                        taxLabelOverride={`Tax (${parseFloat(selectedInvoice.tax_percentage) || 0}%)`}
                        totalAmountOverride={parseFloat(selectedInvoice.total_amount) || 0}
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
                    </div>  {/* zoom wrapper */}
                  </div>  {/* centering wrapper */}
                </div>  {/* scrollable panel */}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
