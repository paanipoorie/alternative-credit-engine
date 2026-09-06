'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Receipt,
  Smartphone,
  Briefcase,
  Building,
  Plus,
} from 'lucide-react';
import { CanonicalEvidence, DeclaredProfile } from '../lib/types';
import { uploadEvidenceFile } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface EvidenceStrengthenViewProps {
  declaredProfile: DeclaredProfile;
  evidenceList: CanonicalEvidence[];
  onEvidenceAdded: (ev: CanonicalEvidence) => void;
  onEvidenceRemoved: (id: string) => void;
  onInspectEvidence: (ev: CanonicalEvidence) => void;
  onBack: () => void;
  onStartAssessment: () => void;
  onLoadSyntheticSample: (sampleFilename: string) => Promise<void>;
  isLoadingSample: boolean;
}

export const EvidenceStrengthenView: React.FC<EvidenceStrengthenViewProps> = ({
  declaredProfile,
  evidenceList,
  onEvidenceAdded,
  onEvidenceRemoved,
  onInspectEvidence,
  onBack,
  onStartAssessment,
  onLoadSyntheticSample,
  isLoadingSample,
}) => {
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploadingCategory('active');
    try {
      const ev = await uploadEvidenceFile(file);
      onEvidenceAdded(ev);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document');
    } finally {
      setUploadingCategory(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getSourceIconColor = (type: string) => {
    switch (type) {
      case 'upi':
        return 'bg-[#1E2C3D] text-[#7AB3EF] border-[#3D78C2]/40';
      case 'utility':
        return 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/40';
      case 'gig_earnings':
        return 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/40';
      case 'gst':
        return 'bg-[#2D1B36] text-[#D8B4FE] border-[#A855F7]/40';
      default:
        return 'bg-[#1D2125] text-[#A7AFB5] border-[#2B3035]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv,.png,.jpg,.jpeg,.xlsx"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* Intro & Declared Context Header */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1D2125] px-3 py-1 text-xs font-semibold text-[#7AB3EF] border border-[#2B3035]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Step 2 of 3 — Optional Financial Evidence
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F5F4]">
              STRENGTHEN YOUR FINANCIAL PROFILE
            </h1>
            <p className="mt-2 text-sm text-[#A7AFB5] leading-relaxed">
              Share any financial evidence you have. You don&apos;t need to provide everything.
              Our automated classification layer automatically detects and structures your documents.
            </p>
          </div>

          {/* Declared Context Tag */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-3 text-xs text-[#A7AFB5] shrink-0">
            <div className="font-bold text-[#F3F5F4]">{declaredProfile.full_name || 'Applicant'}</div>
            <div className="capitalize mt-0.5">{declaredProfile.employment_type.replace('_', ' ')} • {declaredProfile.city}</div>
            <div className="text-[11px] text-[#16A05A] font-semibold mt-0.5">
              Declared: {formatCurrency(declaredProfile.monthly_income)}/mo
            </div>
          </div>
        </div>

        {/* Missing Evidence Principle Banner */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#132E20] border border-[#16A05A]/40 px-4 py-2.5 text-xs text-[#4ADE80]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <strong>Fair Assessment Guarantee:</strong> Unprovided evidence categories reduce coverage and confidence, never your credit score.
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-900 bg-[#381818] p-4 text-xs text-rose-200 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <div className="flex-1 font-medium">{uploadError}</div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs text-rose-400 underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categorized Evidence Upload Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Category 1: UPI / Bank Activity */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs flex flex-col justify-between hover:border-[#3D78C2]/60 transition">
          <div>
            <div className="flex items-center gap-2 text-[#7AB3EF]">
              <Smartphone className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#F3F5F4]">UPI & Bank Activity</h3>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              UPI transaction statements, passbook exports, or mini-statements showing cash-flow regularity.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#2B3035] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#3D78C2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2A5A96] transition shadow-2xs cursor-pointer"
            >
              Upload PDF / Image
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1.5 text-xs font-medium text-[#A7AFB5] hover:bg-[#24292E] hover:text-[#F3F5F4] transition cursor-pointer"
            >
              Upload CSV
            </button>
          </div>
        </div>

        {/* Category 2: Income / Work */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs flex flex-col justify-between hover:border-[#16A05A]/60 transition">
          <div>
            <div className="flex items-center gap-2 text-[#4ADE80]">
              <Briefcase className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#F3F5F4]">Income & Platform Work</h3>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              Zomato, Swiggy, Uber earnings summaries, contractor payouts, or salary slips proving income continuity.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#2B3035] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#16A05A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#08783B] transition shadow-2xs cursor-pointer"
            >
              Upload PDF / Image
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1.5 text-xs font-medium text-[#A7AFB5] hover:bg-[#24292E] hover:text-[#F3F5F4] transition cursor-pointer"
            >
              Upload CSV
            </button>
          </div>
        </div>

        {/* Category 3: Bills & Payments */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs flex flex-col justify-between hover:border-[#D89A24]/60 transition">
          <div>
            <div className="flex items-center gap-2 text-[#FBBF24]">
              <Receipt className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#F3F5F4]">Bills & Utility Payments</h3>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              Electricity (BESCOM, etc.), water, or gas receipts proving on-time payment discipline.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#2B3035] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#3D78C2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2A5A96] transition shadow-2xs cursor-pointer"
            >
              Upload PDF Receipt
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1.5 text-xs font-medium text-[#A7AFB5] hover:bg-[#24292E] hover:text-[#F3F5F4] transition cursor-pointer"
            >
              Upload Image
            </button>
          </div>
        </div>

        {/* Category 4: Business Activity */}
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs flex flex-col justify-between hover:border-purple-400/60 transition">
          <div>
            <div className="flex items-center gap-2 text-purple-400">
              <Building className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#F3F5F4]">Business & Merchant Activity</h3>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              GST return summaries (GSTR-3B/1), POS reports, or merchant sales registers for business resilience.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#2B3035] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#3D78C2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2A5A96] transition shadow-2xs cursor-pointer"
            >
              Upload GST PDF
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1.5 text-xs font-medium text-[#A7AFB5] hover:bg-[#24292E] hover:text-[#F3F5F4] transition cursor-pointer"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>

      {/* Universal Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 text-center cursor-pointer hover:border-[#3D78C2] hover:bg-[#1D2125] transition"
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1E2C3D] text-[#7AB3EF]">
          <Plus className="h-5 w-5" />
        </div>
        <h4 className="mt-2 text-xs font-bold text-[#7AB3EF]">
          + Upload any other financial evidence (PDF, CSV, Excel, Image)
        </h4>
        <p className="text-[11px] text-[#A7AFB5] mt-0.5">
          We automatically classify the document and extract structured records.
        </p>
      </div>

      {/* Ingested Evidence List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#7AB3EF] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Currently Attached Evidence ({evidenceList.length})
          </h2>
          {evidenceList.length > 0 && (
            <span className="text-xs text-[#4ADE80] font-semibold">
              Ready for behavioural analysis
            </span>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2B3035] bg-[#171A1D] p-8 text-center text-xs text-[#737C83]">
            No evidence attached yet. You can upload files above or proceed with your declared profile.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="relative flex flex-col justify-between rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs transition hover:border-[#3D78C2]/50 hover:bg-[#1D2125]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSourceIconColor(
                        ev.source_type
                      )}`}
                    >
                      {ev.source_type === 'upi' && '✓ UPI Statement'}
                      {ev.source_type === 'utility' && '✓ Utility Bill'}
                      {ev.source_type === 'gig_earnings' && '✓ Gig Earnings'}
                      {ev.source_type === 'gst' && '✓ GST Return'}
                      {ev.source_type === 'telecom' && '✓ Telecom Record'}
                    </span>
                    <span className="rounded-full bg-[#132E20] px-2 py-0.5 text-[10px] font-bold text-[#4ADE80] border border-[#16A05A]/30">
                      {ev.provenance.validation_status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded font-bold ${
                      ev.provenance.origin === 'LIVE_N8N_GEMINI' || ev.provenance.origin === 'LIVE_GEMINI' || ev.provenance.origin === 'LIVE_PARSER' || ev.origin === 'LIVE_PARSER'
                        ? 'bg-[#132E20] text-[#4ADE80] border border-[#16A05A]/30'
                        : 'bg-[#1D2125] text-[#A7AFB5] border border-[#2B3035]'
                    }`}>
                      {ev.provenance.origin === 'LIVE_N8N_GEMINI' && '⚡ LIVE (n8n + Gemini)'}
                      {ev.provenance.origin === 'LIVE_GEMINI' && '⚡ LIVE (Gemini AI)'}
                      {(ev.provenance.origin === 'LIVE_PARSER' || ev.origin === 'LIVE_PARSER') && '⚡ LIVE (Extracted)'}
                      {(!ev.provenance.origin || ev.provenance.origin === 'SYNTHETIC_DEMO') && ev.origin !== 'LIVE_PARSER' && '📊 DEMO BENCHMARK'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-[#F3F5F4] truncate" title={ev.provenance.document_name}>
                    {ev.provenance.document_name}
                  </h3>
                  <p className="text-xs text-[#A7AFB5] mt-0.5">
                    {ev.source_provider}
                  </p>

                  {/* Processing Pipeline Completed Verification */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#4ADE80]">
                    <span className="inline-flex items-center gap-0.5 rounded bg-[#132E20]/80 px-1.5 py-0.5 border border-[#16A05A]/20">
                      ✓ Identified
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded bg-[#132E20]/80 px-1.5 py-0.5 border border-[#16A05A]/20">
                      ✓ Extracted
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded bg-[#132E20]/80 px-1.5 py-0.5 border border-[#16A05A]/20">
                      ✓ Validated
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#1D2125] p-2.5 text-xs text-[#A7AFB5] border border-[#2B3035]">
                    <div>
                      <span className="block text-[10px] text-[#737C83] uppercase">Records</span>
                      <span className="font-semibold text-[#F3F5F4]">{ev.provenance.record_count}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#737C83] uppercase">Confidence</span>
                      <span className="font-semibold text-[#4ADE80]">
                        {Math.round(ev.extraction_confidence * 100)}%
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-[#737C83] uppercase">Period</span>
                      <span className="font-medium text-[#F3F5F4]">
                        {ev.period_start} to {ev.period_end}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#2B3035] pt-3">
                  <button
                    type="button"
                    onClick={() => onEvidenceRemoved(ev.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectEvidence(ev)}
                    className="text-xs text-[#7AB3EF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Records
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-[#2B3035] bg-[#1D2125] px-5 py-3 text-xs font-semibold text-[#A7AFB5] hover:bg-[#24292E] hover:text-[#F3F5F4] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profile Form</span>
        </button>

        <button
          type="button"
          onClick={onStartAssessment}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#16A05A] px-6 py-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#08783B] cursor-pointer"
        >
          <span>Generate Alternative Credit Profile</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
