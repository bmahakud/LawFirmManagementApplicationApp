'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Users, Gavel, ArrowRight,
  TrendingUp, DollarSign, ChevronDown, Activity, BarChart as BarChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BRAND = '#0e2340';
const BRAND_L = '#15345d';
const GOLD = '#C8971A';
const GREEN = '#16A34A';
const BLUE = '#2563EB';
const PURPLE = '#7C3AED';
const RED = '#DC2626';

const quickActions = [
  { label: 'Register New Firm', href: '/platform-owner/firms/new', color: 'bg-[#0e2340] text-white hover:bg-[#15345d]' },
  { label: 'View All Firms', href: '/platform-owner/firms', color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
  { label: 'Global Settings', href: '/platform-owner/settings', color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
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

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await customFetch(API.DASHBOARD.GET);
        const data = await response.json();
        if (response.ok) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const rawCaseStats = dashboardData?.cards?.case_statistics || { running: 0, disposed: 0, closed: 0, total: 0 };
  const caseStatsData = [
    { name: 'Running Cases', value: rawCaseStats.running || 0, color: BRAND },
    { name: 'Disposed Cases', value: rawCaseStats.disposed || 0, color: GOLD },
    { name: 'Closed Cases', value: rawCaseStats.closed || 0, color: RED },
  ];
  const totalCases = rawCaseStats.total || 0;

  return (
    <div className="space-y-6">

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { lbl: 'Active Firms', val: loading ? '...' : dashboardData?.cards?.total_firms || '0', chg: 'Live active firms', up: true, icon: Building2, color: BRAND },
          { lbl: 'Active Users', val: loading ? '...' : dashboardData?.cards?.active_users || '0', chg: 'Live global user seats', up: true, icon: Users, color: BLUE },
          { lbl: 'Total Cases', val: loading ? '...' : dashboardData?.cards?.case_statistics?.total || '0', chg: 'All matters on platform', up: true, icon: Gavel, color: PURPLE },
          { lbl: 'Running Cases', val: loading ? '...' : dashboardData?.cards?.case_statistics?.running || '0', chg: 'Currently active matters', up: true, icon: Activity, color: GREEN },
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Global Case Distribution Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[320px]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900">Case Statistics</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of all legal matters on the platform</p>
          </div>

          {!loading && totalCases === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[190px]">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Gavel className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400">No Cases Active</p>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              <ResponsiveContainer width="100%" height={180} className="[&_.recharts-surface]:outline-none">
                <PieChart>
                  <Pie data={caseStatsData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {caseStatsData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} cases`, '']} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2.5 mt-4 border-t border-gray-50 pt-4">
                {caseStatsData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                      {d.name.split(' ')[0]}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{d.value}</span>
                      <span className="text-gray-400 w-10 text-right bg-gray-50 px-1.5 py-0.5 rounded-md text-[10px]">{totalCases > 0 ? Math.round((d.value / totalCases) * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs will take more space now */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Recent Platform Activity</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-6 py-6 text-sm text-gray-400 font-medium animate-pulse text-center">Locating audit trails...</div>
            ) : dashboardData?.recent_audits?.length > 0 ? (
              dashboardData.recent_audits.slice(0, 7).map((audit: any, i: number) => {
                const isLogin = audit.action.includes('login');
                const isError = audit.action.includes('error') || audit.action.includes('fail');
                const isOTP = audit.action.includes('otp');
                const ActionIcon = (isLogin || audit.action === 'logout') ? Users : isOTP ? Activity : Building2;
                const dotColor = isLogin ? 'bg-emerald-500' : isError ? 'bg-red-500' : 'bg-[#0e2340]';

                return (
                  <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl ${dotColor} flex items-center justify-center shrink-0 mt-0.5`}>
                      <ActionIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-semibold">{audit.description}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{new Date(audit.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-6 text-sm text-gray-400 text-center font-medium">No recent operations logged.</div>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
            <Link href="/platform-owner/users" className="text-xs font-bold text-[#0e2340] hover:underline flex items-center gap-1">
              View All System Logs <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Quick Actions and Platform Health */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2 flex-1">
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
        </div>

        {/* This takes the rest of the space (2 cols) */}
        <div className="lg:col-span-2 bg-[#f7f8fa] border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300">
            <BarChartIcon size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Enhanced Analytics</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[240px]">Real-time growth and revenue projections will be integrated soon.</p>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold tracking-widest uppercase">
            Coming Soon
          </div>
        </div>
      </div>

    </div>
  );
}