'use client';

import { useState, useEffect } from 'react';
import { Briefcase, PenTool, Calendar, MessageSquare, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

interface DashboardData {
  role: string;
  role_display: string;
  user_name: string;
  cards: {
    my_cases?: number;
    assigned_cases?: number;
    my_clients: number;
    pending_tasks?: number;
    upcoming_hearings: number;
  };
  firm_info?: {
    id: string;
    name: string;
  };
  recent_cases?: any[];
  recent_clients?: any[];
}

export default function AdvocateDashboard() {
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
          <Loader2 className="w-8 h-8 animate-spin text-[#4a1c40]" />
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

  const { cards, firm_info } = data;

  return (
    <div className="space-y-8">
      {/* Firm Name Header */}
      {firm_info && (
        <div className="bg-gradient-to-r from-[#4a1c40] to-[#6b2456] rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold">{firm_info.name}</h2>
          <p className="text-sm text-white/80 mt-1">Welcome back, {data.user_name}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned Cases',     val: cards?.my_cases || cards?.assigned_cases || 0,     icon: Briefcase,     color: 'bg-[#4a1c40]' },
          { label: 'My Clients',         val: cards?.my_clients || 0,         icon: PenTool,       color: 'bg-purple-600' },
          { label: 'Upcoming Hearings',  val: cards?.upcoming_hearings || 0,  icon: Calendar,      color: 'bg-blue-600' },
          { label: 'Pending Tasks',      val: cards?.pending_tasks || 0,      icon: MessageSquare, color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm transition-transform group-hover:-translate-y-1 group-hover:shadow-md`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#4a1c40]">Kanban Overview</h2>
            <Link href="/advocate/cases" className="text-xs font-bold text-[#4a1c40] bg-[#4a1c40]/10 px-3 py-1.5 rounded-lg hover:bg-[#4a1c40]/20 transition-colors">Go to Board</Link>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {['To Research', 'Drafting', 'Filing'].map(stage => (
              <div key={stage} className="bg-[#f7f8fa] rounded-xl p-4 border border-gray-100 min-h-[250px]">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">{stage}</h3>
                <div className="w-full bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3 cursor-pointer hover:border-[#4a1c40]/50 transition-colors">
                  <p className="text-xs font-bold text-gray-900 mb-2">Kumar v. Builders Ltd</p>
                  <p className="text-[10px] text-white bg-amber-500 px-2 py-0.5 rounded-full inline-block">High Priority</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#4a1c40]">Quick Draft Check</h2>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-[#4a1c40]/10 flex items-center justify-center shrink-0 text-[#4a1c40]">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Bail Petition (Singh)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Last updated 2 hrs ago</p>
                  <button className="text-[11px] font-bold text-[#4a1c40] mt-2 flex items-center hover:underline">
                    Continue Writing <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            ))}
            <button className="w-full py-3 rounded-xl border border-dashed border-[#4a1c40]/30 text-[#4a1c40] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#4a1c40]/5 transition-colors">
              <Plus className="w-4 h-4" /> Start New Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
