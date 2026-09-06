# Scoring & Explainability

## 1. Core separation

```text
Evidence
 ↓
Normalized records
 ↓
Financial features
 ↓
Risk model
 ↓
Risk score
 ↓
Decision policy
```

The AI agent does not directly generate the production credit score.

## 2. Behaviour dimensions

The prototype can present five human-readable dimensions:

### Cash-flow stability

Measures consistency of observed inflows/outflows.

Possible features:

- inflow volatility
- net cash-flow stability
- recurring inflow presence

### Income consistency

Measures continuity and predictability of observed earnings.

Possible features:

- monthly income trend
- active earning months
- income volatility

### Payment discipline

Measures observed payment regularity.

Possible features:

- on-time utility payments
- recurring obligation consistency
- late-payment frequency

### Activity continuity

Measures whether the observed financial/work activity is sustained.

Possible features:

- active days
- consecutive active months
- transaction/work continuity

### Financial resilience

Measures ability to absorb normal variation.

Possible features:

- cash-flow buffer
- inflow/outflow relationship
- recurring obligations relative to observed inflows

## 3. Score & Transparent Prototype Scoring Framework

### Prototype Dimension Weights
- **Cash-flow Stability (C):** 30% (`0.30`)
- **Income Consistency (I):** 20% (`0.20`)
- **Payment Discipline (P):** 20% (`0.20`)
- **Activity Continuity (A):** 15% (`0.15`)
- **Financial Resilience (R):** 15% (`0.15`)

Each dimension is scored deterministically on a **0–100 scale**.

### Composite Behavioral Score ($B$)
$$B = 0.30C + 0.20I + 0.20P + 0.15A + 0.15R$$

### 300–900 Credit Profile Score Mapping
$$\text{Score} = 300 + (6 \times B)$$

**Example Calculation:**
- Cash-flow Stability ($C$) = 82
- Income Consistency ($I$) = 70
- Payment Discipline ($P$) = 88
- Activity Continuity ($A$) = 75
- Financial Resilience ($R$) = 62

$$B = (82 \times 0.30) + (70 \times 0.20) + (88 \times 0.20) + (75 \times 0.15) + (62 \times 0.15) = 76.75$$
$$\text{Score} = 300 + (6 \times 76.75) = 760.5 \approx 761$$

### Risk Bands
- **750 – 900:** Low Risk
- **670 – 749:** Low–Moderate Risk
- **580 – 669:** Moderate Risk
- **300 – 579:** Higher Risk

> **IMPORTANT:** These weights and formulas represent a **transparent prototype scoring framework** for underwriting decision support. In production, this transparent framework can be replaced with a calibrated statistical/ML risk model trained on historical repayment outcomes.

Prototype UI:

```text
761 / 900
LOW–MODERATE RISK
```

## 4. Production model

With appropriate historical repayment-labelled data, candidate models include:

- logistic regression as a transparent baseline
- gradient-boosted trees such as XGBoost/LightGBM
- calibrated probability-of-default model

Model selection should be based on validation performance, calibration, stability and fairness.

## 5. Explainability

Every reason shown to a user or underwriter should originate from measurable features.

Example:

```text
+ Consistent monthly inflows
  Evidence: UPI/bank transaction records
  Period: Jan–Jun 2026
  Feature: monthly inflow volatility

+ Strong payment regularity
  Evidence: utility payment records
  Feature: on-time payment ratio

- Moderate income volatility
  Evidence: gig earnings statements
  Feature: monthly earnings variance
```

For a production model, use model-specific explainability methods such as feature contribution analysis/SHAP where appropriate.

## 6. Confidence

Confidence answers:

> How reliable is the evidence and analysis?

Possible inputs:

- provider-generated vs screenshot
- extraction confidence
- document quality
- validation success
- provenance completeness
- cross-source consistency

Confidence is **not** the same as risk.

## 7. Data coverage

Coverage answers:

> How much relevant evidence did we actually observe?

Example:

```text
Risk score:       742
Confidence:        84%
Data coverage:     71%
```

A borrower with limited evidence could have a reasonable observed-risk score but lower confidence/coverage.

## 8. Missing data

Never implement:

```text
GST missing → negative score
```

Instead:

```text
GST missing
    ↓
GST feature unavailable
    ↓
coverage remains lower
    ↓
model uses available evidence
```

## 9. Decision policy

Keep decision policy separate:

```text
Risk Model
   ↓
Risk score / probability
   ↓
Decision Policy
   ├── eligible
   ├── manual review
   └── outside policy
```

This allows TVS to change business rules without changing the underlying evidence model.

## 10. Human review

The system should support:

- review evidence
- inspect source provenance
- see model factors
- see validation warnings
- override/escalate according to authorized policy

AI should assist the underwriter, not silently replace governance.
