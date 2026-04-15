'use client';

import { useState, useEffect } from 'react';
import { PageSection, Panel, FormGrid, SplitPanels, AadharInput, PANInput, classNames } from '@/components/platform/ui';
import { ToggleLeft, ToggleRight, Loader2, Save, ChevronDown, Calendar, MapPin, Globe, User } from 'lucide-react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { ChangePasswordPanel } from '@/components/platform/page-templates';
import { Country, State, City } from 'country-state-city';

export default function PlatformOwnerSettingsPage() {
  const accent = "#0e2340";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [settings, setSettings] = useState({
    is_free_trial_enabled: true,
    trial_period_days: 15,
  });

  const [profile, setProfile] = useState({
    id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    gender: "",
    date_of_birth: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    aadhar_number: "",
    pan_number: "",
    username: "",
  });

  // For cascading logic: we store names/values in profile, but we need ISO codes for CSC
  const [isoCountry, setIsoCountry] = useState("");
  const [isoState, setIsoState] = useState("");

  const countries = Country.getAllCountries();
  const states = isoCountry ? State.getStatesOfCountry(isoCountry) : [];
  const cities = (isoCountry && isoState) ? City.getCitiesOfState(isoCountry, isoState) : [];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch Global Config
        const configRes = await customFetch(API.CONFIG.GET);
        if (configRes.ok) {
          const configData = await configRes.json();
          setSettings({
            is_free_trial_enabled: configData.is_free_trial_enabled,
            trial_period_days: configData.trial_period_days
          });
        }

        // 2. Fetch User Profile
        const userStr = localStorage.getItem('user_details');
        if (userStr) {
          const user = JSON.parse(userStr);
          const profileRes = await customFetch(API.USERS.DETAIL(user.id));
          if (profileRes.ok) {
            const data = await profileRes.json();
            setProfile({
              id: data.id,
              first_name: data.first_name || "",
              last_name: data.last_name || "",
              email: data.email || "",
              phone_number: data.phone_number || "",
              gender: data.gender || "",
              date_of_birth: data.date_of_birth || "",
              address_line_1: data.address_line_1 || "",
              address_line_2: data.address_line_2 || "",
              city: data.city || "",
              state: data.state || "",
              country: data.country || "",
              postal_code: data.postal_code || "",
              aadhar_number: data.aadhar_number || "",
              pan_number: data.pan_number || "",
              username: data.username || "",
            });

            // Map country name/code to ISO for CSC
            if (data.country) {
              const cMatch = countries.find(c => c.name === data.country || c.isoCode === data.country);
              if (cMatch) {
                setIsoCountry(cMatch.isoCode);
                if (data.state) {
                  const sMatch = State.getStatesOfCountry(cMatch.isoCode).find(s => s.name === data.state || s.isoCode === data.state);
                  if (sMatch) setIsoState(sMatch.isoCode);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
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

  const handleProfileUpdate = async () => {
    if (!profile.id) return;
    setProfileSaving(true);
    try {
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth || null,
        address_line_1: profile.address_line_1,
        address_line_2: profile.address_line_2,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        postal_code: profile.postal_code,
        aadhar_number: profile.aadhar_number || null,
        pan_number: profile.pan_number || null,
      };

      const response = await customFetch(API.USERS.DETAIL(profile.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        const errData = await response.json();
        alert(errData.detail || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("An error occurred while updating profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const updateProfileField = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'phone_number' || field === 'postal_code') {
      finalValue = value.replace(/\D/g, '');
      if (field === 'phone_number') finalValue = finalValue.slice(0, 10);
    }
    setProfile(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleCountryChange = (isoCode: string) => {
    setIsoCountry(isoCode);
    setIsoState("");
    const cName = countries.find(c => c.isoCode === isoCode)?.name || "";
    setProfile(p => ({ ...p, country: cName, state: "", city: "" }));
  };

  const handleStateChange = (isoCode: string) => {
    setIsoState(isoCode);
    const sName = states.find(s => s.isoCode === isoCode)?.name || "";
    setProfile(p => ({ ...p, state: sName, city: "" }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e2340]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-0">
      <PageSection
        eyebrow="Settings"
        title="Account Configuration"
        description="Manage your personal profile, platform account credentials, and resident identification."
      />

      <div className="max-w-5xl">
        <div className="space-y-8">
          <Panel title="Personal Identity" subtitle="Primary identification and demographic details.">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">First Name</label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={(e) => updateProfileField('first_name', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Last Name</label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={(e) => updateProfileField('last_name', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfileField('email', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                    <input
                      type="text"
                      value={profile.phone_number}
                      onChange={(e) => updateProfileField('phone_number', e.target.value)}
                      maxLength={10}
                      placeholder="9876543210"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gender</label>
                    <div className="relative group">
                      <select
                        value={profile.gender}
                        onChange={(e) => updateProfileField('gender', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 appearance-none text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Date of Birth</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                      <input
                        type="date"
                        value={profile.date_of_birth}
                        onChange={(e) => updateProfileField('date_of_birth', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
          </Panel>

          <Panel title="Verification Artifacts" subtitle="National ID components for platform compliance.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Aadhar Number</label>
                  <AadharInput
                    value={profile.aadhar_number}
                    onChange={(val) => setProfile(p => ({ ...p, aadhar_number: val }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">PAN Number</label>
                  <PANInput
                    value={profile.pan_number}
                    onChange={(val) => setProfile(p => ({ ...p, pan_number: val }))}
                  />
                </div>
              </div>
          </Panel>

          <Panel title="Location Details" subtitle="Official residence and correspondence address.">
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Address Line 1</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                    <input
                      type="text"
                      value={profile.address_line_1}
                      onChange={(e) => updateProfileField('address_line_1', e.target.value)}
                      placeholder="Street, suite, building..."
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Country</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0e2340] transition-colors" />
                      <select
                        value={isoCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 appearance-none text-sm font-bold text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">State / Province</label>
                    <div className="relative group">
                      <select
                        value={isoState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        disabled={!isoCountry}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 pr-10 appearance-none text-sm font-bold text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none disabled:opacity-50 font-semibold"
                      >
                        <option value="">Select State</option>
                        {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">City</label>
                    <div className="relative group">
                      <select
                        value={cities.some(c => c.name === profile.city) ? profile.city : (profile.city ? "Other" : "")}
                        onChange={(e) => updateProfileField('city', e.target.value === "Other" ? "" : e.target.value)}
                        disabled={!isoState}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 pr-10 appearance-none text-sm font-bold text-[#0e2340] focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none disabled:opacity-50 font-semibold"
                      >
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        <option value="Other">Other (Input Manual)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {(!cities.some(c => c.name === profile.city) || profile.city === "") && profile.state && isoState && (
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => updateProfileField('city', e.target.value)}
                        placeholder="Specify city name..."
                        className="mt-2 h-10 px-4 rounded-xl border border-gray-100 bg-gray-50/30 text-sm font-bold text-[#0e2340] focus:border-[#0e2340] outline-none animate-in slide-in-from-top-1"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Postal Code</label>
                    <input
                      type="text"
                      value={profile.postal_code}
                      onChange={(e) => updateProfileField('postal_code', e.target.value)}
                      placeholder="400001"
                      className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-gray-800 focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handleProfileUpdate}
                  disabled={profileSaving}
                  className="flex items-center gap-2 rounded-xl bg-[#0e2340] px-6 py-3 text-sm font-bold text-white hover:bg-[#15345d] transition-all shadow-lg shadow-[#0e2340]/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {profileSaving ? "Saving..." : "Update Identity Profile"}
                </button>
              </div>
          </Panel>

          <ChangePasswordPanel accent={accent} />

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
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Free Trial Period (Days)</label>
                      <div className="relative group">
                        <select
                          value={settings.trial_period_days}
                          onChange={(e) => setSettings(s => ({ ...s, trial_period_days: parseInt(e.target.value) || 15 }))}
                          className="w-full h-11 px-4 pr-10 rounded-xl border border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-800 appearance-none focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 transition-all outline-none"
                        >
                          <option value={0}>No Trial</option>
                          <option value={7}>7 Days</option>
                          <option value={15}>15 Days</option>
                          <option value={30}>30 Days</option>
                          <option value={60}>60 Days</option>
                          <option value={90}>90 Days</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
        </div>
      </div>
    </div>
  );
}
