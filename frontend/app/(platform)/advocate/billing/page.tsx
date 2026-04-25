'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfessionalBillingHub from '@/components/platform/ProfessionalBillingHub';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { AlertCircle, List, User, FileText } from 'lucide-react';

type ViewType = 'all' | 'my_entries' | 'unbilled';

export default function SuperAdminBillingPage() {
  const router = useRouter();
  const [viewType, setViewType] = useState<ViewType>('all');
  const { entries, loading, error } = useTimeEntries(viewType);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-max">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setViewType('all')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${viewType === 'all' ? 'bg-[#0f172a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <List className={`w-4 h-4 ${viewType === 'all' ? 'text-blue-400' : 'text-gray-400'}`} /> Firm Ledger
          </button>
          <button 
            onClick={() => setViewType('my_entries')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${viewType === 'my_entries' ? 'bg-[#0f172a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <User className={`w-4 h-4 ${viewType === 'my_entries' ? 'text-blue-400' : 'text-gray-400'}`} /> My Timesheet
          </button>
          <button 
            onClick={() => setViewType('unbilled')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${viewType === 'unbilled' ? 'bg-[#0f172a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FileText className={`w-4 h-4 ${viewType === 'unbilled' ? 'text-blue-400' : 'text-gray-400'}`} /> Unbilled (Ready to Invoice)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <ProfessionalBillingHub 
          role="advocate" 
          isLoading={loading} 
          entries={entries}
          onAddEntry={() => router.push('/advocate/billing/log-time')}
          onEntryClick={(id) => router.push(`/advocate/billing/entries/${id}`)}
        />
      </div>
    </div>
  );
}

