'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale, LayoutDashboard, Briefcase, FileText,
  UserCheck, Bell, MessageSquare, LogOut, ChevronRight, Users, ChevronDown, User, Settings, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopbar } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const topNavItems = [
  { label: 'Dashboard', path: '/firm-admin/dashboard', icon: LayoutDashboard },
  { label: 'Cases', path: '/firm-admin/cases', icon: Briefcase },
  { label: 'Documents', path: '/firm-admin/documents', icon: FileText },
  { label: 'Drafts', path: '/firm-admin/drafts', icon: UserCheck },
];

const userSubItems = [
  { label: 'Advocate', path: '/firm-admin/users/advocate', icon: Briefcase },
  { label: 'Paralegal', path: '/firm-admin/users/paralegal', icon: FileText },
  { label: 'Client', path: '/firm-admin/users/client', icon: Users },
];

const bottomNavItems = [
  { label: 'Invoices', path: '/firm-admin/invoices', icon: FileText },
  { label: 'Messaging', path: '/firm-admin/messaging', icon: MessageSquare },
];

export default function FirmAdminSidebar() {
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
  const [userMenuOpen, setUserMenuOpen] = useState(
    () => pathname.startsWith('/firm-admin/users')
  );

  useEffect(() => {
    if (pathname.startsWith('/firm-admin/users')) {
      setUserMenuOpen(true);
    }
  }, [pathname]);

  const isActive = (path: string) => pathname.startsWith(path);
  const userSectionActive = pathname.startsWith('/firm-admin/users');

  const navRow = (active: boolean) =>
    `group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#2a4365]/10 text-[#2a4365]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`;
  const iconBox = (active: boolean) =>
    `w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#2a4365]/15' : 'bg-gray-100 group-hover:bg-gray-200'
    }`;
  const iconColor = (active: boolean) =>
    `w-4 h-4 ${active ? 'text-[#2a4365]' : 'text-gray-400 group-hover:text-gray-600'}`;

  const sidebarContent = (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#2a4365] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Lex<span className="text-[#2a4365]">Manage</span>
          </span>
        </div>
        <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-3 lg:hidden">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Firm Admin
          </span>
        </div>

        {topNavItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar}>
              <div className={navRow(active)}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#2a4365]" />}
                <div className="flex items-center gap-3">
                  <div className={iconBox(active)}><Icon className={iconColor(active)} /></div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#2a4365]/40" />}
              </div>
            </Link>
          );
        })}

        {/* User Management */}
        <div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setUserMenuOpen((o) => !o); }}
            className={navRow(userSectionActive) + ' w-full'}
          >
            {userSectionActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#2a4365]" />
            )}
            <div className="flex items-center gap-3">
              <div className={iconBox(userSectionActive)}>
                <Users className={iconColor(userSectionActive)} />
              </div>
              <span className="text-sm font-semibold">User Management</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${userMenuOpen ? 'rotate-180 text-[#2a4365]' : 'text-gray-300'}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${userMenuOpen ? 'max-h-52 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-[22px] mt-1 mb-1 border-l-2 border-[#2a4365]/15 pl-3.5 space-y-0.5">
              {userSubItems.map(({ label, path, icon: Icon }) => {
                const active = pathname.startsWith(path);
                return (
                  <Link key={path} href={path} onClick={closeSidebar}>
                    <div className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer ${active ? 'bg-[#2a4365]/10 text-[#2a4365]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                      }`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#2a4365]' : 'text-gray-300 group-hover:text-gray-500'}`} />
                      <span className={`text-[13px] font-semibold ${active ? 'text-[#2a4365]' : ''}`}>{label}</span>
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2a4365]" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {bottomNavItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar}>
              <div className={navRow(active)}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#2a4365]" />}
                <div className="flex items-center gap-3">
                  <div className={iconBox(active)}><Icon className={iconColor(active)} /></div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#2a4365]/40" />}
              </div>
            </Link>
          );
        })}

        {/* Account Context Section (Mirroring Super Admin) */}
        {(isActive('/firm-admin/profile') || isActive('/firm-admin/settings')) && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <div className="px-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Account Context</span>
            </div>
            {[
              { label: 'Profile', path: '/firm-admin/profile', icon: User },
              { label: 'Settings', path: '/firm-admin/settings', icon: Settings }
            ].map(({ label, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} href={path} onClick={closeSidebar}>
                  <div className={navRow(active)}>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#2a4365]" />}
                    <div className="flex items-center gap-3">
                      <div className={iconBox(active)}><Icon className={iconColor(active)} /></div>
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#2a4365]/40" />}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-gray-100 px-4 py-3">
        <button onClick={handleLogout} className="flex items-center gap-2 text-[#2a4365] hover:opacity-75 transition-opacity">
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
