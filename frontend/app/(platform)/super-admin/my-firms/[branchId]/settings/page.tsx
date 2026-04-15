'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, RefreshCcw, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

export default function BranchSettingsPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    is_active: true,
  });

  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.FIRMS.BRANCHES.DETAIL(branchId));
        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
          setFormData({
            branch_name: data.branch_name || '',
            branch_code: data.branch_code || '',
            phone_number: data.phone_number || '',
            email: data.email || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            is_active: data.is_active ?? true,
          });
        } else {
          setError('Failed to load branch settings.');
        }
      } catch (err) {
        setError('A network error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await customFetch(API.FIRMS.BRANCHES.DETAIL(branchId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Branch settings updated successfully.');
        const updated = await response.json();
        setInitialData(updated);
      } else {
        const data = await response.json();
        setError(data.detail || data.message || 'Failed to update branch.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (initialData) {
      setFormData({
        branch_name: initialData.branch_name || '',
        branch_code: initialData.branch_code || '',
        phone_number: initialData.phone_number || '',
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        is_active: initialData.is_active ?? true,
      });
      setError('');
      setSuccess('');
    }
  };

  const updateField = (field: string, value: any) => {
    let finalValue = value;
    if (field === 'phone_number' && typeof value === 'string') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-gray-200 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[#984c1f]" />
        <p className="mt-4 text-sm text-gray-400 font-medium tracking-wide">Loading settings...</p>
      </div>
    );
  }

  const hasChanges = initialData && JSON.stringify(formData) !== JSON.stringify({
    branch_name: initialData.branch_name || '',
    branch_code: initialData.branch_code || '',
    phone_number: initialData.phone_number || '',
    email: initialData.email || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    is_active: initialData.is_active ?? true,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Branch Settings</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Update contact information, location, and operational status.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-600 font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
              Primary Identification
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Branch Name</label>
                <input 
                  type="text" 
                  value={formData.branch_name}
                  onChange={(e) => updateField('branch_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all font-semibold text-black"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Branch Code</label>
                <input 
                  type="text" 
                  value={formData.branch_code}
                  onChange={(e) => updateField('branch_code', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all font-semibold text-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Number</label>
                <input 
                  type="text" 
                  value={formData.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all font-semibold text-black"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider">
              Location & Logistics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="col-span-full">
                <textarea 
                  rows={3}
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all font-semibold resize-none text-black"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all font-semibold text-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">State</label>
                <input 
                  type="text" 
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all font-semibold text-black"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Availability</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <span className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Registry Status</span>
                <span className="block text-[10px] text-gray-500 font-medium mt-0.5">{formData.is_active ? 'Active on Platform' : 'Restricted Access'}</span>
              </div>
              <button 
                type="button" 
                onClick={() => updateField('is_active', !formData.is_active)}
                className="focus:outline-none transition-transform active:scale-95"
              >
                {formData.is_active ? (
                  <ToggleRight className="w-10 h-10 text-emerald-500" strokeWidth={1} />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-300" strokeWidth={1} />
                )}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
             <button 
               type="submit" 
               disabled={saving || !hasChanges}
               className="w-full py-3 bg-[#984c1f] text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
               {saving ? 'Saving changes...' : 'Save Settings'}
             </button>
             
             <button 
               type="button" 
               onClick={handleDiscard}
               disabled={saving || !hasChanges}
               className="w-full py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
             >
               <RefreshCcw className="w-4 h-4" />
               Discard
             </button>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
             <h3 className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wider">Danger Zone</h3>
             <p className="text-[10px] text-red-500 leading-normal mb-4">Deleting a branch is irreversible. All linked case associations will be orphaned.</p>
             <button 
               type="button"
               disabled={true}
               className="w-full py-2.5 bg-white text-red-500 border border-red-200 rounded-xl font-bold text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <Trash2 className="w-3.5 h-3.5" />
               DELETE BRANCH
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
