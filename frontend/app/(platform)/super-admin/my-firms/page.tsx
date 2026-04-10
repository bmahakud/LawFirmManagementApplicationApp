'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Plus, ArrowRight, MapPin, Loader2, Building2, Phone, Mail, Hash } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

interface Branch {
  id: string;
  branch_name: string;
  branch_code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone_number?: string;
  email?: string;
  is_active?: boolean;
  firm?: string;
  firm_name?: string;
  created_at?: string;
  updated_at?: string;
}

export default function MyFirmsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.FIRMS.BRANCHES.LIST);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || data.message || 'Failed to load branches');
        }
        const branchList = data.results || data;
        setBranches(Array.isArray(branchList) ? branchList : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load branches');
        console.error('Branch fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Firm – Branches</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Loading branches…' : `${branches.length} branch${branches.length !== 1 ? 'es' : ''} found`}
          </p>
        </div>
        <Link href="/super-admin/my-firms/new">
          <button className="bg-[#984c1f] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7a3b16] transition-colors text-sm font-semibold">
            <Plus className="w-4 h-4" />
            Add New Branch
          </button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#984c1f] animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading branches…</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-16 text-center">
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && branches.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400">No Branches Yet</h3>
          <p className="text-sm text-gray-300 mt-1 mb-6">Get started by creating your first branch.</p>
          <Link href="/super-admin/my-firms/new">
            <button className="bg-[#984c1f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#7a3b16] transition-colors inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add First Branch
            </button>
          </Link>
        </div>
      )}

      {/* Branch List */}
      {!loading && !error && branches.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-[#984c1f]">All Branches</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {branches.map((branch) => (
              <li key={branch.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#984c1f]/10 flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-[#984c1f]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#984c1f] transition-colors">
                      {branch.branch_name || `Branch`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                      {(branch.city || branch.state) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[branch.city, branch.state, branch.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {branch.address && !branch.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {branch.address}
                        </span>
                      )}
                      {branch.phone_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {branch.phone_number}
                        </span>
                      )}
                      {branch.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {branch.email}
                        </span>
                      )}
                      {branch.branch_code && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {branch.branch_code}
                        </span>
                      )}
                      {branch.is_active !== undefined && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          branch.is_active 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-red-50 text-red-500 border border-red-100'
                        }`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/super-admin/my-firms/${branch.id}/overview`}>
                  <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#984c1f] bg-[#984c1f]/5 rounded-lg hover:bg-[#984c1f]/10 transition-colors">
                    View
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">{branches.length} branch{branches.length !== 1 ? 'es' : ''} total</p>
          </div>
        </div>
      )}
    </div>
  );
}
