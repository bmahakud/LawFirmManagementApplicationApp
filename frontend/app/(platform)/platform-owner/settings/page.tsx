'use client';

import { useState, useEffect } from 'react';
import { Panel } from '@/components/platform/ui';
import { ToggleLeft, ToggleRight, Loader2, Save, ChevronDown } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { SettingsPageTemplate } from '@/components/platform/page-templates';

export default function PlatformOwnerSettingsPage() {
  const accent = "#0e2340";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    is_free_trial_enabled: true,
    trial_period_days: 15,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const configRes = await customFetch(API.CONFIG.GET);
        if (configRes.ok) {
          const configData = await configRes.json();
          setSettings({
            is_free_trial_enabled: configData.is_free_trial_enabled,
            trial_period_days: configData.trial_period_days
          });
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const response = await customFetch(API.CONFIG.UPDATE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_free_trial_enabled: settings.is_free_trial_enabled,
          trial_period_days: settings.trial_period_days
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          is_free_trial_enabled: data.is_free_trial_enabled,
          trial_period_days: data.trial_period_days
        });
        alert("Platform settings updated successfully!");
      } else {
        alert("Failed to update platform settings.");
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("An error occurred while updating settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e2340]" />
      </div>
    );
  }

  return (
    <SettingsPageTemplate
      accent={accent}
      title="Platform Settings"
      description="Manage account authentication and global platform rules."
      rightPanel={
        <Panel title="Law Firm Global Settings" subtitle="Configure system-wide defaults for onboarding law firms.">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Enable Free Trial Globally</h3>
                  <p className="text-xs text-gray-500 mt-1">If enabled, new law firms automatically receive the default trial plan.</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, is_free_trial_enabled: !s.is_free_trial_enabled }))}
                  className="text-[#0e2340] hover:opacity-80 transition-opacity"
                >
                  {settings.is_free_trial_enabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
                </button>
              </div>

              {settings.is_free_trial_enabled && (
                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Free Trial Period (Days)</label>
                    <div className="relative group">
                      <input
                        type="number"
                        min={0}
                        value={settings.trial_period_days}
                        onChange={(e) => setSettings(s => ({ ...s, trial_period_days: parseInt(e.target.value) || 0 }))}
                        className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#0e2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15345d] transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Global Rules"}
                </button>
              </div>
            </div>
        </Panel>
      }
    />
  );
}
