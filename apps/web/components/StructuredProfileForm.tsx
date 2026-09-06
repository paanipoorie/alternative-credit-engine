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
      <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF2FC] px-3 py-1 text-xs font-semibold text-[#1F4E8C] border border-[#BFDBFE]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Step 1 of 3 — Structured Financial Context
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#1F4E8C]">
              BUILD YOUR FINANCIAL PROFILE
            </h1>
            <p className="mt-2 text-sm text-[#5F6368] leading-relaxed">
              Tell us a little about your work, income, and household.
              We combine your declared context with optional observed evidence to assess reliability fairly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="flex items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-[#EBF2FC] px-3.5 py-2 text-xs font-bold text-[#1F4E8C] hover:bg-[#DCE9FA] transition shadow-2xs shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#1F4E8C]" />
            <span>Fill Demo (Rajesh Kumar)</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal / Basic */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#DDE3E0] pb-3">
            <User className="h-4 w-4 text-[#1F4E8C]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F4E8C]">
              Personal & Location Details
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Full Name as per ID
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition ${
                  errors.full_name ? 'border-rose-400 bg-rose-50/50' : 'border-[#DDE3E0] bg-white'
                }`}
              />
              {errors.full_name && <p className="mt-1 text-[11px] text-rose-600">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Age
              </label>
              <input
                type="number"
                min="18"
                max="75"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 28 })}
                className="w-full rounded-xl border border-[#DDE3E0] bg-white px-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                City / Town
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition ${
                  errors.city ? 'border-rose-400 bg-rose-50/50' : 'border-[#DDE3E0] bg-white'
                }`}
              />
              {errors.city && <p className="mt-1 text-[11px] text-rose-600">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 560038"
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition ${
                  errors.pincode ? 'border-rose-400 bg-rose-50/50' : 'border-[#DDE3E0] bg-white'
                }`}
              />
              {errors.pincode && <p className="mt-1 text-[11px] text-rose-600">{errors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Work & Income */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#DDE3E0] pb-3">
            <Briefcase className="h-4 w-4 text-[#0B9348]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B9348]">
              Work & Income Details
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#222222] mb-2">
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
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition ${
                      profile.employment_type === item.key
                        ? 'border-[#1F4E8C] bg-[#EBF2FC] text-[#1F4E8C] shadow-2xs font-bold'
                        : 'border-[#DDE3E0] bg-[#F7F9F8] text-[#5F6368] hover:bg-white hover:border-[#1F4E8C]/50'
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#222222]">{item.label}</span>
                    <span className="text-[10px] text-[#858585] mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#222222] mb-1.5">
                  Approximate Monthly Income (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#858585]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    placeholder="30000"
                    value={profile.monthly_income || ''}
                    onChange={(e) => setProfile({ ...profile, monthly_income: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#DDE3E0] bg-white pl-8 pr-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222222] mb-1.5">
                  Primary Income Channel
                </label>
                <select
                  value={profile.income_channel}
                  onChange={(e) => setProfile({ ...profile, income_channel: e.target.value as any })}
                  className="w-full rounded-xl border border-[#DDE3E0] bg-white px-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="cash">Cash / In-Person</option>
                  <option value="cheque">Cheque</option>
                  <option value="multiple">Multiple Channels</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Expenses & Dependents */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#DDE3E0] pb-3">
            <Home className="h-4 w-4 text-[#1F4E8C]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F4E8C]">
              Expenses & Household
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Approximate Monthly Expenses (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#858585]">
                  ₹
                </span>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="15000"
                  value={profile.monthly_expenses || ''}
                  onChange={(e) => setProfile({ ...profile, monthly_expenses: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#DDE3E0] bg-white pl-8 pr-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#858585]">
                Rent, fuel, groceries, utility bills, and loans
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Number of Dependents
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={profile.dependents}
                onChange={(e) => setProfile({ ...profile, dependents: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#DDE3E0] bg-white px-3.5 py-2.5 text-xs text-[#222222] focus:outline-hidden focus:ring-2 focus:ring-[#1F4E8C] transition"
              />
              <p className="mt-1 text-[11px] text-[#858585]">
                Family members financially reliant on your earnings
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-[#1F4E8C]">
              Step 1 Completed
            </h3>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Next: Strengthen your assessment with optional evidence (UPI, bills, gig payouts).
            </p>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0B9348] px-6 py-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#08783B] cursor-pointer"
          >
            <span>Continue to Evidence Step</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
