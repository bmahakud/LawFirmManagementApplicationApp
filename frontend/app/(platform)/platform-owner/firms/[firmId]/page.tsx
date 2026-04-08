'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, Briefcase, FileSignature, Shield, ArrowLeft,
  Edit, Save, X, Calendar, DollarSign, Download, Clock
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const BRAND = '#0e2340';
const GREEN = '#16A34A';
const RED = '#DC2626';

const resourceData = [
  { name: 'Branches', value: 15, color: '#3b82f6' },
  { name: 'Admins', value: 32, color: '#f43f5e' },
  { name: 'Advocates', value: 218, color: '#8b5cf6' },
  { name: 'Paralegals', value: 114, color: '#f59e0b' },
  { name: 'Clients', value: 1890, color: '#10b981' },
];

const caseGrowthData = [
  { month: 'Jan', cases: 420 },
  { month: 'Feb', cases: 540 },
  { month: 'Mar', cases: 680 },
  { month: 'Apr', cases: 890 },
  { month: 'May', cases: 1150 },
  { month: 'Jun', cases: 1340 },
];

const invoices = [
  { id: 'INV-2024-001', date: '01 Jun 2024', due: '15 Jun 2024', amount: 150000, status: 'Paid' },
  { id: 'INV-2024-002', date: '01 May 2024', due: '15 May 2024', amount: 150000, status: 'Paid' },
  { id: 'INV-2024-003', date: '01 Apr 2024', due: '15 Apr 2024', amount: 145000, status: 'Paid' },
  { id: 'INV-2024-004', date: '01 Mar 2024', due: '15 Mar 2024', amount: 145000, status: 'Paid' },
  { id: 'INV-2024-005', date: '01 Feb 2024', due: '15 Feb 2024', amount: 145000, status: 'Paid' },
];

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

export default function PlatformOwnerFirmOverviewPage({
  params,
}: {
  params: Promise<{ firmId: string }>;
}) {
  const { firmId } = use(params);
  
  const [activeTab, setActiveTab] = useState<'Statistics' | 'Billing' | 'Settings'>('Statistics');
  const [firmDetails, setFirmDetails] = useState({
    name: 'Chen & Associates',
    email: 'contact@chenlaw.com',
    phone: '+1 (555) 987-6543'
  });
  
  const [editedDetails, setEditedDetails] = useState(firmDetails);

  const handleSave = () => {
    setFirmDetails(editedDetails);
    // In a real app, you would submit to backend here
    // Alert or toast could go here
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link href="/platform-owner/firms" className="p-2 mt-1 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-w-[320px]">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{firmDetails.name}</h1>
              </div>
              <p className="text-gray-500 text-sm mt-1 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Firm · #{firmId}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Email:</span>
                  <span className="text-gray-900">{firmDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Phone:</span>
                  <span className="text-gray-900">{firmDetails.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm h-fit">
          <button 
            onClick={() => setActiveTab('Statistics')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Statistics' ? 'bg-[#0e2340] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Statistics
          </button>
          <button 
            onClick={() => setActiveTab('Billing')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Billing' ? 'bg-[#0e2340] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Billing
          </button>
          <button 
            onClick={() => setActiveTab('Settings')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Settings' ? 'bg-[#0e2340] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Settings
          </button>
        </div>
      </div>

      <hr className="border-gray-200 my-4" />

      {/* ── CONTENT RENDERING ── */}
      {activeTab === 'Statistics' ? (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Branches', count: 15, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
              { label: 'Total Admins', count: 32, icon: Shield, color: 'text-rose-600', bg: 'bg-rose-100' },
              { label: 'Total Advocates', count: 218, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'Total Paralegals', count: 114, icon: FileSignature, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'Total Clients', count: 1890, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { label: 'Total Cases', count: 6802, icon: Briefcase, color: 'text-[#0e2340]', bg: 'bg-[#0e2340]/10' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-gray-200 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.count.toLocaleString()}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 pt-2">
            
            {/* Resource Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-900">Resource Distribution</h2>
                <p className="text-xs text-gray-400 mt-0.5">Firm structural breakdown</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={resourceData} layout="vertical" barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Case Load Growth */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Total Cases Overview</h2>
                  <p className="text-xs text-gray-400 mt-0.5">YTD Case volume generation</p>
                </div>
                <span className="text-xs font-bold text-[#0e2340] bg-[#0e2340]/10 px-2 py-1 rounded-md">Total: 1,340</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={caseGrowthData}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cases" name="Total Cases" stroke={BRAND} fill="url(#colorCases)" strokeWidth={3} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
          </div>
        </div>
      ) : activeTab === 'Billing' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 text-emerald-600 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <span className="font-bold text-sm">Total Paid YTD</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹7,35,000</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 text-red-500 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <span className="font-bold text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹0</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-sm font-bold text-[#0e2340]">Invoice History</h2>
              <button className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-white">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Issue Date</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Due Date</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors bg-white">
                      <td className="px-6 py-4 text-sm font-semibold text-[#0e2340]"><span className="text-gray-400 mr-2">#</span>{inv.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2"><Calendar size={12} className="text-gray-400"/> {inv.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.due}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">₹{inv.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'Settings' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Edit className="w-5 h-5 text-gray-400"/> Edit Firm Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Update the core contact identity and metadata for this law firm.</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Firm Name</label>
              <input 
                type="text" 
                value={editedDetails.name}
                onChange={(e) => setEditedDetails({...editedDetails, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={editedDetails.email}
                onChange={(e) => setEditedDetails({...editedDetails, email: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <input 
                type="text" 
                value={editedDetails.phone}
                onChange={(e) => setEditedDetails({...editedDetails, phone: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
              />
            </div>
            
            <div className="pt-4 border-t border-gray-100 mt-6 flex gap-3 justify-end">
              <button 
                onClick={() => setEditedDetails(firmDetails)} 
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSave} 
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0e2340] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
