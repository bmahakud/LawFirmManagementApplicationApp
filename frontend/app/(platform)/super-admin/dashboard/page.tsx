'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Users, FileText, CheckSquare, ArrowRight,
  Gavel, Calendar, TrendingUp, Building2, DollarSign,
  ChevronDown, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadialBarChart, RadialBar
} from 'recharts';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#984c1f';
const BRAND_L = '#C8692B';
const GOLD = '#C8971A';
const GOLD_L = '#E8B84B';
const GREEN = '#16A34A';
const BLUE = '#2563EB';
const PURPLE = '#7C3AED';
const RED = '#DC2626';
const SLATE = '#64748B';

// ─── DATA ───────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const revenueByYear: Record<string, { month: string; revenue: number; collected: number; outstanding: number }[]> = {
  '2024': MONTHS.map((m, i) => ({ month: m, revenue: [10.1, 12.4, 13.2, 11.8, 15.6, 17.2, 15.1, 18.4, 16.2, 19.1, 17.8, 20.2][i], collected: [8.1, 10.0, 10.9, 9.4, 12.8, 14.5, 12.6, 15.4, 13.6, 16.1, 15.0, 17.3][i], outstanding: [2.0, 2.4, 2.3, 2.4, 2.8, 2.7, 2.5, 3.0, 2.6, 3.0, 2.8, 2.9][i] })),
  '2025': MONTHS.map((m, i) => ({ month: m, revenue: [14.2, 16.8, 18.1, 15.4, 20.3, 22.7, 19.8, 23.4, 21.1, 24.6, 22.9, 26.4][i], collected: [11.2, 13.8, 14.9, 12.4, 17.1, 19.2, 16.4, 20.1, 17.8, 21.3, 19.4, 23.1][i], outstanding: [3.0, 3.0, 3.2, 3.0, 3.2, 3.5, 3.4, 3.3, 3.3, 3.3, 3.5, 3.3][i] })),
  '2026': MONTHS.map((m, i) => ({ month: m, revenue: [22.1, 25.4, 28.2, 26.8, 30.1, 33.7, 31.2, 35.4, 32.1, 36.6, 34.9, 38.4][i], collected: [18.9, 22.1, 24.4, 22.8, 26.5, 29.8, 27.2, 31.1, 28.4, 32.2, 30.5, 34.1][i], outstanding: [3.2, 3.3, 3.8, 4.0, 3.6, 3.9, 4.0, 4.3, 3.7, 4.4, 4.4, 4.3][i] })),
};

const casesByYear: Record<string, { month: string; filed: number; resolved: number; pending: number }[]> = {
  '2024': MONTHS.map((m, i) => ({ month: m, filed: [6, 8, 7, 10, 8, 11, 9, 12, 10, 11, 10, 13][i], resolved: [4, 6, 8, 7, 9, 8, 10, 11, 9, 12, 10, 11][i], pending: [10, 12, 11, 14, 13, 16, 15, 16, 17, 16, 16, 18][i] })),
  '2025': MONTHS.map((m, i) => ({ month: m, filed: [8, 11, 9, 13, 10, 14, 12, 15, 11, 13, 14, 16][i], resolved: [6, 8, 11, 9, 12, 10, 13, 14, 12, 15, 13, 14][i], pending: [12, 15, 13, 17, 15, 19, 18, 19, 18, 16, 17, 19][i] })),
  '2026': MONTHS.map((m, i) => ({ month: m, filed: [10, 13, 12, 15, 13, 17, 14, 18, 14, 16, 17, 19][i], resolved: [9, 11, 13, 12, 14, 13, 16, 17, 15, 17, 16, 17][i], pending: [15, 17, 16, 19, 18, 22, 20, 21, 20, 19, 20, 22][i] })),
};

const caseStatusData = [
  { name: 'Running', value: 45, color: BLUE },
  { name: 'Disposed', value: 82, color: GREEN },
  { name: 'Closed', value: 15, color: SLATE },
  { name: 'Stayed', value: 10, color: PURPLE },
];
const caseTypeData = [
  { name: 'Civil', value: 52, color: BRAND },
  { name: 'Corporate', value: 38, color: GOLD },
  { name: 'Criminal', value: 22, color: RED },
  { name: 'Family', value: 18, color: GREEN },
  { name: 'IPR', value: 12, color: PURPLE },
];

const branches = [
  { name: 'Mumbai HQ', color: BRAND, rev: 10.8, clients: 34, cases: 62, pct: 100 },
  { name: 'Delhi Branch', color: GOLD, rev: 7.4, clients: 22, cases: 41, pct: 69 },
  { name: 'Bangalore', color: BLUE, rev: 5.1, clients: 18, cases: 27, pct: 47 },
  { name: 'Chennai', color: GREEN, rev: 3.3, clients: 14, cases: 12, pct: 31 },
];

const branchChartData = branches.map(b => ({ name: b.name, revenue: b.rev, clients: b.clients, cases: b.cases }));

const upcomingItems = [
  { title: 'State vs Kumar', sub: 'Today, 10:30 AM · Court 4', type: 'Hearing', icon: Gavel, bg: '#FEF2F2', color: RED },
  { title: 'TechCorp NDA Review', sub: 'Tomorrow · Priya Sharma', type: 'To-Do', icon: FileText, bg: '#FFFBEB', color: GOLD },
  { title: 'Sarah Jenkins Meeting', sub: '21 Dec, 2:00 PM', type: 'Meeting', icon: Users, bg: '#EFF6FF', color: BLUE },
  { title: 'Mehta Estate Filing', sub: '22 Dec · EOD', type: 'Filing', icon: CheckSquare, bg: '#F5F3FF', color: PURPLE },
  { title: 'GlobalTech Invoice', sub: '24 Dec · ₹1.5L', type: 'Billing', icon: DollarSign, bg: '#F0FDF4', color: GREEN },
];

const quickActions = ['Create New Case', 'Register Client', 'Add Team Member', 'Generate Invoice', 'Upload Document', 'Schedule Hearing'];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function aggregateQuarterly<T extends { revenue?: number; collected?: number; outstanding?: number; filed?: number; resolved?: number; pending?: number }>(
  data: T[]
): ({ month: string } & Partial<T>)[] {
  return [0, 1, 2, 3].map(q => {
    const chunk = data.slice(q * 3, (q + 1) * 3);
    const sum = (key: keyof T) => parseFloat((chunk.reduce((a, b) => a + ((b[key] as number) ?? 0), 0)).toFixed(1));
    const base: Record<string, unknown> = { month: QUARTERS[q] };
    if ('revenue' in chunk[0]) { base.revenue = sum('revenue' as keyof T); base.collected = sum('collected' as keyof T); base.outstanding = sum('outstanding' as keyof T); }
    if ('filed' in chunk[0]) { base.filed = sum('filed' as keyof T); base.resolved = sum('resolved' as keyof T); base.pending = sum('pending' as keyof T); }
    return base as { month: string } & Partial<T>;
  });
}

function aggregateYearly(type: 'revenue' | 'cases') {
  const years = ['2023', '2024', '2025', '2026'];
  if (type === 'revenue') {
    const base2025 = revenueByYear['2025'].reduce((a, b) => a + b.revenue, 0);
    return years.map((yr, i) => {
      const m = [0.55, 0.72, 1, 1.28][i];
      return { month: yr, revenue: +(base2025 * m).toFixed(1), collected: +(base2025 * m * 0.85).toFixed(1), outstanding: +(base2025 * m * 0.15).toFixed(1) };
    });
  } else {
    return years.map((yr, i) => {
      const m = [0.6, 0.78, 1, 1.22][i];
      return { month: yr, filed: Math.round(142 * m * 0.75), resolved: Math.round(97 * m * 0.75), pending: Math.round(45 * m * 0.75) };
    });
  }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: 'inherit' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 12, color: p.color, margin: '2px 0' }}>
          <span style={{ color: '#64748b' }}>{p.name}: </span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' && p.value > 5 && !String(p.value).includes('.') ? p.value : `₹${p.value}L`}</span>
        </p>
      ))}
    </div>
  );
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [revYear, setRevYear] = useState('2025');
  const [caseYear, setCaseYear] = useState('2025');
  const [revType, setRevType] = useState<'bar' | 'area'>('bar');
  const [donutMode, setDonutMode] = useState<'status' | 'type'>('status');

  // Derive chart data
  const getRevData = () => {
    if (period === 'quarterly') return aggregateQuarterly(revenueByYear[revYear]);
    if (period === 'yearly') return aggregateYearly('revenue');
    return revenueByYear[revYear];
  };
  const getCaseData = () => {
    if (period === 'quarterly') return aggregateQuarterly(casesByYear[caseYear]);
    if (period === 'yearly') return aggregateYearly('cases');
    return casesByYear[caseYear];
  };

  const donutData = donutMode === 'status' ? caseStatusData : caseTypeData;
  const totalDonut = donutData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="min-h-screen bg-[#F6F4F1] p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* ── HEADER ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm tracking-wider"
              style={{ background: `linear-gradient(135deg, ${BRAND_L}, ${BRAND})` }}>CA</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Chen &amp; Associates</h1>
              <p className="text-xs text-gray-400 mt-0.5">Reg No: BC/1842/2010 &nbsp;·&nbsp; Civil &amp; Corporate Law &nbsp;·&nbsp; 4 Branches</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Period toggle */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
              {(['monthly', 'quarterly', 'yearly'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  style={period === p ? { background: BRAND } : {}}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {/* Year */}
            <div className="relative">
              <select value={revYear} onChange={e => setRevYear(e.target.value)}
                className="appearance-none text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 cursor-pointer outline-none">
                <option>2024</option><option>2025</option><option>2026</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                <p className="text-5xl font-extrabold tracking-tight">142</p>
                <span className="mb-2 text-[11px] font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">+12% this month</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Running', count: 45, dot: '#60A5FA' },
                  { label: 'Disposed', count: 82, dot: '#34D399' },
                  { label: 'Closed', count: 15, dot: '#9CA3AF' },
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
            { label: 'Total Clients', val: '88', icon: Users, bg: '#F0FDF4', iconBg: '#16A34A', change: '↑ 8% vs last period', up: true },
            { label: 'Total Documents', val: '430', icon: FileText, bg: '#EFF6FF', iconBg: '#2563EB', change: '↑ 22 added this month', up: true },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: s.bg }}>
                <s.icon size={16} style={{ color: s.iconBg }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              <p className={`text-[11px] font-semibold mt-2 ${s.up === true ? 'text-emerald-600' : s.up === false ? 'text-red-500' : 'text-gray-400'}`}>
                {s.change}
              </p>
            </div>
          ))}
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { val: '₹24.6L', lbl: 'Total Revenue', chg: '↑ 18.4% YoY', up: true },
            { val: '₹4.2L', lbl: 'Outstanding', chg: '3 unpaid invoices', up: false },
            { val: '94%', lbl: 'Collection Rate', chg: '↑ 2.1% this month', up: true },
            { val: '₹1.7L', lbl: 'Avg. Case Value', chg: '↑ from ₹1.4L', up: true },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-2xl font-bold text-gray-900">{k.val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.lbl}</p>
              <p className={`text-[11px] font-semibold mt-2 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>{k.chg}</p>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW 1: Revenue + Donut ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Revenue Overview</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {period === 'monthly' ? `Monthly — ${revYear}` : period === 'quarterly' ? `Quarterly — ${revYear}` : 'Year-over-year'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select value={revYear} onChange={e => setRevYear(e.target.value)}
                  className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                  <option>2024</option><option>2025</option><option>2026</option>
                </select>
                <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                  {(['bar', 'area'] as const).map(t => (
                    <button key={t} onClick={() => setRevType(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${revType === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-3">
              {[{ c: BRAND_L, l: 'Revenue' }, { c: GOLD_L, l: 'Collected' }, { c: '#CBD5E1', l: 'Outstanding' }].map(lg => (
                <div key={lg.l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: lg.c }} />{lg.l}
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              {revType === 'bar' ? (
                <BarChart data={getRevData()} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill={BRAND_L} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill={GOLD_L} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#CBD5E1" radius={[5, 5, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={getRevData()}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND_L} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={BRAND_L} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD_L} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={GOLD_L} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area dataKey="revenue" name="Revenue" stroke={BRAND_L} fill="url(#gRev)" strokeWidth={2} dot={false} />
                  <Area dataKey="collected" name="Collected" stroke={GOLD_L} fill="url(#gCol)" strokeWidth={2} dot={false} />
                  <Area dataKey="outstanding" name="Outstanding" stroke="#CBD5E1" fill="none" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Case Split</h2>
                <p className="text-xs text-gray-400 mt-0.5">{donutMode === 'status' ? 'By status' : 'By practice area'}</p>
              </div>
              <select value={donutMode} onChange={e => setDonutMode(e.target.value as 'status' | 'type')}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option value="status">By Status</option>
                <option value="type">By Type</option>
              </select>
            </div>

            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value" stroke="none">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} cases`, '']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-2">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    {d.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{d.value}</span>
                    <span className="text-gray-400">{Math.round(d.value / totalDonut * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CHARTS ROW 2: Cases + Branch ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Cases Filed vs Resolved */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Cases Filed vs Resolved</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {period === 'monthly' ? `Monthly trend — ${caseYear}` : period === 'quarterly' ? `Quarterly — ${caseYear}` : 'Year-over-year'}
                </p>
              </div>
              <select value={caseYear} onChange={e => setCaseYear(e.target.value)}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option>2024</option><option>2025</option><option>2026</option>
              </select>
            </div>

            <div className="flex gap-4 mb-3">
              {[{ c: BLUE, l: 'Filed' }, { c: GREEN, l: 'Resolved' }, { c: PURPLE, l: 'Pending' }].map(lg => (
                <div key={lg.l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: lg.c }} />{lg.l}
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={getCaseData()}>
                <defs>
                  <linearGradient id="gFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey="filed" name="Filed" stroke={BLUE} fill="url(#gFiled)" strokeWidth={2} dot={{ r: 3, fill: BLUE }} activeDot={{ r: 5 }} />
                <Area dataKey="resolved" name="Resolved" stroke={GREEN} fill="url(#gResolved)" strokeWidth={2} dot={{ r: 3, fill: GREEN }} activeDot={{ r: 5 }} />
                <Line dataKey="pending" name="Pending" stroke={PURPLE} strokeWidth={2} dot={{ r: 3, fill: PURPLE }} activeDot={{ r: 5 }} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Branch Revenue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">Branch Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">Revenue in ₹L</p>
            </div>

            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={branchChartData} layout="vertical" barGap={2} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 5, 5, 0]}>
                  {branchChartData.map((_, i) => <Cell key={i} fill={branches[i].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Branch list */}
            <div className="mt-4 space-y-3">
              {branches.map(b => (
                <div key={b.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                      <span className="text-gray-600 font-medium">{b.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-800">₹{b.rev}L</span>
                      <span className="text-gray-400 ml-1.5">{b.clients} clients</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Upcoming */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Upcoming Hearings &amp; Tasks</h2>
              <Link href="/super-admin/calendar" className="text-xs font-semibold text-[#984c1f] hover:underline flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                      <Calendar size={11} /> {item.sub}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: item.bg, color: item.color }}>
                    {item.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map(label => (
                <Link key={label} href="#"
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#FAFAF9] text-gray-700 hover:bg-gray-100 border border-gray-100 transition-colors">
                  {label} <ArrowRight size={14} className="opacity-40" />
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">System Status</p>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Storage Used</span>
                  <span className="font-bold text-gray-700">62%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: '62%', background: `linear-gradient(90deg, ${BRAND}, ${BRAND_L})` }} />
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[11px] text-gray-400">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}