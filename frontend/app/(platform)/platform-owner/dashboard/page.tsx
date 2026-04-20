'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Users, Gavel, ArrowRight,
  Activity, BarChart as BarChartIcon,
  ShieldCheck, Globe, Zap, Clock, LogIn, LogOut, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { classNames } from '@/components/platform/ui';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#0e2340';
const GOLD = '#C8971A';
const GREEN = '#10b981';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';
const RED = '#ef4444';

const quickActions = [
  { label: 'Register New Firm', href: '/platform-owner/firms/new', color: 'bg-[#0e2340] text-white hover:bg-[#15345d] shadow-[#0e2340]/20' },
  { label: 'Settings', href: '/platform-owner/settings', color: 'bg-white text-[#0e2340] hover:bg-gray-50 border border-gray-100' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

export default function PlatformOwnerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [rawData, setRawData] = useState<{ firms: any[], cases: any[], clients: any[] }>({ firms: [], cases: [], clients: [] });
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [growthStats, setGrowthStats] = useState({ percent: '0', isUp: true });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'trailing' | 'annual'>('trailing');

  const availableYears = [2024, 2025, 2026];

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setLoading(true);
        const dashRes = await customFetch(API.DASHBOARD.GET);
        const dashData = await dashRes.json();

        const [firmsRes, casesRes, clientsRes] = await Promise.all([
          customFetch(API.FIRMS.LIST),
          customFetch(API.CASES.LIST),
          customFetch(API.CLIENTS.LIST)
        ]);

        const firms = (await firmsRes.json()).results || [];
        const cases = (await casesRes.json()).results || [];
        const clients = (await clientsRes.json()).results || [];

        setDashboardData(dashData);
        setRawData({ firms, cases, clients });
      } catch (err) {
        console.error("Dashboard Sync Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (!rawData.firms.length && !rawData.cases.length) return;

    const months = [];
    if (viewMode === 'annual') {
      for (let i = 0; i < 12; i++) {
        months.push({
          month: new Date(selectedYear, i).toLocaleString('en-US', { month: 'short' }),
          monthIdx: i,
          year: selectedYear,
          value: 0
        });
      }
    } else {
      const isCurrentYear = selectedYear === new Date().getFullYear();
      const endMonth = isCurrentYear ? new Date().getMonth() : 11;

      for (let i = 5; i >= 0; i--) {
        const d = new Date(selectedYear, endMonth - i, 1);
        months.push({
          month: d.toLocaleString('en-US', { month: 'short' }),
          monthIdx: d.getMonth(),
          year: d.getFullYear(),
          value: 0
        });
      }
    }

    const allItems = [...rawData.firms, ...rawData.cases, ...rawData.clients];
    allItems.forEach(item => {
      if (!item.created_at) return;
      const itemDate = new Date(item.created_at);
      const mIdx = itemDate.getMonth();
      const y = itemDate.getFullYear();

      const found = months.find(mo => mo.monthIdx === mIdx && mo.year === y);
      if (found) found.value += 1;
    });

    const len = months.length;
    const currentVal = months[len - 1]?.value || 0;
    const prevVal = months[len - 2]?.value || 0;
    let growthPercent = 0;
    if (prevVal > 0) {
      growthPercent = ((currentVal - prevVal) / prevVal) * 100;
    } else if (currentVal > 0) {
      growthPercent = 100;
    }

    setGrowthData(months);
    setGrowthStats({
      percent: Math.abs(growthPercent).toFixed(1),
      isUp: growthPercent >= 0
    });
  }, [rawData, selectedYear, viewMode]);

  const rawCaseStats = dashboardData?.cards?.case_statistics || {};
  const caseStatsData = [
    { name: 'Open', value: rawCaseStats.open || 0, color: BRAND },
    { name: 'In Progress', value: rawCaseStats.in_progress || 0, color: BLUE },
    { name: 'Won', value: rawCaseStats.won || 0, color: GREEN },
    { name: 'Lost', value: rawCaseStats.lost || 0, color: RED },
    { name: 'Closed', value: rawCaseStats.closed || 0, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const totalCases = dashboardData?.cards?.total_cases || 0;

  const kpis = [
    { lbl: 'Active Firms', val: dashboardData?.cards?.total_firms || '0', sub: `${dashboardData?.cards?.active_firms || 0} active entries`, icon: Building2, color: BRAND, trend: (dashboardData?.cards?.suspended_firms > 0) ? `${dashboardData.cards.suspended_firms} suspended` : '' },
    { lbl: 'Active Users', val: dashboardData?.cards?.active_users || '0', sub: `Across all organizations`, icon: Users, color: BLUE, trend: `${dashboardData?.cards?.total_users || 0} total users` },
    { lbl: 'Total Cases', val: dashboardData?.cards?.total_cases || '0', sub: `${dashboardData?.cards?.case_statistics?.open || 0} open now`, icon: Gavel, color: PURPLE, trend: '' },
    { lbl: 'Total Documents', val: dashboardData?.cards?.total_documents || '0', sub: `Stored on cloud`, icon: Activity, color: GREEN, trend: `${dashboardData?.cards?.total_clients || 0} Total clients` },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-100 rounded-full animate-spin border-t-[#0e2340]" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400">ANT</div>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-12">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="group relative bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 mb-6 group-hover:scale-110 transition-transform duration-300">
                <k.icon size={18} style={{ color: k.color }} />
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none">{k.val}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">{k.lbl}</p>
              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                <p className="text-[10px] font-semibold text-gray-400 truncate max-w-[120px]">{k.sub}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg truncate ml-2">{k.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Growth Intelligence</h3>
              <p className="text-sm text-gray-400 font-medium mt-0.5">Scale analytics across selected timeframe</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-0.5">
                <button onClick={() => setViewMode('trailing')} className={classNames("px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", viewMode === 'trailing' ? "bg-[#0e2340] text-white shadow-lg shadow-black/10" : "text-gray-400 hover:text-gray-600")}>Trailing</button>
                <button onClick={() => setViewMode('annual')} className={classNames("px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", viewMode === 'annual' ? "bg-[#0e2340] text-white shadow-lg shadow-black/10" : "text-gray-400 hover:text-gray-600")}>Annual</button>
              </div>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0e2340] outline-none shadow-sm">
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0e2340] text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1.5">{payload[0].payload.month} {payload[0].payload.year}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-black">{payload[0].value}</p>
                          <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">Engagements</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="stepAfter" dataKey="value" stroke={BRAND} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period Status</span>
                <div className={classNames("flex items-center gap-1.5 mt-1 text-sm font-black transition-colors", growthStats.isUp ? "text-emerald-600" : "text-rose-600")}>
                  <Zap size={14} className={growthStats.isUp ? "fill-emerald-600" : "fill-rose-600"} /> {growthStats.isUp ? '+' : '-'}{growthStats.percent}%
                </div>
              </div>
              <div className="w-px h-8 bg-gray-50 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Points</span>
                <p className="text-sm font-black text-gray-900 mt-1">{growthData.reduce((acc, curr) => acc + curr.value, 0)}</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em] text-right">Insight Window: {growthData[0]?.month} - {growthData[growthData.length - 1]?.month}</div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#0e2340] rounded-3xl p-8 text-white relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight mb-3">Expansion Pack</h2>
            <p className="text-white/60 text-sm font-medium mb-8">Scale your ecosystem by onboarding new firms or modifying platform blueprints.</p>
            <div className="space-y-4">
              {quickActions.map(action => (
                <Link key={action.label} href={action.href} className={classNames("flex items-center justify-between w-full px-6 py-4 rounded-2xl text-sm font-bold transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-black/20", action.color)}>
                  {action.label}
                  <Zap size={16} className={action.color.includes('white') ? 'text-[#0e2340]' : 'text-white/60'} />
                </Link>
              ))}
            </div>
          </div>
          <div className="relative z-10 mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ShieldCheck size={20} className="text-emerald-400" /></div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-widest">Platform Integrity</p>
                <p className="text-[10px] text-white/40 font-medium">Verified Cloud Infrastructure</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div>
              <h2 className="text-base font-black text-[#0e2340] tracking-tight">System Integrity Log</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Real-time audit trail of global platform activity</p>
            </div>
            <Link href="/platform-owner/audit" className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors group shadow-sm">
              <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto h-[350px] custom-scrollbar">
            {dashboardData?.recent_audits?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {dashboardData.recent_audits.map((audit: any, i: number) => {
                  const isLogin = audit.action.toLowerCase() === 'login';
                  const Icon = isLogin ? LogIn : LogOut;
                  const accentColor = isLogin ? 'text-emerald-500 bg-emerald-50' : 'text-blue-500 bg-blue-50';
                  return (
                    <div key={i} className="px-8 py-5 flex items-center gap-5 hover:bg-gray-50 transition-colors group">
                      <div className={classNames("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 shadow-sm", accentColor)}><Icon size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm text-gray-900 font-bold truncate">{audit.description}</p>
                          <span className="text-[10px] font-bold text-gray-400 shrink-0 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">{new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5"><p className="text-xs text-gray-400 font-medium truncate">{audit.user__email}</p><span className="w-1 h-1 rounded-full bg-gray-200" /><p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">{audit.action}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8"><ShieldCheck size={32} className="text-gray-100 mb-2" /><p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No activities recorded</p></div>
            )}
          </div>
          <div className="px-8 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total {dashboardData?.recent_audits?.length || 0} recent sessions</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col min-h-[460px]">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-base font-black text-gray-900 tracking-tight">Case Statistics</h2><p className="text-xs text-gray-400 font-medium mt-0.5">Case lifecycle</p></div>
            <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner"><Gavel size={18} className="text-gray-400" /></div>
          </div>
          {totalCases === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center"><div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100"><Gavel className="w-8 h-8 text-gray-200" /></div><p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No Active Matters</p></div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="relative flex-1">
                <ResponsiveContainer width="100%" height="100%" className="[&_.recharts-surface]:outline-none">
                  <PieChart>
                    <Pie data={[{ value: 1 }]} cx="50%" cy="50%" innerRadius={80} outerRadius={85} fill="#f1f5f9" dataKey="value" isAnimationActive={false} stroke="none" />
                    <Pie data={caseStatsData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={40} animationDuration={1500}>
                      {caseStatsData.map((d, i) => (
                        <Cell key={i} fill={d.color} className="outline-none" />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0e2340] text-white p-3 rounded-2xl shadow-2xl">
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">{payload[0].name}</p>
                            <p className="text-sm font-black">{payload[0].value} Cases</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="text-4xl font-black text-gray-900 tracking-tighter">{totalCases}</motion.p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mt-1">Total</p>
                </div>
              </div>
              <div className="space-y-3 mt-10 border-t border-gray-50 pt-8">
                {caseStatsData.map(d => (
                  <div key={d.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-2 transition-all group-hover:scale-125" style={{ background: d.color, ringColor: `${d.color}20` }} />
                      <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{d.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}