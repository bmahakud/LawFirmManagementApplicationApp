'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Scale, LayoutDashboard, Briefcase, FileText,
  Calendar, LogOut, ChevronRight, PenTool, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopbar } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const navItems = [
  { label: 'Dashboard',    path: '/paralegal/dashboard', icon: LayoutDashboard },
  { label: 'Assigned Cases',path: '/paralegal/cases',     icon: Briefcase },
  { label: 'Drafting Assist',path: '/paralegal/drafting',  icon: PenTool },
  { label: 'Schedules',    path: '/paralegal/calendar',  icon: Calendar },
];

export default function ParalegalSidebar() {
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useTopbar();

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

  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  const sidebarContent = (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0a6c74] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Para<span className="text-[#0a6c74]">legal</span>
          </span>
        </div>
        <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-3 lg:hidden">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Paralegal
          </span>
        </div>

        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar}>
              <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                active ? 'bg-[#0a6c74]/10 text-[#0a6c74]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#0a6c74]" />}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    active ? 'bg-[#0a6c74]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#0a6c74]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#0a6c74]/40" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-4 py-3">
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:opacity-75 transition-opacity px-2">
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-64 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
