import { Briefcase, FileText, CheckSquare, MessagesSquare, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function FirmAdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Cases',   val: '112', icon: Briefcase,     color: 'bg-[#2a4365]' },
          { label: 'Pending Drafts', val: '24',  icon: FileText,      color: 'bg-amber-500' },
          { label: 'Unread Msgs',    val: '18',  icon: MessagesSquare,color: 'bg-emerald-500' },
          { label: 'Today Tasks',    val: '9',   icon: CheckSquare,   color: 'bg-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Recent Case Activity</h2>
            <Link href="/firm-admin/cases" className="text-xs font-semibold text-[#2a4365]">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { case: 'State vs Kumar',   action: 'Draft Petition uploaded for review', time: '10 mins ago', author: 'S. Sharma (Adv)' },
              { case: 'TechCorp NDA',     action: 'Client message received',            time: '1 hr ago',    author: 'TechCorp Legal' },
              { case: 'Estate Settlement',action: 'Hearing scheduled for next week',    time: '3 hrs ago',   author: 'System' },
            ].map((a, i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{a.case}</h3>
                  <p className="text-sm text-gray-600 mt-1">{a.action}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.author} • {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Pending Approvals</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Bail Petition (Singh)',    type: 'Draft' },
              { label: 'Invoice #1042 (Horizon)',  type: 'Invoice' },
              { label: 'Leave Req - A. Gupta',     type: 'HR' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-[#f7f8fa] border border-gray-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2a4365] bg-[#2a4365]/10 px-2 py-1 rounded">{item.type}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-900">{item.label}</span>
                  <button className="text-xs font-semibold text-[#2a4365] hover:underline">Review &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
