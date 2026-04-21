'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Settings, UserCheck, Menu } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';

import { resolveRouteMeta } from '@/components/platform/route-meta';
import { useTopbar } from '@/components/platform/TopbarContext';

const pageTitles = [
  { match: '/firm-admin/dashboard', title: 'Admin Dashboard', sub: 'Manage cases and coordinate firm operations.' },
  { match: '/firm-admin/cases', title: 'Cases', sub: 'Assign advocates, monitor hearings, and review matter status.' },
  { match: '/firm-admin/documents', title: 'Documents', sub: 'Review uploaded files, categories, and version history.' },
  { match: '/firm-admin/drafts', title: 'Drafts', sub: 'Track draft submissions, approvals, and revisions.' },
  { match: '/firm-admin/invoices', title: 'Invoices', sub: 'Generate invoices and monitor payment collection.' },
  { match: '/firm-admin/messaging', title: 'Messaging', sub: 'Coordinate internal updates and client responses.' },
  { match: '/firm-admin/settings', title: 'Settings', sub: 'Manage your password and security settings.' },
  { match: '/firm-admin/profile', title: 'User Profile', sub: 'View and update your personal information.' },
];

export default function FirmAdminTopbar() {
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
  const page = resolveRouteMeta(pathname, pageTitles, { title: 'Admin Dashboard', sub: 'Manage cases and coordinate firm operations.' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [userDetails, setUserDetails] = useState<{ initials: string; name: string; avatarUrl: string | null }>({
    initials: 'FA', name: 'Firm Admin', avatarUrl: null
  });

  useEffect(() => {
    const syncProfile = () => {
      const detailsRaw = localStorage.getItem('user_details');
      if (detailsRaw) {
        try {
          const user = JSON.parse(detailsRaw);
          const first = user.first_name || '';
          const last = user.last_name || '';
          const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'FA';
          const name = first || last ? `${first} ${last}`.trim() : 'Firm Admin';
          
          let avatarUrl = null;
          if (user.profile_image) {
              avatarUrl = user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}${user.profile_image}`;
          }
          setUserDetails({ initials, name, avatarUrl });
        } catch(e) {}
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
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#2a4365] leading-tight">{page.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
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
            {userDetails.avatarUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shrink-0">
                    <img src={userDetails.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-full bg-[#2a4365] flex items-center justify-center text-white text-xs font-bold shrink-0">{userDetails.initials}</div>
            )}
            <span className="text-sm font-semibold text-[#2a4365] hidden sm:block max-w-[150px] text-left leading-tight break-words line-clamp-2">{userDetails.name}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link href="/firm-admin/profile" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <UserCheck className="w-4 h-4" /> Profile
              </Link>
              <Link href="/firm-admin/settings" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <div className="my-1 border-t border-gray-100" />
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
