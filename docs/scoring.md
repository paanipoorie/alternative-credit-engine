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

## 3. Score

Prototype UI:

```text
742 / 900
LOW–MODERATE RISK
```

The exact prototype weighting is illustrative.

Without TVS historical repayment labels, the team must not claim:

- that the weights are statistically validated
- that the score predicts default at a specific accuracy
- that 742 corresponds to a real TVS credit grade
- that the model guarantees approval

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
