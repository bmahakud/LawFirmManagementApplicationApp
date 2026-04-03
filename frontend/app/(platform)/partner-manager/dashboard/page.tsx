import { Building2, Activity, Link as LinkIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const assignedFirms = [
  { name: 'Chen & Associates', status: 'Active', plan: 'Pro',    since: 'Jan 2024' },
  { name: 'Torres Law Group',  status: 'Active', plan: 'Enterprise', since: 'Mar 2024' },
  { name: 'Davis Legal',       status: 'Inactive', plan: 'Basic', since: 'May 2024' },
];

export default function PartnerManagerDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Firms Onboarded', val: '12', icon: Building2, color: 'bg-[#1a6b4a]' },
          { label: 'Active Firms',          val: '10', icon: Activity,  color: 'bg-emerald-500' },
          { label: 'Pending Invitations',   val: '3',  icon: LinkIcon,  color: 'bg-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#1a6b4a]">Your Assigned Firms</h2>
            <Link href="/partner-manager/firms" className="text-xs font-semibold text-[#1a6b4a] hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-[56px_1fr_auto_auto] gap-4 border-b border-gray-100 bg-[#f7f8fa] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            <span>Sl. No</span>
            <span>Firm</span>
            <span>Status</span>
            <span>View</span>
          </div>
          <div className="divide-y divide-gray-50">
            {assignedFirms.map((f, i) => (
              <div key={i} className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-4 px-6 py-4">
                <div className="text-sm font-semibold text-gray-600">{i + 1}</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#1a6b4a] font-bold">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{f.name}</h3>
                    <p className="text-xs text-gray-400">Plan: {f.plan} • Since {f.since}</p>
                  </div>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    f.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {f.status}
                  </span>
                </div>
                <Link
                  href={`/partner-manager/firms/${i + 1}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#1a6b4a] hover:bg-gray-50"
                >
                  View
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#1a6b4a]">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link href="/partner-manager/firms" className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold bg-[#1a6b4a] text-white hover:bg-[#14533a] transition-colors">
              Onboard New Firm <ArrowRight className="w-4 h-4 opacity-60" />
            </Link>
            <button className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold bg-[#f7f8fa] text-[#1a6b4a] hover:bg-gray-100 border border-gray-100 transition-colors">
              View Analytics <ArrowRight className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
