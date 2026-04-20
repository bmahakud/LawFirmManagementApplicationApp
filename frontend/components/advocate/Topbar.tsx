'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Settings, UserCheck } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';

import { usePathname, useRouter } from 'next/navigation';
import { resolveRouteMeta } from '@/components/platform/route-meta';

const pageTitles = [
  { match: '/advocate/dashboard', title: 'Advocate Dashboard', sub: 'Manage your case files, drafts, and client meetings.' },
  { match: '/advocate/cases', title: 'Assigned Cases', sub: 'Review matter status, evidence, and next hearing tasks.' },
  { match: '/advocate/drafting', title: 'Drafting', sub: 'Prepare petitions, arguments, and revision-ready drafts.' },
  { match: '/advocate/calendar', title: 'Calendar', sub: 'Track hearings, deadlines, and court preparation tasks.' },
  { match: '/advocate/chat', title: 'Client Chat', sub: 'Manage direct client communication and case follow-ups.' },
  { match: '/advocate/settings', title: 'Security Settings', sub: 'Manage your password and account security.' },
  { match: '/advocate/profile', title: 'User Profile', sub: 'View and update your personal professional information.' },
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

  const [userDetails, setUserDetails] = useState<{ initials: string; name: string; avatarUrl: string | null }>({
    initials: 'AD', name: 'Advocate', avatarUrl: null
  });

  useEffect(() => {
    const syncProfile = () => {
      const detailsRaw = localStorage.getItem('user_details');
      if (detailsRaw) {
        try {
          const user = JSON.parse(detailsRaw);
          const first = user.first_name || '';
          const last = user.last_name || '';
          const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'AD';
          const name = first || last ? `${first} ${last}`.trim() : 'Advocate';
          
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
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 sticky top-0 z-30">
      <div>
        <h1 className="text-base font-bold text-[#4a1c40] leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{page.sub}</p>
      </div>
      <div className="flex items-center gap-2">
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
            {userDetails.avatarUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shrink-0">
                    <img src={userDetails.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-full bg-[#4a1c40] flex items-center justify-center text-white text-xs font-bold shrink-0">{userDetails.initials}</div>
            )}
            <span className="text-sm font-semibold text-[#4a1c40] hidden sm:block max-w-[150px] text-left leading-tight break-words line-clamp-2">{userDetails.name}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link href="/advocate/profile" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <UserCheck className="w-4 h-4" /> Profile
              </Link>
              <Link href="/advocate/settings" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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
