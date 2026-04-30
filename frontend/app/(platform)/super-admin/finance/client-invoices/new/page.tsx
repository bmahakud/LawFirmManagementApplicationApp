'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  ArrowLeft, Loader2, Plus, Trash2, Search,
  ChevronDown, Calendar, User, Briefcase, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Client {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  client_id?: string;
}

interface Case {
  id: string;
  case_title: string;
  client: string;
  client_name?: string; // full name string returned by backend
}

interface TimeEntry {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id'); // edit mode when present
  const isEditMode = !!invoiceId;
  useTopbarTitle(
    isEditMode ? 'Edit Invoice' : 'New Invoice',
    isEditMode ? 'Update invoice details.' : 'Generate an itemized bill for legal services.'
  );

  // States
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Form Fields
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-5);
    return `INV-${year}-${seq}`;
  });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: '1', description: '', hours: 1, rate: 0 }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', description: '', amount: 0 }
  ]);

  const [taxPercentage, setTaxPercentage] = useState<number>(18);
  const [customTaxAmount, setCustomTaxAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [invoiceStatus, setInvoiceStatus] = useState<string>('draft');

  const [notes, setNotes] = useState('Invoice for legal services');
  const [internalNotes, setInternalNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Edit-mode extras
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  // UI States
  const [clientSearch, setClientSearch] = useState('');
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isCaseOpen, setIsCaseOpen] = useState(false);

  const clientRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, casesRes] = await Promise.all([
          customFetch(API.CLIENTS.LIST),
          customFetch(API.CASES.LIST)
        ]);
        let clientsList: any[] = [];
        let casesList: any[] = [];

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          clientsList = Array.isArray(data) ? data : (data.results || []);
          setClients(clientsList);
        }
        if (casesRes.ok) {
          const data = await casesRes.json();
          casesList = Array.isArray(data) ? data : (data.results || []);
          setCases(casesList);
        }

        // Pre-populate if editing
        if (invoiceId) {
          const invRes = await customFetch(API.BILLING.INVOICES.DETAIL(invoiceId));
          if (invRes.ok) {
            const inv = await invRes.json();
            setInvoiceNumber(inv.invoice_number);
            setInvoiceDate(inv.invoice_date);
            setDueDate(inv.due_date);
            setTaxPercentage(parseFloat(inv.tax_percentage) || 0);
            setDiscountAmount(parseFloat(inv.discount_amount) || 0);
            setNotes(inv.notes || '');
            setInternalNotes(inv.internal_notes || '');
            setTermsAndConditions(inv.terms_and_conditions || '');
            setInvoiceStatus(inv.status || 'draft');
            if (inv.pdf_file) setExistingPdfUrl(inv.pdf_file);

            // Pre-select client — match by client_user_account_id first, fallback to client UUID
            const matchedClient = clientsList.find(
              (c: any) => c.id === inv.client_user_account_id || c.id === inv.client
            );
            setSelectedClient(matchedClient || { id: inv.client, name: inv.client_name, email: '' });

            // Pre-select case
            if (inv.case) {
              const matchedCase = casesList.find((c: any) => c.id === inv.case);
              setSelectedCase(matchedCase || { id: inv.case, case_title: inv.case_title || '', client: inv.client });
            }

            // Re-map time entries
            if (inv.time_entries_detail?.length) {
              setTimeEntries(inv.time_entries_detail.map((e: any) => ({
                id: e.id, description: e.description,
                hours: parseFloat(e.hours), rate: parseFloat(e.hourly_rate)
              })));
            }
            // Re-map expenses
            if (inv.expenses_detail?.length) {
              setExpenses(inv.expenses_detail.map((e: any) => ({
                id: e.id, description: e.description, amount: parseFloat(e.amount)
              })));
            }
          }
        }
      } catch (err) {
        console.error("Data fetch error", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();

    const handleClickOutside = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setIsClientOpen(false);
      if (caseRef.current && !caseRef.current.contains(e.target as Node)) setIsCaseOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Time Entry Management
  const addTimeEntry = () => {
    setTimeEntries(prev => [...prev, { id: Date.now().toString(), description: '', hours: 1, rate: 0 }]);
  };

  const removeTimeEntry = (id: string) => {
    if (timeEntries.length > 1) setTimeEntries(prev => prev.filter(r => r.id !== id));
  };

  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: any) => {
    setTimeEntries(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Expense Management
  const addExpense = () => {
    setExpenses(prev => [...prev, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  const removeExpense = (id: string) => {
    if (expenses.length > 1) setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Calculations
  const timeSubtotal = timeEntries.reduce((acc, row) => acc + (row.hours * row.rate), 0);
  const expenseSubtotal = expenses.reduce((acc, row) => acc + row.amount, 0);
  const subtotal = timeSubtotal + expenseSubtotal;
  const taxAmount = customTaxAmount > 0 ? customTaxAmount : subtotal * (taxPercentage / 100);
  const total = subtotal + taxAmount - discountAmount;

  const handleSubmit = async () => {
    if (!selectedClient) return alert("Please select a client");
    if (subtotal <= 0) return alert("Invoice amount must be greater than zero");

    setIsSubmitting(true);
    try {
      // Build FormData if a pdf file is attached, else use JSON
      let body: any;
      let headers: any = {};

      if (pdfFile) {
        const fd = new FormData();
        fd.append('client', (selectedClient as any).client_id || selectedClient.id);
        if (selectedCase?.id) fd.append('case', selectedCase.id);
        fd.append('invoice_number', invoiceNumber);
        fd.append('invoice_date', invoiceDate);
        fd.append('due_date', dueDate);
        fd.append('subtotal', subtotal.toFixed(2));
        fd.append('tax_percentage', taxPercentage.toFixed(2));
        fd.append('tax_amount', taxAmount.toFixed(2));
        fd.append('discount_amount', discountAmount.toFixed(2));
        fd.append('total_amount', total.toFixed(2));
        fd.append('notes', notes);
        fd.append('internal_notes', internalNotes);
        fd.append('terms_and_conditions', termsAndConditions);
        if (isEditMode) fd.append('status', invoiceStatus);
        fd.append('pdf_file', pdfFile);
        body = fd;
      } else {
        headers['Content-Type'] = 'application/json';
        const payload: any = {
          client: (selectedClient as any).client_id || selectedClient.id,
          case: selectedCase?.id || null,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          subtotal: subtotal.toFixed(2),
          tax_percentage: taxPercentage.toFixed(2),
          tax_amount: taxAmount.toFixed(2),
          discount_amount: discountAmount.toFixed(2),
          total_amount: total.toFixed(2),
          notes,
          internal_notes: internalNotes,
          terms_and_conditions: termsAndConditions,
          time_entries: timeEntries
            .filter((item) => item.description.trim() && item.hours > 0)
            .map((item) => ({ description: item.description, hours: item.hours, hourly_rate: item.rate, activity_type: 'other' })),
          expenses: expenses
            .filter((item) => item.description.trim() && item.amount > 0)
            .map((item) => ({ description: item.description, amount: item.amount, expense_type: 'other' })),
        };
        if (isEditMode) payload.status = invoiceStatus;
        body = JSON.stringify(payload);
      }

      const url = isEditMode ? API.BILLING.INVOICES.DETAIL(invoiceId!) : API.BILLING.INVOICES.CREATE;
      const method = isEditMode ? 'PATCH' : 'POST';
      const res = await customFetch(url, { method, headers, body });

      if (res.ok) {
        router.push('/super-admin/finance/client-invoices');
      } else {
        const error = await res.json();
        console.error(error);
        alert(isEditMode ? 'Error updating invoice' : 'Error creating invoice');
      }
    } catch (err) {
      console.error(err);
      alert('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const name = (c.name || `${c.first_name || ''} ${c.last_name || ''}`).toLowerCase();
    return name.includes(clientSearch.toLowerCase()) || c.email?.toLowerCase().includes(clientSearch.toLowerCase());
  });

  // Filter cases by matching client full name against case's client_name field
  const filteredCases = selectedClient
    ? cases.filter(c => {
        const clientFullName = `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const caseName = c.client_name
          ?.replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        return caseName === clientFullName;
      })
    : cases;

  if (dataLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-700">

      {/* Header Actions */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="text-xl font-medium text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Invoice' : 'New Invoice'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-[8px] hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-[8px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Invoice
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-5 space-y-6">

        {/* Section 1: Client & Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">

          {/* Client Select */}
          <div className="relative" ref={clientRef}>
            <label className="block text-[13px] font-semibold text-red-600 mb-2">Client*</label>
            {isEditMode ? (
              /* Read-only in edit mode */
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] cursor-not-allowed">
                <span className="text-[14px] text-slate-900 font-medium">
                  {selectedClient ? (selectedClient.name || `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim()) : 'Loading...'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked</span>
              </div>
            ) : (
              <>
                <div
                  onClick={() => setIsClientOpen(!isClientOpen)}
                  className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] cursor-pointer hover:border-slate-400 transition-all group"
                >
                  <span className={`text-[14px] ${selectedClient ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {selectedClient ? (selectedClient.name || `${selectedClient.first_name} ${selectedClient.last_name}`) : "Select or add a client"}
                  </span>
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                    <span className="p-1 px-2 bg-blue-600 rounded-md text-white">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
                <AnimatePresence>
                  {isClientOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[10px] shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <input
                          type="text" placeholder="Search..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-100 rounded-md focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredClients.map(c => (
                          <div key={c.id} onClick={() => { setSelectedClient(c); setSelectedCase(null); setIsClientOpen(false); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-medium border-b border-slate-50 last:border-0">
                            {c.name || `${c.first_name} ${c.last_name}`}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Case Select */}
          <div className="relative" ref={caseRef}>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Case (Optional)</label>
            {isEditMode ? (
              /* Read-only in edit mode */
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] cursor-not-allowed">
                <span className="text-[14px] text-slate-900 font-medium">
                  {selectedCase ? selectedCase.case_title : 'No case linked'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked</span>
              </div>
            ) : (
              <>
                <div
                  onClick={() => selectedClient && setIsCaseOpen(!isCaseOpen)}
                  className={`flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] transition-all ${
                    selectedClient ? 'cursor-pointer hover:border-slate-400' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className={`text-[14px] ${selectedCase ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {selectedCase ? selectedCase.case_title : 'Select a case'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
                <AnimatePresence>
                  {isCaseOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[10px] shadow-xl z-50 overflow-hidden"
                    >
                      <div className="max-h-[200px] overflow-y-auto">
                        {!selectedClient && <div className="p-4 text-center text-xs text-slate-400">Select a client first</div>}
                        {selectedClient && filteredCases.map(c => (
                          <div key={c.id} onClick={() => { setSelectedCase(c); setIsCaseOpen(false); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-medium">
                            {c.case_title}
                          </div>
                        ))}
                        {selectedClient && filteredCases.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400">No cases found for this client</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-[13px] font-semibold text-red-600 mb-2">Invoice Number*</label>
            <input
              type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
              placeholder="INV-0000227"
            />
          </div>

          {/* Dates */}
          <div>
            <label className="block text-[13px] font-semibold text-red-600 mb-2">Invoice Date*</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all cursor-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-red-600 mb-2">Due Date*</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all cursor-text"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Time Entries Table */}
        <div className="border border-slate-200 rounded-[10px] overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Time Entries</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-[50%] border-r border-slate-200">Description</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200">Hours</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Rate (₹)</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200">Amount (₹)</th>
                <th className="py-2.5 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeEntries.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50/50">
                  <td className="py-2 px-4 border-r border-slate-200">
                    <input
                      type="text" placeholder="Describe the work performed." value={row.description}
                      onChange={(e) => updateTimeEntry(row.id, 'description', e.target.value)}
                      className="w-full bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-200">
                    <input
                      type="number" value={row.hours === 0 ? '' : row.hours}
                      onChange={(e) => updateTimeEntry(row.id, 'hours', Math.max(0, parseFloat(e.target.value) || 0))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-20 bg-transparent text-center text-[13px] font-medium text-slate-700 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    <input
                      type="number" value={row.rate === 0 ? '' : row.rate}
                      onChange={(e) => updateTimeEntry(row.id, 'rate', Math.max(0, parseFloat(e.target.value) || 0))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-32 bg-transparent text-right text-[13px] font-medium text-slate-700 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-4 text-right text-[13px] font-bold text-slate-900 border-r border-slate-200">
                    {(row.hours * row.rate).toFixed(2)}
                  </td>
                  <td className="py-2 px-3">
                    <button onClick={() => removeTimeEntry(row.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 rounded-md transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addTimeEntry}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 hover:bg-slate-100 text-blue-600 rounded-[8px] text-[13px] font-bold transition-all"
        >
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Plus className="w-3 h-3" strokeWidth={3} />
          </div>
          Add Time Entry
        </button>

        {/* Section 2b: Expenses Table */}
        <div className="border border-slate-200 rounded-[10px] overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Expenses</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-[70%] border-r border-slate-200">Description</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200">Amount (₹)</th>
                <th className="py-2.5 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="group hover:bg-slate-50/50">
                  <td className="py-2 px-4 border-r border-slate-200">
                    <input
                      type="text" placeholder="Describe the expense." value={exp.description}
                      onChange={(e) => updateExpense(exp.id, 'description', e.target.value)}
                      className="w-full bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-4 text-right border-r border-slate-200">
                    <input
                      type="number" value={exp.amount === 0 ? '' : exp.amount}
                      onChange={(e) => updateExpense(exp.id, 'amount', Math.max(0, parseFloat(e.target.value) || 0))}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-40 bg-transparent text-right text-[13px] font-medium text-slate-700 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <button onClick={() => removeExpense(exp.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 rounded-md transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addExpense}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 hover:bg-slate-100 text-blue-600 rounded-[8px] text-[13px] font-bold transition-all"
        >
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Plus className="w-3 h-3" strokeWidth={3} />
          </div>
          Add Expense
        </button>

        {/* Section 3 & 4 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-5 border-t border-slate-100">

          {/* Notes (Section 4) */}
          <div className="space-y-4">

            {/* Edit-mode only: PDF Upload */}
            {isEditMode && (
              <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">PDF Invoice File</label>
                  {existingPdfUrl && (
                    <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-blue-600 font-semibold mb-2 hover:underline truncate">
                      📄 View existing PDF
                    </a>
                  )}
                  <label className="flex items-center gap-3 px-4 py-3 bg-white border border-dashed border-slate-300 rounded-[8px] cursor-pointer hover:border-blue-400 transition-all">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-[13px] text-slate-500 font-medium">
                      {pdfFile ? pdfFile.name : 'Upload PDF (optional)'}
                    </span>
                    <input type="file" accept="application/pdf" className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-red-600 mb-2">Notes*</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full h-24 p-4 border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 resize-none bg-white"
                placeholder="Invoice for legal services"
              />
              <p className="text-[11px] text-slate-600 mt-2">This will be displayed on the invoice.</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Internal Notes</label>
              <textarea
                value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full h-24 p-4 border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 resize-none bg-white"
                placeholder="Enter internal notes (not visible to client)"
              />
              <p className="text-[11px] text-slate-600 mt-2">This is for your internal reference.</p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Terms and Conditions</label>
              <textarea
                value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full h-24 p-4 border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 resize-none bg-white"
                placeholder="Enter terms and conditions"
              />
              <p className="text-[11px] text-slate-600 mt-2">This will be displayed on the invoice.</p>
            </div>
          </div>

          {/* Billing Summary (Section 3) */}
          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-slate-700">Time Entries (₹)</span>
                <span className="text-[15px] font-semibold text-slate-700">{timeSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-slate-700">Expenses (₹)</span>
                <span className="text-[15px] font-semibold text-slate-700">{expenseSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">Subtotal (₹)</span>
                <span className="text-[15px] font-bold text-slate-900">{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-slate-700">Tax (%)</span>
                <div className="flex items-center gap-2 border border-slate-200 rounded-[8px] px-3 py-1.5 focus-within:border-blue-500 transition-all bg-white">
                  <input
                    type="number"
                    value={taxPercentage === 0 ? '' : taxPercentage}
                    onChange={(e) => {
                      setTaxPercentage(Math.max(0, parseFloat(e.target.value) || 0));
                      setCustomTaxAmount(0); // clear custom tax when % is used
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    disabled={customTaxAmount > 0}
                    className="w-12 text-center text-sm font-bold text-slate-900 focus:outline-none bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <span className="text-xs text-slate-500 border-l border-slate-100 pl-2 font-bold">%</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-slate-700">Or Custom Tax Amount (₹)</span>
                <input
                  type="number"
                  value={customTaxAmount === 0 ? '' : customTaxAmount}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setCustomTaxAmount(val);
                    if (val > 0) setTaxPercentage(0); // clear % when custom amount is used
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-40 border border-slate-200 rounded-[8px] px-4 py-2 text-right text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all bg-white placeholder:text-slate-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-slate-700">Discount (₹)</span>
                <input
                  type="number" value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-40 border border-slate-200 rounded-[8px] px-4 py-2 text-right text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all bg-white placeholder:text-slate-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-slate-700">Tax Amount (₹)</span>
                <span className="text-[15px] font-bold text-slate-900">{taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-6 mt-4 border-t-2 border-slate-100 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Total (₹)</span>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">
                  {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
