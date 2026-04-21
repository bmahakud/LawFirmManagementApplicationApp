'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Settings, Menu } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

import { resolveRouteMeta } from '@/components/platform/route-meta';
import { useTopbar } from '@/components/platform/TopbarContext';

const pageTitles = [
  { match: '/partner-manager/dashboard', title: 'Dashboard', sub: 'Your assigned firms and recent activity.' },
  { match: '/partner-manager/firms', title: 'Firms', sub: 'Manage assigned firms, onboarding, and plan context.' },
  { match: '/partner-manager/settings', title: 'Settings', sub: 'Your account preferences.' },
];

export default function PartnerManagerTopbar() {
  const router = useRouter();
  const { toggleSidebar } = useTopbar();

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
  const page = resolveRouteMeta(pathname, pageTitles, { title: 'Partner Manager', sub: '' });
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
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#1a6b4a] leading-tight">{page.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1a6b4a] border-2 border-white" />
        </button>
        <div className="w-px h-6 bg-gray-100 mx-1" />
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a6b4a] to-[#2d9d6e] flex items-center justify-center text-white text-xs font-bold">PM</div>
            <span className="text-sm font-semibold text-[#1a6b4a] hidden sm:block">Partner Manager</span>
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
