'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Search, LogOut, Settings } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

import { usePathname, useRouter } from 'next/navigation';
import { resolveRouteMeta } from '@/components/platform/route-meta';

const pageTitles = [
  { match: '/advocate/dashboard', title: 'Advocate Dashboard', sub: 'Manage your case files, drafts, and client meetings.' },
  { match: '/advocate/cases', title: 'Assigned Cases', sub: 'Review matter status, evidence, and next hearing tasks.' },
  { match: '/advocate/drafting', title: 'Drafting', sub: 'Prepare petitions, arguments, and revision-ready drafts.' },
  { match: '/advocate/calendar', title: 'Calendar', sub: 'Track hearings, deadlines, and court preparation tasks.' },
  { match: '/advocate/chat', title: 'Client Chat', sub: 'Manage direct client communication and case follow-ups.' },
];

export default function AdvocateTopbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await customFetch(API.AUTH.LOGOUT, { method: 'POST' });
    } catch (e) {
      console.error('Logout failed on backend:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_details');
      if (typeof setIsProfileOpen === 'function') setIsProfileOpen(false);
      router.push('/login');
    }
  };

  const pathname = usePathname();
  const page = resolveRouteMeta(pathname, pageTitles, { title: 'Advocate Dashboard', sub: 'Manage your case files, drafts, and client meetings.' });
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
        <h1 className="text-base font-bold text-[#4a1c40] leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-[#f7f8fa] border border-gray-100 rounded-xl px-3 py-2 w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input type="text" placeholder="Search cases…" className="bg-transparent text-sm text-gray-600 outline-none w-full" />
        </div>
        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>
        <div className="w-px h-6 bg-gray-100 mx-1" />
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#4a1c40] flex items-center justify-center text-white text-xs font-bold">AD</div>
            <span className="text-sm font-semibold text-[#4a1c40] hidden sm:block">Advocate</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
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
