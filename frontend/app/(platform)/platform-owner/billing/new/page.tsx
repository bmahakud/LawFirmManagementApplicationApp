'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  ArrowLeft, Loader2, Search,
  ChevronDown, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePlatformInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const isEditMode = !!invoiceId;

  useTopbarTitle(
    isEditMode ? 'Edit Platform Invoice' : 'New Platform Invoice',
    isEditMode ? 'Update an existing firm subscription bill.' : 'Generate a bill for a firm subscription.'
  );

  // States
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firms, setFirms] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // Form Fields
  const [selectedFirm, setSelectedFirm] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-4);
    return `PLAT-${year}-${seq}`;
  });
  
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState(nextMonth);
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(nextMonth);

  const [planAmount, setPlanAmount] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(18);
  const [notes, setNotes] = useState('Monthly subscription');

  // UI States
  const [firmSearch, setFirmSearch] = useState('');
  const [isFirmOpen, setIsFirmOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const firmRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [firmsRes, plansRes] = await Promise.all([
          customFetch(API.FIRMS.LIST),
          customFetch(API.SUBSCRIPTIONS.PLANS.LIST)
        ]);

        let firmsList: any[] = [];
        let plansList: any[] = [];

        if (firmsRes.ok) {
          const data = await firmsRes.json();
          firmsList = Array.isArray(data) ? data : (data.results || []);
          setFirms(firmsList);
        }
        if (plansRes.ok) {
          const data = await plansRes.json();
          plansList = Array.isArray(data) ? data : (data.results || []);
          setPlans(plansList);
        }

        if (isEditMode) {
          const invRes = await customFetch(API.SUBSCRIPTIONS.PLATFORM_INVOICES.DETAIL(invoiceId));
          if (invRes.ok) {
            const inv = await invRes.json();
            
            // Map fetched data to state
            setInvoiceNumber(inv.invoice_number);
            setInvoiceDate(inv.invoice_date || today);
            setDueDate(inv.due_date || nextMonth);
            setPeriodStart(inv.period_start || today);
            setPeriodEnd(inv.period_end || nextMonth);
            setPlanAmount(parseFloat(inv.plan_amount) || 0);
            setTaxPercentage(parseFloat(inv.tax_percentage) || 0);
            setNotes(inv.notes || '');

            // Re-link Firm
            if (inv.firm) {
              const matchedFirm = firmsList.find((f: any) => f.id === inv.firm || f.uuid === inv.firm);
              setSelectedFirm(matchedFirm || { id: inv.firm, name: inv.firm_name });
            }

            // Re-link Plan
            if (inv.subscription_plan) {
              const matchedPlan = plansList.find((p: any) => p.id === inv.subscription_plan);
              setSelectedPlan(matchedPlan || { id: inv.subscription_plan, name: inv.plan_name });
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
      if (firmRef.current && !firmRef.current.contains(e.target as Node)) setIsFirmOpen(false);
      if (planRef.current && !planRef.current.contains(e.target as Node)) setIsPlanOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [invoiceId, isEditMode]); // Add dependencies



  const taxAmount = planAmount * (taxPercentage / 100);
  const totalAmount = planAmount + taxAmount;

  const handleSubmit = async () => {
    if (!selectedFirm) return alert("Please select a firm");
    if (!selectedPlan) return alert("Please select a subscription plan");
    if (planAmount <= 0) return alert("Plan amount must be greater than zero");

    setIsSubmitting(true);
    try {
      const payload: any = {
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        period_start: periodStart,
        period_end: periodEnd,
        plan_amount: planAmount.toFixed(2),
        tax_percentage: taxPercentage.toFixed(2),
        notes: notes,
        subscription_plan: selectedPlan.id
      };

      if (!isEditMode) {
        payload.firm = selectedFirm.id || selectedFirm.firm_id;
        if (!payload.firm && selectedFirm.uuid) payload.firm = selectedFirm.uuid;
      }

      const url = isEditMode ? API.SUBSCRIPTIONS.PLATFORM_INVOICES.DETAIL(invoiceId!) : API.SUBSCRIPTIONS.PLATFORM_INVOICES.CREATE;
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await customFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 201) {
        router.push('/platform-owner/billing');
      } else {
        const error = await res.json();
        console.error(error);
        alert(`Error saving invoice: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      console.error(err);
      alert('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFirms = firms.filter(f => {
    const name = (f.firm_name || f.name || '').toLowerCase();
    return name.includes(firmSearch.toLowerCase());
  });

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
            {isEditMode ? 'Edit Platform Invoice' : 'New Platform Invoice'}
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
            {isEditMode ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-8">

        {/* Section 1: Firm & Plan Info */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-[12px] p-6">
          <h3 className="text-base font-bold text-slate-900 mb-5">Subscription Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">

            {/* Firm Select */}
            <div className="relative" ref={firmRef}>
              <label className="block text-[13px] font-semibold text-red-600 mb-2">Firm*</label>
              {isEditMode ? (
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] cursor-not-allowed">
                  <span className="text-[14px] text-slate-900 font-medium">
                    {selectedFirm ? (selectedFirm.firm_name || selectedFirm.name) : "Loading..."}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked</span>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => setIsFirmOpen(!isFirmOpen)}
                    className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] cursor-pointer hover:border-slate-400 transition-all group"
                  >
                    <span className={`text-[14px] ${selectedFirm ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                      {selectedFirm ? (selectedFirm.firm_name || selectedFirm.name) : "Select a firm"}
                    </span>
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                      <span className="p-1 px-2 bg-blue-600 rounded-md text-white">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isFirmOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[10px] shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-slate-100">
                          <input
                            type="text" placeholder="Search firm..." value={firmSearch} onChange={(e) => setFirmSearch(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-100 rounded-md focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredFirms.map(f => (
                            <div key={f.id || f.uuid} onClick={() => { setSelectedFirm(f); setIsFirmOpen(false); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-medium border-b border-slate-50 last:border-0">
                              {f.firm_name || f.name}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Plan Select */}
            <div className="relative" ref={planRef}>
              <label className="block text-[13px] font-semibold text-red-600 mb-2">Subscription Plan*</label>
              <div
                onClick={() => setIsPlanOpen(!isPlanOpen)}
                className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-[8px] cursor-pointer hover:border-slate-400 transition-all"
              >
                <span className={`text-[14px] ${selectedPlan ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                  {selectedPlan ? (selectedPlan.name || selectedPlan.plan_name) : "Select a plan"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </div>
              <AnimatePresence>
                {isPlanOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[10px] shadow-xl z-50 overflow-hidden"
                  >
                    <div className="max-h-[200px] overflow-y-auto">
                      {plans.map(p => (
                        <div key={p.id} onClick={() => { 
                          setSelectedPlan(p); 
                          setPlanAmount(parseFloat(p.price));
                          setIsPlanOpen(false); 
                        }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-medium border-b border-slate-50 last:border-0 flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-slate-400">₹{parseFloat(p.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-[13px] font-semibold text-red-600 mb-2">Invoice Number*</label>
              <input
                type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Dates */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-[12px] p-6">
          <h3 className="text-base font-bold text-slate-900 mb-5">Billing Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
            
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

            <div>
              <label className="block text-[13px] font-semibold text-red-600 mb-2">Period Start*</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all cursor-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-red-600 mb-2">Period End*</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all cursor-text"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Financials & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Notes</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 p-4 border border-slate-200 rounded-[8px] text-[14px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 resize-none bg-white"
                placeholder="Monthly subscription"
              />
              <p className="text-[11px] text-slate-500 mt-2">These notes will appear on the invoice.</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-[12px] p-6 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-6">Payment Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold text-slate-600">Plan Amount (₹)</span>
                <input
                  type="number" value={planAmount === 0 ? '' : planAmount}
                  onChange={(e) => setPlanAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-32 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-right text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold text-slate-600">Tax Percentage (%)</span>
                <input
                  type="number" value={taxPercentage === 0 ? '' : taxPercentage}
                  onChange={(e) => setTaxPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-32 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-right text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-between items-center py-2 border-t border-slate-200 mt-2">
                <span className="text-sm font-semibold text-slate-600">Tax Amount (₹)</span>
                <span className="text-[15px] font-bold text-slate-900">{taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-4 mt-2 border-t-[2px] border-slate-200 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Total (₹)</span>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">
                  {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
