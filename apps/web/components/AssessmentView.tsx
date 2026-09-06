'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  Check,
  AlertTriangle,
  Scale,
  ShieldAlert,
  CheckCircle,
  Database,
  FileWarning,
} from 'lucide-react';
import {
  AssessmentProfile,
  CanonicalEvidence,
  ExplainableReason,
  WhatIfResponse,
  ReconciliationItem,
  AssessmentFlag,
  ContradictionFinding,
} from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { calculateWhatIf } from '../lib/api';

interface AssessmentViewProps {
  profile: AssessmentProfile;
  evidenceList: CanonicalEvidence[];
  onInspectEvidence: (ev: CanonicalEvidence) => void;
  onUploadMore: () => void;
  onReset: () => void;
  onSelectScenario?: (scenario: 'baseline' | 'strong' | 'review') => void;
  isLoadingScenario?: boolean;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  profile,
  evidenceList,
  onInspectEvidence,
  onUploadMore,
  onReset,
  onSelectScenario,
  isLoadingScenario,
}) => {
  const [activeTraceIndex, setActiveTraceIndex] = useState<number | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [whatIfIncome, setWhatIfIncome] = useState(0);
  const [whatIfPayment, setWhatIfPayment] = useState(0);
  const [whatIfContinuity, setWhatIfContinuity] = useState(0);
  const [whatIfBuffer, setWhatIfBuffer] = useState(0);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const getAssessmentBandBadge = (band?: string) => {
    switch (band) {
      case 'LOW_RISK':
        return {
          label: 'Low Risk — Recommended',
          className: 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/30',
        };
      case 'MODERATE_RISK':
        return {
          label: 'Moderate Risk — Standard Review',
          className: 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/30',
        };
      case 'HIGH_RISK':
        return {
          label: 'High Risk — Caution',
          className: 'bg-[#381818] text-[#F87171] border-rose-800/30',
        };
      case 'REVIEW_REQUIRED':
      default:
        return {
          label: 'Review Required',
          className: 'bg-[#381818] text-[#F87171] border-rose-800/40 font-semibold',
        };
    }
  };

  const getRiskBandBadge = (riskBand: string) => {
    switch (riskBand) {
      case 'Low Risk':
        return 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/30';
      case 'Low-Moderate Risk':
        return 'bg-[#1E2C3D] text-[#7AB3EF] border-[#3D78C2]/30';
      case 'Moderate Risk':
        return 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/30';
      default:
        return 'bg-[#381818] text-[#F87171] border-rose-800/30';
    }
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'HIGH':
        return { label: 'High Quality', className: 'text-[#4ADE80] bg-[#132E20] border-[#16A05A]/30' };
      case 'MEDIUM':
        return { label: 'Medium Quality', className: 'text-[#FBBF24] bg-[#332511] border-[#D89A24]/30' };
      case 'LOW':
        return { label: 'Needs Verification', className: 'text-[#F87171] bg-[#381818] border-rose-800/30' };
      case 'UNRELIABLE':
      default:
        return { label: 'Unreliable', className: 'text-[#F87171] bg-[#381818] border-rose-800/30' };
    }
  };

  const getReconStatusBadge = (status: string) => {
    switch (status) {
      case 'CONSISTENT':
        return {
          label: 'Consistent',
          className: 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/30',
        };
      case 'MINOR_VARIANCE':
        return {
          label: 'Minor Variance',
          className: 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/30',
        };
      case 'SIGNIFICANT_VARIANCE':
        return {
          label: 'Significant Variance',
          className: 'bg-[#381818] text-[#F87171] border-rose-800/30',
        };
      case 'NOT_OBSERVED':
      default:
        return {
          label: 'Not Observed',
          className: 'bg-[#1D2125] text-[#A7AFB5] border-[#2B3035]',
        };
    }
  };

  const getScoreSummaryText = (score: number) => {
    if (score >= 800) {
      return 'Strong, predictable financial activity observed across multiple verified document sources.';
    } else if (score >= 700) {
      return 'Consistent financial behaviour with healthy cash flow buffers and regular on-time payment history.';
    } else if (score >= 600) {
      return 'Moderate financial regularity with some variation across observed inflows or payment timing.';
    } else {
      return 'Developing credit profile. Additional documentation will help confirm higher underwriting capacity.';
    }
  };

  const handleWhatIfSimulate = async (
    incDelta: number,
    payDelta: number,
    contDelta: number,
    bufAmt: number
  ) => {
    setIsSimulating(true);
    try {
      const res = await calculateWhatIf(profile, incDelta, payDelta, contDelta, bufAmt);
      setWhatIfResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const observedMonthlyIncome =
    profile.observed_profile?.observed_monthly_income ||
    profile.features.gig_avg_monthly_earnings ||
    profile.features.avg_monthly_inflow ||
    profile.declared_profile?.monthly_income ||
    32000;

  const observedMonthlyExpenses =
    profile.observed_profile?.observed_monthly_expenses ||
    profile.features.avg_monthly_outflow ||
    profile.declared_profile?.monthly_expenses ||
    16500;

  const bandInfo = getAssessmentBandBadge(profile.assessment_band);
  const qualityBadge = getQualityBadge(profile.evidence_quality?.overall_quality);
  const isReviewRequired = profile.assessment_band === 'REVIEW_REQUIRED' || !!profile.review_details;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 0. DEMO SCENARIO SELECTOR */}
      {onSelectScenario && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2B3035] bg-[#14171A] px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#F3F5F4]">Demo Profiles:</span>
            <span className="text-[#737C83] hidden sm:inline">Evaluate engine across representative underwriting scenarios</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectScenario('baseline')}
              disabled={isLoadingScenario}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3 py-1.5 text-xs font-medium text-[#F3F5F4] hover:bg-[#24292E] hover:border-[#3D78C2]/40 transition cursor-pointer disabled:opacity-50"
            >
              Rajesh Kumar (Clean Baseline)
            </button>
            <button
              onClick={() => onSelectScenario('strong')}
              disabled={isLoadingScenario}
              className="rounded-lg border border-[#16A05A]/30 bg-[#132E20] px-3 py-1.5 text-xs font-medium text-[#4ADE80] hover:bg-[#163827] transition cursor-pointer disabled:opacity-50"
            >
              Priya Sundaram (Strong Multi-Source)
            </button>
            <button
              onClick={() => onSelectScenario('review')}
              disabled={isLoadingScenario}
              className="rounded-lg border border-rose-800/30 bg-[#381818] px-3 py-1.5 text-xs font-medium text-[#F87171] hover:bg-[#451B1B] transition cursor-pointer disabled:opacity-50"
            >
              Amit Verma (Review Required)
            </button>
          </div>
        </div>
      )}

      {/* 1. APPLICANT CONTEXT & STATUS HEADER */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2B3035] pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium border ${bandInfo.className}`}>
                {bandInfo.label}
              </span>
              <span className="text-xs text-[#737C83]">
                Ref: {profile.assessment_id}
              </span>
              <span className="text-xs text-[#737C83]">•</span>
              <span className="text-xs text-[#737C83]">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F5F4]">
              {profile.declared_profile?.full_name || profile.customer_name || 'Rajesh Kumar'}
            </h1>
            <p className="text-xs text-[#A7AFB5] capitalize mt-0.5">
              {(profile.declared_profile?.employment_type || profile.persona_type || 'gig_worker').replace('_', ' ')} • {profile.declared_profile?.city || 'Bengaluru'} ({profile.declared_profile?.pincode || '560038'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUploadMore}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3.5 py-2 text-xs font-medium text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition cursor-pointer"
            >
              + Add Evidence
            </button>
            <button
              onClick={onReset}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3.5 py-2 text-xs font-medium text-[#A7AFB5] hover:bg-[#24292E] hover:text-white transition cursor-pointer"
            >
              New Assessment
            </button>
          </div>
        </div>

        {/* Declared Context Attributes Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] font-medium text-[#737C83] block">Declared Monthly Income</span>
            <span className="font-semibold text-[#F3F5F4] text-base mt-0.5 block">
              {formatCurrency(profile.declared_profile?.monthly_income || 32000)}
            </span>
            <span className="text-[11px] text-[#A7AFB5] capitalize">
              via {(profile.declared_profile?.income_channel || 'upi').replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-[#737C83] block">Declared Monthly Expenses</span>
            <span className="font-semibold text-[#F3F5F4] text-base mt-0.5 block">
              {formatCurrency(profile.declared_profile?.monthly_expenses || 16500)}
            </span>
            <span className="text-[11px] text-[#A7AFB5]">
              Estimated household cost
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-[#737C83] block">Household Context</span>
            <span className="font-semibold text-[#F3F5F4] text-base mt-0.5 block">
              {profile.declared_profile?.age || 29} yrs • {profile.declared_profile?.dependents || 2} dependents
            </span>
            <span className="text-[11px] text-[#A7AFB5]">
              Family obligation
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-[#737C83] block">Verified Evidence</span>
            <span className="font-semibold text-[#7AB3EF] text-base mt-0.5 block">
              {profile.provenance.length} Source{profile.provenance.length === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-[#A7AFB5]">
              {profile.data_coverage_score}% data coverage
            </span>
          </div>
        </div>
      </div>

      {/* 2. UNDERWRITING REVIEW REQUIRED BANNER (Rendered only when action is required) */}
      {isReviewRequired && (
        <div className="rounded-2xl border border-rose-800/40 bg-[#241315] p-6 shadow-xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#381818] text-[#F87171]">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#F87171]">
                  Underwriting Review Required
                </h3>
                <span className="text-xs text-[#F87171]">
                  {profile.review_details?.trigger_reason || 'Income Divergence Detected'}
                </span>
              </div>
              <p className="text-xs text-[#F3F5F4] leading-relaxed">
                {profile.review_details?.explanation ||
                  'The evidence exhibits variance between declared earnings and verified inflows that exceeds standard automated tolerance. Manual underwriter verification is recommended.'}
              </p>

              <div className="pt-2 text-[11px] text-[#A7AFB5] border-t border-rose-800/20 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="text-[#737C83]">Affected Documents: </span>
                  <span className="text-[#F3F5F4]">
                    {profile.review_details?.affected_evidence?.join(', ') || 'Declared Context vs. Bank Statements'}
                  </span>
                </div>
                {profile.review_details?.observed_period && (
                  <div>
                    <span className="text-[#737C83]">Period: </span>
                    <span className="text-[#F3F5F4]">{profile.review_details.observed_period}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN SCORE CARD & EVIDENCE COVERAGE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Alternative Credit Score Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A7AFB5]">
                Alternative Credit Score
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskBandBadge(profile.risk_band)}`}>
                {profile.risk_band}
              </span>
            </div>

            {/* Score Display */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-bold tracking-tight text-[#F3F5F4]">
                {profile.final_score}
              </span>
              <span className="text-xl text-[#737C83]">/ 900</span>
            </div>

            {/* Concise Assessment Summary */}
            <p className="mt-4 text-xs text-[#A7AFB5] leading-relaxed">
              {getScoreSummaryText(profile.final_score)}
            </p>
          </div>

          {/* Confidence and Coverage Gauges */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#2B3035] pt-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#F3F5F4]">Confidence</span>
                <span className="font-semibold text-[#16A05A]">{profile.confidence_score}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-[#16A05A] rounded-full"
                  style={{ width: `${profile.confidence_score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] text-[#737C83]">Reliability & extraction</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#F3F5F4]">Evidence Coverage</span>
                <span className="font-semibold text-[#7AB3EF]">{profile.data_coverage_score}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-[#3D78C2] rounded-full"
                  style={{ width: `${profile.data_coverage_score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] text-[#737C83]">Observed financial activity</span>
            </div>
          </div>
        </div>

        {/* Evidence Used (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#A7AFB5]">
                Evidence Sources
              </h3>
              <span className="text-xs font-medium text-[#16A05A]">
                {profile.data_coverage_score}% Coverage
              </span>
            </div>
            <p className="mt-1 text-xs text-[#737C83]">
              Missing evidence reduces coverage and confidence rather than penalizing credit score.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* UPI */}
              <div
                className={`rounded-xl p-3.5 border text-xs ${
                  profile.coverage_breakdown?.upi
                    ? 'bg-[#1E2C3D] border-[#3D78C2]/30 text-[#7AB3EF]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-medium flex items-center justify-between">
                  <span>UPI / Bank</span>
                  <span className="text-[11px]">
                    {profile.coverage_breakdown?.upi ? 'Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Cash-flow regularity</span>
              </div>

              {/* Gig Work */}
              <div
                className={`rounded-xl p-3.5 border text-xs ${
                  profile.coverage_breakdown?.gig_earnings
                    ? 'bg-[#132E20] border-[#16A05A]/30 text-[#4ADE80]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-medium flex items-center justify-between">
                  <span>Work Earnings</span>
                  <span className="text-[11px]">
                    {profile.coverage_breakdown?.gig_earnings ? 'Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Platform income continuity</span>
              </div>

              {/* Utility */}
              <div
                className={`rounded-xl p-3.5 border text-xs ${
                  profile.coverage_breakdown?.utility
                    ? 'bg-[#332511] border-[#D89A24]/30 text-[#FBBF24]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-medium flex items-center justify-between">
                  <span>Utility Bills</span>
                  <span className="text-[11px]">
                    {profile.coverage_breakdown?.utility ? 'Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">On-time payment discipline</span>
              </div>

              {/* GST */}
              <div
                className={`rounded-xl p-3.5 border text-xs ${
                  profile.coverage_breakdown?.gst
                    ? 'bg-[#2D1B36] border-[#A855F7]/30 text-[#D8B4FE]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-medium flex items-center justify-between">
                  <span>GST Returns</span>
                  <span className="text-[11px]">
                    {profile.coverage_breakdown?.gst ? 'Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Business filings</span>
              </div>

              {/* Telecom */}
              <div
                className={`rounded-xl p-3.5 border text-xs ${
                  profile.coverage_breakdown?.telecom
                    ? 'bg-[#1A2536] border-[#60A5FA]/30 text-[#93C5FD]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-medium flex items-center justify-between">
                  <span>Telecom Plan</span>
                  <span className="text-[11px]">
                    {profile.coverage_breakdown?.telecom ? 'Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Active recharge history</span>
              </div>

              {/* Quality Summary */}
              <div className="rounded-xl p-3.5 border bg-[#1D2125] border-[#2B3035] text-xs">
                <div className="font-medium flex items-center justify-between text-[#F3F5F4]">
                  <span>Evidence Quality</span>
                  <span className={`text-[11px] font-semibold ${qualityBadge.className.split(' ')[0]}`}>
                    {qualityBadge.label}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#737C83]">
                  {profile.evidence_quality?.observation_window || 'Jan 2026 – Mar 2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#2B3035] pt-4">
            <span className="text-xs text-[#737C83]">
              Strengthen assessment confidence by attaching supplementary bank or tax records.
            </span>
            <button
              onClick={onUploadMore}
              className="text-xs font-medium text-[#7AB3EF] hover:underline cursor-pointer"
            >
              + Upload Evidence
            </button>
          </div>
        </div>
      </div>

      {/* 4. FINANCIAL RECONCILIATION */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2B3035] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#F3F5F4] flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#3D78C2]" />
              Financial Reconciliation
            </h3>
            <p className="mt-0.5 text-xs text-[#737C83]">
              Objective comparison of self-declared applicant context with verified transactional evidence.
            </p>
          </div>
          {profile.reconciliation && (
            <span className={`px-3 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getReconStatusBadge(profile.reconciliation.overall_status).className}`}>
              {getReconStatusBadge(profile.reconciliation.overall_status).label}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {profile.reconciliation?.items && profile.reconciliation.items.length > 0 ? (
            profile.reconciliation.items.map((item: ReconciliationItem, idx: number) => {
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="font-semibold text-[#F3F5F4] text-xs block">
                      {item.field}
                    </span>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#737C83]">Declared:</span>
                        <span className="text-[#F3F5F4]">{item.declared_value}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#737C83]">Observed:</span>
                        <span className="font-medium text-[#16A05A]">{item.observed_value}</span>
                      </div>
                      {item.variance_pct !== undefined && item.variance_pct > 0 && (
                        <div className="flex justify-between items-baseline text-[11px] text-[#FBBF24]">
                          <span className="text-[#737C83]">Variance:</span>
                          <span>±{item.variance_pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#A7AFB5] pt-2 border-t border-[#2B3035] leading-relaxed">
                    {item.explanation || item.description}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-xs text-[#A7AFB5]">
              Reconciliation completed across declared context and uploaded statements.
            </div>
          )}
        </div>
      </div>

      {/* 5. KEY OBSERVATIONS (Replacing raw flag codes & badges) */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="border-b border-[#2B3035] pb-3">
          <h3 className="text-base font-semibold text-[#F3F5F4]">
            Key Observations
          </h3>
          <p className="mt-0.5 text-xs text-[#737C83]">
            Essential underwriting takeaways synthesized from verified cash-flow, income, and payment patterns.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.assessment_flags && profile.assessment_flags.length > 0 ? (
            profile.assessment_flags.map((flag: AssessmentFlag, idx: number) => {
              const isAttention = flag.severity === 'REVIEW' || flag.severity === 'WATCH';
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-1.5"
                >
                  <h4 className={`font-semibold text-xs ${isAttention ? 'text-[#FBBF24]' : 'text-[#F3F5F4]'}`}>
                    {flag.title}
                  </h4>
                  <p className="text-[11px] text-[#A7AFB5] leading-relaxed">
                    {flag.description || flag.explanation}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-xs text-[#A7AFB5]">
              Standard financial behaviour observed with no abnormal indicators.
            </div>
          )}
        </div>
      </div>

      {/* 6. CONTRADICTION FINDINGS (Rendered only when discrepancies exist) */}
      {profile.contradictions && profile.contradictions.length > 0 && (
        <div className="rounded-2xl border border-rose-800/30 bg-[#1A1517] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-rose-800/20 pb-3">
            <div>
              <h3 className="text-base font-semibold text-[#F87171] flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-[#F87171]" />
                Evidence Discrepancies ({profile.contradictions.length})
              </h3>
              <p className="mt-0.5 text-xs text-[#A7AFB5]">
                Cross-source inconsistencies or statement anomalies requiring underwriter review.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            {profile.contradictions.map((c: ContradictionFinding, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-rose-800/20 bg-[#1D2125] p-4 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold text-[#F3F5F4] text-xs">{c.title}</h4>
                  <p className="text-[11px] text-[#A7AFB5] mt-1 leading-relaxed">
                    {c.explanation}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-[#737C83] border-t border-[#2B3035] flex justify-between">
                  <span>Source: {c.affected_evidence?.join(', ')}</span>
                  <span>{c.affected_period}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. WHY THIS ASSESSMENT (Key Strengths & Watch Areas) */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-semibold text-[#F3F5F4] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#16A05A]" />
            Why This Assessment
          </h3>
          <p className="mt-0.5 text-xs text-[#737C83]">
            Evidence-grounded behavioral drivers and observations explaining this profile.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 text-xs">
          {/* Positive Signals */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#4ADE80] font-semibold text-xs">
              <Check className="h-4 w-4" />
              Key Strengths
            </div>
            <ul className="space-y-3">
              {profile.positive_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80] text-[9px] font-bold">
                    ✓
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#F3F5F4]">{factor.title}</div>
                    <p className="text-[11px] text-[#A7AFB5] leading-relaxed">{factor.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Watch Areas */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#FBBF24] font-semibold text-xs">
              <AlertTriangle className="h-4 w-4" />
              Watch Areas & Coverage Observations
            </div>
            <ul className="space-y-3">
              {profile.attention_factors && profile.attention_factors.length > 0 ? (
                profile.attention_factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#332511] text-[#FBBF24] text-[9px] font-bold">
                      !
                    </span>
                    <div className="space-y-0.5">
                      <div className="font-medium text-[#F3F5F4]">{factor.title}</div>
                      <p className="text-[11px] text-[#A7AFB5] leading-relaxed">{factor.summary}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80] text-[9px] font-bold">
                    ✓
                  </span>
                  <p className="text-[11px] text-[#A7AFB5]">
                    No high-risk warnings or adverse flags observed across the verified evidence records.
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 8. FIVE BEHAVIOURAL DIMENSIONS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#F3F5F4] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#3D78C2]" />
            Five Behavioural Dimensions
          </h3>
          <span className="text-xs text-[#737C83]">
            Normalized 0–100 scale from empirical activity
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          {/* 1. Cash-Flow Stability */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-semibold text-[#F3F5F4]">Cash-Flow Stability</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#7AB3EF]">
                  {Math.round(profile.dimensions.cash_flow_stability)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-[#3D78C2] rounded-full"
                  style={{ width: `${profile.dimensions.cash_flow_stability}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#A7AFB5] leading-snug">
                Predictable deposit cadence and low month-over-month inflow volatility.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#737C83] space-y-1">
              <div>Inflows: <span className="text-[#F3F5F4] font-medium">{formatCurrency(profile.features.avg_monthly_inflow || observedMonthlyIncome)}</span></div>
              <div>Volatility CV: <span className="text-[#16A05A] font-medium">{profile.features.inflow_volatility_cv ? profile.features.inflow_volatility_cv.toFixed(2) : '0.06'}</span></div>
            </div>
          </div>

          {/* 2. Income Consistency */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-semibold text-[#F3F5F4]">Income Consistency</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#4ADE80]">
                  {Math.round(profile.dimensions.income_consistency)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-[#16A05A] rounded-full"
                  style={{ width: `${profile.dimensions.income_consistency}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#A7AFB5] leading-snug">
                Sustained earning continuity with continuous active working days.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#737C83] space-y-1">
              <div>Continuity: <span className="text-[#F3F5F4] font-medium">{profile.features.gig_continuity_months || 3} months</span></div>
              <div>Active Days: <span className="text-[#F3F5F4] font-medium">{profile.features.gig_active_days_per_month ? profile.features.gig_active_days_per_month.toFixed(0) : '24'} days/mo</span></div>
            </div>
          </div>

          {/* 3. Payment Discipline */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-semibold text-[#F3F5F4]">Payment Discipline</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#FBBF24]">
                  {Math.round(profile.dimensions.payment_discipline)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-[#D89A24] rounded-full"
                  style={{ width: `${profile.dimensions.payment_discipline}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#A7AFB5] leading-snug">
                Punctual bill fulfillment with low delinquency rates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#737C83] space-y-1">
              <div>On-Time Rate: <span className="text-[#16A05A] font-medium">{profile.features.utility_on_time_ratio ? (profile.features.utility_on_time_ratio * 100).toFixed(0) : '80'}%</span></div>
              <div>Tracked Bills: <span className="text-[#F3F5F4] font-medium">{profile.features.utility_total_bills || 5} cycles</span></div>
            </div>
          </div>

          {/* 4. Activity Continuity */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-semibold text-[#F3F5F4]">Activity Continuity</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#D8B4FE]">
                  {Math.round(profile.dimensions.activity_continuity)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${profile.dimensions.activity_continuity}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#A7AFB5] leading-snug">
                High frequency of day-to-day transactions and business engagement.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#737C83] space-y-1">
              <div>Active Days: <span className="text-[#F3F5F4] font-medium">{profile.features.active_days_count || 39} days</span></div>
              <div>Transactions: <span className="text-[#F3F5F4] font-medium">{profile.features.total_transactions || 39} txns</span></div>
            </div>
          </div>

          {/* 5. Financial Resilience */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="font-semibold text-[#F3F5F4]">Financial Resilience</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#93C5FD]">
                  {Math.round(profile.dimensions.financial_resilience)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${profile.dimensions.financial_resilience}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#A7AFB5] leading-snug">
                Positive net liquidity buffer protects against unexpected cash shortfalls.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#737C83] space-y-1">
              <div>Inflow Ratio: <span className="text-[#F3F5F4] font-medium">{profile.features.credit_debit_ratio ? profile.features.credit_debit_ratio.toFixed(1) : '3.0'}x</span></div>
              <div>Buffer: <span className="text-[#16A05A] font-medium">Positive</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. PROGRESSIVE DISCLOSURE: TECHNICAL PROVENANCE & EVIDENCE DETAILS */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#F3F5F4] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#3D78C2]" />
              Evidence Provenance & Verification Details
            </h3>
            <p className="mt-0.5 text-xs text-[#737C83]">
              Audit trail, cryptographic document identities (SHA-256), and dimensional contribution breakdown.
            </p>
          </div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3.5 py-1.5 text-xs font-medium text-[#7AB3EF] hover:bg-[#24292E] transition cursor-pointer"
          >
            {showTechnicalDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {showTechnicalDetails && (
          <div className="space-y-6 pt-4 border-t border-[#2B3035] animate-in fade-in duration-200">
            {/* 7-Stage Dimensional Traces */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#A7AFB5] block">
                Behavioural Dimension Traces
              </span>
              {profile.evidence_traces && profile.evidence_traces.map((trace, idx) => {
                const isExpanded = activeTraceIndex === idx;
                return (
                  <div key={idx} className="rounded-xl border border-[#2B3035] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveTraceIndex(isExpanded ? null : idx)}
                      className={`w-full flex items-center justify-between p-3.5 text-left transition cursor-pointer ${
                        isExpanded ? 'bg-[#1E2C3D]/50' : 'bg-[#1D2125] hover:bg-[#24292E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-xs text-[#F3F5F4]">{trace.dimension_title}</span>
                        <span className="text-[11px] text-[#737C83]">• {trace.score.toFixed(1)}/100</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#737C83]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#737C83]" />
                      )}
                    </button>

                    {isExpanded && trace.stages && (
                      <div className="p-4 bg-[#14171A] border-t border-[#2B3035] grid gap-3 sm:grid-cols-2 text-xs">
                        <div className="p-2.5 rounded bg-[#1D2125] border border-[#2B3035]">
                          <span className="text-[10px] font-medium text-[#737C83] block">1. Document</span>
                          <p className="text-[#F3F5F4] text-[11px] mt-0.5">{trace.stages.document}</p>
                        </div>
                        <div className="p-2.5 rounded bg-[#1D2125] border border-[#2B3035]">
                          <span className="text-[10px] font-medium text-[#737C83] block">2. Extraction</span>
                          <p className="text-[#F3F5F4] text-[11px] mt-0.5">{trace.stages.extraction}</p>
                        </div>
                        <div className="p-2.5 rounded bg-[#1D2125] border border-[#2B3035]">
                          <span className="text-[10px] font-medium text-[#737C83] block">3. Validation</span>
                          <p className="text-[#F3F5F4] text-[11px] mt-0.5">{trace.stages.validation}</p>
                        </div>
                        <div className="p-2.5 rounded bg-[#1D2125] border border-[#2B3035]">
                          <span className="text-[10px] font-medium text-[#737C83] block">4. Normalization</span>
                          <p className="text-[#F3F5F4] text-[11px] mt-0.5">{trace.stages.normalization}</p>
                        </div>
                        <div className="p-2.5 rounded bg-[#1D2125] border border-[#2B3035]">
                          <span className="text-[10px] font-medium text-[#737C83] block">5. Consistency</span>
                          <p className="text-[#F3F5F4] text-[11px] mt-0.5">{trace.stages.consistency_check}</p>
                        </div>
                        <div className="p-2.5 rounded bg-[#1D2125] border border-[#2B3035]">
                          <span className="text-[10px] font-medium text-[#737C83] block">6. Behavioural Signal</span>
                          <p className="text-[#F3F5F4] text-[11px] mt-0.5">{trace.stages.behavioural_signal}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Raw Documents & Hashes */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-[#A7AFB5] block">
                Cryptographic Artifact Identity
              </span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                {profile.provenance.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#1D2125] border border-[#2B3035] space-y-1.5">
                    <div className="font-semibold text-xs text-[#F3F5F4] truncate">{item.document_name}</div>
                    <div className="text-[11px] text-[#737C83] space-y-0.5">
                      <div>Records: <span className="text-[#F3F5F4]">{item.record_count}</span> • Confidence: <span className="text-[#16A05A]">{Math.round(item.extraction_confidence * 100)}%</span></div>
                      {item.content_hash && (
                        <div className="font-mono text-[10px] text-[#737C83] truncate">
                          SHA: {item.content_hash.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. WHAT-IF SCENARIO SIMULATION */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#F3F5F4] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#3D78C2]" />
              What-If Scenario Simulation
            </h3>
            <p className="mt-0.5 text-xs text-[#737C83]">
              Simulate prospective financial adjustments to project potential score improvements without mutating original records.
            </p>
          </div>
          <span className="text-[11px] text-[#737C83]">
            Non-mutating scenario
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Slider 1: Income Stability */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-[#F3F5F4] mb-2">
              <span>Improve Monthly Inflow Consistency</span>
              <span className="text-[#7AB3EF]">+{whatIfIncome}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={whatIfIncome}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setWhatIfIncome(val);
                handleWhatIfSimulate(val / 100, whatIfPayment / 100, whatIfContinuity / 100, whatIfBuffer);
              }}
              className="w-full accent-[#3D78C2] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#737C83] mt-1">
              <span>Current</span>
              <span>+15% consistency</span>
              <span>+30% consistency</span>
            </div>
          </div>

          {/* Slider 2: Payment Discipline */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-[#F3F5F4] mb-2">
              <span>Improve On-Time Bill Regularity</span>
              <span className="text-[#4ADE80]">+{whatIfPayment}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={whatIfPayment}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setWhatIfPayment(val);
                handleWhatIfSimulate(whatIfIncome / 100, val / 100, whatIfContinuity / 100, whatIfBuffer);
              }}
              className="w-full accent-[#16A05A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#737C83] mt-1">
              <span>Current</span>
              <span>+15% on-time</span>
              <span>+30% on-time</span>
            </div>
          </div>
        </div>

        {/* What-If Projected Result Display */}
        {whatIfResult && (
          <div className="rounded-xl border border-[#16A05A]/30 bg-[#132E20] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200 text-xs">
            <div>
              <div className="font-semibold text-[#4ADE80]">
                Estimated Potential: +{whatIfResult.score_delta} Points
              </div>
              <p className="mt-1 text-[#F3F5F4] leading-relaxed">
                {whatIfResult.explanation}
              </p>
            </div>

            <div className="flex items-baseline gap-2 shrink-0 bg-[#1D2125]/80 px-4 py-3 rounded-xl border border-[#16A05A]/20">
              <span className="text-[#737C83]">Projected:</span>
              <span className="text-2xl font-bold text-[#4ADE80]">
                {whatIfResult.estimated_score}
              </span>
              <span className="text-[#737C83]">/ 900</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
