'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Scale, LayoutDashboard, Briefcase, FileText,
  Calendar, MessageSquare, LogOut, ChevronRight, PenTool, Users, Plus,
  UserCheck, Settings, X, IndianRupee, UserCog, Building2, ChevronDown,
  Check, RefreshCw, ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopbar } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const navItems = [
  { label: 'Dashboard', path: '/advocate/dashboard', icon: LayoutDashboard },
  { label: 'My Clients', path: '/advocate/clients', icon: Users },
  { label: 'My Paralegals', path: '/advocate/paralegals', icon: UserCog },
  { label: 'Cases', path: '/advocate/cases', icon: Briefcase },
  { label: 'Documents', path: '/advocate/documents', icon: FileText },
  { label: 'Drafting', path: '/advocate/drafting', icon: PenTool },
  { label: 'Calendar', path: '/advocate/calendar', icon: Calendar },
  { label: 'Time & Billing', path: '/advocate/billing', icon: IndianRupee },
  { label: 'Client Chat', path: '/advocate/chat', icon: MessageSquare },
];

export default function AdvocateSidebar() {
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useTopbar();
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  // Firm switcher state
  const [showFirmSwitcher, setShowFirmSwitcher] = useState(false);
  const [availableFirms, setAvailableFirms] = useState<any[]>([]);
  const [activeFirm, setActiveFirm] = useState<any>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  // Load user details from localStorage + fetch fresh data
  useEffect(() => {
    const stored = localStorage.getItem('user_details');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setActiveFirm({ firm: user.firm, firm_name: user.firm_name });
        if (user.available_firms) setAvailableFirms(user.available_firms);
      } catch { }
    }
    // Fetch fresh user data to get available_firms
    customFetch(API.USERS.ME)
      .then(r => r.json())
      .then(me => {
        if (me.available_firms) {
          setAvailableFirms(me.available_firms);
          const active = me.available_firms.find((f: any) => f.is_last_active);
          if (active) setActiveFirm(active);
        }
      })
      .catch(() => { });
  }, []);

  const handleSwitchFirm = async (membership: any) => {
    if (membership.is_last_active) {
      setShowFirmSwitcher(false);
      return;
    }
    setSwitching(membership.id);
    try {
      const res = await customFetch(API.USERS.SWITCH_FIRM, {
        method: 'POST',
        body: JSON.stringify({ firm_id: membership.firm }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state
        setAvailableFirms(prev =>
          prev.map(f => ({ ...f, is_last_active: f.id === membership.id }))
        );
        setActiveFirm(membership);

        // Persist updated user to localStorage
        if (data.user) {
          localStorage.setItem('user_details', JSON.stringify(data.user));
        }

        setShowFirmSwitcher(false);
        // Full page reload so all data (cases, clients, etc.) refreshes
        window.location.href = '/advocate/dashboard';
      }
    } catch (e) {
      console.error('Switch failed', e);
    } finally {
      setSwitching(null);
    }
  };

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

  const firmInitials = (name: string) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'F';

  const sidebarContent = (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#2d0b25] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-950 tracking-tight">
            Advocate<span className="text-[#2d0b25]">Portal</span>
          </span>
        </div>
        <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-700 hover:text-gray-950">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── FIRM SWITCHER WIDGET ── */}
      {availableFirms.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setShowFirmSwitcher(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#2d0b25]/5 hover:bg-[#2d0b25]/10 border border-[#2d0b25]/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2d0b25] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {firmInitials(activeFirm?.firm_name || '')}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2d0b25]/50">Active Firm</p>
              <p className="text-xs font-bold text-[#2d0b25] truncate">{activeFirm?.firm_name || 'My Firm'}</p>
            </div>
            {availableFirms.length > 1 && (
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#2d0b25]/40 group-hover:text-[#2d0b25] transition-colors shrink-0" />
            )}
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-3 lg:hidden">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-800">
            Advocate
          </span>
        </div>

        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar}>
              <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#2d0b25]/10 text-[#2d0b25]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'
                }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#2d0b25]" />}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#2d0b25]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#2d0b25]' : 'text-gray-700 group-hover:text-gray-900'}`} />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#2d0b25]/40" />}
              </div>
            </Link>
          );
        })}

        {/* Create Case Button */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <Link href="/advocate/cases/new" onClick={closeSidebar}>
            <div className="group relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#2d0b25] text-white hover:bg-[#1a0616] transition-all duration-200 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Create Case</span>
            </div>
          </Link>
        </div>

        {/* Account Context Section */}
        {(isActive('/advocate/profile') || isActive('/advocate/settings')) && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <div className="px-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-800">Account Context</span>
            </div>
            {[
              { label: 'Profile', path: '/advocate/profile', icon: UserCheck },
              { label: 'Settings', path: '/advocate/settings', icon: Settings }
            ].map(({ label, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} href={path} onClick={closeSidebar}>
                  <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#2d0b25]/10 text-[#2d0b25]' : 'text-gray-900 hover:bg-gray-50 hover:text-black'
                    }`}>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#2d0b25]" />}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#2d0b25]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                        <Icon className={`w-4 h-4 ${active ? 'text-[#2d0b25]' : 'text-gray-700 group-hover:text-gray-900'}`} />
                      </div>
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#2d0b25]/40" />}
                  </div>
                </Link>
              );
            })}
          </>
        )}
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

      {/* ── FIRM SWITCHER MODAL ── */}
      <AnimatePresence>
        {showFirmSwitcher && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFirmSwitcher(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Switch Firm</h2>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">Select your active law firm workspace</p>
                  </div>
                  <button
                    onClick={() => setShowFirmSwitcher(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Firms List */}
              <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
                {availableFirms.map((membership) => {
                  const isCurrentFirm = membership.is_last_active;
                  const isLoading = switching === membership.id;
                  return (
                    <button
                      key={membership.id}
                      onClick={() => handleSwitchFirm(membership)}
                      disabled={isLoading}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left group ${isCurrentFirm
                        ? 'bg-[#2d0b25]/8 border border-[#2d0b25]/20'
                        : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                        }`}
                    >
                      {/* Firm Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${isCurrentFirm ? 'bg-[#2d0b25] text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-[#2d0b25]/10 group-hover:text-[#2d0b25]'
                        }`}>
                        {firmInitials(membership.firm_name)}
                      </div>

                      {/* Firm Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isCurrentFirm ? 'text-[#2d0b25]' : 'text-gray-800'}`}>
                          {membership.firm_name}
                        </p>
                        <p className="text-[11px] font-semibold text-gray-400 capitalize mt-0.5">
                          {membership.user_type}
                          {membership.branch_name && ` · ${membership.branch_name}`}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="shrink-0">
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 text-[#2d0b25] animate-spin" />
                        ) : isCurrentFirm ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#2d0b25] uppercase tracking-wide">Active</span>
                            <div className="w-5 h-5 bg-[#2d0b25] rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-[#2d0b25]/40 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-[11px] font-semibold text-gray-400 text-center">
                  Switching firms reloads your entire workspace — cases, clients, and documents.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
