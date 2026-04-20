'use client';

import { useState, useEffect } from 'react';
import {
  Scale, FileText, Loader2, AlertCircle, ArrowRight,
  MessageSquare, Calendar, Briefcase, User, Download,
  Clock, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

interface DashboardData {
  role: string;
  role_display: string;
  user_name: string;
  user_id: string;
  cards: {
    my_cases: number;
    open_cases: number;
    in_progress_cases: number;
    closed_cases: number;
    my_documents: number;
    upcoming_hearings: number;
  };
  client_info: {
    id: string;
    name: string;
    email: string;
    phone: string;
    assigned_advocate: string | null;
  };
  recent_cases: Array<{
    id: string;
    case_title: string;
    case_number: string;
    status: string;
    next_hearing_date: string | null;
    updated_at: string;
  }>;
}



const DARK = '#1f2937';

const quickLinks = [
  { label: 'My Cases', href: '/client/cases', icon: Briefcase, desc: 'Track your active matters' },
  { label: 'Documents', href: '/client/documents', icon: FileText, desc: 'View shared files & uploads' },
  { label: 'Hearings', href: '/client/calendar', icon: Calendar, desc: 'Upcoming court dates' },
  { label: 'Messages', href: '/client/messaging', icon: MessageSquare, desc: 'Chat with your advocate' },
];

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1f2937]" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-500 font-medium">{error || 'Failed to load dashboard'}</p>
        </div>
      </div>
    );
  }

  const { cards, client_info, user_name, recent_cases } = data;
  const firstName = (user_name || client_info?.name || 'Client')?.split(' ')[0] || 'Client';

  const stats = [
    {
      label: 'My Cases',
      val: cards.my_cases || 0,
      icon: Scale,
      bg: 'bg-[#1f2937]',
      lightBg: 'bg-[#1f2937]/5',
      textColor: 'text-[#1f2937]',
      href: '/client/cases',
    },
    {
      label: 'In Progress',
      val: cards.in_progress_cases || 0,
      icon: Clock,
      bg: 'bg-indigo-600',
      lightBg: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      href: '/client/cases?status=in_progress',
    },
    {
      label: 'Upcoming Hearings',
      val: cards.upcoming_hearings || 0,
      icon: Calendar,
      bg: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
      href: '/client/calendar',
    },
    {
      label: 'My Documents',
      val: cards.my_documents || 0,
      icon: FileText,
      bg: 'bg-emerald-600',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      href: '/client/documents',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── WELCOME HEADER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: `linear-gradient(135deg, #374151, ${DARK})` }}
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Welcome, {firstName}!</h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
              {client_info?.assigned_advocate ? (
                <>
                  <User className="w-3 h-3" />
                  Your Advocate: <span className="text-gray-600 font-semibold">{client_info.assigned_advocate}</span>
                </>
              ) : (
                "Your legal dashboard overview"
              )}
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/client/cases"
            className="text-xs font-semibold text-[#1f2937] border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5" /> View My Cases
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Link key={i} href={s.href} className="group block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl ${s.lightBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon className={`w-5 h-5 ${s.textColor}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {typeof s.val === 'number' ? s.val.toLocaleString() : s.val}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── CASE TIMELINE / UPDATES ── */}
      {/* ── CASE UPDATES ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Case Activity</h2>
          <Link href="/client/cases" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            View All
          </Link>
        </div>
        <div className="p-6 space-y-6">
          {recent_cases && recent_cases.length > 0 ? (
            recent_cases.map((item, idx) => (
              <Link key={item.id} href={`/client/cases/${item.id}`} className="group relative flex gap-4 hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-colors">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 bg-white border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]`}
                  />
                  {idx !== recent_cases.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-2" />}
                </div>
                <div className="pb-2 flex-grow">
                  <span className="text-xs font-bold text-gray-400">
                    Updated {new Date(item.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <p className="text-sm font-bold mt-1 text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {item.case_title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-medium">No: {item.case_number}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'open' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.next_hearing_date && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-lg w-fit">
                      <Calendar className="w-3 h-3" />
                      Next Hearing: {new Date(item.next_hearing_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all self-center" />
              </Link>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-medium">No recent case activity found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Quick Access</h2>
          <p className="text-xs text-gray-400 mt-0.5">Jump to any section of your portal</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-gray-50">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 p-5 hover:bg-gray-50/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1f2937]/5 flex items-center justify-center group-hover:bg-[#1f2937]/10 transition-colors">
                <item.icon className="w-5 h-5 text-[#1f2937]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-[#1f2937] transition-colors">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#1f2937] group-hover:translate-x-1 transition-all mt-auto" />
            </Link>
          ))}
        </div>
      </div>


    </div>
  );
}