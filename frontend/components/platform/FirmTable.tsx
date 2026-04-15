'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, MoreVertical, PauseCircle, Trash2, Eye, CheckCircle2, XCircle, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

interface FirmAPI {
  id: string;
  firm_name: string;
  firm_code: string;
  city: string;
  state: string;
  country: string;
  address: string;
  postal_code: string;
  phone_number: string;
  email: string;
  website: string;
  subscription_type: string;
  is_active: boolean;
  branches: any[];
  created_at: string;
  updated_at: string;
}

export default function FirmTable() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [firms, setFirms] = useState<FirmAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.FIRMS.LIST);
        const data = await response.json();
        // Handle paginated response: { count, results }
        const firmsList = data.results || data;
        setFirms(Array.isArray(firmsList) ? firmsList : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load firms');
        console.error('Failed to fetch firms:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFirms();
  }, []);

  const filtered = firms.filter(
    (f) =>
      f.firm_name.toLowerCase().includes(query.toLowerCase()) ||
      f.email.toLowerCase().includes(query.toLowerCase()) ||
      f.firm_code.toLowerCase().includes(query.toLowerCase()) ||
      f.city.toLowerCase().includes(query.toLowerCase())
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0e2340] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading firms…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-16 text-center">
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-[#0e2340]">Registered Firms</h2>
          <p className="text-xs text-gray-400 mt-0.5">{firms.length} firms total · {firms.filter(f => f.is_active).length} active</p>
        </div>
        {/* Search */}
        <div className="flex w-full items-center gap-2 rounded-xl border border-gray-100 bg-[#f7f8fa] px-3 py-2 transition-[width] duration-300 sm:w-60 sm:focus-within:w-[45vw] lg:focus-within:w-[40rem]">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search firms…"
            className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-gray-100 bg-[#f7f8fa]">
              {['Sl. No', 'Firm', 'Code', 'City', 'Subscription', 'Status', 'Joined', 'View', ''].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-sm text-gray-400">
                  No firms match your search.
                </td>
              </tr>
            ) : (
              paged.map((firm, index) => (
                <tr key={firm.id} className="hover:bg-[#f7f8fa]/60 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                    {(safePage - 1) * pageSize + index + 1}
                  </td>
                  {/* Firm name + email */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0e2340] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {firm.firm_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0e2340]">{firm.firm_name}</p>
                        <p className="text-[11px] text-gray-400">{firm.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {firm.firm_code}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">{firm.city}, {firm.state}</td>

                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                      firm.subscription_type === 'premium' 
                        ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                        : firm.subscription_type === 'basic'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {firm.subscription_type}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        firm.is_active
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-red-50 text-red-500 border border-red-100'
                      }`}
                    >
                      {firm.is_active ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {firm.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-gray-400">{formatDate(firm.created_at)}</td>

                  <td className="px-5 py-4">
                    <Link
                      href={`${pathname}/${firm.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#0e2340] hover:bg-gray-50"
                    >
                      View
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === firm.id ? null : firm.id)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {openMenu === firm.id && (
                      <div className="absolute right-6 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/80 z-20 py-1 overflow-hidden">
                        <Link
                          href={`${pathname}/${firm.id}`}
                          onClick={() => setOpenMenu(null)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                        </Link>
                        <button
                          onClick={() => { setOpenMenu(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          {firm.is_active ? 'Suspend Firm' : 'Reactivate'}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={() => { setOpenMenu(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Firm
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-[#f7f8fa] flex items-center justify-between">
        <p className="text-xs text-gray-400">Showing {paged.length} of {filtered.length} firms</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
            className="w-10 h-7 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="px-2 text-xs font-semibold text-gray-500">
            {safePage} / {pageCount}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={safePage >= pageCount}
            className="w-10 h-7 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
