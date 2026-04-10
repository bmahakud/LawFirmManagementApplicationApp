'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveRouteMeta } from '@/components/platform/route-meta';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const pageTitles = [
  { match: '/client/dashboard', title: 'Welcome, Jane Doe', sub: 'Track your case progress and messages securely.' },
  { match: '/client/cases', title: 'My Cases', sub: 'Follow case progress, milestones, and hearing dates.' },
  { match: '/client/documents', title: 'Documents', sub: 'Download shared documents, orders, and filings.' },
  { match: '/client/calendar', title: 'Hearings', sub: 'Review upcoming hearings and key dates.' },
  { match: '/client/invoices', title: 'Invoices', sub: 'Review invoices, payment status, and due amounts.' },
  { match: '/client/messaging', title: 'Messages', sub: 'Send updates and questions to your legal team.' },
];

export default function ClientTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const page = resolveRouteMeta(pathname, pageTitles, { title: 'Welcome, Jane Doe', sub: 'Track your case progress and messages securely.' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await customFetch(API.AUTH.LOGOUT, { method: 'POST' });
    } catch (e) {
      console.error('Logout failed on backend:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_details');
      setIsProfileOpen(false);
      router.push('/login');
    }
  };

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
        <h1 className="text-base font-bold text-[#1f2937] leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>
        <div className="w-px h-6 bg-gray-100" />
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="w-8 h-8 rounded-full bg-[#1f2937] flex items-center justify-center text-white text-xs font-bold">JD</div>
            <span className="text-sm font-semibold text-[#1f2937] hidden sm:block">Jane Doe</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link 
                href="/client/settings" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
