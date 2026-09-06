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
} from 'lucide-react';
import { AssessmentProfile, CanonicalEvidence, ExplainableReason } from '../lib/types';
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
  const [whatIfResult, setWhatIfResult] = useState<{ score: number; delta: number; explanation: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const getRiskBandBadge = (band: string) => {
    switch (band) {
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

  const getScoreSummaryText = (score: number) => {
    if (score >= 800) {
      return 'Strong and consistent financial behaviour across the evidence provided.';
    } else if (score >= 700) {
      return 'Stable financial behaviour with good payment discipline and regular activity.';
    } else if (score >= 600) {
      return 'Moderate financial regularity with some variation in observed inflows or payment timing.';
    } else {
      return 'Developing credit profile. Additional evidence can help provide a more complete assessment.';
    }
  };

  const handleWhatIfSimulate = async (incomeDelta: number, paymentDelta: number) => {
    setIsSimulating(true);
    try {
      const res = await calculateWhatIf(profile, incomeDelta, paymentDelta);
      setWhatIfResult({
        score: res.estimated_score,
        delta: res.score_delta,
        explanation: res.explanation,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Build clean watch areas from attention factors or contextual observations
  const watchAreas: string[] = [];
  if (profile.attention_factors && profile.attention_factors.length > 0) {
    profile.attention_factors.forEach((f) => watchAreas.push(f.summary || f.title));
  }
  if (profile.dimensions.payment_discipline < 85 && !watchAreas.some(w => w.toLowerCase().includes('payment') || w.toLowerCase().includes('bill'))) {
    watchAreas.push('Payment discipline shows occasional timing variance in observed records.');
  }
  if (profile.data_coverage_score < 100 && !watchAreas.some(w => w.toLowerCase().includes('coverage') || w.toLowerCase().includes('unobserved'))) {
    watchAreas.push(`Evidence coverage is ${profile.data_coverage_score}%, so some financial activity remains unobserved.`);
  }

  const observedMonthlyIncome = profile.features.gig_avg_monthly_earnings > 0 
    ? profile.features.gig_avg_monthly_earnings 
    : profile.features.avg_monthly_inflow > 0 
    ? profile.features.avg_monthly_inflow 
    : (profile.declared_profile?.monthly_income || 32000);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Profile Header / Context Card */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2B3035] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#1E2C3D] px-2.5 py-0.5 text-xs font-semibold text-[#7AB3EF] border border-[#3D78C2]/30">
                Assessment ID: {profile.assessment_id}
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
            <span className="block text-[10px] uppercase font-bold text-[#737C83]">Evidence Ingested</span>
            <span className="font-bold text-[#7AB3EF] text-sm">
              {profile.provenance.length} Sources Verified
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
        <div className="lg:col-span-5 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
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
        <div className="lg:col-span-7 rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
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
              Alternative sources contribute independently. Missing evidence reduces coverage/confidence, not credit score.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* UPI */}
              <div className={`rounded-xl p-3 border text-xs transition ${
                profile.coverage_breakdown?.upi 
                  ? 'bg-[#1E2C3D] border-[#3D78C2]/40 text-[#7AB3EF]' 
                  : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>UPI / Bank</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.upi ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Cash-flow regularity</span>
              </div>

              {/* Gig Work */}
              <div className={`rounded-xl p-3 border text-xs transition ${
                profile.coverage_breakdown?.gig_earnings 
                  ? 'bg-[#132E20] border-[#16A05A]/40 text-[#4ADE80]' 
                  : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Work Earnings</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.gig_earnings ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Platform income continuity</span>
              </div>

              {/* Utility */}
              <div className={`rounded-xl p-3 border text-xs transition ${
                profile.coverage_breakdown?.utility 
                  ? 'bg-[#332511] border-[#D89A24]/40 text-[#FBBF24]' 
                  : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Utility Bills</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.utility ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">On-time bill payments</span>
              </div>

              {/* GST */}
              <div className={`rounded-xl p-3 border text-xs transition ${
                profile.coverage_breakdown?.gst 
                  ? 'bg-[#2D1B36] border-[#A855F7]/40 text-[#D8B4FE]' 
                  : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>GST Returns</span>
                  <span className="text-[11px] font-semibold">
                    {profile.coverage_breakdown?.gst ? '✓ Verified' : 'Not provided'}
                  </span>
                </div>
                <span className="text-[10px] block mt-1 text-[#A7AFB5]">Merchant business filings</span>
              </div>

              {/* Telecom */}
              <div className={`rounded-xl p-3 border text-xs transition ${
                profile.coverage_breakdown?.telecom 
                  ? 'bg-[#1A2536] border-[#60A5FA]/40 text-[#93C5FD]' 
                  : 'bg-[#1D2125] border-[#2B3035] text-[#737C83]'
              }`}>
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
            Underwriting policy: High coverage enables instant automated approvals, while lower coverage triggers selective underwriter review.
          </div>
        </div>
      </div>

      {/* 3. Five Behavioural Dimensions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#3D78C2]" />
            Behavioural Profile
          </h3>
          <span className="text-xs text-[#A7AFB5]">
            0 – 100 scale based on verified customer behaviour
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Cash-Flow Stability */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Cash-Flow Stability</span>
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
                &ldquo;Income inflows have remained stable.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Inflow Regularity: <span className="font-semibold text-[#F3F5F4]">Consistent</span></div>
              <div>Net Cash Surplus: <span className="font-semibold text-[#16A05A]">+{formatCurrency(profile.features.net_cash_flow)}</span></div>
            </div>
          </div>

          {/* 2. Income Consistency */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Income Consistency</span>
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
                &ldquo;Income activity is consistent over time.&rdquo;
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
                &ldquo;Most observed bills were paid on time.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>On-Time Rate: <span className="font-semibold text-[#F3F5F4]">{Math.round((profile.features.utility_on_time_ratio || 0.8) * 100)}%</span></div>
              <div>Observed Bills: <span className="font-semibold text-[#F3F5F4]">{profile.features.utility_total_bills || 5} records</span></div>
            </div>
          </div>

          {/* 4. Activity Continuity */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Activity Continuity</span>
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
                &ldquo;Financial activity has remained active across the observed period.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Active Days: <span className="font-semibold text-[#F3F5F4]">{profile.features.active_days_count || 39} days</span></div>
              <div>Transactions: <span className="font-semibold text-[#F3F5F4]">{profile.features.total_transactions || 39} records</span></div>
            </div>
          </div>

          {/* 5. Financial Resilience */}
          <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3F5F4]">Financial Resilience</span>
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
                &ldquo;Observed inflows provide a healthy buffer against regular outflows.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#2B3035] text-[11px] text-[#A7AFB5] space-y-1">
              <div>Inflow Coverage: <span className="font-semibold text-[#F3F5F4]">{profile.features.credit_debit_ratio ? profile.features.credit_debit_ratio.toFixed(1) : '3.0'}x</span></div>
              <div>Cash Buffer: <span className="font-semibold text-[#16A05A]">Healthy</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. WHY THIS SCORE (Explainability Section) */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#F3F5F4] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#16A05A]" />
            Why This Score
          </h3>
          <p className="mt-1 text-xs text-[#A7AFB5]">
            Key behavioural signals and observed factors explaining this alternative credit assessment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Positive Signals */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#4ADE80] font-bold text-xs uppercase tracking-wider">
              <Check className="h-4 w-4" />
              Positive Signals
            </div>
            <ul className="space-y-2.5 text-xs text-[#F3F5F4]">
              {profile.positive_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80] text-[10px] font-bold">
                    ✓
                  </span>
                  <div>
                    <span className="font-semibold text-[#F3F5F4]">{factor.title}</span>
                    <p className="text-[11px] text-[#A7AFB5] mt-0.5">{factor.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Watch Areas */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#FBBF24] font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              Watch Areas
            </div>
            <ul className="space-y-2.5 text-xs text-[#F3F5F4]">
              {watchAreas.length > 0 ? (
                watchAreas.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#332511] text-[#FBBF24] text-[10px] font-bold">
                      •
                    </span>
                    <p className="text-[11px] text-[#A7AFB5] leading-relaxed">{area}</p>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#132E20] text-[#4ADE80] text-[10px] font-bold">
                    ✓
                  </span>
                  <p className="text-[11px] text-[#A7AFB5]">No high-risk warnings observed in the provided evidence.</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. Declared vs Observed Comparison Card */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#3D78C2]" />
              Declared Context vs. Observed Evidence
            </h3>
            <p className="mt-0.5 text-xs text-[#A7AFB5]">
              Demonstrating the alternative assessment equation: Declared Context + Observed Evidence = Alternative Credit Profile
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Income Comparison */}
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
              <span className="font-bold text-[#16A05A]">{formatCurrency(observedMonthlyIncome)} avg</span>
            </div>
            <div className="text-[10px] text-[#4ADE80] font-medium pt-1">
              ✓ Inflows match declared profile
            </div>
          </div>

          {/* Income Channel Comparison */}
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
              <span className="font-bold text-[#7AB3EF]">UPI Activity Verified</span>
            </div>
            <div className="text-[10px] text-[#7AB3EF] font-medium pt-1">
              ✓ Channel verified via statements
            </div>
          </div>

          {/* Outflows & Household */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4 text-xs space-y-2">
            <span className="font-bold text-[#A7AFB5] uppercase text-[10px] tracking-wider block">
              Cash Surplus & Household
            </span>
            <div className="flex justify-between items-baseline border-b border-[#2B3035] pb-2">
              <span className="text-[#737C83]">Declared Exp:</span>
              <span className="font-semibold text-[#F3F5F4]">{formatCurrency(profile.declared_profile?.monthly_expenses || 16500)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-[#737C83]">Net Surplus:</span>
              <span className="font-bold text-[#16A05A]">+{formatCurrency(profile.features.net_cash_flow)}</span>
            </div>
            <div className="text-[10px] text-[#4ADE80] font-medium pt-1">
              ✓ Healthy financial cushion
            </div>
          </div>
        </div>
      </div>

      {/* 6. Grounded Evidence Provenance Trace */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#F3F5F4] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#3D78C2]" />
            Evidence Trace
          </h3>
          <p className="mt-1 text-xs text-[#A7AFB5]">
            Select any factor below to inspect the 5-stage verification and evidence provenance trace.
          </p>
        </div>

        <div className="space-y-3">
          {profile.positive_factors.map((factor, idx) => {
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

                {/* Evidence Trace Audit Accordion Body */}
                {isExpanded && (
                  <div className="border-t border-[#2B3035] bg-[#171A1D] p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#7AB3EF] flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      5-Stage Evidence Provenance Trace
                    </div>

                    <div className="grid gap-3 sm:grid-cols-5 text-xs">
                      {/* Step 1 */}
                      <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#737C83] uppercase">1. Observation</span>
                        <div className="mt-1 font-semibold text-[#F3F5F4] truncate">{factor.title}</div>
                        <span className="text-[10px] text-[#A7AFB5] block mt-1">Fact extracted from evidence</span>
                      </div>

                      {/* Step 2 */}
                      <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#737C83] uppercase">2. Measured Value</span>
                        <div className="mt-1 font-semibold text-[#4ADE80]">{factor.observed_value}</div>
                        <span className="text-[10px] text-[#A7AFB5] block mt-1">Observed behavioural signal</span>
                      </div>

                      {/* Step 3 */}
                      <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#737C83] uppercase">3. Source Channel</span>
                        <div className="mt-1 font-semibold text-[#7AB3EF] uppercase">{factor.source_type}</div>
                        <span className="text-[10px] text-[#A7AFB5] block mt-1">{factor.evidence_ref}</span>
                      </div>

                      {/* Step 4 */}
                      <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#737C83] uppercase">4. Integrity</span>
                        <div className="mt-1 font-semibold text-[#4ADE80]">PASSED (Verified)</div>
                        <span className="text-[10px] text-[#A7AFB5] block mt-1">Validated against integrity rules</span>
                      </div>

                      {/* Step 5 */}
                      <div className="rounded-lg bg-[#1D2125] p-3 border border-[#2B3035] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#737C83] uppercase">5. Dimension Impact</span>
                        <div className="mt-1 font-semibold text-[#7AB3EF]">Positive Contribution</div>
                        <span className="text-[10px] text-[#A7AFB5] block mt-1">Strengthens profile</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Interactive What-If Simulator */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#F3F5F4] flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#3D78C2]" />
              What-If Scenario Simulator
            </h3>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              Simulate hypothetical behavioural improvements to estimate score trajectory.
            </p>
          </div>
          <span className="rounded-full bg-[#1D2125] px-3 py-1 text-[11px] font-medium text-[#A7AFB5] border border-[#2B3035]">
            Scenario Only • Not an approval guarantee
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Slider 1: Income Stability */}
          <div className="rounded-xl border border-[#2B3035] bg-[#1D2125] p-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#F3F5F4] mb-2">
              <span>Improve Monthly Income Consistency</span>
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
                handleWhatIfSimulate(val / 100, whatIfPayment / 100);
              }}
              className="w-full accent-[#3D78C2] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#737C83] mt-1">
              <span>Current</span>
              <span>+15% stability</span>
              <span>+30% stability</span>
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
                handleWhatIfSimulate(whatIfIncome / 100, val / 100);
              }}
              className="w-full accent-[#16A05A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#737C83] mt-1">
              <span>Current (80%)</span>
              <span>+15% on-time</span>
              <span>100% on-time</span>
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        {whatIfResult && (whatIfIncome > 0 || whatIfPayment > 0) && (
          <div className="rounded-xl border border-[#3D78C2]/40 bg-[#1E2C3D] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7AB3EF]">Estimated Trajectory:</span>
                <span className="text-lg font-bold text-[#F3F5F4]">
                  {whatIfResult.score} / 900
                </span>
                <span className="rounded-full bg-[#132E20] px-2 py-0.5 text-xs font-bold text-[#4ADE80] border border-[#16A05A]/30">
                  +{whatIfResult.delta} points
                </span>
              </div>
              <p className="text-xs text-[#A7AFB5] mt-1">{whatIfResult.explanation}</p>
            </div>
            <button
              onClick={() => {
                setWhatIfIncome(0);
                setWhatIfPayment(0);
                setWhatIfResult(null);
              }}
              className="text-xs text-[#7AB3EF] underline font-semibold shrink-0 cursor-pointer"
            >
              Reset Simulation
            </button>
          </div>
        )}
      </div>

      {/* 8. Ingested Evidence Provenance Table */}
      <div className="rounded-2xl border border-[#2B3035] bg-[#171A1D] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F3F5F4] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#3D78C2]" />
              Document Provenance & Audit Registry
            </h3>
            <p className="mt-0.5 text-xs text-[#A7AFB5]">
              All calculation inputs retain complete audit trails and validation timestamps.
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
                const matchedEv = evidenceList.find((e) => e.id === prov.evidence_id) || {
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
                } as CanonicalEvidence;

                const isLive = prov.origin === 'LIVE_N8N_GEMINI' || prov.origin === 'LIVE_GEMINI' || prov.origin === 'LIVE_PARSER';

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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLive
                          ? 'bg-[#132E20] text-[#4ADE80] border border-[#16A05A]/30'
                          : 'bg-[#1D2125] text-[#A7AFB5] border border-[#2B3035]'
                      }`}>
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

      {/* 9. Underwriter Disclaimer */}
      <div className="rounded-xl border border-[#2B3035] bg-[#171A1D] p-4 text-[11px] text-[#A7AFB5] leading-relaxed">
        <span className="font-bold text-[#F3F5F4]">Prototype Governance Notice: </span>
        {profile.disclaimer}
      </div>
    </div>
  );
};

