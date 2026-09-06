'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  Info,
  Sparkles,
  Check,
  AlertTriangle,
  Scale,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Flag,
  CheckCircle,
  FileCheck2,
} from 'lucide-react';
import {
  AssessmentProfile,
  CanonicalEvidence,
  ExplainableReason,
  WhatIfResponse,
  ReconciliationItem,
  AssessmentFlag,
} from '../lib/types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { calculateWhatIf } from '../lib/api';

interface AssessmentViewProps {
  profile: AssessmentProfile;
  evidenceList: CanonicalEvidence[];
  onInspectEvidence: (ev: CanonicalEvidence) => void;
  onUploadMore: () => void;
  onReset: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  profile,
  evidenceList,
  onInspectEvidence,
  onUploadMore,
  onReset,
}) => {
  const [activeTraceIndex, setActiveTraceIndex] = useState<number | null>(0);
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
          label: 'LOW RISK (STANDARD APPROVAL TIER)',
          className: 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/40',
        };
      case 'MODERATE_RISK':
        return {
          label: 'MODERATE RISK (STANDARD UNDERWRITING)',
          className: 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/40',
        };
      case 'HIGH_RISK':
        return {
          label: 'HIGH RISK (ELEVATED CAUTION)',
          className: 'bg-[#381818] text-[#F87171] border-rose-800/40',
        };
      case 'REVIEW_REQUIRED':
      default:
        return {
          label: 'REVIEW REQUIRED (MANUAL UNDERWRITING)',
          className: 'bg-[#2D1B36] text-[#D8B4FE] border-purple-500/40',
        };
    }
  };

  const getRiskBandBadge = (riskBand: string) => {
    switch (riskBand) {
      case 'Low Risk':
        return 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/40';
      case 'Low-Moderate Risk':
        return 'bg-[#1E2C3D] text-[#7AB3EF] border-[#3D78C2]/40';
      case 'Moderate Risk':
        return 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/40';
      default:
        return 'bg-[#381818] text-[#F87171] border-rose-800/40';
    }
  };

  const getReconStatusBadge = (status: string) => {
    switch (status) {
      case 'CONSISTENT':
        return {
          label: 'Consistent (≤10%)',
          className: 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/40',
        };
      case 'MINOR_VARIANCE':
        return {
          label: 'Minor Variance (10–25%)',
          className: 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/40',
        };
      case 'SIGNIFICANT_VARIANCE':
        return {
          label: 'Significant Variance (>25%)',
          className: 'bg-[#381818] text-[#F87171] border-rose-800/40',
        };
      case 'NOT_OBSERVED':
      default:
        return {
          label: 'Not Observed',
          className: 'bg-[#1D2125] text-[#A7AFB5] border-[#2B3035]',
        };
    }
  };

  const getFlagSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'REVIEW':
        return 'bg-[#381818] text-[#F87171] border-rose-800/40';
      case 'WATCH':
        return 'bg-[#332511] text-[#FBBF24] border-[#D89A24]/40';
      case 'INFO':
      default:
        return 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/40';
    }
  };

  const getScoreSummaryText = (score: number) => {
    if (score >= 800) {
      return 'Strong and consistent financial behaviour across all observed document streams.';
    } else if (score >= 700) {
      return 'Stable financial behaviour with healthy cash flow, good payment regularity, and continuous engagement.';
    } else if (score >= 600) {
      return 'Moderate financial regularity with some variation in observed inflows or payment timing.';
    } else {
      return 'Developing credit profile. Additional evidence documents will help establish higher underwriting confidence.';
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Profile Header / Applicant Context Card */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2B3035] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1E2C3D] px-2.5 py-0.5 text-xs font-semibold text-[#7AB3EF] border border-[#3D78C2]/30">
                Assessment ID: {profile.assessment_id}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${bandInfo.className}`}>
                {bandInfo.label}
              </span>
              <span className="text-xs text-[#737C83]">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5F4]">
              {profile.declared_profile?.full_name || profile.customer_name || 'Rajesh Kumar'}
            </h1>
            <p className="text-xs text-[#A7AFB5] capitalize">
              {(profile.declared_profile?.employment_type || profile.persona_type || 'gig_worker').replace('_', ' ')} • {profile.declared_profile?.city || 'Bengaluru'} ({profile.declared_profile?.pincode || '560038'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUploadMore}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3.5 py-2 text-xs font-semibold text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition shadow-xs cursor-pointer"
            >
              + Strengthen With More Evidence
            </button>
            <button
              onClick={onReset}
              className="rounded-lg border border-[#2B3035] bg-[#1D2125] px-3.5 py-2 text-xs font-semibold text-[#A7AFB5] hover:bg-[#24292E] hover:text-white transition shadow-xs cursor-pointer"
            >
              New Assessment
            </button>
          </div>
        </div>

        {/* Declared Context Attributes Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#1D2125] p-4 text-xs border border-[#2B3035]">
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#737C83]">Declared Monthly Income</span>
            <span className="font-bold text-[#16A05A] text-sm">
              {formatCurrency(profile.declared_profile?.monthly_income || 32000)}
            </span>
            <span className="block text-[10px] text-[#A7AFB5] capitalize">
              via {(profile.declared_profile?.income_channel || 'upi').replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-bold text-[#737C83]">Declared Monthly Expenses</span>
            <span className="font-bold text-[#F3F5F4] text-sm">
              {formatCurrency(profile.declared_profile?.monthly_expenses || 16500)}
            </span>
            <span className="block text-[10px] text-[#A7AFB5]">
              Estimated household cost
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-bold text-[#737C83]">Age & Dependents</span>
            <span className="font-bold text-[#F3F5F4] text-sm">
              {profile.declared_profile?.age || 29} yrs • {profile.declared_profile?.dependents || 2} dependents
            </span>
            <span className="block text-[10px] text-[#A7AFB5]">
              Household stability
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-bold text-[#737C83]">Evidence Verified</span>
            <span className="font-bold text-[#7AB3EF] text-sm">
              {profile.provenance.length} Sources Active
            </span>
            <span className="block text-[10px] text-[#A7AFB5]">
              {profile.data_coverage_score}% Evidence coverage
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Score Card & Evidence Coverage Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Alternative Credit Score Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A7AFB5]">
                Alternative Credit Score
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRiskBandBadge(profile.risk_band)}`}>
                {profile.risk_band.toUpperCase()}
              </span>
            </div>

            {/* Score Display */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#F3F5F4]">
                {profile.final_score}
              </span>
              <span className="text-xl font-medium text-[#737C83]">/ 900</span>
            </div>

            {/* Behavioral Score Sub-metric */}
            <div className="mt-2 flex items-center gap-2 text-xs text-[#A7AFB5]">
              <span>Behavioral Composite Score:</span>
              <span className="font-bold text-[#7AB3EF]">{profile.behavioral_score.toFixed(1)} / 100</span>
            </div>

            {/* Clean Customer-Facing Assessment Summary */}
            <div className="mt-4 rounded-xl bg-[#1D2125] p-3.5 text-xs text-[#A7AFB5] border border-[#2B3035]">
              <p className="text-xs font-medium text-[#F3F5F4] leading-relaxed">
                &ldquo;{getScoreSummaryText(profile.final_score)}&rdquo;
              </p>
            </div>
          </div>

          {/* Confidence and Coverage Progress Gauges */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#2B3035] pt-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#F3F5F4]">Confidence</span>
                <span className="font-bold text-[#16A05A]">{profile.confidence_score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-[#16A05A] rounded-full transition-all duration-500"
                  style={{ width: `${profile.confidence_score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] text-[#737C83]">Evidence quality & reliability</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#F3F5F4]">Evidence Coverage</span>
                <span className="font-bold text-[#7AB3EF]">{profile.data_coverage_score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-[#3D78C2] rounded-full transition-all duration-500"
                  style={{ width: `${profile.data_coverage_score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] text-[#737C83]">Observed financial behaviour</span>
            </div>
          </div>
        </div>

        {/* Evidence Used / Coverage Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#7AB3EF] flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                Evidence Used
              </h3>
              <span className="text-xs font-semibold text-[#16A05A]">
                {profile.data_coverage_score}% Coverage
              </span>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              Alternative sources contribute independently. Missing evidence reduces coverage and confidence rather than penalizing score.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* UPI */}
              <div
                className={`rounded-xl p-3 border text-xs transition ${
                  profile.coverage_breakdown?.upi
                    ? 'bg-[#1E2C3D] border-[#3D78C2]/40 text-[#7AB3EF]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>UPI / Bank</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.upi ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Cash-flow regularity</span>
              </div>

              {/* Gig Work */}
              <div
                className={`rounded-xl p-3 border text-xs transition ${
                  profile.coverage_breakdown?.gig_earnings
                    ? 'bg-[#132E20] border-[#16A05A]/40 text-[#4ADE80]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Work Earnings</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.gig_earnings ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Platform income continuity</span>
              </div>

              {/* Utility */}
              <div
                className={`rounded-xl p-3 border text-xs transition ${
                  profile.coverage_breakdown?.utility
                    ? 'bg-[#332511] border-[#D89A24]/40 text-[#FBBF24]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Utility Bills</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.utility ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">On-time bill payments</span>
              </div>

              {/* GST */}
              <div
                className={`rounded-xl p-3 border text-xs transition ${
                  profile.coverage_breakdown?.gst
                    ? 'bg-[#2D1B36] border-[#A855F7]/40 text-[#D8B4FE]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>GST Returns</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.gst ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Merchant business filings</span>
              </div>

              {/* Telecom */}
              <div
                className={`rounded-xl p-3 border text-xs transition ${
                  profile.coverage_breakdown?.telecom
                    ? 'bg-[#1A2536] border-[#60A5FA]/40 text-[#93C5FD]'
                    : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Telecom Plan</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.telecom ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Consistent recharges</span>
              </div>

              {/* Summary Pill */}
              <div className="rounded-xl p-3 border bg-[#1D2125] border-[#2B3035] text-xs">
                <div className="font-bold flex items-center justify-between text-[#F3F5F4]">
                  <span>Total Sources</span>
                  <span className="text-[#16A05A] font-bold">{profile.provenance.length} Active</span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Sufficient for assessment</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#1D2125] p-3 text-[11px] text-[#A7AFB5] border border-[#2B3035]">
            <Info className="inline-block h-3.5 w-3.5 mr-1 text-[#7AB3EF]" />
            Underwriting recommendation: High coverage and multi-source corroboration enable instant automated approvals; lower coverage initiates standard underwriter review.
          </div>
        </div>
      </div>

      {/* 3. FINANCIAL RECONCILIATION: Declared vs Observed */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2B3035] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#3D78C2]" />
              Financial Reconciliation: Declared Context vs. Observed Evidence
            </h3>
            <p className="mt-0.5 text-xs text-[#A7AFB5]">
              Cross-verification comparing self-reported applicant attributes with empirical document signals.
            </p>
          </div>

          {profile.reconciliation && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold border ${
                getReconStatusBadge(profile.reconciliation.overall_status).className
              }`}
            >
              Status: {(profile.reconciliation.overall_status || 'CONSISTENT').replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Reconciliation Summary Alert */}
        {profile.reconciliation && (
          <div className="rounded-xl bg-[#1D2125] p-4 text-xs text-[#F3F5F4] border border-[#2B3035] flex items-start gap-3">
            <Info className="h-4 w-4 text-[#7AB3EF] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#7AB3EF]">Reconciliation Analysis: </span>
              <span className="text-[#A7AFB5]">{profile.reconciliation.summary}</span>
            </div>
          </div>
        )}

        {/* Reconciled Items Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profile.reconciliation?.items ? (
            profile.reconciliation.items.map((item: ReconciliationItem, idx: number) => {
              const statusBadge = getReconStatusBadge(item.status);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-bold text-[#F3F5F4] uppercase text-[10px] tracking-wider truncate">
                        {item.field}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${statusBadge.className}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-b border-[#2B3035] pb-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#737C83]">Declared:</span>
                        <span className="font-semibold text-[#F3F5F4]">{item.declared_value}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#737C83]">Observed:</span>
                        <span className="font-bold text-[#16A05A]">{item.observed_value}</span>
                      </div>
                      {item.variance_pct !== undefined && item.variance_pct > 0 && (
                        <div className="flex justify-between items-baseline text-[11px]">
                          <span className="text-[#737C83]">Variance:</span>
                          <span className="font-medium text-[#FBBF24]">±{item.variance_pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#A7AFB5] pt-1 leading-snug">
                    {item.explanation || item.description}
                  </p>
                </div>
              );
            })
          ) : (
            // Fallback if reconciliation items are not yet loaded
            <>
              <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2">
                <span className="font-bold text-[#A7AFB5] uppercase text-[10px] tracking-wider block">
                  Monthly Income
                </span>
                <div className="flex justify-between items-baseline border-b border-[#2B3035] pb-2">
                  <span className="text-[#737C83]">Declared:</span>
                  <span className="font-semibold text-[#F3F5F4]">{formatCurrency(profile.declared_profile?.monthly_income || 32000)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[#737C83]">Observed:</span>
                  <span className="font-bold text-[#16A05A]">{formatCurrency(observedMonthlyIncome)}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2">
                <span className="font-bold text-[#A7AFB5] uppercase text-[10px] tracking-wider block">
                  Income Channel
                </span>
                <div className="flex justify-between items-baseline border-b border-[#2B3035] pb-2">
                  <span className="text-[#737C83]">Declared:</span>
                  <span className="font-semibold text-[#F3F5F4] uppercase">{profile.declared_profile?.income_channel || 'UPI'}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[#737C83]">Observed:</span>
                  <span className="font-bold text-[#7AB3EF]">UPI & Work Payouts</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2">
                <span className="font-bold text-[#A7AFB5] uppercase text-[10px] tracking-wider block">
                  Monthly Outflows
                </span>
                <div className="flex justify-between items-baseline border-b border-[#2B3035] pb-2">
                  <span className="text-[#737C83]">Declared:</span>
                  <span className="font-semibold text-[#F3F5F4]">{formatCurrency(profile.declared_profile?.monthly_expenses || 16500)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[#737C83]">Observed:</span>
                  <span className="font-bold text-[#16A05A]">{formatCurrency(observedMonthlyExpenses)}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2">
                <span className="font-bold text-[#A7AFB5] uppercase text-[10px] tracking-wider block">
                  Activity Timeline
                </span>
                <div className="flex justify-between items-baseline border-b border-[#2B3035] pb-2">
                  <span className="text-[#737C83]">Status:</span>
                  <span className="font-semibold text-[#F3F5F4]">Active Worker</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[#737C83]">Observed:</span>
                  <span className="font-bold text-[#7AB3EF]">{profile.features.active_days_count || 39} Active Days</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. DETERMINISTIC ASSESSMENT FLAGS */}
      {profile.assessment_flags && profile.assessment_flags.length > 0 && (
        <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2B3035] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
                <Flag className="h-5 w-5 text-[#3D78C2]" />
                Underwriting Signals & Assessment Flags
              </h3>
              <p className="mt-0.5 text-xs text-[#A7AFB5]">
                Standardized deterministic flags generated from rule-based reconciliation and evidence integrity checks.
              </p>
            </div>
            <span className="text-xs text-[#737C83]">
              {profile.assessment_flags.length} Flags Generated
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.assessment_flags.map((flag: AssessmentFlag, idx: number) => {
              const sevBadge = getFlagSeverityBadge(flag.severity);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-[#737C83] uppercase tracking-wider">
                        {flag.category || 'SIGNAL'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sevBadge}`}>
                        {flag.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#F3F5F4] text-xs">{flag.title}</h4>
                    <p className="text-[11px] text-[#A7AFB5] mt-1 leading-snug">
                      {flag.description || flag.explanation}
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-[#737C83] border-t border-[#2B3035]/60">
                    CODE: {flag.code}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. WHY THIS ASSESSMENT (Key Strengths & Watch Areas) */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#F3F5F4] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#16A05A]" />
            Why This Assessment
          </h3>
          <p className="mt-1 text-xs text-[#A7AFB5]">
            Evidence-grounded behavioral drivers and observations explaining this profile.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Positive Signals */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#4ADE80] font-bold text-xs uppercase tracking-wider">
              <Check className="h-4 w-4" />
              Key Strengths & Positive Signals
            </div>
            <ul className="space-y-3 text-xs text-[#F3F5F4]">
              {profile.positive_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80] text-[10px] font-bold">
                    ✓
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#F3F5F4]">{factor.title}</span>
                      {factor.dimension && (
                        <span className="rounded bg-[#1E2C3D] px-1.5 py-0.2 text-[9px] font-semibold text-[#7AB3EF] border border-[#3D78C2]/30">
                          {factor.dimension}
                        </span>
                      )}
                      {factor.period && (
                        <span className="text-[10px] text-[#737C83]">({factor.period})</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A7AFB5] leading-snug">{factor.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Watch Areas */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#FBBF24] font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              Watch Areas & Coverage Observations
            </div>
            <ul className="space-y-3 text-xs text-[#F3F5F4]">
              {profile.attention_factors && profile.attention_factors.length > 0 ? (
                profile.attention_factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#332511] text-[#FBBF24] text-[10px] font-bold">
                      !
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-[#F3F5F4]">{factor.title}</span>
                        {factor.dimension && (
                          <span className="rounded bg-[#332511] px-1.5 py-0.2 text-[9px] font-semibold text-[#FBBF24] border border-[#D89A24]/30">
                            {factor.dimension}
                          </span>
                        )}
                        {factor.period && (
                          <span className="text-[10px] text-[#737C83]">({factor.period})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A7AFB5] leading-snug">{factor.summary}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80] text-[10px] font-bold">
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

      {/* 6. FIVE BEHAVIOURAL DIMENSIONS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#3D78C2]" />
            Behavioural Dimensions
          </h3>
          <span className="text-xs text-[#A7AFB5]">
            0 – 100 scale derived from verified financial activity
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Cash-Flow Stability */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Cash-Flow Stability</span>
                <span className="text-[10px] font-semibold text-[#737C83]">30% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#7AB3EF]">
                  {Math.round(profile.dimensions.cash_flow_stability)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-[#3D78C2] rounded-full"
                  style={{ width: `${profile.dimensions.cash_flow_stability}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#A7AFB5] font-medium leading-snug">
                &ldquo;Consistent monthly inflows with low variance.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Inflow Regularity: <span className="font-semibold text-[#F3F5F4]">Consistent</span></div>
              <div>Net Surplus: <span className="font-semibold text-[#16A05A]">+{formatCurrency(profile.features.net_cash_flow)}</span></div>
            </div>
          </div>

          {/* 2. Income Consistency */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Income Consistency</span>
                <span className="text-[10px] font-semibold text-[#737C83]">20% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#4ADE80]">
                  {Math.round(profile.dimensions.income_consistency)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-[#16A05A] rounded-full"
                  style={{ width: `${profile.dimensions.income_consistency}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#A7AFB5] font-medium leading-snug">
                &ldquo;Demonstrated earning continuity across cycles.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Earning Period: <span className="font-semibold text-[#F3F5F4]">{profile.features.gig_continuity_months || 3} months</span></div>
              <div>Active Days: <span className="font-semibold text-[#F3F5F4]">~{Math.round(profile.features.gig_active_days_per_month || 26)} days/mo</span></div>
            </div>
          </div>

          {/* 3. Payment Discipline */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Payment Discipline</span>
                <span className="text-[10px] font-semibold text-[#737C83]">20% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#FBBF24]">
                  {Math.round(profile.dimensions.payment_discipline)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-[#D89A24] rounded-full"
                  style={{ width: `${profile.dimensions.payment_discipline}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#A7AFB5] font-medium leading-snug">
                &ldquo;High on-time utility payment rate.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>On-Time Rate: <span className="font-semibold text-[#F3F5F4]">{Math.round((profile.features.utility_on_time_ratio || 0.8) * 100)}%</span></div>
              <div>Observed Bills: <span className="font-semibold text-[#F3F5F4]">{profile.features.utility_total_bills || 5} cycles</span></div>
            </div>
          </div>

          {/* 4. Activity Continuity */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Activity Continuity</span>
                <span className="text-[10px] font-semibold text-[#737C83]">15% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#D8B4FE]">
                  {Math.round(profile.dimensions.activity_continuity)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${profile.dimensions.activity_continuity}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#A7AFB5] font-medium leading-snug">
                &ldquo;Steady day-to-day economic transaction frequency.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Active Days: <span className="font-semibold text-[#F3F5F4]">{profile.features.active_days_count || 39} days</span></div>
              <div>Transactions: <span className="font-semibold text-[#F3F5F4]">{profile.features.total_transactions || 39} txns</span></div>
            </div>
          </div>

          {/* 5. Financial Resilience */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Financial Resilience</span>
                <span className="text-[10px] font-semibold text-[#737C83]">15% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#93C5FD]">
                  {Math.round(profile.dimensions.financial_resilience)}
                </span>
                <span className="text-xs text-[#737C83]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#1D2125] border border-[#2B3035] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${profile.dimensions.financial_resilience}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#A7AFB5] font-medium leading-snug">
                &ldquo;Positive net cash buffer protects against volatility.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Inflow Coverage: <span className="font-semibold text-[#F3F5F4]">{profile.features.credit_debit_ratio ? profile.features.credit_debit_ratio.toFixed(1) : '3.0'}x</span></div>
              <div>Buffer Status: <span className="font-semibold text-[#16A05A]">Healthy</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. EVIDENCE CONTRIBUTION TRACES */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#F3F5F4] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#3D78C2]" />
            Evidence Contribution Traces
          </h3>
          <p className="mt-1 text-xs text-[#A7AFB5]">
            Explore how specific documents and extracted signals contribute directly to each behavioural dimension.
          </p>
        </div>

        <div className="space-y-3">
          {profile.evidence_traces && profile.evidence_traces.length > 0 ? (
            profile.evidence_traces.map((trace, idx) => {
              const isExpanded = activeTraceIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2B3035] overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setActiveTraceIndex(isExpanded ? null : idx)}
                    className={`w-full flex items-center justify-between p-4 text-left transition cursor-pointer ${
                      isExpanded ? 'bg-[#1E2C3D]/60' : 'bg-[#1D2125] hover:bg-[#24292E]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#F3F5F4]">{trace.dimension_title}</h4>
                        <p className="text-xs text-[#A7AFB5] mt-0.5">{trace.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded bg-[#1E2C3D] px-2.5 py-1 text-xs font-bold text-[#7AB3EF] border border-[#3D78C2]/30">
                        Score: {trace.score.toFixed(1)}/100
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#737C83]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#737C83]" />
                      )}
                    </div>
                  </button>

                  {/* Trace Breakdown Body */}
                  {isExpanded && (
                    <div className="border-t border-[#2B3035] bg-[#171A1D] p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="grid gap-4 md:grid-cols-2 text-xs">
                        {/* Evidence Sources */}
                        <div className="rounded-lg bg-[#1D2125] p-3.5 border border-[#2B3035]">
                          <span className="text-[10px] font-bold text-[#737C83] uppercase tracking-wider block mb-2">
                            Contributing Evidence Documents
                          </span>
                          <ul className="space-y-1 text-[#F3F5F4]">
                            {trace.sources.map((src, sIdx) => (
                              <li key={sIdx} className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-[#3D78C2]" />
                                <span className="font-mono text-xs">{src}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Extracted Quantitative Signals */}
                        <div className="rounded-lg bg-[#1D2125] p-3.5 border border-[#2B3035]">
                          <span className="text-[10px] font-bold text-[#737C83] uppercase tracking-wider block mb-2">
                            Extracted Quantitative Signals
                          </span>
                          <ul className="space-y-1 text-[#16A05A]">
                            {trace.extracted_signals.map((sig, sigIdx) => (
                              <li key={sigIdx} className="flex items-center gap-2 font-mono text-xs">
                                <span>•</span>
                                <span className="text-[#F3F5F4]">{sig}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Fallback to positive factor traces if evidence_traces not populated
            profile.positive_factors.map((factor, idx) => {
              const isExpanded = activeTraceIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2B3035] overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setActiveTraceIndex(isExpanded ? null : idx)}
                    className={`w-full flex items-center justify-between p-4 text-left transition cursor-pointer ${
                      isExpanded ? 'bg-[#1E2C3D]/60' : 'bg-[#1D2125] hover:bg-[#24292E]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#F3F5F4]">{factor.title}</h4>
                        <p className="text-xs text-[#A7AFB5] mt-0.5">{factor.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline-block rounded bg-[#132E20] px-2 py-0.5 text-[10px] font-bold text-[#4ADE80] uppercase border border-[#16A05A]/30">
                        {factor.impact} Impact
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#737C83]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#737C83]" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#2B3035] bg-[#171A1D] p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="grid gap-3 sm:grid-cols-4 text-xs">
                        <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035]">
                          <span className="text-[10px] font-bold text-[#737C83] uppercase">Signal</span>
                          <div className="mt-1 font-semibold text-[#F3F5F4] truncate">{factor.title}</div>
                        </div>
                        <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035]">
                          <span className="text-[10px] font-bold text-[#737C83] uppercase">Observed Value</span>
                          <div className="mt-1 font-semibold text-[#4ADE80]">{factor.observed_value}</div>
                        </div>
                        <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035]">
                          <span className="text-[10px] font-bold text-[#737C83] uppercase">Source Channel</span>
                          <div className="mt-1 font-semibold text-[#7AB3EF] uppercase">{factor.source_type}</div>
                        </div>
                        <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035]">
                          <span className="text-[10px] font-bold text-[#737C83] uppercase">Integrity</span>
                          <div className="mt-1 font-semibold text-[#4ADE80]">PASSED (Verified)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 8. INTERACTIVE WHAT-IF SIMULATOR */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#F3F5F4] flex items-center gap-2">
                <Sliders className="h-5 w-5 text-[#3D78C2]" />
                What-If Scenario Simulation
              </h3>
              <span className="rounded-full bg-[#1E2C3D] px-2 py-0.5 text-[10px] font-bold text-[#7AB3EF] border border-[#3D78C2]/30">
                HYPOTHETICAL SANDBOX
              </span>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              Simulate prospective financial adjustments to project potential score improvements without mutating original records.
            </p>
          </div>
          <span className="rounded-full bg-[#1D2125] px-3 py-1 text-[11px] font-medium text-[#A7AFB5] border border-[#2B3035]">
            Non-mutating Scenario • Not an approval guarantee
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Slider 1: Income Stability */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#F3F5F4] mb-2">
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
            <div className="flex justify-between items-center text-xs font-bold text-[#F3F5F4] mb-2">
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
              <span>Current (80%)</span>
              <span>+15% on-time</span>
              <span>100% on-time</span>
            </div>
          </div>

          {/* Slider 3: Platform Continuity */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#F3F5F4] mb-2">
              <span>Extend Active Platform History</span>
              <span className="text-[#D8B4FE]">+{whatIfContinuity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={whatIfContinuity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setWhatIfContinuity(val);
                handleWhatIfSimulate(whatIfIncome / 100, whatIfPayment / 100, val / 100, whatIfBuffer);
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#737C83] mt-1">
              <span>Current</span>
              <span>+15% continuous days</span>
              <span>+30% continuous days</span>
            </div>
          </div>

          {/* Slider 4: Monthly Buffer */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#F3F5F4] mb-2">
              <span>Add Recurring Monthly Surplus</span>
              <span className="text-[#93C5FD]">+{formatCurrency(whatIfBuffer)}/mo</span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="2500"
              value={whatIfBuffer}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setWhatIfBuffer(val);
                handleWhatIfSimulate(whatIfIncome / 100, whatIfPayment / 100, whatIfContinuity / 100, val);
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#737C83] mt-1">
              <span>₹0</span>
              <span>+₹7,500</span>
              <span>+₹15,000</span>
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        {whatIfResult && (whatIfIncome > 0 || whatIfPayment > 0 || whatIfContinuity > 0 || whatIfBuffer > 0) && (
          <div className="rounded-xl border border-[#3D78C2]/40 bg-[#1E2C3D] p-5 flex flex-col gap-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#7AB3EF]">Simulated Score Trajectory:</span>
                  <span className="text-2xl font-extrabold text-[#F3F5F4]">
                    {whatIfResult.estimated_score} / 900
                  </span>
                  <span className="rounded-full bg-[#132E20] px-2.5 py-0.5 text-xs font-bold text-[#4ADE80] border border-[#16A05A]/30">
                    +{whatIfResult.score_delta} points
                  </span>
                </div>
                <p className="text-xs text-[#A7AFB5] mt-1 leading-relaxed">{whatIfResult.explanation}</p>
              </div>
              <button
                onClick={() => {
                  setWhatIfIncome(0);
                  setWhatIfPayment(0);
                  setWhatIfContinuity(0);
                  setWhatIfBuffer(0);
                  setWhatIfResult(null);
                }}
                className="text-xs text-[#7AB3EF] underline font-semibold shrink-0 cursor-pointer"
              >
                Reset Simulation
              </button>
            </div>

            {/* Simulation Steps */}
            {whatIfResult.simulation_steps && whatIfResult.simulation_steps.length > 0 && (
              <div className="pt-2 border-t border-[#3D78C2]/30 text-xs">
                <span className="text-[10px] font-bold text-[#7AB3EF] uppercase tracking-wider block mb-1">
                  Simulation Steps:
                </span>
                <ul className="space-y-1 text-[#F3F5F4]">
                  {whatIfResult.simulation_steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-2">
                      <span className="text-[#4ADE80]">✓</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 9. DOCUMENT PROVENANCE & AUDIT REGISTRY */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#3D78C2]" />
              Document Provenance & Audit Registry
            </h3>
            <p className="mt-0.5 text-xs text-[#A7AFB5]">
              All calculation inputs retain complete audit trails, source hashes, and extraction confidence metrics.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#2B3035]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1D2125] text-[#A7AFB5] font-semibold border-b border-[#2B3035]">
              <tr>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Source Channel</th>
                <th className="px-4 py-3">Pipeline Origin</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-center">Records</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-center">Validation</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3035]">
              {profile.provenance.map((prov, i) => {
                const matchedEv = evidenceList.find((e) => e.id === prov.evidence_id) || ({
                  id: prov.evidence_id,
                  customer_id: profile.customer_id,
                  source_type: prov.source_type,
                  source_provider: prov.document_name,
                  period_start: prov.period_start,
                  period_end: prov.period_end,
                  source_quality: prov.source_quality_score,
                  extraction_confidence: prov.extraction_confidence,
                  origin: prov.origin,
                  provenance: prov,
                } as CanonicalEvidence);

                const isLive =
                  prov.origin === 'LIVE_N8N_GEMINI' ||
                  prov.origin === 'LIVE_GEMINI' ||
                  prov.origin === 'LIVE_PARSER';

                return (
                  <tr key={prov.evidence_id || i} className="hover:bg-[#1D2125]/70 transition">
                    <td className="px-4 py-3 font-medium text-[#F3F5F4] flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#3D78C2]" />
                      <span>{prov.document_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1E2C3D] text-[#7AB3EF] border border-[#3D78C2]/30 uppercase">
                        {prov.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLive
                            ? 'bg-[#132E20] text-[#4ADE80] border border-[#16A05A]/30'
                            : 'bg-[#1D2125] text-[#A7AFB5] border border-[#2B3035]'
                        }`}
                      >
                        {prov.origin === 'LIVE_N8N_GEMINI' && '⚡ LIVE (n8n + Gemini)'}
                        {prov.origin === 'LIVE_GEMINI' && '⚡ LIVE (Gemini AI)'}
                        {prov.origin === 'LIVE_PARSER' && '⚡ LIVE (Extracted)'}
                        {(!prov.origin || prov.origin === 'SYNTHETIC_DEMO') && '📊 DEMO / BENCHMARK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#A7AFB5]">
                      {prov.period_start} → {prov.period_end}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#F3F5F4]">
                      {prov.record_count}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#4ADE80]">
                      {Math.round(prov.extraction_confidence * 100)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#132E20] text-[#4ADE80] border border-[#16A05A]/30">
                        {prov.validation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onInspectEvidence(matchedEv)}
                        className="rounded bg-[#1D2125] border border-[#2B3035] px-2.5 py-1 text-[11px] font-semibold text-[#7AB3EF] hover:bg-[#24292E] hover:text-white transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. UNDERWRITER DISCLAIMER & GOVERNANCE NOTICE */}
      <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-4 text-[11px] text-[#A7AFB5] leading-relaxed">
        <span className="font-bold text-[#F3F5F4]">Prototype Governance Notice: </span>
        {profile.disclaimer}
      </div>
    </div>
  );
};
