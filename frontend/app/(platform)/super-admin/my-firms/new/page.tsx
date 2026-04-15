'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

export default function AddNewFirmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingFirm, setFetchingFirm] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    const fetchMyFirm = async () => {
      try {
        const response = await customFetch(API.FIRMS.LIST);
        if (response.ok) {
          const data = await response.json();
          const firms = data.results || data;
          if (Array.isArray(firms) && firms.length > 0) {
            setFirmId(firms[0].id);
          } else {
            setError('Could not identify your firm. Please contact support.');
          }
        } else {
          setError('Failed to load firm context.');
        }
      } catch (err) {
        setError('An error occurred while loading your firm details.');
      } finally {
        setFetchingFirm(false);
      }
    };
    fetchMyFirm();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId) {
      setError('Firm association missing. Cannot create branch.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await customFetch(API.FIRMS.BRANCHES.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          firm: firmId,
        }),
      });

      if (response.ok) {
        router.push('/super-admin/my-firms');
      } else {
        const data = await response.json();
        setError(data.detail || data.message || 'Failed to create branch. Please check the fields.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'phone_number') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  if (fetchingFirm) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#984c1f] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Identifying firm context...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/super-admin/my-firms" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Firm Branch</h1>
          <p className="text-gray-500 mt-1 text-sm">Fill in the details to create a new branch for your firm.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.branch_name}
                onChange={(e) => updateField('branch_name', e.target.value)}
                placeholder="e.g. Downtown Branch" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400" 
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Code</label>
              <input 
                type="text" 
                value={formData.branch_code}
                onChange={(e) => updateField('branch_code', e.target.value)}
                placeholder="BR-001" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400" 
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Bhubaneswar" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400" 
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="Odisha" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400" 
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea 
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Full address of the new branch" 
                rows={3} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400"
              ></textarea>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="branch@example.com" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400" 
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
              <input 
                type="text" 
                value={formData.phone_number}
                onChange={(e) => updateField('phone_number', e.target.value)}
                maxLength={10}
                placeholder="9876543210" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all text-black font-semibold placeholder:text-gray-400" 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#984c1f] rounded-lg hover:bg-[#7a3b16] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
