# Product Specification

## 1. Problem

First-time borrowers, gig workers, small merchants and informal workers may have limited conventional credit history even when their real financial behaviour contains useful evidence.

TVS's public materials indicate that it already uses internal and external data, analytics models, bureau scores and APIs in lending workflows. Its public privacy disclosures also mention financial information, bank statements, GSTIN and Account Aggregator integrations. The case-study opportunity is therefore best framed as an **additional behavioural evidence layer**, not a replacement for existing underwriting.

## 2. Product

### Alternative Financial Evidence Engine

A unified customer journey where the borrower can provide whatever relevant evidence is available.

The customer is **not forced to choose a segment** such as "gig worker" or "merchant" first.

Example:

```text
BUILD YOUR FINANCIAL PROFILE

Share evidence that can help us assess your financial reliability.

[ + Add financial evidence ]
[ + Connect a data source ]

PDF • CSV • Excel • Image

You don't need to provide everything.
```

## 3. Evidence-first principle

The customer may provide:

- UPI/bank transaction evidence
- GST records
- gig/work-platform earnings
- utility payment records
- telecom recharge records
- e-commerce records where legitimately available
- vehicle/fuel/finance evidence where relevant
- other verifiable financial evidence

The system automatically identifies the evidence type.

```text
✓ UPI transaction data detected
✓ Utility payment record detected
✓ Gig earnings detected
✗ GST not provided
```

The missing GST record does **not** become a negative risk factor.

## 4. Data acquisition hierarchy

Preferred order:

1. Authorized/regulated connection
2. Provider-generated structured statement
3. CSV/Excel
4. PDF
5. Image/screenshot
6. User declaration

Source quality affects **confidence**, not automatically the risk score.

## 5. Consent

Before connecting or uploading data, the customer should see:

- what data will be used
- why it is being used
- which source is being accessed
- what analysis will be performed
- whether sharing is optional
- how consent can be revoked

The prototype should visibly model explicit consent and avoid dark patterns.

## 6. Customer output

```text
ALTERNATIVE CREDIT PROFILE

742 / 900
LOW–MODERATE RISK

Confidence      84%
Data coverage   71%
```

### Behaviour dimensions

- Cash-flow stability
- Income consistency
- Payment discipline
- Activity continuity
- Financial resilience

### Explainability

Example:

**Positive factors**
- Consistent monthly inflows
- Strong payment regularity
- Sustained work activity

**Factors requiring attention**
- Moderate income volatility

Every displayed reason should be traceable to underlying evidence and derived features.

## 7. Underwriter view

A second view can show:

- score
- confidence
- coverage
- evidence sources
- time periods
- important features
- model reasons
- validation warnings
- provenance

This creates a human-reviewable path instead of an opaque AI verdict.

## 8. What-if analysis

Optional prototype feature:

```text
Current score: 742

If monthly income becomes 10% more stable:
Estimated score: +X

Why:
Cash-flow stability feature improves.
```

This is for explanation and scenario analysis, not a promise of approval.
