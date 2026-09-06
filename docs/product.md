# Product Specification

## 1. Product Problem Statement & Underwriting Context

First-time borrowers, informal workers, and gig economy participants frequently encounter credit rejection due to "thin" or non-existent traditional credit bureau files. However, their day-to-day transactional activities—such as recurring UPI peer-to-peer transfers, gig platform payouts, and electricity bill payments—contain rich, verifiable behavioral signals of creditworthiness.

The **Alternative Credit Engine** establishes an **evidence-first behavioral risk layer** designed to complement, not replace, institutional underwriting at financial institutions like TVS Credit.

---

## 2. Core Product Principles

1. **Evidence-First, Not Segment-Locked:** Borrowers are never forced into narrow personas. They provide whatever evidence they possess; the system identifies and extracts signals automatically.
2. **Missing Evidence is Not Bad Credit:** Missing sources reduce Data Coverage and Confidence, but never penalize the credit score.
3. **Strict Mathematical Grounding:** All risk metrics are computed deterministically. AI is restricted to extraction, classification, reconciliation, and synthesizing a single unified assessment narrative.
4. **Transparent Explainability:** Every dimensional score is backed by measurable telemetry and an audit trail tracing back to cryptographic SHA-256 document identities.

---

## 3. Four-Step Customer Journey

```text
┌───────────────────────────────┐
│ STEP 1: Declared Context      │  ──► Full Name, City, Employment Type, Declared Income & Expenses
├───────────────────────────────┤
│ STEP 2: Evidence Hub & Upload │  ──► Optional uploads (Bank CSV, Gig PDF, Utility Bills, GST, Telecom)
├───────────────────────────────┤
│ STEP 3: Ingestion Pipeline    │  ──► Real-time stages: Ingestion ──► Classification ──► Feature Math
├───────────────────────────────┤
│ STEP 4: Assessment Profile    │  ──► Score /900, Key Metrics, Reconciliation, 5 Dimensions, AI Summary
└───────────────────────────────┘
```

---

## 4. Assessment Presentation Hierarchy

The customer-facing assessment interface maintains high visual restraint and strict fintech hierarchy:

```text
1. Applicant Header & Scenario Bar (Rajesh Kumar / Priya Sundaram / Amit Verma)
2. Underwriting Policy Review Alert (Conditional trigger if anomalies/discrepancies exist)
3. Alternative Credit Score Card (/900) + Confidence & Coverage Gauges
4. Key Underwriting Indicators Grid (Cash-flow ratio, Volatility CV, Income Variance, On-Time Rate)
5. Financial Reconciliation (Declared vs Observed factual cards with State Badges)
6. Five Behavioural Dimensions (Cash-Flow, Income, Payment, Activity, Resilience)
7. Evidence Sources Breakdown (Tiles with verification status and "Verifies..." secondary purpose)
8. Evidence Discrepancies & Contradictions (Conditional underwriter findings)
9. Underwriting Assessment Summary (Single unified AI synthesis + Strengths & Watch Areas)
10. Progressive Disclosure: Technical Provenance & SHA-256 Cryptographic Artifact Hashes
11. What-If Scenario Simulation (Non-mutating interactive projection sliders)
```

---

## 5. Representative Benchmark Scenarios

| Scenario | Applicant | Persona & Context | Score & Band | Key Outcome |
|---|---|---|---|---|
| **Clean Baseline** | Rajesh Kumar | Gig delivery partner (₹32k declared, ₹26.5k observed, 80% on-time bills) | **854** (Low Risk) | Clean baseline; 80% coverage, 96% confidence |
| **Strong Multi-Source** | Priya Sundaram | Platform worker + Utility + Telecom (₹34k declared, ₹34k observed, 100% on-time) | **854** (Low Risk) | Optimal multi-source corroboration; 100% coverage, 98% confidence |
| **Review Required** | Amit Verma | Merchant/Freelancer (₹75k declared vs ₹26.5k observed, duplicate file uploaded) | **785** (Review Required) | Policy guardrails trigger Underwriting Review Alert with 4 contradiction findings |

---

## 6. What-If Scenario Simulation

An interactive, non-mutating simulation panel enabling borrowers and loan officers to evaluate how improving deposit regularity or on-time bill payment improves credit capacity without altering historical evidence records.

