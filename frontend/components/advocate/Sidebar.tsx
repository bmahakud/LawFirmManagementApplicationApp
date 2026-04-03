'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale, LayoutDashboard, Briefcase, FileText,
  Calendar, MessageSquare, LogOut, ChevronRight, PenTool
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',    path: '/advocate/dashboard', icon: LayoutDashboard },
  { label: 'Assigned Cases',path: '/advocate/cases',     icon: Briefcase },
  { label: 'Drafting',     path: '/advocate/drafting',  icon: PenTool },
  { label: 'Calendar',     path: '/advocate/calendar',  icon: Calendar },
  { label: 'Client Chat',  path: '/advocate/chat',      icon: MessageSquare },
];

export default function AdvocateSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0">
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#4a1c40] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Advocate<span className="text-[#4a1c40]">Portal</span>
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path}>
              <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                active ? 'bg-[#4a1c40]/10 text-[#4a1c40]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#4a1c40]" />}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    active ? 'bg-[#4a1c40]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#4a1c40]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#4a1c40]/40" />}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 px-4 py-3">
        <Link href="/login" className="flex items-center gap-2 text-red-500 hover:opacity-75 transition-opacity px-2">
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
