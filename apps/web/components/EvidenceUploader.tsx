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
    <div className="space-y-8">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF2FC] px-3 py-1 text-xs font-semibold text-[#1F4E8C] border border-[#BFDBFE]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Milestone 3 — Evidence Ingestion Engine
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#1F4E8C]">
            BUILD YOUR FINANCIAL PROFILE
          </h1>
          <p className="mt-2 text-sm text-[#5F6368] leading-relaxed">
            Share evidence that can help us assess your financial reliability.
            Our automated classification engine reads UPI statements, utility receipts, and gig earnings without manual tagging.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#0B9348]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>You don&apos;t need to provide everything. Missing data will not reduce your score.</span>
          </div>
        </div>

        {/* Quick Sample Action Chips */}
        <div className="mt-6 pt-6 border-t border-[#DDE3E0]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#222222] flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Try Synthetic Samples:
            </span>
            <button
              onClick={() => onLoadSyntheticSample('upi_statement.pdf')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1 text-xs font-medium text-[#1F4E8C] hover:bg-[#EBF2FC] hover:border-[#BFDBFE] transition disabled:opacity-50"
            >
              📄 UPI PDF
            </button>
            <button
              onClick={() => onLoadSyntheticSample('utility_bill_bescom.pdf')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1 text-xs font-medium text-[#1F4E8C] hover:bg-[#EBF2FC] hover:border-[#BFDBFE] transition disabled:opacity-50"
            >
              ⚡ BESCOM Utility PDF
            </button>
            <button
              onClick={() => onLoadSyntheticSample('zomato_earnings_summary.pdf')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1 text-xs font-medium text-[#1F4E8C] hover:bg-[#EBF2FC] hover:border-[#BFDBFE] transition disabled:opacity-50"
            >
              🛵 Zomato Earnings PDF
            </button>
            <button
              onClick={() => onLoadSyntheticSample('upi_statement.csv')}
              disabled={isLoadingSample}
              className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3 py-1 text-xs font-medium text-[#1F4E8C] hover:bg-[#EBF2FC] hover:border-[#BFDBFE] transition disabled:opacity-50"
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
            ? 'border-[#1F4E8C] bg-[#EBF2FC]/60 scale-[1.005]'
            : 'border-[#DDE3E0] bg-white hover:border-[#1F4E8C]/60 hover:bg-[#F7F9F8]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.png,.jpg,.jpeg,.xlsx"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF2FC] text-[#1F4E8C] shadow-xs">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-base font-bold text-[#1F4E8C]">
          {uploading ? 'Processing & Extracting Document...' : 'Upload Financial Evidence'}
        </h3>
        <p className="mt-1 text-xs text-[#5F6368] max-w-md">
          Drag & drop your files here, or click to browse.
          Our AI & pattern engine automatically detects document types and validates fields.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] font-medium text-[#5F6368]">
          <span className="rounded-md bg-[#F1F4F3] px-2 py-0.5 border border-[#DDE3E0]">PDF</span>
          <span className="rounded-md bg-[#F1F4F3] px-2 py-0.5 border border-[#DDE3E0]">CSV</span>
          <span className="rounded-md bg-[#F1F4F3] px-2 py-0.5 border border-[#DDE3E0]">Excel</span>
          <span className="rounded-md bg-[#F1F4F3] px-2 py-0.5 border border-[#DDE3E0]">Images (.png, .jpg)</span>
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

      {/* Ingested Evidence List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F4E8C] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ingested Financial Evidence ({evidenceList.length})
          </h2>
          {evidenceList.length > 0 && (
            <span className="text-xs text-[#5F6368]">
              Ready for scoring calculation
            </span>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDE3E0] bg-white p-8 text-center text-xs text-[#858585]">
            No evidence added yet. Upload a document or click a sample button above to begin.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="relative flex flex-col justify-between rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs transition hover:shadow-md"
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
                    <span className="rounded-full bg-[#E8F6EE] px-2 py-0.5 text-[10px] font-bold text-[#0B9348]">
                      {ev.provenance.validation_status}
                    </span>
                  </div>

                  {/* Document Title */}
                  <h3 className="mt-3 text-sm font-bold text-[#222222] truncate" title={ev.provenance.document_name}>
                    {ev.provenance.document_name}
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    {ev.source_provider}
                  </p>

                  {/* Key Metrics */}
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

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-[#DDE3E0] pt-3">
                  <button
                    type="button"
                    onClick={() => onEvidenceRemoved(ev.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                  <span className="text-[11px] font-medium text-[#0B9348] bg-[#E8F6EE] px-2 py-0.5 rounded">
                    Processed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#1F4E8C]">
            Ready to Generate Alternative Credit Profile?
          </h3>
          <p className="text-xs text-[#5F6368] mt-0.5">
            The deterministic scoring engine will calculate behavioral dimensions and explainable factors.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartAssessment}
          disabled={evidenceList.length === 0}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0B9348] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#08783B] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Generate Assessment Profile</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
