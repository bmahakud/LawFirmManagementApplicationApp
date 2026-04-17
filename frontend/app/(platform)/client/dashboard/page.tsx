'use client';

import { useState, useEffect } from 'react';
import { Scale, Clock, MessageSquare, Download, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

interface DashboardData {
  role: string;
  role_display: string;
  user_name: string;
  cards: {
    my_cases?: number;
    active_cases?: number;
    next_hearing?: string;
    new_messages?: number;
    unpaid_invoices?: number;
    upcoming_hearings?: number;
  };
  client_info?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    assigned_advocate: string | null;
  };
  recent_cases?: any[];
}

export default function ClientDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.DASHBOARD.GET);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.detail || json.message || 'Failed to load dashboard');
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-500 font-medium">{error || 'Failed to load dashboard'}</p>
        </div>
      </div>
    );
  }

  const { cards, client_info } = data;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Client Info Header */}
      {client_info && (
        <div className="bg-gradient-to-r from-[#1f2937] to-[#111827] rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold">Welcome, {client_info.name}</h2>
          {client_info.assigned_advocate && (
            <p className="text-sm text-white/80 mt-1">Your Advocate: {client_info.assigned_advocate}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Cases',   val: cards?.my_cases || cards?.active_cases || 0,     icon: Scale,     color: 'bg-[#1f2937]' },
          { label: 'Next Hearing',   val: cards?.next_hearing || 'N/A', icon: Calendar,  color: 'bg-indigo-600' },
          { label: 'New Messages',   val: cards?.new_messages || 0,     icon: MessageSquare, color: 'bg-emerald-600' },
          { label: 'Unpaid Invoices',val: cards?.unpaid_invoices || 0,  icon: Clock,     color: 'bg-gray-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm transition-transform group-hover:scale-110`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Case Updates: Doe vs Corporate Ltd</h2>
          <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">Hearing Stage</span>
        </div>
        <div className="p-6 space-y-8">
          {[
            { date: '12 May 2024', status: 'Next Hearing Scheduled', desc: 'Please ensure you are present at the City Civil Court by 10 AM.', current: true },
            { date: '01 May 2024', status: 'Draft Petition Filed',   desc: 'Adv. S. Sharma filed the petition in registry.', current: false },
            { date: '15 Apr 2024', status: 'Case Initiated',         desc: 'Initial documents submitted and verified.', current: false },
          ].map((item, idx) => (
            <div key={idx} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 bg-white ${item.current ? 'border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' : 'border-gray-300'}`} />
                {idx !== 2 && <div className="w-0.5 h-full bg-gray-100 mt-2" />}
              </div>
              <div className="pb-2">
                <span className="text-xs font-bold text-gray-400">{item.date}</span>
                <p className={`text-sm font-bold mt-1 ${item.current ? 'text-indigo-600' : 'text-gray-900'}`}>{item.status}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent Documents</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { name: 'Initial_Petition_Signed.pdf', size: '2.4 MB' },
              { name: 'Evidence_Annexure_A.pdf',     size: '5.1 MB' },
            ].map(doc => (
              <div key={doc.name} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.size}</p>
                  </div>
                </div>
                <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-2xl border border-gray-800 shadow-lg p-6 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold">Need Help?</h2>
            <p className="text-sm text-gray-400 mt-2">Send a direct message to your assigned advocate. We usually reply within 2 hours.</p>
          </div>
          <Link href="/client/messaging" className="mt-6 bg-white text-gray-900 font-bold py-3 px-4 rounded-xl text-center text-sm shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Message Advocate
          </Link>
        </div>
      </div>
    </div>
  );
}
