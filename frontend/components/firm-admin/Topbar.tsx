'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, LogOut, Settings } from 'lucide-react';
import { resolveRouteMeta } from '@/components/platform/route-meta';

const pageTitles = [
  { match: '/firm-admin/dashboard', title: 'Admin Dashboard', sub: 'Manage cases and coordinate firm operations.' },
  { match: '/firm-admin/cases', title: 'Cases', sub: 'Assign advocates, monitor hearings, and review matter status.' },
  { match: '/firm-admin/documents', title: 'Documents', sub: 'Review uploaded files, categories, and version history.' },
  { match: '/firm-admin/drafts', title: 'Drafts', sub: 'Track draft submissions, approvals, and revisions.' },
  { match: '/firm-admin/invoices', title: 'Invoices', sub: 'Generate invoices and monitor payment collection.' },
  { match: '/firm-admin/messaging', title: 'Messaging', sub: 'Coordinate internal updates and client responses.' },
];

export default function FirmAdminTopbar() {
  const pathname = usePathname();
  const page = resolveRouteMeta(pathname, pageTitles, { title: 'Admin Dashboard', sub: 'Manage cases and coordinate firm operations.' });
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
        <h1 className="text-base font-bold text-[#2a4365] leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-[#f7f8fa] border border-gray-100 rounded-xl px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input type="text" placeholder="Search cases…" className="bg-transparent text-sm text-gray-600 outline-none w-full" />
        </div>
        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2a4365] border-2 border-white" />
        </button>
        <div className="w-px h-6 bg-gray-100 mx-1" />
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#2a4365] flex items-center justify-center text-white text-xs font-bold">FA</div>
            <span className="text-sm font-semibold text-[#2a4365] hidden sm:block">Firm Admin</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link 
                href="/firm-admin/settings" 
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
