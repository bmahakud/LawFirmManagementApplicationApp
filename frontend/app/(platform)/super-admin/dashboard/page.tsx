'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase, Users, FileText, CheckSquare, ArrowRight,
  Gavel, Calendar, Building2, UserCheck, MapPin, Phone, Mail, Clock,
  CheckCircle2, Loader2, AlertCircle, Activity, Zap, ShieldCheck,
  Search, ExternalLink
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import { classNames } from '@/components/platform/ui';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#984c1f';
const GOLD = '#C8971A';
const BLUE = '#3b82f6';
const GREEN = '#10b981';
const SLATE = '#64748b';
const PURPLE = '#8b5cf6';
const RED = '#ef4444';

// ─── ANIMATION VARIANTS ───────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
} as const;

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.DASHBOARD.GET);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.detail || json.message || 'Failed to sync intelligence');
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
        console.error('Super Admin Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-100 rounded-full animate-spin border-t-[#984c1f]" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400">ANT</div>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Firm Intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-12 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-100 mx-auto mb-4" />
          <p className="text-sm text-red-500 font-bold uppercase tracking-wider mb-2">Sync Error</p>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">{error || 'Failed to load cloud data'}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all">Reload Dashboard</button>
        </div>
      </div>
    );
  }

  const { cards, firm_info, user_name, branches, recent_activity } = data;

  // Case Statistics Mapping
  const rawCaseStats = cards?.case_statistics || {};
  const caseStatsData = [
    { name: 'Open', value: rawCaseStats.open || 0, color: BLUE },
    { name: 'In Progress', value: rawCaseStats.in_progress || 0, color: PURPLE },
    { name: 'Won', value: rawCaseStats.won || 0, color: GREEN },
    { name: 'Lost', value: rawCaseStats.lost || 0, color: RED },
    { name: 'Closed', value: rawCaseStats.closed || 0, color: SLATE },
  ].filter(d => d.value > 0);

  const totalCases = cards?.total_cases || 0;

  const kpis = [
    { lbl: 'Total Cases', val: cards?.total_cases || '0', sub: `${rawCaseStats.open || 0} active matters`, icon: Gavel, color: BRAND, trend: '' },
    { lbl: 'Total Team', val: cards?.total_team || '0', sub: `${cards?.advocates || 0} advocates active`, icon: Users, color: BLUE, trend: 'Across Branches' },
    { lbl: 'Active Clients', val: cards?.total_clients || '0', sub: `Verified identities`, icon: UserCheck, color: GREEN, trend: '' },
    { lbl: 'Total Documents', val: cards?.total_documents || '0', sub: `Stored on cloud`, icon: Activity, color: PURPLE, trend: 'Storage Active' },
  ];

  const teamBreakdown = [
    { label: 'Advocates', value: cards?.advocates || 0, color: BLUE },
    { label: 'Admins', value: cards?.admins || 0, color: BRAND },
    { label: 'Paralegals', value: cards?.paralegals || 0, color: PURPLE },
  ].filter(t => t.value > 0);

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return 'Now';
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1d';
    return `${days}d`;
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-12 overflow-x-hidden">

      {/* ── HEADER ── */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-[#984c1f]/20"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #5a2a0d)` }}>
            {firm_info?.name?.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{firm_info?.name || 'Firm Intelligence'}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">ID: {firm_info?.code}</span>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">{firm_info?.subscription} Access</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administrator</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">{user_name}</p>
          </div>
        </div>
      </motion.div>

      {/* ── KPI GRID ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="group relative bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-[#984c1f]/5 transition-all duration-300 overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 mb-6 group-hover:scale-110 transition-transform duration-300">
                <k.icon size={18} style={{ color: k.color }} />
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none tracking-tighter">{k.val}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">{k.lbl}</p>
              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                <p className="text-[10px] font-semibold text-gray-400 truncate">{k.sub}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{k.trend}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full translate-x-12 -translate-y-12 opacity-50 group-hover:scale-150 transition-transform duration-700" />
          </div>
        ))}
      </motion.div>

      {/* ── CENTRAL HUB ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left Column: Intelligence */}
        <div className="lg:col-span-2 space-y-6">

          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">

            {/* Case Statistics Donut */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Case Statistics</h3>
                  <p className="text-xs text-gray-400 font-medium">Portfolio distribution by status</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center"><Gavel size={18} className="text-gray-400" /></div>
              </div>

              <div className="relative h-48 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: 1 }]} cx="50%" cy="50%" innerRadius={75} outerRadius={80} fill="#f8fafc" dataKey="value" stroke="none" isAnimationActive={false} />
                    <Pie data={caseStatsData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={40}>
                      {caseStatsData.map((d, i) => <Cell key={i} fill={d.color} className="outline-none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalCases}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cases</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {caseStatsData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-2 transition-all group-hover:scale-125" style={{ background: d.color, '--tw-ring-color': `${d.color}10` } as any} />
                      <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{d.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Dynamics */}
            <div className="bg-[#0e2340] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div>
                <h3 className="text-base font-black tracking-tight mb-1 relative z-10">Team Composition</h3>
                <p className="text-white/40 text-xs font-medium mb-8 relative z-10">Cross-branch workforce metrics</p>

                <div className="space-y-6 relative z-10">
                  {teamBreakdown.map((t, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-white/60 tracking-wider uppercase">{t.label}</span>
                        <span className="text-lg font-black text-white">{t.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(t.value / (cards?.total_team || 1)) * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: t.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Staff</p>
                    <p className="text-xl font-black text-white">{cards?.total_team || 0}</p>
                  </div>
                  <Link href="/super-admin/user-management" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Branch Network */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#984c1f]/10 flex items-center justify-center"><Building2 size={16} className="text-[#984c1f]" /></div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">Branch Network</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{firm_info?.total_branches || branches?.length || 0} Operational Nodes</p>
                </div>
              </div>
              <Link href="/super-admin/firm-management" className="text-[10px] font-black text-[#984c1f] uppercase tracking-widest hover:underline">View All</Link>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches?.length > 0 ? branches.map((branch: any, i: number) => (
                  <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><CheckCircle2 className={classNames("w-4 h-4", branch.is_active ? "text-emerald-500" : "text-gray-300")} /></div>
                        <div>
                          <h4 className="text-xs font-black text-gray-900 truncate max-w-[120px]">{branch.branch_name}</h4>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{branch.city}, {branch.state}</p>
                        </div>
                      </div>
                      {branch.branch_code && <span className="text-[9px] font-bold text-[#984c1f] bg-[#984c1f]/5 px-2 py-0.5 rounded-lg border border-[#984c1f]/10 uppercase tracking-widest">{branch.branch_code}</span>}
                    </div>
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100/50">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <Phone size={10} className="text-gray-400" /> {branch.phone_number || '--'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <Mail size={10} className="text-gray-400" /> {branch.email || '--'}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-300">
                    <MapPin size={32} className="mb-3 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No branch data synchronised</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column: Pulse */}
        <div className="space-y-6">

          {/* Quick Actions / Control */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#984c1f]/5 rounded-full translate-x-12 translate-y-12 blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2 uppercase tracking-widest"><Zap size={14} className="text-[#984c1f]" /> Quick Dispatch</h3>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Register New Case', href: '/super-admin/cases/new', icn: Gavel },
                  { label: 'Onboard Client', href: '/super-admin/clients/new', icn: UserCheck },
                  { label: 'Deploy Documents', href: '/super-admin/documents', icn: FileText },
                  { label: 'Invite Member', href: '/super-admin/user-management', icn: PlusCircle }
                ].map((act, i) => (
                  <Link key={i} href={act.href} className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gray-50/50 hover:bg-[#984c1f] text-gray-600 hover:text-white border border-gray-100 hover:border-[#984c1f] transition-all duration-300 group/btn shadow-sm hover:shadow-xl hover:shadow-[#984c1f]/20">
                    <div className="flex items-center gap-3">
                      <act.icn size={14} className="opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-bold tracking-tight">{act.label}</span>
                    </div>
                    <ArrowRight size={12} className="opacity-20 group-hover/btn:opacity-100 transition-all translate-x-0 group-hover/btn:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-gray-50 relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Security Active</span>
              </div>
              <span className="text-[9px] font-black text-[#984c1f] uppercase tracking-widest opacity-40">Ver. 2.0.4</span>
            </div>
          </motion.div>

          {/* Audit Trail / Recent Activity */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/20">
              <h3 className="text-sm font-black text-gray-900 tracking-tight">System Audit Trail</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Live event stream</p>
            </div>
            <div className="flex-1 p-0 overflow-y-auto max-h-[500px] custom-scrollbar">
              {recent_activity?.length > 0 ? (
                <div className="divide-y divide-gray-50/50">
                  {recent_activity.map((act: any, i: number) => (
                    <div key={i} className="px-8 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={classNames("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                          act.action.includes('login') ? "bg-blue-50 text-blue-600" :
                            act.action.includes('create') ? "bg-emerald-50 text-emerald-600" :
                              act.action.includes('password') ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500")}>
                          {act.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-300 uppercase tabular-nums">{formatTimeAgo(act.created_at)}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-gray-900 transition-colors">{act.description}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium truncate">{act.user__email}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-300">
                  <Activity size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No recent audit logs</p>
                </div>
              )}
            </div>
            <div className="px-8 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/10">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Watcher</span>
              <Link href="/super-admin/audit" className="p-1.5 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 shadow-sm"><ArrowRight size={12} /></Link>
            </div>
          </motion.div>

        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
      `}</style>
    </motion.div>
  );
}

const PlusCircle = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);