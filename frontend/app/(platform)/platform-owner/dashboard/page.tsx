import AnalyticsCards from '@/components/platform/AnalyticsCards';
import { Building2, Gavel, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const recentActivity = [
  { icon: Building2, text: 'New firm registered: Torres Law Group', time: '2 min ago', color: 'bg-[#0e2340]' },
  { icon: Users,     text: '3 new users added to Chen & Associates', time: '18 min ago', color: 'bg-blue-600' },
  { icon: Gavel,     text: 'Case #1042 filed under Legal Experts LLP', time: '45 min ago', color: 'bg-emerald-600' },
  { icon: Building2, text: 'Davis Legal suspended by admin', time: '2 hr ago', color: 'bg-red-500' },
];

export default function PlatformOwnerDashboard() {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <AnalyticsCards />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Recent Activity</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map(({ icon: Icon, text, time, color }, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'Register New Firm',    href: '/platform-owner/firms',    color: 'bg-[#0e2340] text-white hover:bg-[#1a3a5c]' },
              { label: 'View All Firms',       href: '/platform-owner/firms',    color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
              { label: 'Platform Analytics',   href: '/platform-owner/analytics',color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
              { label: 'Manage Partner Mgrs',  href: '/platform-owner/partners', color: 'bg-[#f7f8fa] text-[#0e2340] hover:bg-gray-100 border border-gray-100' },
            ].map(({ label, href, color }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${color}`}
              >
                {label}
                <ArrowRight className="w-4 h-4 opacity-60" />
              </Link>
            ))}
          </div>

          {/* Mini platform health */}
          <div className="mx-4 mb-4 p-4 bg-[#0e2340] rounded-xl text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Platform Health</p>
            {[
              { label: 'API Uptime',   val: '99.9%',   ok: true },
              { label: 'DB Status',    val: 'Healthy',  ok: true },
              { label: 'Queue Lag',    val: '12 ms',    ok: true },
            ].map(({ label, val, ok }) => (
              <div key={label} className="flex items-center justify-between mb-2 last:mb-0">
                <span className="text-xs text-white/50">{label}</span>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}