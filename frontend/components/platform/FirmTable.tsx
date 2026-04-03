'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, MoreVertical, PauseCircle, Trash2, Eye, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

type Status = 'Active' | 'Suspended';

interface Firm {
  id: number;
  name: string;
  code: string;
  owner: string;
  users: number;
  cases: number;
  pending: number;
  paid: number;
  status: Status;
  joined: string;
}

const mockFirms: Firm[] = [
  { id: 1, name: 'Legal Experts LLP',   code: 'LE001', owner: 'Arjun Sharma',   users: 10, cases: 120, pending: 5000,  paid: 20000, status: 'Active',    joined: '12 Jan 2024' },
  { id: 2, name: 'Chen & Associates',   code: 'CA002', owner: 'Sarah Chen',     users: 7,  cases: 88,  pending: 12000, paid: 45000, status: 'Active',    joined: '3 Mar 2024'  },
  { id: 3, name: 'Torres Law Group',    code: 'TL003', owner: 'Michael Torres', users: 15, cases: 230, pending: 0,     paid: 78000, status: 'Active',    joined: '19 Apr 2024' },
  { id: 4, name: 'Davis Legal',         code: 'DL004', owner: 'Emily Davis',    users: 4,  cases: 42,  pending: 8000,  paid: 15000, status: 'Suspended', joined: '8 May 2024'  },
  { id: 5, name: 'Wright & Partners',   code: 'WP005', owner: 'James Wright',   users: 9,  cases: 67,  pending: 3200,  paid: 29000, status: 'Active',    joined: '22 Jun 2024' },
];

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

export default function FirmTable() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [firms, setFirms] = useState(mockFirms);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = firms.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.owner.toLowerCase().includes(query.toLowerCase()) ||
      f.code.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleStatus = (id: number) =>
    setFirms((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: f.status === 'Active' ? 'Suspended' : 'Active' } : f
      )
    );

  const deleteFirm = (id: number) => setFirms((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-[#0e2340]">Registered Firms</h2>
          <p className="text-xs text-gray-400 mt-0.5">{firms.length} firms total · {firms.filter(f => f.status === 'Active').length} active</p>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#f7f8fa] border border-gray-100 rounded-xl px-3 py-2 w-60">
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
              {['Sl. No', 'Firm', 'Code', 'Users', 'Cases', 'Pending', 'Paid', 'Status', 'Joined', 'View', ''].map((h) => (
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
                  {/* Firm name + owner */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0e2340] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {firm.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0e2340]">{firm.name}</p>
                        <p className="text-[11px] text-gray-400">{firm.owner}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {firm.code}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-gray-700">{firm.users}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700">{firm.cases}</td>

                  <td className="px-5 py-4">
                    <span className={`text-sm font-semibold ${firm.pending > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {fmt(firm.pending)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{fmt(firm.paid)}</td>

                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        firm.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-red-50 text-red-500 border border-red-100'
                      }`}
                    >
                      {firm.status === 'Active' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {firm.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-gray-400">{firm.joined}</td>

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
                        <button
                          onClick={() => { setOpenMenu(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                        </button>
                        <button
                          onClick={() => { toggleStatus(firm.id); setOpenMenu(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          {firm.status === 'Active' ? 'Suspend Firm' : 'Reactivate'}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={() => { deleteFirm(firm.id); setOpenMenu(null); }}
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
            className="w-10 h-7 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100"
          >
            Prev
          </button>
          <span className="px-2 text-xs font-semibold text-gray-500">
            {safePage} / {pageCount}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            className="w-10 h-7 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
