# Product Screens & UI Architecture

## 1. Customer Assessment Journey Flow

The user journey consists of four sequential, focused steps:

```text
Step 1: Declared Profile Form
   ↓
Step 2: Evidence Hub & Ingestion
   ↓
Step 3: Real-Time Ingestion Pipeline
   ↓
Step 4: Alternative Credit Profile & Underwriting Assessment
```

---

## 2. Screen Specifications

### Step 1: Declared Context Form (`ProfileSetup.tsx`)
- **Header:** Progress indicator (`Step 1 of 3 — Structured Financial Context`) and quick-fill scenario loader.
- **Section 1 (Personal Details):** Full Name, Age, City, PIN Code.
- **Section 2 (Work & Income):** Segment badges (Gig, Self-Employed, Salaried, Merchant, Informal), Approx Monthly Income, Primary Channel (UPI, Bank Transfer, Cash).
- **Section 3 (Household Context):** Approx Monthly Living Expenses, Number of Dependents.

### Step 2: Evidence Hub & Upload (`EvidenceHub.tsx`)
- **Evidence Dropzone:** Drag-and-drop support for PDF, CSV, Excel, Images.
- **Pre-loaded Evidence Records:** Status cards for uploaded statements (UPI, Gig Work, Electricity, Telecom).
- **Evidence Card Details:** Provider tag, record count, date window, extraction confidence, and document identity tags.

### Step 3: Ingestion Pipeline View (`PipelineProgress.tsx`)
- **Live Pipeline Stages:**
  1. Ingesting & Fingerprinting Document (SHA-256)
  2. Document Classification & Type Detection
  3. Structured Fact Extraction (Gemini / OCR)
  4. Data Validation & Integrity Checking
  5. Deterministic Feature & Dimension Calculation
  6. Final Credit Profile & Explainability Generation

### Step 4: Alternative Credit Profile (`AssessmentView.tsx`)

The assessment screen follows a strict, disciplined fintech hierarchy:

```text
1. Scenario Bar & Applicant Context
   - Reference ID, Assessment Date, Declared Income & Household Summary
   - Demo Switcher (Rajesh Kumar / Priya Sundaram / Amit Verma)

2. Underwriting Policy Review Banner (Conditional)
   - Rendered only when policy discrepancies or anomalies exceed automated tolerances.

3. Main Score & Reliability
   - Alternative Credit Score (/900) and Risk Band Badge (Low Risk / Review Required)
   - Confidence Gauge (0–100%) and Evidence Coverage Gauge (0–100%)
   - Evidence Sources Breakdown Grid with status badges and "Verifies..." purpose captions.

4. Key Underwriting Indicators Grid
   - 6 compact factual metrics: Cash-Flow Ratio, Inflow Volatility CV, Income Variance, On-Time Payment Rate, Active Observation Span, Evidence Reliability.

5. Financial Reconciliation (Declared vs Observed)
   - 4 Cards: Monthly Inflow, Monthly Expenses, Primary Channel, Active Months.
   - Structured comparison displaying Declared, Observed, Variance %, and Reconciliation State Badges (CONSISTENT, MINOR_VARIANCE, SIGNIFICANT_VARIANCE). No repetitive explanatory paragraphs.

6. Five Behavioural Dimensions
   - Cash-Flow Stability (0–100)
   - Income Consistency (0–100)
   - Payment Discipline (0–100)
   - Activity Continuity (0–100)
   - Financial Resilience (0–100)
   - Each card displays score / 100, visual progress bar, and 2 deterministic telemetry rows.

7. Evidence Discrepancies (Conditional)
   - Highlights contradiction findings, duplicate files, or timestamp overlaps when detected.

8. Underwriting Assessment Summary (Single Unified AI Synthesis)
   - Dedicated narrative card presenting grounded factual synthesis.
   - Key Strengths list (positive factors) and Watch Areas list (coverage observations).

9. Evidence Provenance & Verification Details (Progressive Disclosure)
   - Collapsible panel with 7-stage dimensional traces and SHA-256 cryptographic document hashes.

10. What-If Scenario Simulation
    - Non-mutating interactive sliders projecting score improvement for increased deposit regularity or on-time bill payment.
```

---

## 3. Visual & Design System Principles

- **Fintech Restraint:** Avoid gratuitous AI badges (`INFO`, `WATCH`, category pills, internal codes). Let numbers, state badges, and verified facts speak for themselves.
- **Color Discipline:**
  - Dark surfaces: `#14171A`, `#171A1D`, `#1D2125`
  - Subtle borders: `#2B3035`
  - Positive highlights: Emerald/Green (`#16A05A`, `#4ADE80`, `#132E20`)
  - Informational accents: Steel Blue (`#3D78C2`, `#7AB3EF`, `#1E2C3D`)
  - Warning/Attention: Amber/Yellow (`#D89A24`, `#FBBF24`, `#332511`)
  - Discrepancy/Alert: Crimson/Rose (`#F87171`, `#381818`)
