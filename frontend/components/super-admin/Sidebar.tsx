'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale, LayoutDashboard, Users,
  Settings, ChevronRight, LogOut, Briefcase, FileText, CreditCard, BarChart2, ChevronDown, UserCheck
} from 'lucide-react';

const topNavItems = [
  { label: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Cases',     path: '/super-admin/cases',     icon: Briefcase       },
];

const userSubItems = [
  { label: 'Admin', path: '/super-admin/users/admin', icon: UserCheck },
  { label: 'Advocate', path: '/super-admin/users/advocate', icon: Briefcase },
  { label: 'Paralegal', path: '/super-admin/users/paralegal', icon: FileText },
  { label: 'Client', path: '/super-admin/users/client', icon: Users },
];

const bottomNavItems = [
  { label: 'Billing',   path: '/super-admin/billing',   icon: CreditCard      },
  { label: 'Reports',   path: '/super-admin/reports',   icon: BarChart2       },
  { label: 'Settings',  path: '/super-admin/settings',  icon: Settings        },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(
    () => pathname.startsWith('/super-admin/users')
  );

  useEffect(() => {
    if (pathname.startsWith('/super-admin/users')) {
      setUserMenuOpen(true);
    }
  }, [pathname]);

  const isActive = (path: string) => pathname.startsWith(path);
  const userSectionActive = pathname.startsWith('/super-admin/users');

  const navRow = (active: boolean) =>
    `group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
      active ? 'bg-[#984c1f]/10 text-[#984c1f]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`;
  const iconBox = (active: boolean) =>
    `w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
      active ? 'bg-[#984c1f]/15' : 'bg-gray-100 group-hover:bg-gray-200'
    }`;
  const iconColor = (active: boolean) =>
    `w-4 h-4 ${active ? 'text-[#984c1f]' : 'text-gray-400 group-hover:text-gray-600'}`;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0">
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#984c1f] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Firm<span className="text-[#984c1f]">Manage</span>
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Super Admin (Owner)
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {topNavItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path}>
              <div className={navRow(active)}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#984c1f]" />}
                <div className="flex items-center gap-3">
                  <div className={iconBox(active)}><Icon className={iconColor(active)} /></div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#984c1f]/40" />}
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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#984c1f]" />
            )}
            <div className="flex items-center gap-3">
              <div className={iconBox(userSectionActive)}>
                <Users className={iconColor(userSectionActive)} />
              </div>
              <span className="text-sm font-semibold">User Management</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${userMenuOpen ? 'rotate-180 text-[#984c1f]' : 'text-gray-300'}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${userMenuOpen ? 'max-h-52 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-[22px] mt-1 mb-1 border-l-2 border-[#984c1f]/15 pl-3.5 space-y-0.5">
              {userSubItems.map(({ label, path, icon: Icon }) => {
                const active = pathname.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                      active ? 'bg-[#984c1f]/10 text-[#984c1f]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                    }`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#984c1f]' : 'text-gray-300 group-hover:text-gray-500'}`} />
                      <span className={`text-[13px] font-semibold ${active ? 'text-[#984c1f]' : ''}`}>{label}</span>
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#984c1f]" />}
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
            <Link key={path} href={path}>
              <div className={navRow(active)}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#984c1f]" />}
                <div className="flex items-center gap-3">
                  <div className={iconBox(active)}><Icon className={iconColor(active)} /></div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#984c1f]/40" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#984c1f] flex items-center justify-center text-white text-xs font-bold shrink-0">
            FO
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 truncate">Firm Owner</p>
            <p className="text-[10px] text-gray-400 truncate">owner@chenlaw.com</p>
          </div>
        </div>
        <div className="border-t border-gray-100 px-4 py-3">
          <Link href="/login" className="flex items-center gap-2 text-[#984c1f] hover:opacity-75 transition-opacity">
            <LogOut className="w-4 h-4" />
            <span className="text-[13px] font-semibold">Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
