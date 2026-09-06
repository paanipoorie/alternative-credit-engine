# Alternative Credit Engine

## TVS Credit E.P.I.C. — Problem Statement 4: Alternative Data Credit Engine for the Invisible Customer

An AI-powered alternative credit risk intelligence engine that ingests non-traditional financial evidence (UPI transaction trends, gig work payouts, utility bill payments, GST filings, and telecom recharges) to generate explainable, deterministic behavioural credit profiles for first-time borrowers, gig workers, small merchants, and informal sector workers.

---

## 1. Product Thesis & Philosophy

Traditional underwriting relies heavily on credit bureau histories (CIBIL/Experian), which excludes "thin-file" or "new-to-credit" borrowers. The **Alternative Credit Engine** introduces an **evidence-backed behavioural intelligence layer**:

- **No Penalty for Missing Evidence:** Missing evidence sources decrease **Data Coverage** and **Confidence**, but never penalize the credit score itself.
- **Three Independent Pillars:**
  1. **Alternative Credit Score (300–900):** Objective behavioural risk based solely on observed activity.
  2. **Confidence (0–100%):** Reliability, completeness, and extraction verification of submitted evidence.
  3. **Data Coverage (0–100%):** Breadth of financial dimensions corroborated across distinct sources.
- **Strict Separation of Concerns:**
  $$\textbf{DETERMINISTIC DATA} \longrightarrow \textbf{METRICS / SCORES} \longrightarrow \textbf{VISUALIZATION} \longrightarrow \textbf{ONE FINAL ASSESSMENT SUMMARY}$$
  - Deterministic calculations (features, scores, dimension ratings, variances) are computed in Go.
  - Generative AI is strictly used for extraction, classification, reconciliation, and synthesizing a single unified underwriting assessment summary.

---

## 2. System Architecture

```text
                       APPLICANT / UNDERWRITER
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Next.js 15 Web App     │
                    │  (Tailwind, TypeScript) │
                    └───────────┬─────────────┘
                                │ REST / JSON
                                ▼
                    ┌─────────────────────────┐
                    │  Go API Server (:8080)  │
                    │  (Router, Feature Engine│
                    │   Deterministic Scoring)│
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│ n8n / Gemini Ingestion    │               │  Document Integrity &     │
│ - Classification Agent    │               │  Guardrails Engine        │
│ - Evidence Extraction     │               │  - SHA-256 Fingerprinting │
│ - Semantic Normalization  │               │  - Deduplication          │
└─────────┬─────────────────┘               │  - Anomaly Detection      │
          │                                 └─────────────┬─────────────┘
          └─────────────────────┬─────────────────────────┘
                                ▼
                    ┌─────────────────────────┐
                    │ Feature & Scoring Layer │
                    │ - 5 Behavioral Dims     │
                    │ - Financial Reconcile   │
                    │ - Grounded AI Summary   │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ Assessment Profile View │
                    │ - Score / 900           │
                    │ - Key Indicators Grid   │
                    │ - Declared vs Observed  │
                    │ - 5 Dimension Telemetry │
                    │ - 7-Stage Audit Traces  │
                    │ - What-If Simulation    │
                    └─────────────────────────┘
```

---

## 3. Five Behavioural Dimensions (0–100 Normalized Scale)

The engine deterministically computes five human-readable behavioural dimensions:

| Dimension | Weight | Primary Signals Evaluated |
|---|---|---|
| **Cash-Flow Stability** | 30% | Inflow Volatility (Coefficient of Variation $CV$), deposit regularity, net cash-flow buffer |
| **Income Consistency** | 20% | Platform gig continuity (months), active working days per month, earnings per day |
| **Payment Discipline** | 20% | Utility & bill fulfillment on-time ratio, average payment delay days, tracked billing cycles |
| **Activity Continuity** | 15% | Calendar active transaction days ratio, monthly transaction volume density |
| **Financial Resilience** | 15% | Credit-to-Debit cash ratio tier, net inflow buffer relative to monthly outflows |

$$\text{Composite Behavioral Score } (B) = 0.30C + 0.20I + 0.20P + 0.15A + 0.15R$$
$$\text{Alternative Credit Score } = \text{round}(300 + 6 \times B)$$

---

## 4. Representative Demo Scenarios

The engine includes three fully deterministic, verified test profiles:

1. **Rajesh Kumar — Clean Baseline (Score: 854 / 900 — LOW RISK)**
   - *Persona:* Gig delivery partner (₹32,000/mo declared vs ₹26,467/mo observed).
   - *Evidence:* 3 Sources (UPI, Gig Work, Utility).
   - *Profile:* 80% on-time payment, low inflow volatility (CV 0.06), 11.0x cash-flow multiplier.
   - *Outcome:* Recommended standard approval with high confidence (96%).

2. **Priya Sundaram — Strong Multi-Source (Score: 854 / 900 — LOW RISK)**
   - *Persona:* High-consistency platform worker (₹34,000/mo declared vs ₹34,020/mo observed, 0.1% variance).
   - *Evidence:* 4 Sources (Bank/UPI, Platform Work, Electricity, Telecom).
   - *Profile:* 100% on-time bill payment across 6 cycles, 16.2x cash-flow ratio, 45 active days.
   - *Outcome:* Optimal multi-source corroboration with 100% coverage and 98% confidence.

3. **Amit Verma — Review Required (Score: 785 / 900 — REVIEW REQUIRED)**
   - *Persona:* Merchant / Freelancer declaring ₹75,000/mo vs ₹26,500/mo observed (−64.7% divergence).
   - *Evidence:* Incomplete & redundant records (Duplicate statement upload detected & deduplicated).
   - *Profile:* 50% utility payment delays (3.5 days avg delay), 18 active transaction days.
   - *Outcome:* Triggers Underwriting Policy Review Alert with 4 explicit contradiction findings.

---

## 5. Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend API:** Go (1.23+ standard library HTTP, deterministic feature & scoring algorithms).
- **AI & Ingestion:** Google Gemini 1.5/2.0 API, n8n workflow orchestrator.
- **Testing & QA:** Go `testing` package, Playwright MCP end-to-end browser verification.

---

## 6. Quickstart & Local Setup

### Prerequisites
- Go 1.22+
- Node.js 18+ & npm

### 1. Start Go API Backend
```bash
cd apps/api
go build -o bin/server cmd/server/main.go
./bin/server
# Running on http://localhost:8080
```

### 2. Start Next.js Frontend
```bash
cd apps/web
npm install
npm run dev
# Running on http://localhost:3000
```

### 3. Run Backend Test Suite
```bash
cd apps/api
go test -v ./...
```

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API service health check |
| `POST` | `/api/assess` | Ingest evidence and compute full credit assessment profile |
| `POST` | `/api/what-if` | Non-mutating prospective scenario simulation |
| `GET` | `/api/scenarios/:name` | Load pre-configured synthetic demo scenarios (`baseline`, `strong`, `review`) |
| `POST` | `/api/extract` | Document classification and structured extraction endpoint |

---

## 8. Repository Structure

```text
alternative-credit-engine/
├── apps/
│   ├── api/                     # Go backend API & deterministic calculation engine
│   │   ├── cmd/server/          # Server entry point
│   │   └── pkg/
│   │       ├── calculator/      # Scoring, feature calculation & summary synthesis
│   │       ├── domain/          # Data models & schemas
│   │       ├── extractor/       # Ingestion & parser handlers
│   │       ├── handler/         # HTTP REST handlers
│   │       ├── service/         # Assessment orchestration
│   │       └── validator/       # Document integrity & validation
│   └── web/                     # Next.js 15 frontend application
│       ├── app/                 # Next.js App Router
│       ├── components/          # React components (AssessmentView, IngestionHub, etc.)
│       └── lib/                 # API client, TypeScript definitions, mock data
├── docs/                        # Detailed architectural & scoring documentation
│   ├── architecture.md          # End-to-end system architecture
│   ├── data-sources.md          # Supported evidence sources & feature dictionary
│   ├── product.md               # Product specification & UX principles
│   ├── scoring.md               # Scoring formulas & explainability framework
│   └── screens.md               # UI screen walkthrough & layout hierarchy
└── data/synthetic/              # Standardized CSV/JSON evidence datasets
```
