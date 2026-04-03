'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, LogOut, Settings } from 'lucide-react';
import { resolveRouteMeta } from '@/components/platform/route-meta';

const pageTitles = [
  { match: '/super-admin/dashboard', title: 'Firm Dashboard', sub: 'Overview of your law firm.' },
  { match: '/super-admin/cases', title: 'Cases', sub: 'Manage all firm cases, filings, and lifecycle stages.' },
  { match: '/super-admin/team', title: 'Team', sub: 'Manage advocates, admins, and paralegals.' },
  { match: '/super-admin/clients', title: 'Clients', sub: 'Manage clients and their profiles.' },
  { match: '/super-admin/billing', title: 'Billing', sub: 'View invoices and manage payments.' },
  { match: '/super-admin/reports', title: 'Reports', sub: 'Generate firm performance reports.' },
  { match: '/super-admin/settings', title: 'Settings', sub: 'Manage firm profile and verification settings.' },
];

export default function SuperAdminTopbar() {
  const pathname = usePathname();
  const page = resolveRouteMeta(pathname, pageTitles, { title: 'Super Admin', sub: 'Firm Management' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
      <div>
        <h1 className="text-base font-bold text-[#984c1f] leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-[#f7f8fa] border border-gray-100 rounded-xl px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input type="text" placeholder="Search…" className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full" />
        </div>
        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#984c1f] border-2 border-white" />
        </button>
        <div className="w-px h-6 bg-gray-100 mx-1" />
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#984c1f] to-[#e68045] flex items-center justify-center text-white text-xs font-bold">FO</div>
            <span className="text-sm font-semibold text-[#984c1f] hidden sm:block">Firm Owner</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link 
                href="/super-admin/settings" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
