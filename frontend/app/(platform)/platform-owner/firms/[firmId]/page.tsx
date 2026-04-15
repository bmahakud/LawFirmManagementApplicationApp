'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Users, Briefcase, FileSignature, Shield, ArrowLeft,
  Edit, Save, X, Calendar, DollarSign, Download, Clock, Loader2,
  Mail, Phone, MapPin, Globe, Hash
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { useTopbarTitle } from '@/components/platform/TopbarContext';

const BRAND = '#0e2340';

interface FirmDetail {
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: 'inherit' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || BRAND, margin: '2px 0' }}>
          <span style={{ color: '#64748b' }}>{p.name}: </span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function PlatformOwnerFirmOverviewPage({
  params,
}: {
  params: Promise<{ firmId: string }>;
}) {
  const { firmId } = use(params);

  const [activeTab, setActiveTab] = useState<'Overview' | 'Billing' | 'Settings'>('Overview');
  const [firm, setFirm] = useState<FirmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Push firm name into the topbar dynamically once loaded
  useTopbarTitle(
    firm?.firm_name ?? '',
    firm ? `Law Firm · ${firm.is_active ? 'Active' : 'Inactive'}` : '',
  );

  // Editable state for Settings tab
  const [editedDetails, setEditedDetails] = useState({
    firm_name: '',
    email: '',
    phone_number: '',
    subscription_type: '',
    is_active: true,
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });

  useEffect(() => {
    const fetchFirm = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.FIRMS.DETAIL(firmId));
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || data.message || 'Failed to load firm details');
        }
        setFirm(data);
        setEditedDetails({
          firm_name: data.firm_name,
          email: data.email,
          phone_number: data.phone_number,
          subscription_type: data.subscription_type,
          is_active: data.is_active,
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'India',
          postal_code: data.postal_code || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load firm details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFirm();
  }, [firmId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await customFetch(API.FIRMS.DETAIL(firmId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDetails),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to update firm details');
      }
      setFirm(data);
      alert('Firm details updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update firm details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#0e2340] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading firm details…</p>
      </div>
    );
  }

  if (error || !firm) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Link href="/platform-owner/firms" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Firms
        </Link>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-16 text-center">
          <p className="text-sm text-red-500 font-medium">{error || 'Firm not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link href="/platform-owner/firms" className="p-2 mt-1 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-w-[320px]">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{firm.firm_name}</h1>
              </div>
              <p className="text-gray-500 text-sm mt-1 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${firm.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                {firm.is_active ? 'Active' : 'Inactive'} Firm · <span className="font-mono text-xs">{firm.firm_code}</span>
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-500">Email:</span>
                  <span className="text-gray-900">{firm.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-500">Phone:</span>
                  <span className="text-gray-900">{firm.phone_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-500">Location:</span>
                  <span className="text-gray-900">{firm.city}, {firm.state}, {firm.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-500">Postal:</span>
                  <span className="text-gray-900">{firm.postal_code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm h-fit">
          <button
            onClick={() => setActiveTab('Overview')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Overview' ? 'bg-[#0e2340] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('Billing')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Billing' ? 'bg-[#0e2340] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab('Settings')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'Settings' ? 'bg-[#0e2340] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Settings
          </button>
        </div>
      </div>

      <hr className="border-gray-200 my-4" />

      {/* ── CONTENT RENDERING ── */}
      {activeTab === 'Overview' ? (
        <div className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Subscription', value: firm.subscription_type, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100', capitalize: true },
              { label: 'Branches', value: firm.branches.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
              { label: 'Created', value: formatDate(firm.created_at), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'Status', value: firm.is_active ? 'Active' : 'Inactive', icon: Shield, color: firm.is_active ? 'text-emerald-600' : 'text-red-600', bg: firm.is_active ? 'bg-emerald-100' : 'bg-red-100' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-gray-200 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold text-gray-900 ${stat.capitalize ? 'capitalize' : ''}`}>
                      {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Firm Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
              {[
                { label: 'Firm Name', value: firm.firm_name },
                { label: 'Firm Code', value: firm.firm_code },
                { label: 'Email', value: firm.email },
                { label: 'Phone', value: firm.phone_number },
                { label: 'Address', value: firm.address },
                { label: 'City', value: firm.city },
                { label: 'State', value: firm.state },
                { label: 'Country', value: firm.country },
                { label: 'Postal Code', value: firm.postal_code },
                { label: 'Website', value: firm.website || '—' },
                { label: 'Subscription', value: firm.subscription_type },
                { label: 'Last Updated', value: formatDate(firm.updated_at) },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm font-semibold text-gray-400">{item.label}</span>
                  <span className="text-sm text-gray-800 capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Branches */}
          {firm.branches.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Branches ({firm.branches.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {firm.branches.map((branch: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    <p className="font-semibold text-sm text-[#0e2340]">{branch.branch_name || `Branch ${idx + 1}`}</p>
                    <p className="text-xs text-gray-400 mt-1">{branch.city || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'Billing' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Billing Coming Soon</h3>
            <p className="text-sm text-gray-300 mt-1">Billing and invoice data will be available when the backend endpoint is ready.</p>
          </div>
        </div>
      ) : activeTab === 'Settings' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Edit className="w-5 h-5 text-gray-400" /> Edit Firm Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Update the core contact identity and metadata for this law firm.</p>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Firm Name</label>
                <input
                  type="text"
                  value={editedDetails.firm_name}
                  onChange={(e) => setEditedDetails({ ...editedDetails, firm_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                <input
                  type="text"
                  value={editedDetails.website}
                  onChange={(e) => setEditedDetails({ ...editedDetails, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={editedDetails.email}
                  onChange={(e) => setEditedDetails({ ...editedDetails, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editedDetails.phone_number}
                  onChange={(e) => setEditedDetails({ ...editedDetails, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Office Address</label>
              <textarea
                rows={2}
                value={editedDetails.address}
                onChange={(e) => setEditedDetails({ ...editedDetails, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={editedDetails.city}
                  onChange={(e) => setEditedDetails({ ...editedDetails, city: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                <input
                  type="text"
                  value={editedDetails.state}
                  onChange={(e) => setEditedDetails({ ...editedDetails, state: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                <input
                  type="text"
                  value={editedDetails.country}
                  onChange={(e) => setEditedDetails({ ...editedDetails, country: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Postal Code</label>
                <input
                  type="text"
                  value={editedDetails.postal_code}
                  onChange={(e) => setEditedDetails({ ...editedDetails, postal_code: e.target.value.replace(/\D/g, '') })}
                  placeholder="400001"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subscription Plan</label>
                <select
                  value={editedDetails.subscription_type}
                  onChange={(e) => setEditedDetails({ ...editedDetails, subscription_type: e.target.value })}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] focus:bg-white"
                >
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => setEditedDetails({ ...editedDetails, is_active: !editedDetails.is_active })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${editedDetails.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editedDetails.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-sm font-semibold ${editedDetails.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {editedDetails.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setEditedDetails({
                  firm_name: firm.firm_name,
                  email: firm.email,
                  phone_number: firm.phone_number,
                  subscription_type: firm.subscription_type,
                  is_active: firm.is_active,
                  website: firm.website || '',
                  address: firm.address || '',
                  city: firm.city || '',
                  state: firm.state || '',
                  country: firm.country || 'India',
                  postal_code: firm.postal_code || '',
                })}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0e2340] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
