'use client';

import React, { useState, useEffect } from 'react';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { 
  Search, Download, Filter, Plus, Receipt, 
  User, ArrowUpRight, Tags, Eye, Trash2, 
  X, Loader2, Calendar, Briefcase, Info, 
  CheckCircle2, AlertCircle, Edit3
} from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Expense {
  id: string;
  date: string;
  case_title: string;
  expense_type: string;
  description: string;
  submitted_by_name: string;
  status: string;
  amount: string;
  billable: boolean;
  markup_percentage: string;
  billable_amount: string;
  notes: string;
}

export default function ExpensesPage() {
  useTopbarTitle('Expenses Tracking', 'Monitor and securely trace platform overhead and operational outputs.');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState('0.00');
  
  // Detail View State
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await customFetch(API.BILLING.EXPENSES.LIST);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        setExpenses(results);
        
        // Calculate total output
        const total = results.reduce((acc: number, curr: Expense) => acc + parseFloat(curr.amount), 0);
        setTotalExpenses(total.toFixed(2));
      }
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await customFetch(API.BILLING.EXPENSES.DETAIL(id), { method: 'DELETE' });
      if (res.ok) {
        fetchExpenses();
        if (selectedExpense?.id === id) setSelectedExpense(null);
      }
    } catch (err) {
      alert("Failed to delete expense");
    }
  };

  const handleFetchDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const res = await customFetch(API.BILLING.EXPENSES.DETAIL(id));
      if (res.ok) {
        const data = await res.json();
        setSelectedExpense(data);
        setEditForm(data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to fetch detail", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedExpense) return;
    try {
      const res = await customFetch(API.BILLING.EXPENSES.DETAIL(selectedExpense.id), {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedExpense(updated);
        setIsEditing(false);
        fetchExpenses();
      }
    } catch (err) {
      alert("Failed to update expense");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fafafa] p-4 md:p-6 lg:p-4 font-sans relative overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-10">

        {/* Header Actions & Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100/50 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
              <ArrowUpRight className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Operational Output</p>
              <h3 className="text-3xl font-black text-slate-900">₹{parseFloat(totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <Link href="/super-admin/finance/expenses/new">
            <button className="flex justify-center items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm shadow-red-600/20 transition-all w-full md:w-auto hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Log Expense
            </button>
          </Link>
        </div>

        {/* Expenses Tracking Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Actions Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expenses by category or desc..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Case Title</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Logged By</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                      <td className="py-4 px-6 text-sm font-medium text-slate-500 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{exp.case_title || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded uppercase tracking-wider">
                          {exp.expense_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-500 max-w-xs truncate">{exp.description}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-slate-400" />{exp.submitted_by_name}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center justify-center w-[100px] tracking-wide uppercase ${
                          exp.status === 'invoiced' ? 'bg-emerald-100/50 text-emerald-700' :
                          exp.status === 'submitted' ? 'bg-amber-100/50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/super-admin/finance/expenses/${exp.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400 font-medium italic">No expenses found. Click "Log Expense" to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
