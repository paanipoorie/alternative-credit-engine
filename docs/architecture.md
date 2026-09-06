# System Architecture

## 1. Core Architecture Principle

The system strictly decouples **orchestration, AI interpretation, deterministic computation, and lending decisioning**:

```text
┌────────────────────────────────┐
│ Generative AI (Gemini / n8n)   │  ──►  Extraction, Classification & Grounded Synthesis
├────────────────────────────────┤
│ Document Integrity Engine      │  ──►  SHA-256 Hashing, Deduplication & Validation
├────────────────────────────────┤
│ Feature & Scoring Engine (Go)  │  ──►  Deterministic Math & Normalized Behavioural Signals
├────────────────────────────────┤
│ Lending Policy Guardrails      │  ──►  Reconciliation, Contradiction Flags & Review Alerts
└────────────────────────────────┘
```

---

## 2. End-to-End System Topology

```text
                             APPLICANT / UNDERWRITER
                                        │
                                        ▼
                            ┌─────────────────────────┐
                            │  Next.js 15 Web Client  │
                            │  - Step 1: Declared Form│
                            │  - Step 2: Evidence Hub │
                            │  - Step 3: Pipeline Run │
                            │  - Step 4: Assessment UI│
                            └───────────┬─────────────┘
                                        │ JSON over HTTP
                                        ▼
                            ┌─────────────────────────┐
                            │   Go API Gateway (:8080)│
                            │   (pkg/handler, service)│
                            └───────────┬─────────────┘
                                        │
          ┌─────────────────────────────┴─────────────────────────────┐
          ▼                                                           ▼
┌──────────────────────────────────────┐            ┌──────────────────────────────────────┐
│  AI Ingestion & Extraction (Gemini)  │            │  Document Integrity & Deduplication  │
│  - Document Classifier               │            │  - Content Hashing (SHA-256)         │
│  - Structured Data Extractor         │            │  - Document-level Deduplication      │
│  - Semantic Normalization Agent      │            │  - Record-level Deduplication        │
└──────────────────┬───────────────────┘            └──────────────────┬───────────────────┘
                   │                                                   │
                   └─────────────────────┬─────────────────────────────┘
                                         ▼
                            ┌─────────────────────────┐
                            │  Canonical Evidence Bus │
                            │  (Domain Model Events)  │
                            └────────────┬────────────┘
                                         ▼
                            ┌─────────────────────────┐
                            │  Deterministic Feature  │
                            │  & Dimension Calculator │
                            │  - 5 Behavioral Dims    │
                            │  - Volatility, Inflows  │
                            └────────────┬────────────┘
                                         ▼
                            ┌─────────────────────────┐
                            │ Financial Reconciliation│
                            │ & Policy Guardrails     │
                            │ - Declared vs Observed  │
                            │ - Cross-source Anomaly  │
                            │ - Review Triggers       │
                            └────────────┬────────────┘
                                         ▼
                            ┌─────────────────────────┐
                            │ Single Synthesis Engine │
                            │ - Grounded AI Summary   │
                            │ - Progressive Provenance│
                            │ - Non-mutating What-If  │
                            └─────────────────────────┘
```

---

## 3. Seven-Stage Dimensional Trace Pipeline

Every behavioural dimension ($0–100$) is verifiable via an unbroken 7-stage lineage:

```text
1. Document Ingestion    ──► Ingested filename, MIME type, SHA-256 fingerprint, byte size.
2. Data Extraction       ──► Model/parser confidence rating, structured records identified.
3. Validation            ──► Header format check, date sequence validation, range assertions.
4. Normalization         ──► Normalized CanonicalEvidence events (inflows, outflows, bills).
5. Consistency Check     ──► Deduplication matching, cross-source sanity verification.
6. Behavioural Signal    ──► Feature mathematical derivation (CV, active days, on-time ratio).
7. Assessment Impact     ──► Dimensional score contribution & score weight calculation.
```

---

## 4. Document Integrity & Guardrails Layer

To prevent fraudulent tampering, redundant submissions, or extraction anomalies:

1. **Cryptographic Identity:**
   - Every uploaded evidence document receives a deterministic SHA-256 hash.
   - Identical document content uploaded under different filenames is detected and flagged.
2. **Transaction-Level Deduplication:**
   - Detects duplicate transaction timestamps, amounts, and counterparties across statements to eliminate double-counting.
3. **Cross-Source Contradiction Detection:**
   - Evaluates variance between declared profile attributes and observed transaction realities (e.g. $>30\%$ income variance triggers `REVIEW_REQUIRED`).
4. **Policy Guardrails:**
   - When significant discrepancies or duplicate evidence are detected, the system generates formal `ContradictionFinding` records and elevates the applicant to an Underwriting Policy Review Alert.

---

## 5. Technology Stack & Directory Organization

```text
alternative-credit-engine/
├── apps/
│   ├── api/                     # High-performance Go 1.23 backend
│   │   ├── cmd/server/          # HTTP server bootstrap
│   │   └── pkg/
│   │       ├── ai/              # Gemini / n8n integration clients
│   │       ├── calculator/      # Deterministic scoring, feature math & summary generation
│   │       ├── domain/          # Strongly-typed models (AssessmentProfile, Evidence, etc.)
│   │       ├── extractor/       # Parsers for UPI, Utility, Gig Earnings, GST
│   │       ├── handler/         # REST endpoints (/api/assess, /api/what-if, etc.)
│   │       ├── service/         # Assessment orchestration & trace builder
│   │       └── validator/       # Integrity hashing, validation rules & deduplication
│   └── web/                     # Next.js 15 (React 19, TypeScript, Tailwind CSS)
│       ├── app/                 # App Router page routes & layout
│       ├── components/          # Reusable UI modules (AssessmentView, IngestionHub, etc.)
│       └── lib/                 # Client API layer, type definitions, scenario datasets
├── workflows/n8n/               # n8n workflow definitions for Gemini orchestration
└── docs/                        # Complete system, scoring, and UI documentation
```

---

## 6. Strict Presentation Hierarchy

To prevent AI prototype clutter, the customer-facing assessment strictly follows this hierarchy:

$$\text{SCORE} \longrightarrow \text{CONFIDENCE + COVERAGE} \longrightarrow \text{KEY INDICATORS} \longrightarrow \text{DECLARED VS OBSERVED} \longrightarrow \text{BEHAVIOURAL DIMENSIONS} \longrightarrow \text{EVIDENCE SOURCES} \longrightarrow \text{ASSESSMENT SUMMARY} \longrightarrow \text{DETAILED PROVENANCE} \longrightarrow \text{WHAT-IF SIMULATION}$$

- **Metric Cards:** Display structured numbers and state badges only. No repetitive explanatory paragraphs.
- **Underwriting Assessment Summary:** A single dedicated narrative section presenting grounded, factual synthesis.

