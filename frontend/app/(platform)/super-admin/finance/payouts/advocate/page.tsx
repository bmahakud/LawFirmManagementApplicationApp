'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Download, Filter, Eye, Clock, Receipt,
  AlertCircle, Loader2, RefreshCw, X, CheckCircle2,
  XCircle, IndianRupee, ChevronDown, Calendar
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvocateInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  advocate: string;
  advocate_name: string;
  advocate_email: string;
  firm: string;
  firm_name: string;
  period_start: string;
  period_end: string;
  subtotal: string;
  tax_percentage: string;
  tax_amount: string;
  total_amount: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  payment_method: string;
  payment_reference: string;
  paid_date: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_date: string | null;
  rejection_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface TimeEntry {
  id: string;
  user_name: string;
  case_title: string;
  date: string;
  activity_type: string;
  description: string;
  hours: string;
  hourly_rate: string;
  amount: string;
  billable: boolean;
  status: string;
  advocate_invoice: string | null;
}

interface Expense {
  id: string;
  submitted_by_name: string;
  case_title: string;
  date: string;
  expense_type: string;
  description: string;
  amount: string;
  billable_amount: string;
  billable: boolean;
  status: string;
  markup_percentage: string;
}

interface AdvocateStats {
  total_invoiced: number;
  total_paid: number;
  total_invoices: number;
  draft_invoices: number;
  submitted_invoices: number;
  approved_invoices: number;
  rejected_invoices: number;
  paid_invoices: number;
}

// ─── Status badge helper ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

function fmt(val: string | number) {
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function InvoiceDetailModal({
  invoice,
  onClose,
  onApprove,
  onReject,
  onPay,
  actionLoading,
}: {
  invoice: AdvocateInvoice;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onPay: (id: string, method: string, ref: string) => void;
  actionLoading: boolean;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [showPayForm, setShowPayForm] = useState(false);

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">{invoice.invoice_number}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{invoice.advocate_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${statusColors[invoice.status]}`}>
              {invoice.status}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Amounts */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-bold text-slate-800">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Tax ({invoice.tax_percentage}%)</span>
              <span className="font-bold text-slate-800">{fmt(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
              <span className="font-black text-slate-900">Total</span>
              <span className="font-black text-blue-600 text-base">{fmt(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Date</p>
              <p className="font-semibold text-slate-800">
                {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Period</p>
              <p className="font-semibold text-slate-800">
                {new Date(invoice.period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
                {new Date(invoice.period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {invoice.payment_method && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
                <p className="font-semibold text-slate-800 capitalize">{invoice.payment_method.replace('_', ' ')}</p>
              </div>
            )}
            {invoice.payment_reference && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reference</p>
                <p className="font-semibold text-slate-800">{invoice.payment_reference}</p>
              </div>
            )}
            {invoice.approved_by_name && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Approved By</p>
                <p className="font-semibold text-slate-800">{invoice.approved_by_name}</p>
              </div>
            )}
            {invoice.paid_date && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paid On</p>
                <p className="font-semibold text-slate-800">
                  {new Date(invoice.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {invoice.rejection_reason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 font-medium">{invoice.rejection_reason}</p>
            </div>
          )}

          {invoice.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-blue-700 font-medium">{invoice.notes}</p>
            </div>
          )}

          {/* Actions for submitted invoices */}
          {invoice.status === 'submitted' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {!showRejectInput ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => onApprove(invoice.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors border border-red-200 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (required)..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { onReject(invoice.id, rejectReason); setShowRejectInput(false); }}
                      disabled={!rejectReason.trim() || actionLoading}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pay action for approved invoices */}
          {invoice.status === 'approved' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {!showPayForm ? (
                <button
                  onClick={() => setShowPayForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                  <IndianRupee className="w-4 h-4" /> Mark as Paid
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reference / Transaction ID</label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="e.g. TXN123456"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { onPay(invoice.id, payMethod, payRef); setShowPayForm(false); }}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Payment'}
                    </button>
                    <button
                      onClick={() => setShowPayForm(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdvocatePaymentsPage() {
  const [activeTab, setActiveTab] = useState<'History' | 'Time Entries' | 'Expenses'>('History');

  // History (paid advocate invoices)
  const [invoices, setInvoices] = useState<AdvocateInvoice[]>([]);
  const [stats, setStats] = useState<AdvocateStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Time Entries
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<AdvocateInvoice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch advocate invoices + stats ──────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const [invRes, statsRes] = await Promise.all([
        customFetch(API.BILLING.ADVOCATE_INVOICES.LIST),
        customFetch(API.BILLING.ADVOCATE_INVOICES.STATS),
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(Array.isArray(data) ? data : data.results ?? []);
      } else {
        setHistoryError('Failed to load advocate invoices.');
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch {
      setHistoryError('Connection error. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Fetch time entries ────────────────────────────────────────────────────
  const fetchTimeEntries = useCallback(async () => {
    setTimeLoading(true);
    setTimeError(null);
    try {
      const res = await customFetch(API.BILLING.TIME_ENTRIES.LIST);
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(Array.isArray(data) ? data : data.results ?? []);
      } else {
        setTimeError('Failed to load time entries.');
      }
    } catch {
      setTimeError('Connection error.');
    } finally {
      setTimeLoading(false);
    }
  }, []);

  // ── Fetch expenses ────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setExpLoading(true);
    setExpError(null);
    try {
      const res = await customFetch(API.BILLING.EXPENSES.LIST);
      if (res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : data.results ?? []);
      } else {
        setExpError('Failed to load expenses.');
      }
    } catch {
      setExpError('Connection error.');
    } finally {
      setExpLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    if (activeTab === 'Time Entries' && timeEntries.length === 0) fetchTimeEntries();
    if (activeTab === 'Expenses' && expenses.length === 0) fetchExpenses();
  }, [activeTab]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await customFetch(API.BILLING.ADVOCATE_INVOICES.REVIEW(id), {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        showToast('Invoice approved successfully.');
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        const err = await res.json();
        showToast(err.error || 'Approval failed.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      const res = await customFetch(API.BILLING.ADVOCATE_INVOICES.REVIEW(id), {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', reason }),
      });
      if (res.ok) {
        showToast('Invoice rejected.');
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        const err = await res.json();
        showToast(err.error || 'Rejection failed.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (id: string, method: string, ref: string) => {
    setActionLoading(true);
    try {
      const res = await customFetch(API.BILLING.ADVOCATE_INVOICES.PAY(id), {
        method: 'POST',
        body: JSON.stringify({ payment_method: method, payment_reference: ref }),
      });
      if (res.ok) {
        showToast('Invoice marked as paid.');
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        const err = await res.json();
        showToast(err.error || 'Payment failed.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = filteredInvoices.map((inv) => [
      inv.invoice_date,
      inv.invoice_number,
      inv.advocate_name,
      inv.payment_method || '-',
      inv.total_amount,
      inv.status,
    ]);
    const header = ['Date', 'Transaction ID', 'Advocate', 'Method', 'Amount', 'Status'];
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'advocate_payouts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !search ||
        inv.advocate_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.payment_method?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalDistributed = useMemo(
    () => invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0),
    [invoices]
  );

  const tabs = ['Time Entries', 'Expenses', 'History'] as const;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold transition-all ${toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 px-2 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-[14px] font-bold transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-blue-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── HISTORY TAB ── */}
      {activeTab === 'History' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
            <div>
              <h2 className="text-xl font-black text-slate-900">Advocate Distributions</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Review payouts to external and internal advocates securely.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {stats && (
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                    {stats.submitted_invoices} Pending
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                    {stats.approved_invoices} Approved
                  </span>
                </div>
              )}
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Distributed
                </p>
                <p className="text-xl font-black text-blue-600">{fmt(totalDistributed)}</p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by advocate, ID..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
              <button
                onClick={fetchInvoices}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={exportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">Loading payouts...</span>
            </div>
          ) : historyError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm font-semibold text-slate-600">{historyError}</p>
              <button
                onClick={fetchInvoices}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <IndianRupee className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">No payouts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Advocate</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors cursor-default">
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">
                        {new Date(inv.invoice_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-700">{inv.advocate_name}</p>
                        {inv.advocate_email && (
                          <p className="text-xs text-slate-400 mt-0.5">{inv.advocate_email}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-600 capitalize">
                        {inv.payment_method ? inv.payment_method.replace('_', ' ') : '—'}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">
                        {fmt(inv.total_amount)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <span
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${STATUS_STYLES[inv.status] ?? 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TIME ENTRIES TAB ── */}
      {activeTab === 'Time Entries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-xl font-black text-slate-900">Advocate Time Entries</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Billable hours logged by advocates across all cases.
            </p>
          </div>

          {timeLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">Loading time entries...</span>
            </div>
          ) : timeError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm font-semibold text-slate-600">{timeError}</p>
              <button onClick={fetchTimeEntries} className="text-sm font-bold text-blue-600 hover:underline">Retry</button>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Clock className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">No time entries found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Advocate</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Case</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hours</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Rate</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-700">{entry.user_name}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{entry.case_title || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize">
                          {entry.activity_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900 text-right">{entry.hours}h</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-600 text-right">{fmt(entry.hourly_rate)}</td>
                      <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">{fmt(entry.amount)}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${STATUS_STYLES[entry.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {entry.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {activeTab === 'Expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-xl font-black text-slate-900">Advocate Expense Claims</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Out-of-pocket expenses submitted by advocates for reimbursement.
            </p>
          </div>

          {expLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">Loading expenses...</span>
            </div>
          ) : expError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm font-semibold text-slate-600">{expError}</p>
              <button onClick={fetchExpenses} className="text-sm font-bold text-blue-600 hover:underline">Retry</button>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Receipt className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">No expense claims found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted By</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Case</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Billable</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">
                        {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-700">{exp.submitted_by_name}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{exp.case_title || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize">
                          {exp.expense_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 max-w-[200px] truncate">{exp.description}</td>
                      <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">{fmt(exp.amount)}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-700 text-right">{fmt(exp.billable_amount)}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${STATUS_STYLES[exp.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {exp.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onPay={handlePay}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}