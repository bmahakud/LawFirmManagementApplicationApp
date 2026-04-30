'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  ArrowLeft, Loader2, Calendar, 
  ChevronDown, Search, CloudUpload, AlertCircle, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Case {
  id: string;
  case_title: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

export default function CreateExpensePage() {
  const router = useRouter();
  useTopbarTitle('New Expense', 'Log operational or case-related expenditures.');

  // Loading States
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form States
  const [submittedBy, setSubmittedBy] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType] = useState('court_fee');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [markupPercentage, setMarkupPercentage] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // UI States
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const caseRef = useRef<HTMLDivElement>(null);
  
  // File Upload States
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let currentUserId = '';
    const detailsRaw = localStorage.getItem('user_details');
    if (detailsRaw) {
      try {
        const user = JSON.parse(detailsRaw);
        if (user.id) {
          currentUserId = user.id;
          setSubmittedBy(user.id);
        }
      } catch(e) {}
    }

    const fetchData = async () => {
      try {
        const [casesRes, usersRes] = await Promise.all([
          customFetch(API.CASES.LIST),
          customFetch(API.USERS.LIST)
        ]);

        if (casesRes.ok) {
          const data = await casesRes.json();
          setCases(Array.isArray(data) ? data : data.results || []);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          const fetchedUsers = Array.isArray(data) ? data : data.results || [];
          setUsers(fetchedUsers);
          
          // Only auto-select first user if we didn't get one from localStorage
          if (!currentUserId && fetchedUsers.length > 0) {
            setSubmittedBy(fetchedUsers[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();

    const handleClickOutside = (e: MouseEvent) => {
      if (caseRef.current && !caseRef.current.contains(e.target as Node)) setIsCaseOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculations for Preview
  const markupValue = billable ? (amount * (markupPercentage / 100)) : 0;
  const totalBillable = amount + markupValue;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setReceiptFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!date || !expenseType || amount <= 0 || !description || !submittedBy) {
      alert("Please fill all required fields (Date, Type, Amount, Description)");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('expense_type', expenseType);
      formData.append('description', description);
      formData.append('amount', amount.toFixed(2));
      formData.append('billable', String(billable));
      formData.append('markup_percentage', markupPercentage.toFixed(2));
      formData.append('notes', notes);
      formData.append('submitted_by', submittedBy);
      if (selectedCase) formData.append('case', selectedCase.id);
      if (receiptFile) formData.append('receipt', receiptFile);

      const res = await customFetch(API.BILLING.EXPENSES.CREATE, {
        method: 'POST',
        // customFetch handles headers, but for FormData we should let the browser set it
        body: formData,
        headers: {} // passing empty headers to ensure customFetch doesn't force json
      });

      if (res.ok) {
        router.push('/super-admin/finance/expenses');
      } else {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err));
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCases = cases.filter(c => 
    (c.case_title || '').toLowerCase().includes(caseSearch.toLowerCase())
  );

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-32">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">New Expense</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => router.back()}
             className="px-5 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-[8px] hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <div className="flex items-center">
             <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-l-[8px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
             >
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               Save Expense
             </button>
             <button className="px-3 py-2 bg-blue-600 text-white border-l border-blue-500 rounded-r-[8px] hover:bg-blue-700 transition-all">
                <ChevronDown className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 space-y-8">
        
        {/* Section 1: Basic Information */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Basic Information</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Submitted By</label>
                 <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {users.find(u => u.id === submittedBy) ? 
                      `${users.find(u => u.id === submittedBy)?.first_name} ${users.find(u => u.id === submittedBy)?.last_name}` : 
                      'Current User'}
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Expenses are automatically logged under your profile.</p>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Date<span className="text-red-500">*</span></label>
                 <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                       type="date" value={date} onChange={(e) => setDate(e.target.value)}
                       className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Expense Type<span className="text-red-500">*</span></label>
                 <div className="relative">
                    <select 
                       value={expenseType} onChange={(e) => setExpenseType(e.target.value)}
                       className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                       <option value="court_fee">Court Fee</option>
                       <option value="filing_fee">Filing Fee</option>
                       <option value="travel">Travel</option>
                       <option value="accommodation">Accommodation</option>
                       <option value="photocopying">Photocopying</option>
                       <option value="courier">Courier/Postage</option>
                       <option value="expert_witness">Expert Witness Fee</option>
                       <option value="investigation">Investigation</option>
                       <option value="translation">Translation</option>
                       <option value="notary">Notary Fee</option>
                       <option value="other">Other</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                 </div>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Amount (₹)<span className="text-red-500">*</span></label>
                 <input 
                  type="number" value={amount || ''} onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
               />
              </div>

              <div className="md:col-span-2">
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Description<span className="text-red-500">*</span></label>
                 <div className="relative">
                    <textarea 
                       value={description} onChange={(e) => setDescription(e.target.value)}
                       placeholder="Enter expense description"
                       maxLength={500}
                       className="w-full h-24 p-3 bg-white border border-slate-200 rounded-[6px] text-[13px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                    />
                    <span className="absolute bottom-2 right-3 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/80 px-1">{description.length}/500</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Section 2: Billing Information */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Billing Information</h3>
           <div className="flex items-center gap-3 mb-4">
              <span className="text-[12px] font-bold text-slate-900">Billable</span>
              <button 
                 onClick={() => setBillable(!billable)}
                 className={`w-9 h-4.5 rounded-full transition-all relative ${billable ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                 <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${billable ? 'left-5' : 'left-0.5'}`} />
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Markup Percentage (%)</label>
                 <div className="relative">
                    <input 
                       type="number" value={markupPercentage || ''} onChange={(e) => setMarkupPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                       onWheel={(e) => e.currentTarget.blur()}
                       disabled={!billable}
                       className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">%</span>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-medium capitalize">Billable amount is calculated based on amount and markup percentage.</p>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Billable Amount (₹)</label>
                 <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-[6px] text-[13px] font-bold text-slate-700">
                    {totalBillable.toFixed(2)}
                 </div>
              </div>
           </div>
        </section>

        {/* Section 3: Additional Information */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Additional Information</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="relative" ref={caseRef}>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Case (Optional)</label>
                 <div 
                    onClick={() => setIsCaseOpen(!isCaseOpen)}
                    className="flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-[6px] cursor-pointer hover:border-slate-300 transition-all"
                 >
                    <span className={`text-[13px] ${selectedCase ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                       {selectedCase ? selectedCase.case_title : "Select a case"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                 </div>

                 <AnimatePresence>
                    {isCaseOpen && (
                       <motion.div 
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-[8px] shadow-2xl z-50 overflow-hidden"
                       >
                          <div className="p-2.5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                             <Search className="w-3 h-3 text-slate-500" />
                             <input 
                                type="text" placeholder="Search cases..." value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)}
                                className="w-full bg-transparent border-none text-[11px] text-slate-900 focus:outline-none placeholder:text-slate-400"
                             />
                          </div>
                          <div className="max-h-[150px] overflow-y-auto">
                             {filteredCases.map(c => (
                                <div 
                                   key={c.id} onClick={() => { setSelectedCase(c); setIsCaseOpen(false); }}
                                   className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-[12px] font-medium border-b border-slate-50 last:border-0"
                                >
                                   {c.case_title}
                                </div>
                             ))}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Notes</label>
                 <div className="relative">
                    <textarea 
                       value={notes} onChange={(e) => setNotes(e.target.value)}
                       placeholder="Add any additional notes (optional)"
                       maxLength={500}
                       className="w-full h-24 p-3 bg-white border border-slate-200 rounded-[6px] text-[13px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                    />
                    <span className="absolute bottom-2 right-3 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/80 px-1">{notes.length}/500</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Section 4: Receipt (Optional) */}
        <section className="space-y-4 pb-12">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Receipt (Optional)</h3>
           <input 
             type="file" ref={fileInputRef} onChange={handleFileChange} 
             className="hidden" accept="image/*,.pdf" 
           />
           <div 
             onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
             onDragLeave={() => setIsDragging(false)}
             onDrop={handleDrop}
             onClick={() => fileInputRef.current?.click()}
             className={`border-2 border-dashed rounded-[6px] p-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${
               isDragging ? 'border-blue-500 bg-blue-50/50' : 
               receiptFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 bg-slate-50/20 hover:bg-slate-50/50'
             }`}
           >
              {receiptFile ? (
                <>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">{receiptFile.name}</p>
                  <p className="text-[10px] text-emerald-600 mt-1 font-medium">File ready for upload ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }}
                    className="mt-3 text-[11px] font-bold text-red-500 hover:underline"
                  >
                    Remove File
                  </button>
                </>
              ) : (
                <>
                  <CloudUpload className={`w-6 h-6 mb-2 transition-transform group-hover:scale-110 ${isDragging ? 'text-blue-600 animate-bounce' : 'text-slate-400'}`} />
                  <p className="text-[13px] font-bold text-slate-800">
                    {isDragging ? "Drop here to upload" : "Drag & drop file here or browse"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium text-center">
                    PNG, JPG or PDF up to 10MB
                  </p>
                </>
              )}
           </div>
        </section>

      </div>
    </div>
  );
}
