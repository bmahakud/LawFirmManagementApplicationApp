'use client';

import { useState } from 'react';
import { PageSection, Panel, FormGrid, SplitPanels } from '@/components/platform/ui';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function PlatformOwnerSettingsPage() {
  const accent = "#0e2340";
  const [trialEnabled, setTrialEnabled] = useState(true);

  return (
    <div className="space-y-8 p-0">
      <PageSection 
        eyebrow="Settings" 
        title="Platform Configuration" 
        description="Manage your personal profile, platform account credentials, and global law firm trial rules." 
      />
      
      <SplitPanels
        left={
          <div className="space-y-8">
            <Panel title="Personal Information" subtitle="Your basic details and contact preferences.">
              <FormGrid
                fields={[
                  { label: 'Full Name', placeholder: 'Platform Admin' },
                  { label: 'Email Address', placeholder: 'admin@platform.com', type: 'email' },
                  { label: 'Phone Number', placeholder: '+91 9876543210' },
                ]}
                columns={2}
              />
            </Panel>

            <Panel title="Account Information" subtitle="Manage your security schema and platform credentials.">
              <FormGrid
                fields={[
                  { label: 'Username', placeholder: 'platform_owner1' },
                  { label: 'Password', placeholder: '********', type: 'password' },
                  { label: '2FA Status', placeholder: 'Enabled (Authenticator App)' },
                ]}
                columns={2}
              />
            </Panel>
            
            <Panel title="Law Firm Global Settings" subtitle="Configure system-wide defaults for onboarding law firms.">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Enable Free Trial Globally</h3>
                    <p className="text-xs text-gray-500 mt-1">If enabled, new law firms automatically receive the default trial plan.</p>
                  </div>
                  <button 
                    onClick={() => setTrialEnabled(!trialEnabled)}
                    className="text-[#0e2340] hover:opacity-80 transition-opacity"
                  >
                    {trialEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
                  </button>
                </div>

                {trialEnabled && (
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Free Trial Period (Days)</label>
                      <input 
                        type="number" 
                        defaultValue={14} 
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e2340]/20 focus:border-[#0e2340] placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <div className="flex justify-end pt-2">
              <button className="rounded-xl bg-[#0e2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15345d] transition-colors shadow-sm">
                Save Platform Settings
              </button>
            </div>
          </div>
        }
        right={
          <Panel title="Configuration Logs" subtitle="Internal audit trail of settings modifications.">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-[#f7f8fa]">
                <p className="text-sm text-gray-700"><strong>Free Trial Enabled</strong></p>
                <p className="text-xs text-gray-500 mt-1">Modified by Admin - 12 days ago</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-[#f7f8fa]">
                <p className="text-sm text-gray-700"><strong>Trial Days updated to 14</strong></p>
                <p className="text-xs text-gray-500 mt-1">Modified by Admin - 45 days ago</p>
              </div>
            </div>
          </Panel>
        }
      />
    </div>
  );
}
