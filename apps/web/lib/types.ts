export type SourceType = 'upi' | 'utility' | 'gig_earnings' | 'gst' | 'telecom' | 'ecommerce' | 'vehicle';
export type DocumentFormat = 'pdf' | 'csv' | 'xlsx' | 'image' | 'json';
export type ProcessingStatus = 'UPLOADED' | 'IDENTIFYING' | 'EXTRACTING' | 'VALIDATING' | 'ANALYZING' | 'COMPLETE' | 'FAILED';

export interface UPITransaction {
  id: string;
  date: string;
  amount: number;
  type: string; // 'credit' | 'debit'
  counterparty: string;
  description: string;
  status: string;
  category?: string;
}

export interface UtilityPayment {
  id: string;
  bill_period: string;
  provider_name: string;
  service_type: string;
  bill_amount: number;
  due_date: string;
  payment_date?: string;
  status: string;
  days_late: number;
  payment_amount: number;
}

export interface GigPayout {
  id: string;
  platform: string;
  period_start: string;
  period_end: string;
  gross_earnings: number;
  net_payout: number;
  active_days: number;
  trips_or_jobs: number;
  incentives: number;
  tips: number;
}

export interface EvidenceEvent {
  id: string;
  timestamp: string;
  source_type: SourceType;
  event_type: string;
  amount: number;
  direction: string;
  category: string;
  status: string;
  metadata?: Record<string, any>;
  confidence: number;
}

export interface ProvenanceItem {
  evidence_id: string;
  source_type: SourceType;
  document_name: string;
  document_format: DocumentFormat;
  period_start: string;
  period_end: string;
  record_count: number;
  extraction_confidence: number;
  source_quality_score: number;
  validation_status: string;
  validation_notes?: string[];
  origin?: 'LIVE_N8N_GEMINI' | 'LIVE_GEMINI' | 'LIVE_PARSER' | 'SYNTHETIC_DEMO';
  ingested_at: string;
}

export interface CanonicalEvidence {
  id: string;
  customer_id: string;
  source_type: SourceType;
  source_provider: string;
  period_start: string;
  period_end: string;
  source_quality: number;
  extraction_confidence: number;
  provenance: ProvenanceItem;
  origin?: 'LIVE_N8N_GEMINI' | 'LIVE_GEMINI' | 'LIVE_PARSER' | 'SYNTHETIC_DEMO';
  events?: EvidenceEvent[];
  upi_transactions?: UPITransaction[];
  utility_payments?: UtilityPayment[];
  gig_payouts?: GigPayout[];
}

export interface BehavioralDimensions {
  cash_flow_stability: number;
  income_consistency: number;
  payment_discipline: number;
  activity_continuity: number;
  financial_resilience: number;
}

export interface ExplainableReason {
  type: 'positive' | 'attention';
  title: string;
  summary: string;
  source_type: SourceType;
  evidence_ref: string;
  observed_value: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  period?: string;
  dimension?: string;
}

export interface DerivedFeatures {
  total_inflow: number;
  total_outflow: number;
  avg_monthly_inflow: number;
  avg_monthly_outflow: number;
  net_cash_flow: number;
  inflow_volatility_cv: number;
  outflow_volatility_cv: number;
  credit_debit_ratio: number;
  total_transactions: number;
  active_days_count: number;
  active_days_ratio: number;
  monthly_inflows?: { month: string; amount: number; count: number }[];
  recurring_inflow_ratio: number;

  gig_total_earnings: number;
  gig_avg_monthly_earnings: number;
  gig_earnings_volatility_cv: number;
  gig_active_days_per_month: number;
  gig_continuity_months: number;
  gig_earnings_per_active_day: number;
  gig_monthly_earnings?: { month: string; amount: number; count: number }[];

  utility_total_bills: number;
  utility_on_time_count: number;
  utility_on_time_ratio: number;
  utility_avg_delay_days: number;
}

export interface DeclaredProfile {
  full_name: string;
  age: number;
  city: string;
  pincode: string;
  employment_type: 'salaried' | 'self_employed' | 'gig_worker' | 'business_owner' | 'informal' | 'other';
  monthly_income: number;
  income_channel: 'bank_transfer' | 'upi' | 'cash' | 'cheque' | 'multiple';
  monthly_expenses: number;
  dependents: number;
}

export type AssessmentBand = 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'REVIEW_REQUIRED';

export type FlagSeverity = 'INFO' | 'WATCH' | 'REVIEW';

export interface AssessmentFlag {
  code: string;
  severity: FlagSeverity;
  title: string;
  description: string;
  explanation?: string;
  category?: string;
  supporting_evidence?: string[];
}

export interface ReconciliationItem {
  field: string;
  declared_value: string;
  observed_value: string;
  variance_pct?: number;
  status: 'CONSISTENT' | 'MINOR_VARIANCE' | 'SIGNIFICANT_VARIANCE' | 'NOT_OBSERVED';
  description?: string;
  explanation?: string;
  supporting_evidence?: string[];
  notes?: string;
}

export interface ReconciliationReport {
  overall_status: 'CONSISTENT' | 'MINOR_VARIANCE' | 'SIGNIFICANT_VARIANCE' | 'PARTIALLY_OBSERVED';
  summary: string;
  items: ReconciliationItem[];
}

export interface ObservedProfile {
  observed_monthly_income: number;
  observed_income_channel: string;
  observed_monthly_expenses: number;
  active_months: number;
  primary_inflow_source: string;
}

export interface EvidenceTraceItem {
  dimension: string;
  dimension_title: string;
  score: number;
  sources: string[];
  extracted_signals: string[];
  summary: string;
}

export interface AssessmentProfile {
  assessment_id: string;
  customer_id: string;
  customer_name?: string;
  persona_type?: string;
  declared_profile?: DeclaredProfile;
  observed_profile?: ObservedProfile;
  reconciliation?: ReconciliationReport;
  behavioral_score: number;
  final_score: number;
  risk_band: string;
  assessment_band?: AssessmentBand | string;
  confidence_score: number;
  data_coverage_score: number;
  dimensions: BehavioralDimensions;
  dimension_weights: Record<string, number>;
  positive_factors: ExplainableReason[];
  attention_factors: ExplainableReason[];
  features: DerivedFeatures;
  provenance: ProvenanceItem[];
  evidence_traces?: EvidenceTraceItem[];
  assessment_flags?: AssessmentFlag[];
  coverage_breakdown: Record<string, boolean>;
  created_at: string;
  disclaimer: string;
}

export interface WhatIfResponse {
  is_hypothetical?: boolean;
  original_score: number;
  estimated_score: number;
  score_delta: number;
  original_b_score: number;
  estimated_b_score: number;
  simulated_dimensions?: BehavioralDimensions;
  explanation: string;
  simulation_steps?: string[];
}
