'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  Filter, 
  Search, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge, MetricCard, Panel, SearchBar } from './ui';
import { TimeEntry } from '@/hooks/useTimeEntries';

interface ProfessionalBillingHubProps {
  role?: 'super-admin' | 'admin';
  isLoading?: boolean;
  entries?: TimeEntry[];
  onAddEntry?: () => void;
  onEntryClick?: (id: string) => void;
}

const STATUS_MAP = {
  paid: { tone: 'success' as const, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending: { tone: 'warning' as const, icon: <Clock className="w-3.5 h-3.5" /> },
  overdue: { tone: 'danger' as const, icon: <AlertCircle className="w-3.5 h-3.5" /> },
  draft: { tone: 'info' as const, icon: <FileText className="w-3.5 h-3.5" /> },
};

export default function ProfessionalBillingHub({ 
  role = 'admin', 
  isLoading = false,
  entries = [],
  onAddEntry,
  onEntryClick,
}: ProfessionalBillingHubProps) {
  const [query, setQuery] = useState('');

  const filteredEntries = useMemo(() => {
    return (entries || []).filter(entry => 
      (entry.case_title || '').toLowerCase().includes(query.toLowerCase()) || 
      (entry.user_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (entry.description || '').toLowerCase().includes(query.toLowerCase())
    );
  }, [entries, query]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl border border-gray-100" />)}
        </div>
        <div className="h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="Total Revenue" value="Rs. 12.8L" hint="+12% from last month" accent="#0e2340" />
        <MetricCard label="Pending" value="Rs. 2.4L" hint="Across 8 invoices" accent="#f59e0b" />
        <MetricCard label="Overdue" value="Rs. 0.8L" hint="3 high priority" accent="#ef4444" />
        <MetricCard label="Collection Rate" value="94.2%" hint="Historical average" accent="#10b981" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8">
        {/* Main Ledger */}
        <div className="space-y-6">
          <Panel 
            title="Time Entries Ledger" 
            subtitle="Manage billable hours, track case activities, and generate invoices."
            actions={
              <div className="flex items-center gap-3">
                <SearchBar placeholder="Search entries, cases, or personnel..." value={query} onChange={setQuery} />
                <button className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-500 transition-all">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-y border-gray-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Entry Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Case & Activity</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Logged By</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Hours / Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEntries.map((entry) => (
                    <motion.tr 
                      key={entry.id} 
                      onClick={() => onEntryClick && onEntryClick(entry.id)}
                      className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-[#0e2340] transition-colors">{entry.date}</span>
                          <span className="text-[11px] text-gray-400 font-medium uppercase">{entry.billable ? 'Billable' : 'Non-Billable'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{entry.case_title || 'General Ad-hoc'}</span>
                          <span className="text-[11px] text-gray-400 font-medium uppercase">{entry.activity_type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-700">{entry.user_name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <Badge 
                            label={entry.status.toUpperCase()} 
                            tone={
                               entry.status === 'submitted' ? 'info' :
                               entry.status === 'approved' ? 'success' :
                               entry.status === 'invoiced' ? 'warning' : 'neutral'
                            } 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                           <span className="font-bold text-sm text-gray-900">₹ {entry.amount || '0.00'}</span>
                           <span className="text-[11px] text-gray-500 font-bold">{entry.hours} hrs @ ₹{entry.hourly_rate}/hr</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Panel title="Quick Actions" subtitle="System controls">
            <div className="space-y-3">
              <button onClick={onAddEntry} className="w-full p-4 rounded-2xl bg-[#0e2340] text-white flex items-center justify-between group hover:shadow-xl hover:shadow-[#0e2340]/20 transition-all">
                <span className="text-sm font-bold">Log Time Entry</span>
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
              <button className="w-full p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 text-gray-700 flex items-center justify-between group transition-all">
                <span className="text-sm font-bold">Remittance Report</span>
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </Panel>

          <Panel title="Remittance Guide" subtitle="Help Center">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Auto-Sync</span>
                </div>
                <p className="text-xs text-emerald-800/80 leading-relaxed font-medium">
                  Invoices are automatically generated for disposal matters every Friday.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Compliance</span>
                </div>
                <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                  3 overdue payments have crossed the 30-day escalation threshold.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
