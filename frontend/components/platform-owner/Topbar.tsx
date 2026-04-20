'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';

import { resolveRouteMeta } from '@/components/platform/route-meta';
import { useTopbar } from '@/components/platform/TopbarContext';

const pageTitles = [
  { match: '/platform-owner', title: 'Dashboard', sub: "Welcome back, here's what's happening on your platform today." },
  { match: '/platform-owner/analytics', title: 'Analytics', sub: 'Platform-wide insights and performance metrics.' },
  { match: '/platform-owner/billing', title: 'Billing', sub: 'Manage platform billing and payments.' },
  { match: '/platform-owner/settings', title: 'Settings', sub: 'Configure platform preferences.' },
  { match: '/platform-owner/firms', title: 'Law Firms', sub: 'Manage law firms, onboarding, and subscription context.' },
  { match: '/platform-owner/partners', title: 'Partner Managers', sub: 'Manage partner managers and assigned firms.' },
  { match: '/platform-owner/sales', title: 'Sales Persons', sub: 'Manage sales personnel, referrals, and lead ownership.' },
  { match: '/platform-owner/users', title: 'User Management', sub: 'Manage platform-level user accounts.' },
  { match: '/platform-owner/users/super-admin', title: 'Super Admins', sub: 'Manage firm super admin accounts.' },
];

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { dynamic } = useTopbar();
  const staticPage = resolveRouteMeta(pathname, pageTitles, { title: 'Platform Owner', sub: '' });
  const page = dynamic ?? staticPage;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [userDetails, setUserDetails] = useState<{ initials: string; name: string; avatarUrl: string | null }>({
    initials: 'PO', name: 'Platform Owner', avatarUrl: null
  });

  useEffect(() => {
    const syncProfile = () => {
      const detailsRaw = localStorage.getItem('user_details');
      if (detailsRaw) {
        try {
          const user = JSON.parse(detailsRaw);
          const first = user.first_name || '';
          const last = user.last_name || '';
          const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'PO';
          const name = first || last ? `${first} ${last}`.trim() : 'Platform Owner';

          let avatarUrl = null;
          if (user.profile_image) {
            avatarUrl = user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}${user.profile_image}`;
          }
          setUserDetails({ initials, name, avatarUrl });
        } catch (e) { }
      }
    };

    syncProfile();
    window.addEventListener('profile_updated', syncProfile);

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('profile_updated', syncProfile);
    };
  }, []);

  return (
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 sticky top-0 z-30">      <div>
      <h1 className="text-base font-bold text-[#0e2340] leading-tight">{page.title}</h1>
      <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
    </div>

      <div className="flex items-center gap-2">

        <button className="relative w-9 h-9 rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c9a96e] border-2 border-white" />
        </button>

        <div className="w-px h-6 bg-gray-100 mx-1" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {userDetails.avatarUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-white">
                <img src={userDetails.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0e2340] to-[#1a3a5c] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userDetails.initials}
              </div>
            )}
            <span className="text-sm font-semibold text-[#0e2340] hidden sm:block max-w-[120px] text-left leading-tight break-words line-clamp-2">{userDetails.name}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link
                href="/platform-owner/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-gray-500">ID</span>
                </div>
                Profile
              </Link>
              <Link
                href="/platform-owner/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={async () => {
                  setIsProfileOpen(false);
                  try {
                    await customFetch(API.AUTH.LOGOUT, { method: 'POST' });
                  } catch (error) { } finally {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_details');
                    router.push('/login');
                  }
                }}
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
