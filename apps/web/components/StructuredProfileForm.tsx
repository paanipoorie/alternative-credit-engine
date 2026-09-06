'use client';

import React, { useState } from 'react';
import {
  User,
  Briefcase,
  Wallet,
  Home,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Users,
} from 'lucide-react';
import { DeclaredProfile } from '../lib/types';

interface StructuredProfileFormProps {
  initialProfile?: DeclaredProfile;
  onContinue: (profile: DeclaredProfile) => void;
}

const DEFAULT_DEMO: DeclaredProfile = {
  full_name: 'Rajesh Kumar',
  age: 29,
  city: 'Bengaluru',
  pincode: '560038',
  employment_type: 'gig_worker',
  monthly_income: 32000,
  income_channel: 'upi',
  monthly_expenses: 16500,
  dependents: 2,
};

export const StructuredProfileForm: React.FC<StructuredProfileFormProps> = ({
  initialProfile,
  onContinue,
}) => {
  const [profile, setProfile] = useState<DeclaredProfile>(
    initialProfile || {
      full_name: '',
      age: 28,
      city: '',
      pincode: '',
      employment_type: 'gig_worker',
      monthly_income: 30000,
      income_channel: 'upi',
      monthly_expenses: 15000,
      dependents: 1,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!profile.full_name.trim()) errs.full_name = 'Full name is required';
    if (!profile.city.trim()) errs.city = 'City is required';
    if (!profile.pincode.trim() || profile.pincode.length < 6) errs.pincode = 'Valid 6-digit PIN code required';
    if (profile.monthly_income <= 0) errs.monthly_income = 'Monthly income must be greater than 0';
    if (profile.monthly_expenses < 0) errs.monthly_expenses = 'Expenses cannot be negative';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onContinue(profile);
    }
  };

  const handleFillDemo = () => {
    setProfile(DEFAULT_DEMO);
    setErrors({});
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Intro Header */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1D2125] px-3 py-1 text-xs font-semibold text-[#7AB3EF] border border-[#2B3035]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Step 1 of 3 — Structured Financial Context
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F5F4]">
              BUILD YOUR FINANCIAL PROFILE
            </h1>
            <p className="mt-2 text-sm text-[#A7AFB5] leading-relaxed">
              Tell us a little about your work, income, and household.
              We combine your declared context with optional observed evidence to assess reliability fairly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="flex items-center gap-1.5 rounded-xl border border-[#2B3035] bg-[#1D2125] px-3.5 py-2 text-xs font-bold text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition shadow-2xs shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#3D78C2]" />
            <span>Fill Demo (Rajesh Kumar)</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal / Basic */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2B3035] pb-3">
            <User className="h-4 w-4 text-[#3D78C2]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D78C2]">
              Personal & Location Details
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                Full Name as per ID
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 transition ${
                  errors.full_name ? 'border-rose-500 bg-rose-950/30' : 'border-[#2B3035] bg-[#1D2125] focus:border-[#3D78C2]'
                }`}
              />
              {errors.full_name && <p className="mt-1 text-[11px] text-rose-400">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                Age
              </label>
              <input
                type="number"
                min="18"
                max="75"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 28 })}
                className="w-full rounded-xl border border-[#2B3035] bg-[#1D2125] px-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 focus:border-[#3D78C2] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                City / Town
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 transition ${
                  errors.city ? 'border-rose-500 bg-rose-950/30' : 'border-[#2B3035] bg-[#1D2125] focus:border-[#3D78C2]'
                }`}
              />
              {errors.city && <p className="mt-1 text-[11px] text-rose-400">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 560038"
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 transition ${
                  errors.pincode ? 'border-rose-500 bg-rose-950/30' : 'border-[#2B3035] bg-[#1D2125] focus:border-[#3D78C2]'
                }`}
              />
              {errors.pincode && <p className="mt-1 text-[11px] text-rose-400">{errors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Work & Income */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2B3035] pb-3">
            <Briefcase className="h-4 w-4 text-[#16A05A]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#16A05A]">
              Work & Income Details
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#F3F5F4] mb-2">
                Employment / Income Type
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { key: 'gig_worker', label: 'Gig / Platform Worker', sub: 'Delivery, cab, freelance' },
                  { key: 'self_employed', label: 'Self-Employed', sub: 'Trades, micro-services' },
                  { key: 'salaried', label: 'Salaried', sub: 'Formal / contract salary' },
                  { key: 'business_owner', label: 'Business / Merchant', sub: 'Retail shop, vendor' },
                  { key: 'informal', label: 'Informal / Cash-Based', sub: 'Daily/weekly wages' },
                  { key: 'other', label: 'Other', sub: 'Multiple / seasonal sources' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setProfile({ ...profile, employment_type: item.key as any })}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition cursor-pointer ${
                      profile.employment_type === item.key
                        ? 'border-[#3D78C2] bg-[#1E2C3D] text-[#F3F5F4] shadow-2xs font-bold'
                        : 'border-[#2B3035] bg-[#1D2125] text-[#A7AFB5] hover:bg-[#24292E] hover:border-[#3D78C2]/40'
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#F3F5F4]">{item.label}</span>
                    <span className="text-[10px] text-[#737C83] mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                  Approximate Monthly Income (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#737C83]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    placeholder="30000"
                    value={profile.monthly_income || ''}
                    onChange={(e) => setProfile({ ...profile, monthly_income: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#2B3035] bg-[#1D2125] pl-8 pr-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 focus:border-[#3D78C2] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                  Primary Income Channel
                </label>
                <select
                  value={profile.income_channel}
                  onChange={(e) => setProfile({ ...profile, income_channel: e.target.value as any })}
                  className="w-full rounded-xl border border-[#2B3035] bg-[#1D2125] px-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 focus:border-[#3D78C2] transition"
                >
                  <option value="upi" className="bg-[#171A1D] text-[#F3F5F4]">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                  <option value="bank_transfer" className="bg-[#171A1D] text-[#F3F5F4]">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="cash" className="bg-[#171A1D] text-[#F3F5F4]">Cash / In-Person</option>
                  <option value="cheque" className="bg-[#171A1D] text-[#F3F5F4]">Cheque</option>
                  <option value="multiple" className="bg-[#171A1D] text-[#F3F5F4]">Multiple Channels</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Expenses & Dependents */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2B3035] pb-3">
            <Home className="h-4 w-4 text-[#3D78C2]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D78C2]">
              Expenses & Household
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                Approximate Monthly Expenses (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#737C83]">
                  ₹
                </span>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="15000"
                  value={profile.monthly_expenses || ''}
                  onChange={(e) => setProfile({ ...profile, monthly_expenses: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#2B3035] bg-[#1D2125] pl-8 pr-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 focus:border-[#3D78C2] transition"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#737C83]">
                Rent, fuel, groceries, utility bills, and loans
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F3F5F4] mb-1.5">
                Number of Dependents
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={profile.dependents}
                onChange={(e) => setProfile({ ...profile, dependents: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#2B3035] bg-[#1D2125] px-3.5 py-2.5 text-xs text-[#F3F5F4] focus:outline-hidden focus:ring-2 focus:ring-[#3D78C2]/40 focus:border-[#3D78C2] transition"
              />
              <p className="mt-1 text-[11px] text-[#737C83]">
                Family members financially reliant on your earnings
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-[#F3F5F4]">
              Step 1 Completed
            </h3>
            <p className="text-xs text-[#A7AFB5] mt-0.5">
              Next: Strengthen your assessment with optional evidence (UPI, bills, gig payouts).
            </p>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#16A05A] px-6 py-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#08783B] cursor-pointer"
          >
            <span>Continue to Evidence Step</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
