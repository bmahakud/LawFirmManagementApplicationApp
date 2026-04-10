'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import {
  Scale, LayoutDashboard, Briefcase, FileText,
  Calendar, MessageSquare, LogOut, ChevronRight, CreditCard
} from 'lucide-react';

const navItems = [
  { label: 'Overview',    path: '/client/dashboard', icon: LayoutDashboard },
  { label: 'My Cases',    path: '/client/cases',     icon: Briefcase },
  { label: 'Documents',   path: '/client/documents', icon: FileText },
  { label: 'Hearings',    path: '/client/calendar',  icon: Calendar },
  { label: 'Invoices',    path: '/client/invoices',  icon: CreditCard },
  { label: 'Messages',    path: '/client/messaging', icon: MessageSquare },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = async () => {
    try {
      await customFetch(API.AUTH.LOGOUT, { method: 'POST' });
    } catch (e) {
      console.error('Logout failed on backend:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_details');
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0">
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1f2937] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Client<span className="text-[#1f2937]">Portal</span>
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path}>
              <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                active ? 'bg-[#1f2937]/10 text-[#1f2937]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1f2937]" />}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    active ? 'bg-[#1f2937]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#1f2937]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#1f2937]/40" />}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 px-4 py-3">
        <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-500 hover:opacity-75 transition-opacity px-2">
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
