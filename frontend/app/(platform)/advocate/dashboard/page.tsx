import { Briefcase, PenTool, Calendar, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdvocateDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned Cases',     val: '18', icon: Briefcase,     color: 'bg-[#4a1c40]' },
          { label: 'Drafts in Progress', val: '5',  icon: PenTool,       color: 'bg-purple-600' },
          { label: 'Upcoming Hearings',  val: '3',  icon: Calendar,      color: 'bg-blue-600' },
          { label: 'Unread Chats',       val: '12', icon: MessageSquare, color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm transition-transform group-hover:-translate-y-1 group-hover:shadow-md`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#4a1c40]">Kanban Overview</h2>
            <Link href="/advocate/cases" className="text-xs font-bold text-[#4a1c40] bg-[#4a1c40]/10 px-3 py-1.5 rounded-lg hover:bg-[#4a1c40]/20 transition-colors">Go to Board</Link>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {['To Research', 'Drafting', 'Filing'].map(stage => (
              <div key={stage} className="bg-[#f7f8fa] rounded-xl p-4 border border-gray-100 min-h-[250px]">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">{stage}</h3>
                <div className="w-full bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3 cursor-pointer hover:border-[#4a1c40]/50 transition-colors">
                  <p className="text-xs font-bold text-gray-900 mb-2">Kumar v. Builders Ltd</p>
                  <p className="text-[10px] text-white bg-amber-500 px-2 py-0.5 rounded-full inline-block">High Priority</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#4a1c40]">Quick Draft Check</h2>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-[#4a1c40]/10 flex items-center justify-center shrink-0 text-[#4a1c40]">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Bail Petition (Singh)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Last updated 2 hrs ago</p>
                  <button className="text-[11px] font-bold text-[#4a1c40] mt-2 flex items-center hover:underline">
                    Continue Writing <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            ))}
            <button className="w-full py-3 rounded-xl border border-dashed border-[#4a1c40]/30 text-[#4a1c40] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#4a1c40]/5 transition-colors">
              <Plus className="w-4 h-4" /> Start New Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
