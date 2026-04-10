'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase, Users, FileText, CheckSquare, ArrowRight,
  Gavel, Calendar, Building2, UserCheck, Clock,
  CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#984c1f';
const BRAND_L = '#C8692B';
const BLUE = '#2563EB';
const GREEN = '#16A34A';
const SLATE = '#64748B';
const PURPLE = '#7C3AED';
const AMBER = '#F59E0B';

interface DashboardData {
  role: string;
  role_display: string;
  user_name: string;
  cards: {
    total_cases: {
      total: number;
      running: number;
      disposed: number;
      closed: number;
    };
    total_clients: number;
    total_documents: number;
    team_members: number;
    todos: {
      pending: number;
      upcoming: number;
    };
  };
  firm_info: {
    name: string;
    code: string;
    subscription: string;
    practice_areas: string[];
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: 'inherit' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || BRAND, margin: '2px 0' }}>
          <span style={{ color: '#64748b' }}>{p.name}: </span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
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
          <Loader2 className="w-8 h-8 text-[#984c1f] animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard…</p>
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

  const { cards, firm_info, user_name } = data;
  const cases = cards.total_cases;

  // Chart data
  const caseStatusData = [
    { name: 'Running', value: cases.running, color: BLUE },
    { name: 'Disposed', value: cases.disposed, color: GREEN },
    { name: 'Closed', value: cases.closed, color: SLATE },
  ].filter(d => d.value > 0);

  const hasChartData = caseStatusData.length > 0;
  const totalCasesPie = caseStatusData.reduce((a, b) => a + b.value, 0);

  // Bar chart for KPI overview
  const kpiBarData = [
    { name: 'Cases', value: cases.total, color: BRAND_L },
    { name: 'Clients', value: cards.total_clients, color: GREEN },
    { name: 'Documents', value: cards.total_documents, color: BLUE },
    { name: 'Team', value: cards.team_members, color: PURPLE },
  ];

  // Quick actions
  const quickActions = [
    { label: 'Create New Case', href: '/super-admin/cases/new' },
    { label: 'Register Client', href: '/super-admin/clients/new' },
    { label: 'Add Team Member', href: '/super-admin/user-management' },
    { label: 'Upload Document', href: '/super-admin/documents' },
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
              <h1 className="text-lg font-bold text-gray-900">{firm_info.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Code: {firm_info.code} &nbsp;·&nbsp; 
                <span className="capitalize">{firm_info.subscription}</span> Plan
                {firm_info.practice_areas.length > 0 && (
                  <> &nbsp;·&nbsp; {firm_info.practice_areas.join(', ')}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden md:block">
              <p className="text-xs text-gray-400">Welcome back,</p>
              <p className="text-sm font-bold text-gray-700">{user_name || 'Admin'}</p>
            </div>
            <Link href="/super-admin/settings"
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* ── TOP STATS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Hero Cases Card */}
          <div className="col-span-2 relative rounded-2xl p-6 text-white overflow-hidden shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND_L} 0%, ${BRAND} 55%, #5a2a0d 100%)` }}>
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10 blur-3xl -mr-14 -mt-14" style={{ background: '#fff' }} />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 -ml-10 -mb-10" style={{ background: '#000' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/70">Total Cases Portfolio</p>
              </div>
              <div className="flex items-end gap-3 mb-1">
                <p className="text-5xl font-extrabold tracking-tight">{cases.total}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Running', count: cases.running, dot: '#60A5FA' },
                  { label: 'Disposed', count: cases.disposed, dot: '#34D399' },
                  { label: 'Closed', count: cases.closed, dot: '#9CA3AF' },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{s.label}</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { val: cards.team_members, lbl: 'Team Members', icon: UserCheck, bg: '#F5F3FF', iconBg: PURPLE },
            { val: cards.todos.pending, lbl: 'Pending Todos', icon: Clock, bg: '#FFFBEB', iconBg: AMBER },
            { val: cards.todos.upcoming, lbl: 'Upcoming Todos', icon: Calendar, bg: '#EFF6FF', iconBg: BLUE },
            { val: firm_info.subscription, lbl: 'Subscription Plan', icon: Building2, bg: '#FDF2F8', iconBg: BRAND, isText: true },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                <k.icon size={18} style={{ color: k.iconBg }} />
              </div>
              <div>
                <p className={`text-xl font-bold text-gray-900 ${(k as any).isText ? 'capitalize' : ''}`}>
                  {typeof k.val === 'number' ? k.val.toLocaleString() : k.val}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{k.lbl}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* KPI Overview Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 [&_.recharts-surface]:outline-none">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Key metrics at a glance</p>
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
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
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
              <h2 className="text-sm font-bold text-gray-900">Case Statistics</h2>
              <p className="text-xs text-gray-400 mt-0.5">By status breakdown</p>
            </div>

            {hasChartData ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={caseStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {caseStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} cases`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {caseStatusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                        {d.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{d.value}</span>
                        <span className="text-gray-400">{totalCasesPie > 0 ? Math.round(d.value / totalCasesPie * 100) : 0}%</span>
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

        {/* ── BOTTOM ROW ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Firm Info Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Firm Information</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Firm Name', value: firm_info.name },
                  { label: 'Firm Code', value: firm_info.code },
                  { label: 'Subscription', value: firm_info.subscription, capitalize: true },
                  { label: 'Total Cases', value: cases.total.toString() },
                  { label: 'Running Cases', value: cases.running.toString() },
                  { label: 'Disposed Cases', value: cases.disposed.toString() },
                  { label: 'Closed Cases', value: cases.closed.toString() },
                  { label: 'Total Clients', value: cards.total_clients.toString() },
                  { label: 'Total Documents', value: cards.total_documents.toString() },
                  { label: 'Team Members', value: cards.team_members.toString() },
                  { label: 'Pending Todos', value: cards.todos.pending.toString() },
                  { label: 'Upcoming Todos', value: cards.todos.upcoming.toString() },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-400">{item.label}</span>
                    <span className={`text-sm text-gray-800 ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              {firm_info.practice_areas.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Practice Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {firm_info.practice_areas.map((area, i) => (
                      <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#984c1f]/10 text-[#984c1f] border border-[#984c1f]/10">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map(action => (
                <Link key={action.label} href={action.href}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#FAFAF9] text-gray-700 hover:bg-gray-100 border border-gray-100 transition-colors">
                  {action.label} <ArrowRight size={14} className="opacity-40" />
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Dashboard Status</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[11px] text-gray-400">Live data · All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}