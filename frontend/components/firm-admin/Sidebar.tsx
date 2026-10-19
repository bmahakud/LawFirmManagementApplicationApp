'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale, LayoutDashboard, Briefcase, FileText,
  UserCheck, Bell, MessageSquare, LogOut, ChevronRight, Users, ChevronDown, User, Settings, X, Calendar, CreditCard, BarChart3, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopbar } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const topNavItems = [
  { label: 'Dashboard', path: '/firm-admin/dashboard', icon: LayoutDashboard },
  { label: 'Calendar', path: '/firm-admin/calendar', icon: Calendar },
  { label: 'Cases', path: '/firm-admin/cases', icon: Briefcase },
  { label: 'Drafts', path: '/firm-admin/drafts', icon: UserCheck },
];

const userSubItems = [
  { label: 'Advocate', path: '/firm-admin/users/advocate', icon: Briefcase },
  { label: 'Paralegal', path: '/firm-admin/users/paralegal', icon: FileText },
  { label: 'Client', path: '/firm-admin/users/client', icon: Users },
];

const bottomNavItems = [
  { label: 'Messaging', path: '/firm-admin/messaging', icon: MessageSquare },
];

const billingSubItems = [
  { label: 'Billing Center', path: '/firm-admin/billing', icon: CreditCard },
  { label: 'Client Invoices', path: '/firm-admin/billing/client-invoices', icon: FileText },
  { label: 'Reports', path: '/firm-admin/billing/reports', icon: BarChart3 },
];

export default function FirmAdminSidebar() {
  const router = useRouter();
  const { isSidebarOpen, closeSidebar, isCollapsed, toggleCollapse } = useTopbar();

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
  const [billingMenuOpen, setBillingMenuOpen] = useState(
    () => pathname.startsWith('/firm-admin/billing')
  );

  useEffect(() => {
    if (pathname.startsWith('/firm-admin/users')) setUserMenuOpen(true);
    if (pathname.startsWith('/firm-admin/billing')) setBillingMenuOpen(true);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/firm-admin/cases') {
      return pathname.startsWith('/firm-admin/cases') || pathname.startsWith('/firm-admin/documents');
    }
    return pathname.startsWith(path);
  };
  const userSectionActive = pathname.startsWith('/firm-admin/users');

  const sidebarContent = (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden transition-all duration-300`}>
      <div className={`px-4 py-5 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-[#1a2a40] rounded-lg flex items-center justify-center shadow-md shrink-0">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-950 tracking-tight truncate">
              Firm<span className="text-[#1a2a40]">Admin</span>
            </span>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="hidden lg:flex p-2 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-700 hover:text-gray-950">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 mb-3 lg:hidden">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-800">
              Firm Admin
            </span>
          </div>
        )}

        {topNavItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar} title={isCollapsed ? label : undefined}>
              <div className={`group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#1a2a40]/10 text-[#1a2a40]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'}`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1a2a40]" />}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#1a2a40]/15' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#1a2a40]' : 'text-gray-700 group-hover:text-gray-900'}`} />
                  </div>
                  {!isCollapsed && <span className="text-sm font-semibold">{label}</span>}
                </div>
                {active && !isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-[#1a2a40]/40" />}
              </div>
            </Link>
          );
        })}

        {/* User Management */}
        <div>
          <button
            type="button"
            title={isCollapsed ? "User Management" : undefined}
            onClick={(e) => { e.preventDefault(); setUserMenuOpen((o) => !o); }}
            className={`group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all duration-200 cursor-pointer w-full ${userSectionActive ? 'bg-[#1a2a40]/10 text-[#1a2a40]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'}`}
          >
            {userSectionActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1a2a40]" />
            )}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${userSectionActive ? 'bg-[#1a2a40]/15' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                <Users className={`w-4 h-4 ${userSectionActive ? 'text-[#1a2a40]' : 'text-gray-700 group-hover:text-gray-900'}`} />
              </div>
              {!isCollapsed && <span className="text-sm font-semibold">User Management</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${userMenuOpen ? 'rotate-180 text-[#1a2a40]' : 'text-gray-400'}`} />
            )}
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${userMenuOpen ? 'max-h-52 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`${isCollapsed ? 'pl-0 border-none' : 'ml-[22px] border-l-2 border-[#1a2a40]/15 pl-3.5'} mt-1 mb-1 space-y-0.5`}>
              {userSubItems.map(({ label, path, icon: Icon }) => {
                const active = pathname.startsWith(path);
                return (
                  <Link key={path} href={path} onClick={closeSidebar} title={isCollapsed ? label : undefined}>
                    <div className={`group flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2 rounded-lg transition-all duration-150 cursor-pointer ${active ? 'bg-[#1a2a40]/10 text-[#1a2a40]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#1a2a40]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      {!isCollapsed && <span className={`text-[13px] font-semibold ${active ? 'text-[#1a2a40]' : ''}`}>{label}</span>}
                      {active && !isCollapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a2a40]" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Billing — collapsible with Reports */}
        {(() => {
          const billingSectionActive = pathname.startsWith('/firm-admin/billing');
          return (
            <div>
              <button type="button"
                title={isCollapsed ? "Billing" : undefined}
                onClick={(e) => { e.preventDefault(); setBillingMenuOpen(o => !o); }}
                className={`group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all duration-200 cursor-pointer w-full ${billingSectionActive ? 'bg-[#1a2a40]/10 text-[#1a2a40]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'}`}>
                {billingSectionActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1a2a40]" />}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${billingSectionActive ? 'bg-[#1a2a40]/15' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <CreditCard className={`w-4 h-4 ${billingSectionActive ? 'text-[#1a2a40]' : 'text-gray-700 group-hover:text-gray-900'}`} />
                  </div>
                  {!isCollapsed && <span className="text-sm font-semibold">Billing</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${billingMenuOpen ? 'rotate-180 text-[#1a2a40]' : 'text-gray-500'}`} />
                )}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${billingMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className={`${isCollapsed ? 'pl-0 border-none' : 'ml-[22px] border-l-2 border-[#1a2a40]/15 pl-3.5'} mt-1 mb-1 space-y-0.5`}>
                  {billingSubItems.map(({ label, path, icon: Icon }) => {
                    const active = path === '/firm-admin/billing' ? pathname === '/firm-admin/billing' : pathname.startsWith(path);
                    return (
                      <Link key={path} href={path} onClick={closeSidebar} title={isCollapsed ? label : undefined}>
                        <div className={`group flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2 rounded-lg transition-all duration-150 cursor-pointer ${active ? 'bg-[#1a2a40]/8 text-[#1a2a40]' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'}`}>
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#1a2a40]' : 'text-gray-600 group-hover:text-gray-900'}`} />
                          {!isCollapsed && <span className={`text-[13px] font-semibold ${active ? 'text-[#1a2a40]' : ''}`}>{label}</span>}
                          {active && !isCollapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a2a40]" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {bottomNavItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar} title={isCollapsed ? label : undefined}>
              <div className={`group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#1a2a40]/10 text-[#1a2a40]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'}`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1a2a40]" />}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#1a2a40]/15' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#1a2a40]' : 'text-gray-700 group-hover:text-gray-900'}`} />
                  </div>
                  {!isCollapsed && <span className="text-sm font-semibold">{label}</span>}
                </div>
                {active && !isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-[#1a2a40]/40" />}
              </div>
            </Link>
          );
        })}

        {/* Account Context Section */}
        {(isActive('/firm-admin/profile') || isActive('/firm-admin/settings')) && (
          <>
            <div className="my-3 border-t border-gray-100" />
            {!isCollapsed && (
              <div className="px-3 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-800">Account Context</span>
              </div>
            )}
            {[
              { label: 'Profile', path: '/firm-admin/profile', icon: User },
              { label: 'Settings', path: '/firm-admin/settings', icon: Settings }
            ].map(({ label, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} href={path} onClick={closeSidebar} title={isCollapsed ? label : undefined}>
                  <div className={`group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#1a2a40]/10 text-[#1a2a40]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'}`}>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1a2a40]" />}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#1a2a40]/15' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                        <Icon className={`w-4 h-4 ${active ? 'text-[#1a2a40]' : 'text-gray-700 group-hover:text-gray-900'}`} />
                      </div>
                      {!isCollapsed && <span className="text-sm font-semibold">{label}</span>}
                    </div>
                    {active && !isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-[#1a2a40]/40" />}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-gray-100 px-3 py-3 flex justify-center">
        <button onClick={handleLogout} title={isCollapsed ? "Sign Out" : undefined} className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-2 px-2'} text-[#2a4365] hover:opacity-75 transition-opacity`}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-[13px] font-semibold">Sign Out</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'} h-screen shrink-0 sticky top-0 transition-all duration-300`}>
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
