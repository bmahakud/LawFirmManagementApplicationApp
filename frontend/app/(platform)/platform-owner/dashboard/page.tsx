'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, Gavel, ArrowRight,
  TrendingUp, DollarSign, ChevronDown, Activity
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#0e2340';
const BRAND_L = '#15345d';
const GOLD = '#C8971A';
const GREEN = '#16A34A';
const BLUE = '#2563EB';
const PURPLE = '#7C3AED';
const RED = '#DC2626';

// ─── DATA ───────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const revenueData = MONTHS.map((m, i) => ({
  month: m,
  revenue: [4.2, 5.8, 6.1, 8.4, 10.3, 11.7, 10.8, 14.4, 13.1, 16.6, 15.9, 19.4][i],
  collected: [3.2, 4.8, 4.9, 7.4, 8.1, 10.2, 9.4, 13.1, 11.8, 15.3, 13.4, 17.1][i],
  outstanding: [1.0, 1.0, 1.2, 1.0, 2.2, 1.5, 1.4, 1.3, 1.3, 1.3, 2.5, 2.3][i]
}));

const firmGrowthData = MONTHS.map((m, i) => ({
  month: m,
  activeFirms: [12, 14, 15, 18, 22, 25, 27, 30, 31, 35, 38, 42][i],
  totalUsers: [85, 95, 112, 140, 175, 205, 220, 245, 260, 290, 315, 340][i]
}));

const partnerPerformance = [
  { name: 'Anita Khanna (PM)', value: 18, color: BRAND },
  { name: 'Rohan Sethi (Sales)', value: 12, color: GOLD },
  { name: 'Megha Rao (PM)', value: 8, color: BLUE },
  { name: 'Karan Patel (Sales)', value: 4, color: GREEN },
];

const topFirms = [
  { name: 'Torres Law Group',  cases: 230, revenue: 78000, pct: 100 },
  { name: 'Chen & Associates', cases: 88,  revenue: 45000, pct: 58  },
  { name: 'Wright & Partners', cases: 67,  revenue: 29000, pct: 37  },
  { name: 'Legal Experts LLP', cases: 120, revenue: 20000, pct: 26  },
  { name: 'Davis Legal',       cases: 42,  revenue: 15000, pct: 19  },
];

const monthlyDataBreakdown = [
  { month: 'Jan', firms: 18, cases: 310, revenue: 280000 },
  { month: 'Feb', firms: 19, cases: 340, revenue: 310000 },
  { month: 'Mar', firms: 20, cases: 380, revenue: 345000 },
  { month: 'Apr', firms: 21, cases: 410, revenue: 390000 },
  { month: 'May', firms: 22, cases: 460, revenue: 420000 },
  { month: 'Jun', firms: 25, cases: 540, revenue: 465000 },
];

const recentActivity = [
  { icon: Building2, text: 'New firm registered: Torres Law Group', time: '2 min ago', color: 'bg-[#0e2340]' },
  { icon: Users,     text: '3 new users added to Chen & Associates', time: '18 min ago', color: 'bg-blue-600' },
  { icon: Gavel,     text: 'Case #1042 filed under Legal Experts LLP', time: '45 min ago', color: 'bg-emerald-600' },
  { icon: Building2, text: 'Davis Legal suspended by admin', time: '2 hr ago', color: 'bg-red-500' },
];

const quickActions = [
  { label: 'Register New Firm',    href: '/platform-owner/firms/new',    color: 'bg-[#0e2340] text-white hover:bg-[#15345d]' },
  { label: 'View All Firms',       href: '/platform-owner/firms',    color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
  { label: 'Global Settings',      href: '/platform-owner/settings', color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: 'inherit' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color, margin: '2px 0' }}>
          <span style={{ color: '#64748b' }}>{p.name}: </span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' && p.value % 1 !== 0 ? `₹${p.value}L` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function PlatformOwnerDashboard() {
  const [revType, setRevType] = useState<'bar' | 'area'>('bar');
  const [metricYear, setMetricYear] = useState('2026');

  return (
    <div className="space-y-6">

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { lbl: 'Total Revenue', val: '₹12.4L', chg: '↑ 22% vs last year', up: true, icon: DollarSign, color: GREEN },
          { lbl: 'Active Firms', val: '42', chg: '↑ 4 new this month', up: true, icon: Building2, color: BRAND },
          { lbl: 'Total Platform Users', val: '340', chg: '↑ 25 this month', up: true, icon: Users, color: BLUE },
          { lbl: 'Pending Revenue', val: '₹2.3L', chg: 'Collections trailing', up: false, icon: Activity, color: RED },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50">
                <k.icon size={16} color={k.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.lbl}</p>
            <p className={`text-[11px] font-semibold mt-2 border-t border-gray-50 pt-2 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>{k.chg}</p>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW 1: Revenue + Partner Split ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Platform Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly tracking vs collected revenue</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={metricYear} onChange={e => setMetricYear(e.target.value)}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option>2025</option><option>2026</option>
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

          <div className="flex gap-4 mb-3">
            {[{ c: BRAND, l: 'Expected Revenue' }, { c: GOLD, l: 'Collected' }, { c: '#CBD5E1', l: 'Outstanding' }].map(lg => (
              <div key={lg.l} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: lg.c }} />{lg.l}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            {revType === 'bar' ? (
              <BarChart data={revenueData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Expected Revenue" fill={BRAND} radius={[5, 5, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill={GOLD} radius={[5, 5, 0, 0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#CBD5E1" radius={[5, 5, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gRev_po" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCol_po" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey="revenue" name="Expected Revenue" stroke={BRAND} fill="url(#gRev_po)" strokeWidth={2} dot={false} />
                <Area dataKey="collected" name="Collected" stroke={GOLD} fill="url(#gCol_po)" strokeWidth={2} dot={false} />
                <Area dataKey="outstanding" name="Outstanding" stroke="#CBD5E1" fill="none" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Platform Output Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900">Platform Ownership</h2>
            <p className="text-xs text-gray-400 mt-0.5">Generated output by Partner &amp; Sales Mgrs</p>
          </div>

          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={partnerPerformance} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value" stroke="none">
                {partnerPerformance.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} firms brought in`, '']} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">
            {partnerPerformance.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                  {d.name.split(' ')[0]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{d.value} Firms</span>
                  <span className="text-gray-400">{Math.round(d.value / 42 * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2: Firm Growth ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Law Firm &amp; User Seat Growth</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tracking active firms versus provisioned individual user seats</p>
          </div>
        </div>

        <div className="flex gap-4 mb-3">
          {[{ c: BRAND_L, l: 'Active Firms' }, { c: '#9ca3af', l: 'Total User Seats' }].map(lg => (
            <div key={lg.l} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: lg.c }} />{lg.l}
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={firmGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line yAxisId="left" type="monotone" dataKey="activeFirms" name="Active Firms" stroke={BRAND_L} strokeWidth={3} dot={{ r: 4, fill: BRAND_L }} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="totalUsers" name="Total User Seats" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3, fill: '#9ca3af' }} strokeDasharray="6 6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── BOTTOM PANELS ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Recent Platform Activity</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map(({ icon: Icon, text, time, color }, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-semibold">{text}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            {quickActions.map(({ label, href, color }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${color}`}
              >
                {label}
                <ArrowRight className="w-4 h-4 opacity-60" />
              </Link>
            ))}
          </div>

          <div className="mx-4 mb-4 mt-6 p-5 bg-[#0e2340] rounded-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 opacity-50 -mr-6 -mt-6" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-4 relative z-10">Platform Health</p>
            {[
              { label: 'API Uptime',   val: '99.9%',   ok: true },
              { label: 'DB Status',    val: 'Healthy',  ok: true },
              { label: 'Queue Lag',    val: '12 ms',    ok: true },
            ].map(({ label, val, ok }) => (
              <div key={label} className="flex items-center justify-between mb-3 last:mb-0 relative z-10">
                <span className="text-xs font-medium text-white/70">{label}</span>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ADDITIONAL ANALYTICS ROW ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Top Firms</h2>
            <p className="text-xs text-gray-400 mt-0.5">By revenue generated</p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {topFirms.map(({ name, cases, revenue, pct }, i) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                    <span className="text-sm font-semibold text-[#0e2340] truncate max-w-[130px]">{name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0e2340]">₹{(revenue / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0e2340] to-[#1a3a5c]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{cases} cases</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#f7f8fa]">
                  {['Month', 'Firms', 'Cases', 'Revenue', 'Growth'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyDataBreakdown.map(({ month, firms, cases, revenue }, idx) => {
                  const prev = monthlyDataBreakdown[idx - 1];
                  const growth = prev ? (((revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : null;
                  return (
                    <tr key={month} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-[#0e2340]">{month} 2024</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{firms}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{cases}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600">₹{(revenue / 1000).toFixed(0)}k</td>
                      <td className="px-6 py-4">
                        {growth ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+{growth}%</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}