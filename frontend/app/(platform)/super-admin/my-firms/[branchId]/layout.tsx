'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { useTopbarTitle } from '@/components/platform/TopbarContext';

export default function BranchDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ branchId: string }>;
}) {
  const pathname = usePathname();
  const { branchId } = use(params);
  const basePath = `/super-admin/my-firms/${branchId}`;

  const [branchName, setBranchName] = useState('');

  // Fetch branch name so we can push it to the topbar
  useEffect(() => {
    if (!branchId) return;
    customFetch(API.FIRMS.BRANCHES.DETAIL(branchId))
      .then((r) => r.json())
      .then((data) => {
        if (data?.branch_name) setBranchName(data.branch_name);
      })
      .catch(() => {});
  }, [branchId]);

  // Push branch name into the shared topbar
  useTopbarTitle(branchName, 'Branch details and settings');

  const navItems = [
    { name: 'Overview', path: `${basePath}/overview` },
    { name: 'Advocates', path: `${basePath}/advocates` },
    { name: 'Paralegal', path: `${basePath}/paralegal` },
    { name: 'Clients', path: `${basePath}/clients` },
    { name: 'Settings', path: `${basePath}/settings` },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <Link href="/super-admin/my-firms" className="hover:text-gray-900 transition-colors">My Firms</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{branchName || 'Branch Details'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{branchName || 'Branch Dashboard'}</h1>

      {/* Top Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-[#984c1f] text-[#984c1f]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}

