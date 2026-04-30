'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  ArrowLeft, Loader2, Calendar, 
  ChevronDown, Search, CloudUpload, 
  Edit3, Trash2, Save, X, Info,
  Briefcase, User, Tags, Receipt, AlertCircle
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

interface Expense {
  id: string;
  date: string;
  expense_type: string;
  description: string;
  amount: string;
  billable: boolean;
  markup_percentage: string;
  billable_amount: string;
  notes: string;
  case: string;
  case_title: string;
  submitted_by: string;
  submitted_by_name: string;
  status: string;
  receipt?: string;
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useTopbarTitle('Expense Detail', 'View and manage expense records.');

  // States
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Edit States
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const caseRef = useRef<HTMLDivElement>(null);

  // File Upload States
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDetail = async () => {
    try {
      const res = await customFetch(API.BILLING.EXPENSES.DETAIL(id));
      if (res.ok) {
        const data = await res.json();
        setExpense(data);
        setEditForm(data);
      } else {
        router.push('/super-admin/finance/expenses');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [casesRes, usersRes] = await Promise.all([
        customFetch(API.CASES.LIST),
        customFetch(API.USERS.LIST)
      ]);
      if (casesRes.ok) setCases((await casesRes.json()).results || []);
      if (usersRes.ok) setUsers((await usersRes.json()).results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchOptions();
    
    const handleClickOutside = (e: MouseEvent) => {
      if (caseRef.current && !caseRef.current.contains(e.target as Node)) setIsCaseOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (editForm.date) formData.append('date', editForm.date);
      if (editForm.expense_type) formData.append('expense_type', editForm.expense_type);
      if (editForm.description) formData.append('description', editForm.description);
      if (editForm.amount) formData.append('amount', editForm.amount);
      if (editForm.billable !== undefined) formData.append('billable', String(editForm.billable));
      if (editForm.markup_percentage) formData.append('markup_percentage', editForm.markup_percentage);
      if (editForm.notes !== undefined) formData.append('notes', editForm.notes);
      if (editForm.case) formData.append('case', editForm.case);
      
      // Only append if it's a new file
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await customFetch(API.BILLING.EXPENSES.DETAIL(id), {
        method: 'PATCH',
        body: formData,
        headers: {} // Allow browser to set boundary
      });
      if (res.ok) {
        const updated = await res.json();
        setExpense(updated);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await customFetch(API.BILLING.EXPENSES.DETAIL(id), { method: 'DELETE' });
      if (res.ok) router.push('/super-admin/finance/expenses');
    } catch (err) {
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!expense) return null;

  const filteredCases = cases.filter(c => (c.case_title || '').toLowerCase().includes(caseSearch.toLowerCase()));
  const currentTotal = parseFloat(editForm.amount || '0') + (editForm.billable ? (parseFloat(editForm.amount || '0') * (parseFloat(editForm.markup_percentage || '0') / 100)) : 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Editing Expense' : `Expense: ${expense.expense_type.replace('_', ' ')}`}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              {expense.id}
              {!isEditing && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${expense.status === 'invoiced' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                  {expense.status}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all mr-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg flex items-center gap-2 shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Expense
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 space-y-8">
        
        {/* Section 1: Basic Information */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Basic Information</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Submitted By</label>
                 <p className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-[13px] font-semibold text-slate-700 flex items-center gap-2">
                   <User className="w-4 h-4 text-slate-400" />
                   {expense.submitted_by_name}
                 </p>
                 <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Record owner cannot be changed after logging.</p>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Date</label>
                 {isEditing ? (
                   <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px]" />
                 ) : (
                   <p className="text-[14px] font-semibold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" />{new Date(expense.date).toLocaleDateString()}</p>
                 )}
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Expense Type</label>
                 {isEditing ? (
                   <div className="relative">
                      <select 
                         value={editForm.expense_type} onChange={(e) => setEditForm({...editForm, expense_type: e.target.value})}
                         className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] appearance-none"
                      >
                         <option value="court_fee">Court Fee</option>
                         <option value="filing_fee">Filing Fee</option>
                         <option value="travel">Travel</option>
                         <option value="accommodation">Accommodation</option>
                         <option value="photocopying">Photocopying</option>
                         <option value="courier">Courier/Postage</option>
                         <option value=" expert_witness">Expert Witness Fee</option>
                         <option value="investigation">Investigation</option>
                         <option value="translation">Translation</option>
                         <option value="notary">Notary Fee</option>
                         <option value="other">Other</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" />
                   </div>
                 ) : (
                   <p className="text-[14px] font-semibold text-slate-800 capitalize bg-slate-100 px-3 py-1 rounded w-fit">{expense.expense_type.replace('_', ' ')}</p>
                 )}
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Amount (₹)</label>
                 {isEditing ? (
                   <input 
                     type="number" value={editForm.amount || ''} 
                     onChange={(e) => setEditForm({...editForm, amount: Math.max(0, parseFloat(e.target.value) || 0).toString()})} 
                     onWheel={(e) => e.currentTarget.blur()}
                     className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] font-bold" 
                   />
                 ) : (
                   <p className="text-xl font-black text-slate-900">₹{parseFloat(expense.amount).toLocaleString('en-IN')}</p>
                 )}
              </div>

              <div className="md:col-span-2">
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Description</label>
                 {isEditing ? (
                   <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full h-24 p-3 bg-white border border-slate-200 rounded-[6px] text-[13px]" />
                 ) : (
                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm font-medium text-slate-700 leading-relaxed italic">"{expense.description}"</div>
                 )}
              </div>
           </div>
        </section>

        {/* Section 2: Billing Information */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Billing Information</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <div className="flex items-center gap-3 mb-4">
                    <span className="text-[12px] font-bold text-slate-900">Billable to Client</span>
                    {isEditing ? (
                      <button onClick={() => setEditForm({...editForm, billable: !editForm.billable})} className={`w-9 h-4.5 rounded-full relative transition-all ${editForm.billable ? 'bg-blue-600' : 'bg-slate-300'}`}>
                         <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${editForm.billable ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    ) : (
                      <span className={`text-[10px] font-black px-2 py-1 rounded ${expense.billable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {expense.billable ? 'YES' : 'NO'}
                      </span>
                    )}
                 </div>
                 
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Markup Percentage (%)</label>
                 {isEditing ? (
                   <input 
                     type="number" value={editForm.markup_percentage || ''} 
                     onChange={(e) => setEditForm({...editForm, markup_percentage: Math.max(0, parseFloat(e.target.value) || 0).toString()})} 
                     onWheel={(e) => e.currentTarget.blur()}
                     disabled={!editForm.billable} 
                     className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-[13px] disabled:opacity-30" 
                   />
                 ) : (
                   <p className="text-[14px] font-bold text-slate-800">{expense.markup_percentage}%</p>
                 )}
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Total Billable Amount</label>
                 <div className="text-2xl font-black text-slate-900 tracking-tighter">
                    ₹{parseFloat(isEditing ? currentTotal.toString() : expense.billable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                 </div>
              </div>
           </div>
        </section>

        {/* Section 3: Additional Information */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Additional Information</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="relative" ref={caseRef}>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Linked Case</label>
                 {isEditing ? (
                   <div 
                      onClick={() => setIsCaseOpen(!isCaseOpen)}
                      className="flex justify-between items-center px-3 py-2 bg-white border border-slate-200 rounded-[6px] cursor-pointer hover:border-slate-300 transition-all"
                   >
                      <span className="text-[13px] font-medium">
                        {cases.find(c => c.id === editForm.case)?.case_title || "No Case Linked"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                   </div>
                 ) : (
                   <p className="text-[14px] font-semibold text-slate-800 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" />{expense.case_title || 'N/A'}</p>
                 )}
                 
                 <AnimatePresence>
                    {isCaseOpen && (
                       <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-[8px] shadow-2xl z-50">
                          <div className="p-2 border-b"><input type="text" placeholder="Search..." value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} className="w-full text-xs focus:outline-none" /></div>
                          <div className="max-h-[150px] overflow-y-auto">
                             {filteredCases.map(c => <div key={c.id} onClick={() => { setEditForm({...editForm, case: c.id}); setIsCaseOpen(false); }} className="px-3 py-2 hover:bg-slate-50 text-xs cursor-pointer">{c.case_title}</div>)}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div>
                 <label className="block text-[12px] font-bold text-slate-900 mb-1.5">Internal Notes</label>
                 {isEditing ? (
                   <textarea value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} className="w-full h-24 p-3 bg-white border border-slate-200 rounded-[6px] text-[13px]" />
                 ) : (
                   <p className="text-sm font-medium text-slate-600 italic">"{expense.notes || 'No internal notes'}"</p>
                 )}
              </div>
           </div>
        </section>

        {/* Section 4: Receipt */}
        <section className="space-y-4 pb-12">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Receipt</h3>
            
            {isEditing ? (
              <>
                <input 
                  type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && setReceiptFile(e.target.files[0])} 
                  className="hidden" accept="image/*,.pdf" 
                />
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files?.[0]) setReceiptFile(e.dataTransfer.files[0]); }}
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
                       <p className="text-[10px] text-emerald-600 mt-1 font-medium">New file selected</p>
                     </>
                   ) : (
                     <>
                       <CloudUpload className={`w-6 h-6 mb-2 transition-transform group-hover:scale-110 ${isDragging ? 'text-blue-600 animate-bounce' : 'text-slate-400'}`} />
                       <p className="text-[13px] font-bold text-slate-800">
                         {isDragging ? "Drop here to upload" : expense.receipt ? "Click to replace existing receipt" : "Drag & drop file here or browse"}
                       </p>
                     </>
                   )}
                </div>
              </>
            ) : expense.receipt ? (
               <a 
                href={expense.receipt} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg w-fit hover:bg-slate-100 transition-all cursor-pointer group"
               >
                  <Receipt className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Expense Receipt</p>
                    <p className="text-xs text-slate-500">Click to view original document</p>
                  </div>
               </a>
            ) : (
               <div className="flex items-center gap-3 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg w-fit grayscale opacity-60">
                  <Receipt className="w-5 h-5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Receipt Attached</p>
               </div>
            )}
        </section>
      </div>

    </div>
  );
}
