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
        return 'bg-blue-50 text-[#1F4E8C] border-blue-200';
      case 'utility':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'gig_earnings':
        return 'bg-emerald-50 text-[#0B9348] border-emerald-200';
      case 'gst':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
      <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF2FC] px-3 py-1 text-xs font-semibold text-[#1F4E8C] border border-[#BFDBFE]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Step 2 of 3 — Optional Financial Evidence
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#1F4E8C]">
              STRENGTHEN YOUR FINANCIAL PROFILE
            </h1>
            <p className="mt-2 text-sm text-[#5F6368] leading-relaxed">
              Share any financial evidence you have. You don&apos;t need to provide everything.
              Our automated classification layer automatically detects and structures your documents.
            </p>
          </div>

          {/* Declared Context Tag */}
          <div className="rounded-xl border border-[#DDE3E0] bg-[#F7F9F8] p-3 text-xs text-[#5F6368] shrink-0">
            <div className="font-bold text-[#222222]">{declaredProfile.full_name || 'Applicant'}</div>
            <div className="capitalize mt-0.5">{declaredProfile.employment_type.replace('_', ' ')} • {declaredProfile.city}</div>
            <div className="text-[11px] text-[#0B9348] font-semibold mt-0.5">
              Declared: {formatCurrency(declaredProfile.monthly_income)}/mo
            </div>
          </div>
        </div>

        {/* Missing Evidence Principle Banner */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E8F6EE] px-4 py-2.5 text-xs text-[#08783B]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <strong>Fair Assessment Guarantee:</strong> Unprovided evidence categories reduce coverage and confidence, never your credit score.
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <div className="flex-1 font-medium">{uploadError}</div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs text-rose-600 underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categorized Evidence Upload Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Category 1: UPI / Bank Activity */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-[#1F4E8C]/60 transition">
          <div>
            <div className="flex items-center gap-2 text-[#1F4E8C]">
              <Smartphone className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#222222]">UPI & Bank Activity</h3>
            </div>
            <p className="mt-1 text-xs text-[#5F6368]">
              UPI transaction statements, passbook exports, or mini-statements showing cash-flow regularity.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#DDE3E0] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#1F4E8C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173D70] transition shadow-2xs"
            >
              Upload PDF / Image
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1.5 text-xs font-medium text-[#5F6368] hover:bg-white transition"
            >
              Upload CSV
            </button>
          </div>
        </div>

        {/* Category 2: Income / Work */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-[#0B9348]/60 transition">
          <div>
            <div className="flex items-center gap-2 text-[#0B9348]">
              <Briefcase className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#222222]">Income & Platform Work</h3>
            </div>
            <p className="mt-1 text-xs text-[#5F6368]">
              Zomato, Swiggy, Uber earnings summaries, contractor payouts, or salary slips proving income continuity.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#DDE3E0] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#0B9348] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#08783B] transition shadow-2xs"
            >
              Upload PDF / Image
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1.5 text-xs font-medium text-[#5F6368] hover:bg-white transition"
            >
              Upload CSV
            </button>
          </div>
        </div>

        {/* Category 3: Bills & Payments */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-amber-400 transition">
          <div>
            <div className="flex items-center gap-2 text-amber-600">
              <Receipt className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#222222]">Bills & Utility Payments</h3>
            </div>
            <p className="mt-1 text-xs text-[#5F6368]">
              Electricity (BESCOM, etc.), water, or gas receipts proving on-time payment discipline.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#DDE3E0] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#1F4E8C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173D70] transition shadow-2xs"
            >
              Upload PDF Receipt
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1.5 text-xs font-medium text-[#5F6368] hover:bg-white transition"
            >
              Upload Image
            </button>
          </div>
        </div>

        {/* Category 4: Business Activity */}
        <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-purple-400 transition">
          <div>
            <div className="flex items-center gap-2 text-purple-700">
              <Building className="h-5 w-5" />
              <h3 className="text-sm font-bold text-[#222222]">Business & Merchant Activity</h3>
            </div>
            <p className="mt-1 text-xs text-[#5F6368]">
              GST return summaries (GSTR-3B/1), POS reports, or merchant sales registers for business resilience.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#DDE3E0] pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#1F4E8C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173D70] transition shadow-2xs"
            >
              Upload GST PDF
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1.5 text-xs font-medium text-[#5F6368] hover:bg-white transition"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>

      {/* Universal Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed border-[#DDE3E0] bg-white p-6 sm:p-8 text-center cursor-pointer hover:border-[#1F4E8C] hover:bg-[#F7F9F8] transition"
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF2FC] text-[#1F4E8C]">
          <Plus className="h-5 w-5" />
        </div>
        <h4 className="mt-2 text-xs font-bold text-[#1F4E8C]">
          + Upload any other financial evidence (PDF, CSV, Excel, Image)
        </h4>
        <p className="text-[11px] text-[#5F6368] mt-0.5">
          We automatically classify the document and extract structured records.
        </p>
      </div>

      {/* Ingested Evidence List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F4E8C] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Currently Attached Evidence ({evidenceList.length})
          </h2>
          {evidenceList.length > 0 && (
            <span className="text-xs text-[#0B9348] font-semibold">
              Ready for behavioural analysis
            </span>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDE3E0] bg-white p-8 text-center text-xs text-[#858585]">
            No evidence attached yet. You can upload files above or proceed with your declared profile.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="relative flex flex-col justify-between rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs transition hover:shadow-md"
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
                    <span className="rounded-full bg-[#E8F6EE] px-2 py-0.5 text-[10px] font-bold text-[#0B9348]">
                      {ev.provenance.validation_status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-[#222222] truncate" title={ev.provenance.document_name}>
                    {ev.provenance.document_name}
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    {ev.source_provider}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#F7F9F8] p-2.5 text-xs text-[#5F6368]">
                    <div>
                      <span className="block text-[10px] text-[#858585] uppercase">Records</span>
                      <span className="font-semibold text-[#222222]">{ev.provenance.record_count}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#858585] uppercase">Confidence</span>
                      <span className="font-semibold text-[#0B9348]">
                        {Math.round(ev.extraction_confidence * 100)}%
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-[#858585] uppercase">Period</span>
                      <span className="font-medium text-[#222222]">
                        {ev.period_start} to {ev.period_end}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#DDE3E0] pt-3">
                  <button
                    type="button"
                    onClick={() => onEvidenceRemoved(ev.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectEvidence(ev)}
                    className="text-xs text-[#1F4E8C] hover:underline font-semibold flex items-center gap-1"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-[#DDE3E0] bg-white px-5 py-3 text-xs font-semibold text-[#5F6368] hover:bg-[#F7F9F8] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profile Form</span>
        </button>

        <button
          type="button"
          onClick={onStartAssessment}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0B9348] px-6 py-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#08783B]"
        >
          <span>Generate Alternative Credit Profile</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
