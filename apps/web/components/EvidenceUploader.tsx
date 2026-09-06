'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { CanonicalEvidence } from '../lib/types';
import { uploadEvidenceFile } from '../lib/api';

interface EvidenceUploaderProps {
  evidenceList: CanonicalEvidence[];
  onEvidenceAdded: (ev: CanonicalEvidence) => void;
  onEvidenceRemoved: (id: string) => void;
  onStartAssessment: () => void;
  onLoadSyntheticSample: (sampleFilename: string) => Promise<void>;
  isLoadingSample: boolean;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  evidenceList,
  onEvidenceAdded,
  onEvidenceRemoved,
  onStartAssessment,
  onLoadSyntheticSample,
  isLoadingSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const ev = await uploadEvidenceFile(file);
      onEvidenceAdded(ev);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
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
    <div className="space-y-8">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1D2125] px-3 py-1 text-xs font-semibold text-[#7AB3EF] border border-[#2B3035]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Milestone 3 — Evidence Ingestion Engine
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F5F4]">
            BUILD YOUR FINANCIAL PROFILE
          </h1>
          <p className="mt-2 text-sm text-[#A7AFB5] leading-relaxed">
            Share evidence that can help us assess your financial reliability.
            Our automated classification engine reads UPI statements, utility receipts, and gig earnings without manual tagging.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#4ADE80]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>You don&apos;t need to provide everything. Missing data will not reduce your score.</span>
          </div>
        </div>

        {/* Quick Sample Action Chips */}
        <div className="mt-6 pt-6 border-t border-[#2B3035]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#F3F5F4] flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Try Synthetic Samples:
            </span>
            <button
              onClick={() => onLoadSyntheticSample('upi_statement.pdf')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1 text-xs font-medium text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              📄 UPI PDF
            </button>
            <button
              onClick={() => onLoadSyntheticSample('utility_bill_bescom.pdf')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1 text-xs font-medium text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              ⚡ BESCOM Utility PDF
            </button>
            <button
              onClick={() => onLoadSyntheticSample('zomato_earnings_summary.pdf')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1 text-xs font-medium text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              🛵 Zomato Earnings PDF
            </button>
            <button
              onClick={() => onLoadSyntheticSample('upi_statement.csv')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1 text-xs font-medium text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              📊 UPI CSV (40 txns)
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition ${
          isDragging
            ? 'border-[#3D78C2] bg-[#1E2C3D]/60 scale-[1.005]'
            : 'border-[#2B3035] bg-[#171A1D] hover:border-[#3D78C2]/60 hover:bg-[#1D2125]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.png,.jpg,.jpeg,.xlsx"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E2C3D] text-[#7AB3EF] shadow-xs">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-base font-bold text-[#F3F5F4]">
          {uploading ? 'Processing & Extracting Document...' : 'Upload Financial Evidence'}
        </h3>
        <p className="mt-1 text-xs text-[#A7AFB5] max-w-md">
          Drag & drop your files here, or click to browse.
          Our automated pattern engine validates and structures document data.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] font-medium text-[#A7AFB5]">
          <span className="rounded-md bg-[#1D2125] px-2 py-0.5 border border-[#2B3035]">PDF</span>
          <span className="rounded-md bg-[#1D2125] px-2 py-0.5 border border-[#2B3035]">CSV</span>
          <span className="rounded-md bg-[#1D2125] px-2 py-0.5 border border-[#2B3035]">Excel</span>
          <span className="rounded-md bg-[#1D2125] px-2 py-0.5 border border-[#2B3035]">Images (.png, .jpg)</span>
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

      {/* Ingested Evidence List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#7AB3EF] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ingested Financial Evidence ({evidenceList.length})
          </h2>
          {evidenceList.length > 0 && (
            <span className="text-xs text-[#4ADE80] font-medium">
              Ready for behavioural analysis
            </span>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2B3035] bg-[#171A1D] p-8 text-center text-xs text-[#737C83]">
            No evidence added yet. Upload a document or click a sample button above to begin.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="relative flex flex-col justify-between rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs transition hover:bg-[#1D2125]"
              >
                <div>
                  {/* Category Pill & Status Badge */}
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

                  {/* Document Title */}
                  <h3 className="mt-3 text-sm font-bold text-[#F3F5F4] truncate" title={ev.provenance.document_name}>
                    {ev.provenance.document_name}
                  </h3>
                  <p className="text-xs text-[#A7AFB5] mt-0.5">
                    {ev.source_provider}
                  </p>

                  {/* Key Metrics */}
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

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-[#2B3035] pt-3">
                  <button
                    type="button"
                    onClick={() => onEvidenceRemoved(ev.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                  <span className="text-[11px] font-medium text-[#4ADE80] bg-[#132E20] px-2 py-0.5 rounded border border-[#16A05A]/30">
                    Processed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#F3F5F4]">
            Ready to Generate Alternative Credit Profile?
          </h3>
          <p className="text-xs text-[#A7AFB5] mt-0.5">
            The assessment engine will analyze behavioral dimensions and explainable factors.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartAssessment}
          disabled={evidenceList.length === 0}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#16A05A] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#08783B] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Generate Assessment Profile</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
