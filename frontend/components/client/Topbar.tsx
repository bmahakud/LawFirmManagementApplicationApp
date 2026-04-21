'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Settings, User, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveRouteMeta } from '@/components/platform/route-meta';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import { useTopbar } from '@/components/platform/TopbarContext';

const pageTitles = [
  { match: '/client/dashboard', title: 'Dashboard',  sub: 'Track your case progress and messages securely.' },
  { match: '/client/cases',     title: 'My Cases',   sub: 'Follow case progress, milestones, and hearing dates.' },
  { match: '/client/documents', title: 'Documents',  sub: 'Download shared documents, orders, and filings.' },
  { match: '/client/calendar',  title: 'Hearings',   sub: 'Review upcoming hearings and key dates.' },
  { match: '/client/invoices',  title: 'Invoices',   sub: 'Review invoices, payment status, and due amounts.' },
  { match: '/client/messaging', title: 'Messages',   sub: 'Send updates and questions to your legal team.' },
  { match: '/client/profile',   title: 'My Profile', sub: 'Update your personal details and identity.' },
  { match: '/client/settings',  title: 'Settings',   sub: 'Manage your account security and password.' },
];

export default function ClientTopbar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { toggleSidebar } = useTopbar();
  const page       = resolveRouteMeta(pathname, pageTitles, { title: 'Welcome', sub: 'Track your case progress.' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Real user state
  const [userName,   setUserName]   = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [initials,   setInitials]   = useState('');

  /* Load user from localStorage (fast) then verify */
  const loadUser = () => {
    const stored = localStorage.getItem('user_details');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Client';
        setUserName(name);
        setInitials(`${(u.first_name || u.username || '').charAt(0)}${(u.last_name || '').charAt(0)}`.toUpperCase() || 'C');
        
        if (u.profile_image) {
          const path = u.profile_image;
          if (path.startsWith('http')) {
            setAvatarUrl(path);
          } else {
            const separator = path.startsWith('/') ? '' : '/';
            setAvatarUrl(`${API_BASE_URL}${separator}${path}`);
          }
        } else {
          setAvatarUrl(null);
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    loadUser();

    // Fetch fresh profile in background
    (async () => {
      try {
        const stored = localStorage.getItem('user_details');
        let userId: string | null = null;
        if (stored) { try { userId = JSON.parse(stored)?.id; } catch (_) {} }
        const res = await customFetch(`${API.USERS.LIST}?user_type=client`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        const me = userId ? list.find((u: any) => u.id === userId) : list[0];
        if (!me) return;

        // Update localStorage so next load is instant
        localStorage.setItem('user_details', JSON.stringify(me));
        loadUser(); // Re-trigger local state update
      } catch (_) {}
    })();

    // When profile page saves, refresh
    const handler = () => loadUser();
    window.addEventListener('client-profile-updated', handler);
    return () => window.removeEventListener('client-profile-updated', handler);
  }, []);

  const handleLogout = async () => {
    try { await customFetch(API.AUTH.LOGOUT, { method: 'POST' }); } catch (_) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_details');
    setIsProfileOpen(false);
    router.push('/login');
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
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#1f2937] leading-tight">{page.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Bell */}
        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1f2937] border-2 border-white" />
        </button>

        <div className="w-px h-6 bg-gray-100" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            {/* Avatar */}
            {avatarUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shrink-0">
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1f2937] to-[#4b5563] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials || 'C'}
              </div>
            )}
            {/* Name */}
            {userName && (
              <span className="text-sm font-semibold text-[#1f2937] hidden sm:block max-w-[150px] text-left leading-tight break-words line-clamp-1">
                {userName}
              </span>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-bold text-gray-900 truncate">{userName || 'Client'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Client Portal</p>
              </div>

              <Link href="/client/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}>
                <User className="w-4 h-4" /> Profile
              </Link>

              <Link href="/client/settings"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}>
                <Settings className="w-4 h-4" /> Settings
              </Link>

              <div className="h-px bg-gray-100 my-1" />

              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
