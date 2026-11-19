'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, UserPlus, Loader2, AlertCircle, User, Scale, ArrowRight, IndianRupee, Sparkles } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

type AddMethod = 'manual' | 'link';

export default function AdvocateAddClientPage() {
  const router = useRouter();
  const [addMethod, setAddMethod] = useState<AddMethod>('manual');
  const [clientLink, setClientLink] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual form state including Legal Matter / CRM Lead details
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    brief_summary: '',
    // CRM Lead details
    create_lead: true,
    lead_title: '',
    lead_category: 'court_case',
    lead_case_type: 'Civil Suit',
    lead_opposing_party: '',
    lead_estimated_fee: '',
    lead_priority: 'medium',
    lead_source: 'walk_in',
  });

  useEffect(() => {
    if (addMethod === 'link') {
      fetchClientLink();
    }
  }, [addMethod]);

  const fetchClientLink = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customFetch(API.JOIN_LINKS.LIST);
      const data = await response.json();
      
      // Ensure data is an array
      const links = Array.isArray(data) ? data : (data.results || []);
      
      const activeClientLink = links.find((link: any) => 
        link.user_type === 'client' && link.is_active
      );
      
      setClientLink(activeClientLink);
    } catch (err: any) {
      setError(err.message || 'Failed to load link');
      console.error('Error fetching link:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      setCreating(true);
      setError(null);
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
        const newLink = await response.json();
        setClientLink(newLink);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.error || 'Failed to create link');
      }
    } catch (err: any) {
      console.error('Error creating link:', err);
      setError(err.message || 'Failed to create client link');
    } finally {
      setCreating(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!clientLink) return;
    const fullUrl = `${window.location.origin}/join/${clientLink.id}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await customFetch(API.CLIENTS.LIST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to add client');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Client Added & CRM Lead Created!</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
              A new contact profile and initial CRM intake lead have been generated in your pipeline. You can manage consultation stages or finalize directly into an official Case File.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push('/advocate/crm')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4a1c40] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#3a1530] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Open CRM Pipeline
            </button>
            <button
              onClick={() => router.push('/advocate/clients')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              View Clients List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#4a1c40]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-[#4a1c40]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Client</h1>
        <p className="text-gray-500">Choose how you want to add a client to your firm</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setAddMethod('manual')}
          className={`p-6 rounded-2xl border-2 transition-all ${
            addMethod === 'manual'
              ? 'border-[#4a1c40] bg-[#4a1c40]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <User className={`w-8 h-8 mx-auto mb-3 ${addMethod === 'manual' ? 'text-[#4a1c40]' : 'text-gray-400'}`} />
          <h3 className="font-bold text-gray-900 mb-1">Manual Entry</h3>
          <p className="text-sm text-gray-500">Fill in client details yourself</p>
        </button>

        <button
          onClick={() => setAddMethod('link')}
          className={`p-6 rounded-2xl border-2 transition-all ${
            addMethod === 'link'
              ? 'border-[#4a1c40] bg-[#4a1c40]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Link2 className={`w-8 h-8 mx-auto mb-3 ${addMethod === 'link' ? 'text-[#4a1c40]' : 'text-gray-400'}`} />
          <h3 className="font-bold text-gray-900 mb-1">Share Link</h3>
          <p className="text-sm text-gray-500">Let client register themselves</p>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {addMethod === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Client Information</h2>
          
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.address_line_1}
                onChange={(e) => updateField('address_line_1', e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line_2}
                onChange={(e) => updateField('address_line_2', e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all"
                  placeholder="400001"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Brief Case Summary
              </label>
              <textarea
                value={formData.brief_summary}
                onChange={(e) => updateField('brief_summary', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] focus:bg-white transition-all resize-none"
                placeholder="Brief description of the client's case..."
              />
            </div>

            {/* CRM Lead / Intake Section */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#4a1c40] flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Intake Matter & CRM Lead</h3>
                    <p className="text-xs text-gray-400">Creates an intake card on your CRM pipeline to track and convert into a Case File</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.create_lead}
                    onChange={(e) => updateField('create_lead', e.target.checked)}
                    className="w-4 h-4 rounded text-[#4a1c40] accent-[#4a1c40] cursor-pointer"
                  />
                  <span>Generate CRM Lead</span>
                </label>
              </div>

              {formData.create_lead && (
                <div className="space-y-4 bg-purple-50/40 border border-purple-100 p-5 rounded-2xl">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Matter / Inquiry Title
                      </label>
                      <input
                        type="text"
                        value={formData.lead_title}
                        onChange={(e) => updateField('lead_title', e.target.value)}
                        placeholder={formData.first_name ? `${formData.first_name}'s Legal Matter` : "e.g. Property Dispute with Tenant"}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Opposing Party / Respondent
                      </label>
                      <input
                        type="text"
                        value={formData.lead_opposing_party}
                        onChange={(e) => updateField('lead_opposing_party', e.target.value)}
                        placeholder="e.g. ABC Builder Ltd."
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Category
                      </label>
                      <select
                        value={formData.lead_category}
                        onChange={(e) => updateField('lead_category', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40]"
                      >
                        <option value="court_case">Court Case</option>
                        <option value="pre_litigation">Pre-Litigation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Estimated Fee (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          value={formData.lead_estimated_fee}
                          onChange={(e) => updateField('lead_estimated_fee', e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full h-11 pl-8 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.lead_priority}
                        onChange={(e) => updateField('lead_priority', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none focus:border-[#4a1c40]"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#4a1c40] text-white rounded-lg hover:bg-[#3a1530] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding Client...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Add Client
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/advocate/clients')}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addMethod === 'link' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#4a1c40] mx-auto mb-4" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : !clientLink ? (
            <div className="text-center py-8">
              <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Client Link Yet</h3>
              <p className="text-gray-500 mb-6">
                Create a shareable link that your clients can use to join your firm
              </p>
              <button
                onClick={handleCreateLink}
                disabled={creating}
                className="px-6 py-3 bg-[#4a1c40] text-white rounded-lg hover:bg-[#3a1530] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Create Client Link
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#4a1c40]/5 rounded-xl p-6 border border-[#4a1c40]/10">
                <h3 className="text-sm font-bold text-[#4a1c40] mb-3">Your Client Join Link</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <p className="text-sm text-gray-600 break-all font-mono">
                    {`${window.location.origin}/join/${clientLink.id}`}
                  </p>
                </div>
                <button
                  onClick={copyLinkToClipboard}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4a1c40] text-white rounded-lg hover:bg-[#3a1530] transition-colors font-semibold"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Total Uses:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {clientLink.usage_count} {clientLink.max_uses > 0 ? `/ ${clientLink.max_uses}` : '(Unlimited)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Status:</span>
                  <span className={`text-sm font-bold ${clientLink.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {clientLink.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">How to use:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the link above</li>
                  <li>Share it with your client via email, WhatsApp, or SMS</li>
                  <li>Client clicks the link and fills in their details</li>
                  <li>Client is automatically assigned to you</li>
                  <li>You can view them in "My Clients" section</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-2">✅ Manual Entry</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Immediate client creation</li>
            <li>• Full control over details</li>
            <li>• No waiting for client action</li>
            <li>• Best for in-person meetings</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-2">🔗 Share Link</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Client fills their own details</li>
            <li>• Reduces data entry errors</li>
            <li>• Trackable and secure</li>
            <li>• Best for remote onboarding</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
