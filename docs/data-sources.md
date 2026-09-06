# Data Sources & Financial Signals

## Principle

The case study names multiple alternative data categories. They should not all have equal weight.

Prioritize signals according to:

1. predictive usefulness
2. legitimate availability
3. consent complexity
4. explainability
5. data quality

Missing evidence should reduce **coverage**, not automatically reduce risk.

## 1. UPI / transaction activity

### Raw evidence

- transaction ID
- date/time
- amount
- debit/credit
- payer/payee information where available
- transaction status
- transaction description/reference

### Derived features

- monthly inflow
- monthly outflow
- net cash flow
- transaction frequency
- active days
- average transaction value
- inflow volatility
- recurring payment patterns
- monthly trend

Important implementation note:

Do not assume a universal direct UPI-history API. For the prototype, support transaction CSV/PDF/bank-statement evidence. UPI activity may also appear in bank transaction data.

## 2. GST

### Raw evidence

- filing period
- outward supplies/turnover fields
- tax liability
- relevant return status
- credit/debit notes where available

### Derived features

- reported turnover
- turnover growth
- turnover volatility
- filing consistency
- seasonality
- business activity trend

GST is especially useful for merchants and formalized small businesses.

GST activity alone is not repayment capacity.

## 3. Gig/work earnings

Provider-generated earnings statements are preferred.

### Raw evidence

- earnings period
- total earnings
- jobs/trips where available
- adjustments
- active work information where present

### Derived features

- monthly earnings
- earnings per active day
- work continuity
- earnings volatility
- trend
- active-day consistency

Do not depend on continuous GPS tracking.

## 4. Utility payments

Possible evidence:

- electricity/water/other utility bill
- payment receipt
- provider payment history
- screenshot where necessary

Derived:

- bill amount
- due date
- payment date
- late frequency
- average delay
- missed payments
- payment consistency

There is no universal utility-history format, so upload/provider-generated records are the prototype-friendly route.

## 5. Telecom recharge

Possible evidence:

- recharge history
- recharge statement
- provider-generated record

Derived:

- recharge frequency
- average recharge
- recharge gaps
- plan continuity

Use this as a **secondary signal**. Telecom behaviour should not dominate a credit decision.

## 6. E-commerce

Potential evidence:

- order date
- amount
- order status
- return/cancellation information

This should remain optional and secondary.

Do not infer creditworthiness from what products a customer buys.

Do not require customers to hand over shopping passwords or credentials.

## 7. Mobility / vehicle evidence

Potential evidence:

- vehicle finance/EMI records
- fuel transactions
- service/maintenance records
- insurance
- telematics where legitimately available

For gig workers, work-platform earnings/activity is generally more practical than continuous vehicle tracking.

Avoid making GPS surveillance a core feature.

## 8. Signal priority

| Signal | Prototype priority | Main reason |
|---|---:|---|
| Bank/transaction cash flow | Very high | Strong financial-behaviour evidence |
| UPI/transaction trends | Very high | Useful behavioural detail where available |
| GST | Very high for merchants | Business activity evidence |
| Gig earnings | Very high for gig workers | Direct earning continuity |
| Utility | Medium | Payment discipline |
| Telecom | Low-medium | Weak/indirect signal |
| Mobility/vehicle | Medium/niche | Useful in specific contexts |
| E-commerce | Low | Harder to obtain and explain |

## 9. Canonical evidence model

All sources should be normalized into a common representation.

```json
{
  "customer_id": "demo-001",
  "source_type": "upi",
  "source_provider": "example_provider",
  "period_start": "2026-01-01",
  "period_end": "2026-03-31",
  "records": [],
  "source_quality": 0.94,
  "extraction_confidence": 0.97,
  "provenance": []
}
```

The feature engine should consume this normalized representation rather than provider-specific formats.
