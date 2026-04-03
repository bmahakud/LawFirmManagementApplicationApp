import { Briefcase, Users, FileText, CheckSquare, ArrowRight, Gavel, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Profile/Firm Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#984c1f]/10 flex items-center justify-center text-[#984c1f] text-xl font-bold">
            CA
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Chen & Associates</h1>
            <p className="text-sm text-gray-500 mt-1">Reg No: BC/1842/2010 • Civil & Corporate Law</p>
          </div>
        </div>
        <Link href="/super-admin/settings" className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Edit Profile
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Premium Cases Detail Card */}
        <div className="col-span-2 relative bg-gradient-to-br from-[#984c1f] via-[#7a3c18] to-[#4a220a] rounded-3xl p-7 text-white shadow-xl shadow-[#984c1f]/20 overflow-hidden group">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/10 transition-colors duration-700 ease-in-out" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10" />
          <div className="absolute top-1/2 left-1/2 w-full h-full bg-gradient-to-t from-black/20 to-transparent transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Total Cases Portfolio</p>
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-extrabold tracking-tight drop-shadow-sm">142</p>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 backdrop-blur-md">
                    +12% this month
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.2)] group-hover:scale-105 group-hover:bg-white/15 transition-all duration-500 ease-out p-3">
                <Briefcase className="w-full h-full text-white/90 drop-shadow-md" strokeWidth={1.5} />
              </div>
            </div>

            {/* Status Badges - Glassmorphism */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Running', count: '45', color: 'text-blue-100', dotBg: 'bg-blue-400', bg: 'bg-white/10', border: 'border-white/10' },
                { label: 'Disposed Off', count: '82', color: 'text-emerald-100', dotBg: 'bg-emerald-400', bg: 'bg-white/10', border: 'border-white/10' },
                { label: 'Closed', count: '15', color: 'text-gray-200', dotBg: 'bg-gray-400', bg: 'bg-white/5', border: 'border-white/5' }
              ].map((status) => (
                <div key={status.label} className={`flex flex-col p-3.5 rounded-2xl border backdrop-blur-md ${status.bg} ${status.border} hover:bg-white/20 transition-all duration-300 shadow-sm`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dotBg}`} />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{status.label}</span>
                  </div>
                  <span className={`text-2xl font-extrabold ${status.color} leading-none tracking-tight`}>{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Normal stat cards */}
        {[
          { label: 'Total Clients',   val: '88',  icon: Users,      color: 'bg-emerald-500' },
          { label: 'Total Documents', val: '430', icon: FileText,   color: 'bg-blue-500' },
          { label: 'Team Members',    val: '12',  icon: Users,      color: 'bg-purple-500' },
          { label: 'Pending To-dos',  val: '15',  icon: CheckSquare,color: 'bg-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:border-[#984c1f]/30 transition-colors">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm transition-transform group-hover:scale-110`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Upcoming Hearings & To-dos</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { title: 'Hearing: State vs Kumar', date: 'Today, 10:30 AM',  type: 'Hearing', icon: Gavel, color: 'text-red-600 bg-red-50' },
              { title: 'Draft Review: TechCorp NDA', date: 'Tomorrow',       type: 'To-do',   icon: FileText, color: 'text-amber-600 bg-amber-50' },
              { title: 'Client Meeting: Sarah Jenkins', date: '21 Mar, 2:00 PM',type: 'Meeting', icon: Users, color: 'text-blue-600 bg-blue-50' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.color}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" /> {t.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'Create New Case',   href: '/super-admin/cases' },
              { label: 'Add Team Member',   href: '/super-admin/team' },
              { label: 'Register Client',   href: '/super-admin/clients' },
              { label: 'Generate Invoice',  href: '/super-admin/billing' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold bg-[#f7f8fa] text-gray-700 hover:bg-gray-100 border border-gray-100 transition-colors">
                {label} <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
