frontend/app/(platform)/super-admin/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase, Users, FileText, ArrowRight, Activity, MapPin, Phone, Mail,
  Calendar, Building2, UserCheck, Clock, Layers, ShieldQuestion, Loader2, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#0e2340';
const BRAND_L = '#1a365d';
const BLUE = '#2563EB';
const GREEN = '#10B981';
const SLATE = '#64748B';
const PURPLE = '#8B5CF6';
const AMBER = '#F59E0B';
const RED = '#EF4444';

interface ActivityItem {
  action: string;
  description: string;
  created_at: string;
  user__email: string;
}

interface BranchItem {
  id: string;
  branch_name: string;
  branch_code: string;
  city: string;
  state: string;
  phone_number: string;
  email: string;
  is_active: boolean;
}

interface DashboardData {
  role: string;
  role_display: string;
  user_name: string;
  user_id: string;
  cards: {
    total_cases: number;
    open_cases: number;
    in_progress_cases: number;
    closed_cases: number;
    total_clients: number;
    total_documents: number;
    pending_verification: number;
    total_team: number;
    advocates: number;
    admins: number;
    paralegals: number;
    pending_tasks: number;
    overdue_tasks: number;
    case_statistics: {
      total: number;
      open: number;
      in_progress: number;
      on_hold: number;
      closed: number;
      won: number;
      lost: number;
    };
  };
  firm_info: {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
    subscription: string;
    is_suspended: boolean;
    subscription_end_date: string;
    practice_areas: string[];
    total_branches: number;
  };
  branches: BranchItem[];
  recent_activity: ActivityItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs m-0.5 flex gap-1.5 items-center">
           <span className="w-2 h-2 rounded-full" style={{ background: p.color || BRAND }} />
           <span className="text-slate-500">{p.name}:</span>
           <span className="font-semibold text-slate-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// Formatter for timestamps
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
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
      <div className="min-h-screen bg-[#F6F4F1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0e2340] animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading live dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F6F4F1] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-500 font-medium">{error || 'Failed to load dashboard'}</p>
        </div>
      </div>
    );
  }

  const { cards, firm_info, user_name, branches, recent_activity } = data;
  const cases = cards.case_statistics;

  // Chart data
  const caseStatusData = [
    { name: 'Open', value: cases.open, color: BLUE },
    { name: 'In Progress', value: cases.in_progress, color: AMBER },
    { name: 'On Hold', value: cases.on_hold, color: PURPLE },
    { name: 'Closed', value: cases.closed, color: SLATE },
    { name: 'Won', value: cases.won, color: GREEN },
    { name: 'Lost', value: cases.lost, color: RED },
  ].filter(d => d.value > 0);

  const hasChartData = caseStatusData.length > 0;
  const totalCasesPie = caseStatusData.reduce((a, b) => a + b.value, 0);

  // Bar chart for KPI overview
  const kpiBarData = [
    { name: 'Cases', value: cases.total, color: BRAND_L },
    { name: 'Clients', value: cards.total_clients, color: GREEN },
    { name: 'Documents', value: cards.total_documents, color: BLUE },
    { name: 'Team', value: cards.total_team, color: PURPLE },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4F1] p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* ── HEADER ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm tracking-wider"
              style={{ background: `linear-gradient(135deg, ${BRAND_L}, ${BRAND})` }}>
              {firm_info.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{firm_info.name}</h1>
                {firm_info.is_suspended && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-600 border border-red-200">
                    Suspended
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Code: {firm_info.code} &nbsp;·&nbsp; 
                {firm_info.city}, {firm_info.state} &nbsp;·&nbsp; 
                <span className="capitalize">{firm_info.subscription}</span> Plan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden md:block">
              <p className="text-xs text-gray-400">Welcome back,</p>
              <p className="text-sm font-bold text-gray-700">{user_name}</p>
            </div>
            <Link href="/super-admin/settings"
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              Settings
            </Link>
          </div>
        </div>

        {/* ── TOP STATS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Hero Cases Card */}
          <div className="col-span-2 relative rounded-2xl p-6 text-white overflow-hidden shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND_L} 0%, ${BRAND} 70%, #000 100%)` }}>
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10 blur-3xl -mr-14 -mt-14" style={{ background: '#fff' }} />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 -ml-10 -mb-10" style={{ background: '#fff' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/70">Total Case Portfolio</p>
              </div>
              <div className="flex items-end gap-3 mb-1">
                <p className="text-5xl font-extrabold tracking-tight">{cases.total}</p>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Open', count: cases.open, dot: '#60A5FA' },
                  { label: 'In Porgress', count: cases.in_progress, dot: '#FBBF24' },
                  { label: 'Won', count: cases.won, dot: '#34D399' },
                  { label: 'Closed', count: cases.closed, dot: '#9CA3AF' },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider truncate">{s.label}</span>
                    </div>
                    <span className="text-2xl font-extrabold leading-none">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          {[
            { label: 'Total Clients', val: cards.total_clients, icon: Users, bg: '#F0FDF4', iconBg: GREEN },
            { label: 'Total Documents', val: cards.total_documents, icon: FileText, bg: '#EFF6FF', iconBg: BLUE },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: s.bg }}>
                <s.icon size={16} style={{ color: s.iconBg }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.val.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { val: cards.total_team, lbl: 'Team Members', icon: UserCheck, bg: '#F5F3FF', iconBg: PURPLE },
            { val: cards.advocates, lbl: 'Advocates', icon: ShieldQuestion, bg: '#F5F3FF', iconBg: PURPLE },
            { val: cards.pending_verification, lbl: 'Pending Verification', icon: ShieldAlert, bg: '#FFFBEB', iconBg: AMBER },
            { val: cards.pending_tasks, lbl: 'Pending Tasks', icon: Clock, bg: '#EFF6FF', iconBg: BLUE },
            { val: cards.overdue_tasks, lbl: 'Overdue Tasks', icon: AlertCircle, bg: '#FEF2F2', iconBg: RED },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                <k.icon size={18} style={{ color: k.iconBg }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {k.val.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">{k.lbl}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* KPI Overview Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 [&_.recharts-surface]:outline-none">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">Key Metrics Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Distribution of main platform entities</p>
            </div>
            <div className="flex gap-4 mb-3">
              {kpiBarData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />{d.name}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={kpiBarData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                  {kpiBarData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Case Status Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 [&_.recharts-surface]:outline-none">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">Portfolio Breakdown</h2>
              <p className="text-xs text-gray-400 mt-0.5">By detailed case status</p>
            </div>

            {hasChartData ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={caseStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={4} dataKey="value" stroke="none">
                      {caseStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-4 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {caseStatusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 text-gray-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded shadow-sm" style={{ background: d.color }} />
                        {d.name}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{d.value}</span>
                        <span className="text-gray-400 font-medium w-8 text-right">{totalCasesPie > 0 ? Math.round(d.value / totalCasesPie * 100) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-gray-300">
                <Briefcase className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">No case data yet</p>
                <p className="text-xs mt-1">Cases will appear here once added</p>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM ROW (Branches & Activity) ── */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Branches Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0e2340]" />
                <h2 className="text-sm font-bold text-gray-900">Firm Branches ({firm_info.total_branches})</h2>
              </div>
            </div>
            <div className="p-0 flex-1 overflow-auto">
              {branches.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {branches.map(branch => (
                    <div key={branch.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 capitalize">{branch.branch_name || 'Unnamed Branch'}</h3>
                          {branch.branch_code && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{branch.branch_code}</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${branch.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{branch.city || 'N/A'}, {branch.state || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{branch.phone_number || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 col-span-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{branch.email || 'No email'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                  <MapPin className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">No branches configured</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0e2340]" />
                <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
              </div>
            </div>
            <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
              {recent_activity.length > 0 ? (
                <div className="space-y-4">
                  {recent_activity.map((activity, index) => (
                    <div key={index} className="flex gap-4 relative">
                      {index !== recent_activity.length - 1 && (
                         <div className="absolute top-8 bottom-[-16px] left-[15px] w-px bg-gray-100" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white ${activity.action === 'login' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                        {activity.action === 'login' ? <UserCheck size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex justify-between items-start">
                           <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                           <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider shrink-0 mt-0.5">{formatTimeAgo(activity.created_at)}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">By <span className="font-semibold text-gray-700">{activity.user__email}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">No recent activity</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
