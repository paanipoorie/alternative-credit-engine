# Data Sources & Financial Signals

## 1. Evidence Prioritization Principle

Alternative data signals are prioritized based on:
1. **Predictive Financial Usefulness:** Direct measurement of cash inflows, working continuity, and obligation fulfillment.
2. **Legitimate Availability:** Readily available via Account Aggregator, direct PDF/CSV exports, or bills without invasive surveillance.
3. **Consent & Privacy:** Explicit borrower-controlled uploads without scraping or password collection.
4. **Verifiability:** Grounded in provider records with cryptographic SHA-256 fingerprinting.

> **Missing Data Principle:** Missing evidence sources reduce **Data Coverage** and **Confidence**, but **never reduce the credit score**.

---

## 2. Ingested Evidence Sources & Purpose

| Evidence Source | What It Measures | Secondary Underwriting Verification | Coverage Weight |
|---|---|---|---|
| **UPI / Bank** | Cash-flow regularity, deposit predictability, volatility CV | *Verifies cash-flow regularity* | 35% |
| **Work Earnings** | Platform earnings continuity, active days per month | *Verifies income continuity* | 25% |
| **Utility Bills** | On-time payment discipline, delinquency delay days | *Verifies payment discipline* | 20% |
| **GST Returns** | Business filing consistency, turnover trends | *Verifies business activity* | 15% |
| **Telecom** | Active recharge history, plan continuity | *Verifies recharge continuity* | 5% |
| **Evidence Quality** | Date span density, cross-source consistency | *Verifies evidence reliability* | Baseline Gauge |

---

## 3. Detailed Source Mappings & Derived Features

### 1. UPI / Bank Transaction Records
- **Raw Elements:** Transaction ID, Timestamp, Amount, Direction (`credit` / `debit`), Counterparty, Description, Status.
- **Derived Features:**
  - `total_inflow`, `total_outflow`, `net_cash_flow`
  - `avg_monthly_inflow`, `avg_monthly_outflow`
  - `inflow_volatility_cv` (Coefficient of Variation $\sigma / \mu$)
  - `credit_debit_ratio` (Cash-flow multiplier)
  - `active_days_count`, `active_days_ratio`, `total_transactions`

### 2. Work / Gig Earnings Statements
- **Raw Elements:** Payout Period, Gross Earnings, Net Payout, Active Days, Completed Jobs/Trips, Incentives.
- **Derived Features:**
  - `gig_total_earnings`, `gig_avg_monthly_earnings`
  - `gig_earnings_volatility_cv`
  - `gig_continuity_months`
  - `gig_active_days_per_month`
  - `gig_earnings_per_active_day`

### 3. Utility Payment Receipts & Statements
- **Raw Elements:** Bill Period, Provider Name, Due Date, Payment Date, Bill Amount, Paid Amount, Days Late.
- **Derived Features:**
  - `utility_total_bills`
  - `utility_on_time_count`, `utility_on_time_ratio`
  - `utility_avg_delay_days`

### 4. GST Returns (GSTR-3B / GSTR-1)
- **Raw Elements:** Return Period, Reported Turnover, Outward Taxable Supplies, Tax Liability.
- **Derived Features:**
  - Turnover growth trend, turnover volatility CV, quarterly filing regularity.

### 5. Telecom Recharge Statements
- **Raw Elements:** Recharge Date, Plan Value, Validity Period, Service Type.
- **Derived Features:**
  - Recharge frequency, average monthly telecom spend, continuity gaps.

---

## 4. Canonical Evidence Domain Schema

All heterogeneous evidence files are normalized into standard domain structs in Go:

```json
{
  "id": "ev-001",
  "customer_id": "cust-rajesh",
  "source_type": "upi",
  "source_provider": "bank_statement",
  "period_start": "2026-01-01",
  "period_end": "2026-03-31",
  "source_quality": 0.95,
  "extraction_confidence": 0.98,
  "provenance": {
    "evidence_id": "ev-001",
    "document_name": "bank_statement_q1.csv",
    "document_format": "csv",
    "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "record_count": 39,
    "extraction_confidence": 0.98,
    "validation_status": "PASSED",
    "ingested_at": "2026-09-06T12:00:00Z"
  }
}
```

