'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale, LayoutDashboard, Briefcase, FileText,
  Calendar, MessageSquare, LogOut, ChevronRight, CreditCard, Users, Link2, X, Copy, Loader2, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopbar } from '@/components/platform/TopbarContext';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

const navItems = [
  { label: 'Overview', path: '/client/dashboard', icon: LayoutDashboard },
  { label: 'My Cases', path: '/client/cases', icon: Briefcase },
  { label: 'Documents', path: '/client/documents', icon: FileText },
  { label: 'Hearings', path: '/client/calendar', icon: Calendar },
  { label: 'Invoices', path: '/client/invoices', icon: CreditCard },
  { label: 'Messages', path: '/client/messaging', icon: MessageSquare },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useTopbar();
  const isActive = (path: string) => pathname.startsWith(path);
  const [showJoinLinkModal, setShowJoinLinkModal] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [joinLink, setJoinLink] = useState<any>(null);

  const handleLogout = async () => {
    try {
      await customFetch(API.AUTH.LOGOUT, { method: 'POST' });
    } catch (e) {
      console.error('Logout failed on backend:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_details');
      router.push('/login');
    }
  };

  const handleCreateJoinLink = async () => {
    try {
      setCreatingLink(true);
      const payload = {
        user_type: 'client',
        max_uses: 0,
        expires_at: null
      };

      const response = await customFetch(API.JOIN_LINKS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setJoinLink(data);
        setShowJoinLinkModal(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create link');
      }
    } catch (err: any) {
      console.error('Error creating link:', err);
      alert('Failed to create join link');
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!joinLink) return;
    const fullUrl = `${window.location.origin}/join/${joinLink.id}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
  };

  const sidebarContent = (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1f2937] rounded-lg flex items-center justify-center shadow-md">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Client<span className="text-[#1f2937]">Portal</span>
          </span>
        </div>
        <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-3 lg:hidden">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            Client
          </span>
        </div>

        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} onClick={closeSidebar}>
              <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#1f2937]/10 text-[#1f2937]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1f2937]" />}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#1f2937]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#1f2937]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#1f2937]/40" />}
              </div>
            </Link>
          );
        })}

        {(isActive('/client/profile') || isActive('/client/settings')) && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <div className="px-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Account Context</span>
            </div>
            {[
              { label: 'Profile', path: '/client/profile', icon: Users },
              { label: 'Settings', path: '/client/settings', icon: Settings }
            ].map(({ label, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} href={path} onClick={closeSidebar}>
                  <div className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${active ? 'bg-[#1f2937]/10 text-[#1f2937]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-[#1f2937]" />}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#1f2937]/15' : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                        <Icon className={`w-4 h-4 ${active ? 'text-[#1f2937]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#1f2937]/40" />}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-gray-100 px-4 py-3">
        <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-500 hover:opacity-75 transition-opacity px-2">
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-64 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Link Modal */}
      {showJoinLinkModal && joinLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Join Link Created!</h2>
              <button onClick={() => setShowJoinLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#1f2937]/5 rounded-xl p-4 border border-[#1f2937]/10">
                <p className="text-sm font-semibold text-[#1f2937] mb-2">Share this link:</p>
                <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                  <p className="text-sm text-gray-600 break-all font-mono">{`${window.location.origin}/join/${joinLink.id}`}</p>
                </div>
                <button onClick={copyLinkToClipboard} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1f2937] text-white rounded-lg hover:bg-[#111827] transition-colors font-semibold">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">How to use:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the link above</li>
                  <li>Share it via email, WhatsApp, or SMS</li>
                  <li>New clients can register using this link</li>
                  <li>They will be automatically added to your firm</li>
                </ol>
              </div>
              <button onClick={() => setShowJoinLinkModal(false)} className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
