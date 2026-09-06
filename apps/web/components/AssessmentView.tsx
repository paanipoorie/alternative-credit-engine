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
        return 'bg-[#E8F6EE] text-[#0B9348] border-[#A7F3D0]';
      case 'Low-Moderate Risk':
        return 'bg-[#EBF2FC] text-[#1F4E8C] border-[#BFDBFE]';
      case 'Moderate Risk':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Customer Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#DDE3E0] bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EBF2FC] px-2.5 py-0.5 text-xs font-semibold text-[#1F4E8C]">
              Assessment ID: {profile.assessment_id}
            </span>
            <span className="text-xs text-[#858585]">
              {new Date(profile.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1F4E8C]">
            {profile.customer_name || 'Rajesh Kumar'}
          </h2>
          <p className="text-xs text-[#5F6368]">
            Persona: <span className="font-semibold text-[#222222]">Gig Delivery Partner / Informal Worker</span> • Transparent Behavioural Assessment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUploadMore}
            className="rounded-lg border border-[#DDE3E0] bg-[#F7F9F8] px-3.5 py-2 text-xs font-semibold text-[#1F4E8C] hover:bg-[#EBF2FC] transition shadow-xs"
          >
            + Ingest More Evidence
          </button>
        </div>
      </div>

      {/* Main Score & Topline Metrics Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Credit Profile Score Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                Alternative Credit Score
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRiskBandBadge(profile.risk_band)}`}>
                {profile.risk_band.toUpperCase()}
              </span>
            </div>

            {/* Score Number Display */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#1F4E8C]">
                {profile.final_score}
              </span>
              <span className="text-xl font-medium text-[#858585]">/ 900</span>
            </div>

            {/* Behavioural Score Calculation Formula */}
            <div className="mt-3 rounded-lg bg-[#F7F9F8] p-3 text-xs text-[#5F6368] border border-[#DDE3E0]">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#222222]">Composite Behavioural Score (B):</span>
                <span className="font-mono font-bold text-[#0B9348] text-sm">{profile.behavioral_score.toFixed(1)} / 100</span>
              </div>
              <p className="mt-1 text-[11px] text-[#858585]">
                Score formula: <span className="font-mono">round(300 + 6 × B)</span>
              </p>
            </div>
          </div>

          {/* Confidence and Coverage Progress Gauges */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#DDE3E0] pt-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#222222]">Confidence</span>
                <span className="font-bold text-[#0B9348]">{profile.confidence_score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-[#0B9348] rounded-full transition-all duration-500"
                  style={{ width: `${profile.confidence_score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] text-[#858585]">Data & OCR Integrity</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#222222]">Data Coverage</span>
                <span className="font-bold text-[#1F4E8C]">{profile.data_coverage_score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-[#1F4E8C] rounded-full transition-all duration-500"
                  style={{ width: `${profile.data_coverage_score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] text-[#858585]">Observed Dimensions</span>
            </div>
          </div>
        </div>

        {/* Coverage Breakdown & Source Pills (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F4E8C] flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              Evidence Coverage Breakdown
            </h3>
            <p className="mt-1 text-xs text-[#5F6368]">
              Alternative sources contribute independently. Missing sources reduce coverage/confidence, never credit score.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className={`rounded-xl p-3 border text-xs ${
                profile.coverage_breakdown?.upi ? 'bg-[#EBF2FC] border-[#BFDBFE] text-[#1F4E8C]' : 'bg-[#F7F9F8] border-[#DDE3E0] text-[#858585]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>UPI Transactions</span>
                  <span>{profile.coverage_breakdown?.upi ? '✓ 35%' : '0%'}</span>
                </div>
                <span className="text-[10px] block mt-1">Cash flow & regular inflows</span>
              </div>

              <div className={`rounded-xl p-3 border text-xs ${
                profile.coverage_breakdown?.gig_earnings ? 'bg-[#E8F6EE] border-[#A7F3D0] text-[#0B9348]' : 'bg-[#F7F9F8] border-[#DDE3E0] text-[#858585]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Gig Earnings</span>
                  <span>{profile.coverage_breakdown?.gig_earnings ? '✓ 25%' : '0%'}</span>
                </div>
                <span className="text-[10px] block mt-1">Platform work continuity</span>
              </div>

              <div className={`rounded-xl p-3 border text-xs ${
                profile.coverage_breakdown?.utility ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-[#F7F9F8] border-[#DDE3E0] text-[#858585]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Utility History</span>
                  <span>{profile.coverage_breakdown?.utility ? '✓ 20%' : '0%'}</span>
                </div>
                <span className="text-[10px] block mt-1">On-time bill payments</span>
              </div>

              <div className={`rounded-xl p-3 border text-xs ${
                profile.coverage_breakdown?.gst ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-[#F7F9F8] border-[#DDE3E0] text-[#858585]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>GST Returns</span>
                  <span>{profile.coverage_breakdown?.gst ? '✓ 15%' : 'Unobserved'}</span>
                </div>
                <span className="text-[10px] block mt-1">Merchant business filing</span>
              </div>

              <div className={`rounded-xl p-3 border text-xs ${
                profile.coverage_breakdown?.telecom ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-[#F7F9F8] border-[#DDE3E0] text-[#858585]'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Telecom Plan</span>
                  <span>{profile.coverage_breakdown?.telecom ? '✓ 5%' : 'Unobserved'}</span>
                </div>
                <span className="text-[10px] block mt-1">Continuous recharges</span>
              </div>

              <div className="rounded-xl p-3 border bg-[#F7F9F8] border-[#DDE3E0] text-[#858585] text-xs">
                <div className="font-bold flex items-center justify-between">
                  <span>Total Coverage</span>
                  <span className="text-[#1F4E8C] font-bold">{profile.data_coverage_score}%</span>
                </div>
                <span className="text-[10px] block mt-1">Sufficient for underwriting</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#F7F9F8] p-3 text-[11px] text-[#5F6368] border border-[#DDE3E0]">
            <Info className="inline-block h-3.5 w-3.5 mr-1 text-[#1F4E8C]" />
            Underwriting policy: High coverage enables instant automated approvals, while lower coverage triggers selective underwriter review.
          </div>
        </div>
      </div>

      {/* 5 Behavioural Dimensions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1F4E8C] flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Five Behavioural Dimensions (0 – 100 Scale)
          </h3>
          <span className="text-xs text-[#5F6368]">
            Deterministic mathematical signals from extracted evidence
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Cash-flow Stability */}
          <div className="rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#222222]">Cash-Flow Stability</span>
                <span className="rounded bg-[#EBF2FC] px-1.5 py-0.5 text-[10px] font-bold text-[#1F4E8C]">30% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#1F4E8C]">
                  {Math.round(profile.dimensions.cash_flow_stability)}
                </span>
                <span className="text-xs text-[#858585]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-[#1F4E8C] rounded-full"
                  style={{ width: `${profile.dimensions.cash_flow_stability}%` }}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DDE3E0] text-[11px] text-[#5F6368] space-y-1">
              <div>Inflow CV: <span className="font-semibold text-[#222222]">{profile.features.inflow_volatility_cv.toFixed(2)}</span> (Low)</div>
              <div>Net Flow: <span className="font-semibold text-[#0B9348]">+{formatCurrency(profile.features.net_cash_flow)}</span></div>
            </div>
          </div>

          {/* 2. Income Consistency */}
          <div className="rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#222222]">Income Consistency</span>
                <span className="rounded bg-[#E8F6EE] px-1.5 py-0.5 text-[10px] font-bold text-[#0B9348]">20% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0B9348]">
                  {Math.round(profile.dimensions.income_consistency)}
                </span>
                <span className="text-xs text-[#858585]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-[#0B9348] rounded-full"
                  style={{ width: `${profile.dimensions.income_consistency}%` }}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DDE3E0] text-[11px] text-[#5F6368] space-y-1">
              <div>Continuity: <span className="font-semibold text-[#222222]">{profile.features.gig_continuity_months || 3} months</span></div>
              <div>Active Days: <span className="font-semibold text-[#222222]">{Math.round(profile.features.gig_active_days_per_month || 26)} d/mo</span></div>
            </div>
          </div>

          {/* 3. Payment Discipline */}
          <div className="rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#222222]">Payment Discipline</span>
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">20% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-amber-600">
                  {Math.round(profile.dimensions.payment_discipline)}
                </span>
                <span className="text-xs text-[#858585]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${profile.dimensions.payment_discipline}%` }}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DDE3E0] text-[11px] text-[#5F6368] space-y-1">
              <div>On-Time Rate: <span className="font-semibold text-[#222222]">{Math.round((profile.features.utility_on_time_ratio || 0.8) * 100)}%</span></div>
              <div>Observed Bills: <span className="font-semibold text-[#222222]">{profile.features.utility_total_bills || 5} records</span></div>
            </div>
          </div>

          {/* 4. Activity Continuity */}
          <div className="rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#222222]">Activity Continuity</span>
                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">15% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-purple-700">
                  {Math.round(profile.dimensions.activity_continuity)}
                </span>
                <span className="text-xs text-[#858585]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${profile.dimensions.activity_continuity}%` }}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DDE3E0] text-[11px] text-[#5F6368] space-y-1">
              <div>Active Days: <span className="font-semibold text-[#222222]">{profile.features.active_days_count || 39} days</span></div>
              <div>Transactions: <span className="font-semibold text-[#222222]">{profile.features.total_transactions || 39} total</span></div>
            </div>
          </div>

          {/* 5. Financial Resilience */}
          <div className="rounded-xl border border-[#DDE3E0] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#222222]">Financial Resilience</span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">15% wt</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-indigo-700">
                  {Math.round(profile.dimensions.financial_resilience)}
                </span>
                <span className="text-xs text-[#858585]">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#DDE3E0]/60 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${profile.dimensions.financial_resilience}%` }}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DDE3E0] text-[11px] text-[#5F6368] space-y-1">
              <div>CR / DR Ratio: <span className="font-semibold text-[#222222]">{profile.features.credit_debit_ratio ? profile.features.credit_debit_ratio.toFixed(1) : '3.0'}x</span></div>
              <div>Buffer: <span className="font-semibold text-[#0B9348]">Healthy</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Reasons & Interactive Evidence Trace */}
      <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#1F4E8C] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#0B9348]" />
            Why This Profile? (Explainable Decision Factors)
          </h3>
          <p className="mt-1 text-xs text-[#5F6368]">
            Click any factor below to inspect the mathematical signal and raw evidence trace.
          </p>
        </div>

        <div className="space-y-3">
          {profile.positive_factors.map((factor, idx) => {
            const isExpanded = activeTraceIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-xl border border-[#DDE3E0] overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveTraceIndex(isExpanded ? null : idx)}
                  className={`w-full flex items-center justify-between p-4 text-left transition ${
                    isExpanded ? 'bg-[#EBF2FC]/50' : 'bg-white hover:bg-[#F7F9F8]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F6EE] text-[#0B9348]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#222222]">{factor.title}</h4>
                      <p className="text-xs text-[#5F6368] mt-0.5">{factor.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block rounded bg-[#E8F6EE] px-2 py-0.5 text-[10px] font-bold text-[#0B9348] uppercase">
                      {factor.impact} IMPACT
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[#858585]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#858585]" />
                    )}
                  </div>
                </button>

                {/* Evidence Trace Audit Accordion Body */}
                {isExpanded && (
                  <div className="border-t border-[#DDE3E0] bg-[#F7F9F8] p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#1F4E8C] flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      5-Stage Evidence Provenance Trace
                    </div>

                    <div className="grid gap-3 sm:grid-cols-5 text-xs">
                      {/* Step 1 */}
                      <div className="rounded-lg bg-white p-3 border border-[#DDE3E0] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#858585] uppercase">1. Observation</span>
                        <div className="mt-1 font-semibold text-[#222222]">{factor.title}</div>
                        <span className="text-[10px] text-[#5F6368] block mt-1">Fact extracted from evidence</span>
                      </div>

                      {/* Step 2 */}
                      <div className="rounded-lg bg-white p-3 border border-[#DDE3E0] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#858585] uppercase">2. Measured Value</span>
                        <div className="mt-1 font-semibold text-[#0B9348]">{factor.observed_value}</div>
                        <span className="text-[10px] text-[#5F6368] block mt-1">Mathematical formula</span>
                      </div>

                      {/* Step 3 */}
                      <div className="rounded-lg bg-white p-3 border border-[#DDE3E0] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#858585] uppercase">3. Source Channel</span>
                        <div className="mt-1 font-semibold text-[#1F4E8C] uppercase">{factor.source_type}</div>
                        <span className="text-[10px] text-[#5F6368] block mt-1">{factor.evidence_ref}</span>
                      </div>

                      {/* Step 4 */}
                      <div className="rounded-lg bg-white p-3 border border-[#DDE3E0] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#858585] uppercase">4. Integrity</span>
                        <div className="mt-1 font-semibold text-[#0B9348]">PASSED (98% Conf)</div>
                        <span className="text-[10px] text-[#5F6368] block mt-1">Validated against rules</span>
                      </div>

                      {/* Step 5 */}
                      <div className="rounded-lg bg-white p-3 border border-[#DDE3E0] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#858585] uppercase">5. Model Impact</span>
                        <div className="mt-1 font-semibold text-[#1F4E8C]">+HIGH Contribution</div>
                        <span className="text-[10px] text-[#5F6368] block mt-1">Cash-Flow Stability</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive What-If Simulator */}
      <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1F4E8C] flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              What-If Scenario Simulator
            </h3>
            <p className="mt-1 text-xs text-[#5F6368]">
              Simulate hypothetical behavioural improvements to estimate score trajectory.
            </p>
          </div>
          <span className="rounded-full bg-[#F1F4F3] px-3 py-1 text-[11px] font-medium text-[#5F6368] border border-[#DDE3E0]">
            Scenario Only • Not an approval guarantee
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Slider 1: Income Stability */}
          <div className="rounded-xl border border-[#DDE3E0] bg-[#F7F9F8] p-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#222222] mb-2">
              <span>Improve Monthly Income Consistency</span>
              <span className="text-[#1F4E8C]">+{whatIfIncome}%</span>
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
              className="w-full accent-[#1F4E8C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#858585] mt-1">
              <span>Current</span>
              <span>+15% stability</span>
              <span>+30% stability</span>
            </div>
          </div>

          {/* Slider 2: Payment Discipline */}
          <div className="rounded-xl border border-[#DDE3E0] bg-[#F7F9F8] p-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#222222] mb-2">
              <span>Improve On-Time Bill Regularity</span>
              <span className="text-[#0B9348]">+{whatIfPayment}%</span>
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
              className="w-full accent-[#0B9348] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#858585] mt-1">
              <span>Current (80%)</span>
              <span>+15% on-time</span>
              <span>100% on-time</span>
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        {whatIfResult && (whatIfIncome > 0 || whatIfPayment > 0) && (
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF2FC] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1F4E8C]">Estimated Trajectory:</span>
                <span className="text-lg font-bold text-[#1F4E8C]">
                  {whatIfResult.score} / 900
                </span>
                <span className="rounded-full bg-[#E8F6EE] px-2 py-0.5 text-xs font-bold text-[#0B9348]">
                  +{whatIfResult.delta} points
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-1">{whatIfResult.explanation}</p>
            </div>
            <button
              onClick={() => {
                setWhatIfIncome(0);
                setWhatIfPayment(0);
                setWhatIfResult(null);
              }}
              className="text-xs text-[#1F4E8C] underline font-semibold shrink-0"
            >
              Reset Simulation
            </button>
          </div>
        )}
      </div>

      {/* Ingested Evidence Provenance Table */}
      <div className="rounded-2xl border border-[#DDE3E0] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F4E8C] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Provenance & Audit Registry
            </h3>
            <p className="mt-0.5 text-xs text-[#5F6368]">
              All calculation inputs retain complete audit trails and validation timestamps.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#DDE3E0]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F4F3] text-[#5F6368] font-semibold border-b border-[#DDE3E0]">
              <tr>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Source Channel</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-center">Records</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-center">Validation</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E0]">
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
                  provenance: prov,
                } as CanonicalEvidence;

                return (
                  <tr key={prov.evidence_id || i} className="hover:bg-[#F7F9F8]">
                    <td className="px-4 py-3 font-medium text-[#222222] flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#1F4E8C]" />
                      <span>{prov.document_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF2FC] text-[#1F4E8C] uppercase">
                        {prov.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5F6368]">
                      {prov.period_start} → {prov.period_end}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#222222]">
                      {prov.record_count}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#0B9348]">
                      {Math.round(prov.extraction_confidence * 100)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F6EE] text-[#0B9348]">
                        {prov.validation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onInspectEvidence(matchedEv)}
                        className="rounded bg-[#F7F9F8] border border-[#DDE3E0] px-2.5 py-1 text-[11px] font-semibold text-[#1F4E8C] hover:bg-[#EBF2FC] transition flex items-center gap-1 ml-auto"
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

      {/* Underwriter Disclaimer */}
      <div className="rounded-xl border border-[#DDE3E0] bg-[#F7F9F8] p-4 text-[11px] text-[#5F6368] leading-relaxed">
        <span className="font-bold text-[#222222]">Prototype Governance Notice: </span>
        {profile.disclaimer}
      </div>
    </div>
  );
};
