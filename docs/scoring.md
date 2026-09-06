# Scoring & Explainability

## 1. Core Architectural Separation

$$\textbf{DETERMINISTIC DATA} \longrightarrow \textbf{METRICS / SCORES} \longrightarrow \textbf{VISUALIZATION} \longrightarrow \textbf{ONE FINAL ASSESSMENT SUMMARY}$$

```text
Evidence Documents
 ↓
Normalized Records (CanonicalEvidence)
 ↓
Deterministic Features (DerivedFeatures)
 ↓
Five Behavioural Dimensions (0–100)
 ↓
Credit Risk Score (300–900)
 ↓
Financial Reconciliation & Guardrails
 ↓
Grounded Underwriting Assessment Summary
```

The AI agent does **not** invent or directly calculate the credit score. All calculations are executed in deterministic Go code.

---

## 2. Five Behavioural Dimensions ($0–100$ Scale)

The engine deterministically computes five human-readable behavioral dimensions:

### 1. Cash-flow Stability ($C \in [0, 100]$) — Weight: 30%
Measures consistency and predictability of observed inflows/outflows.
- **Inflow Volatility Component:** Evaluated via Coefficient of Variation ($CV = \frac{\sigma}{\mu}$ of monthly inflows). Lower volatility scores higher:
  $$\text{VolatilityPts} = \max(10.0, \ 85.0 - (CV_{\text{inflow}} \times 90.0))$$
- **Net Cash-Flow Bonus:** $+10.0$ pts if $\text{NetCashFlow} = \text{TotalInflow} - \text{TotalOutflow} > 0$.
- **Recurring Inflow Bonus:** Up to $+15.0$ pts based on $\text{RecurringInflowRatio}$.
- **Formula:** $C = \text{clamp}(\text{VolatilityPts} + \text{NetCashBonus} + \text{RecurringBonus}, \ 10.0, \ 98.0)$.

### 2. Income Consistency ($I \in [0, 100]$) — Weight: 20%
Measures continuity, working density, and predictability of observed earnings.
- **Continuity Months:** $+15$ pts per continuous active month (up to $40.0$ pts).
- **Active Working Days:** Up to $+35.0$ pts for $\ge 25$ active days/month: $\min\left(35.0, \frac{\text{ActiveDays/Mo}}{25.0} \times 35.0\right)$.
- **Earnings Volatility:** Up to $+25.0$ pts based on low earnings variance: $\max(5.0, \ 25.0 - (CV_{\text{earnings}} \times 30.0))$.
- **Formula:** $I = \text{clamp}(\text{ContinuityPts} + \text{ActiveDaysPts} + \text{EarningsVolatilityPts}, \ 10.0, \ 98.0)$.

### 3. Payment Discipline ($P \in [0, 100]$) — Weight: 20%
Measures observed payment regularity and adherence to bills/obligations.
- **On-Time Payment Ratio:** Up to $+75.0$ pts: $\text{OnTimeRatio} \times 75.0$.
- **Average Delay Penalty:** $-\min(30.0, \ \text{AvgDelayDays} \times 6.0)$.
- **Bill Volume Base:** Up to $+25.0$ pts for $\ge 5$ observed bills: $\min(25.0, \ \text{TotalBills} \times 5.0)$.
- **Formula:** $P = \text{clamp}(\text{OnTimePts} - \text{DelayPenalty} + \text{VolumeBase}, \ 10.0, \ 98.0)$.

### 4. Activity Continuity ($A \in [0, 100]$) — Weight: 15%
Measures sustained economic and transactional engagement over calendar periods.
- **Active Calendar Days Ratio:** Up to $+50.0$ pts: $\min(50.0, \ \text{ActiveDaysRatio} \times 70.0)$.
- **Transaction Density:** Up to $+30.0$ pts for $\ge 20$ active transactions.
- **Observation Span:** Up to $+20.0$ pts for $\ge 3$ active months.
- **Formula:** $A = \text{clamp}(\text{ActiveDaysPts} + \text{TxnDensityPts} + \text{SpanPts}, \ 10.0, \ 98.0)$.

### 5. Financial Resilience ($R \in [0, 100]$) — Weight: 15%
Measures capacity to absorb normal expense shocks and financial cushion.
- **Credit/Debit Ratio Tier:**
  - Ratio $\ge 2.0 \rightarrow 45.0$ pts
  - $1.4 \le \text{Ratio} < 2.0 \rightarrow 38.0$ pts
  - $1.1 \le \text{Ratio} < 1.4 \rightarrow 28.0$ pts
  - $1.0 \le \text{Ratio} < 1.1 \rightarrow 20.0$ pts
  - $\text{Ratio} < 1.0 \rightarrow 10.0$ pts
- **Net Inflow Buffer:** Up to $+35.0$ pts for net buffer exceeding 1 month's average outflow: $\min\left(35.0, \frac{\text{NetCashFlow}}{\text{AvgMonthlyOutflow}} \times 35.0\right)$.
- **Recurring Inflow Bonus:** Up to $+20.0$ pts for recurring source diversification.
- **Formula:** $R = \text{clamp}(\text{RatioPts} + \text{BufferPts} + \text{RecurringBonus}, \ 10.0, \ 98.0)$.

---

## 3. Credit Score Calculation ($300–900$ Scale)

### Prototype Dimension Weights
- **Cash-flow Stability (C):** 30% (`0.30`)
- **Income Consistency (I):** 20% (`0.20`)
- **Payment Discipline (P):** 20% (`0.20`)
- **Activity Continuity (A):** 15% (`0.15`)
- **Financial Resilience (R):** 15% (`0.15`)

$$\text{Composite Behavioral Score } (B) = 0.30C + 0.20I + 0.20P + 0.15A + 0.15R$$
$$\text{Alternative Credit Score} = \text{round}(300 + 6 \times B)$$

### Risk Bands
- **750 – 900:** Low Risk
- **670 – 749:** Low–Moderate Risk
- **580 – 669:** Moderate Risk
- **300 – 579:** Higher Risk

---

## 4. Confidence & Data Coverage Metrics

### Confidence (0–100%)
Measures evidence reliability and extraction fidelity without mutating the credit score:
$$\text{Confidence} = \text{round}\Big(0.35 \cdot Q_{\text{source}} + 0.30 \cdot E_{\text{extraction}} + 0.20 \cdot V_{\text{validation}} + 0.15 \cdot C_{\text{cross}}\Big) \in [10\%, 100\%]$$

### Data Coverage (0–100%)
Measures the dimensional breadth of ingested evidence:
$$\text{Coverage} = 35\% \cdot \mathbb{I}(\text{UPI}) + 25\% \cdot \mathbb{I}(\text{Gig}) + 20\% \cdot \mathbb{I}(\text{Utility}) + 15\% \cdot \mathbb{I}(\text{GST}) + 5\% \cdot \mathbb{I}(\text{Telecom})$$

> **Missing Data Principle:** Missing evidence sources reduce Data Coverage and Confidence, but **never reduce the credit score**.

---

## 5. Financial Reconciliation Layer

The engine compares self-declared profile attributes against observed transactional evidence across 4 dimensions:

1. **Monthly Inflow / Income:** Variance evaluated between declared monthly income and verified statement deposits.
2. **Monthly Outflows / Expenses:** Evaluates declared household costs against observed debit totals.
3. **Primary Income Channel:** Validates declared payment rails (UPI, Bank Transfer) against transaction descriptions.
4. **Activity History / Continuity:** Validates active working history across consecutive observation months.

### Reconciliation State Badges
- **`CONSISTENT`:** Variance $\le 15\%$, payment rails matching.
- **`MINOR_VARIANCE`:** Variance $>15\%$ and $\le 30\%$, acceptable for informal workers.
- **`SIGNIFICANT_VARIANCE`:** Variance $>30\%$, triggers underwriter attention.
- **`PARTIALLY_OBSERVED`:** Evidence observed for partial cycles or single rails.

---

## 6. Grounded Underwriting Assessment Summary

Rather than distributing unstructured AI prose across multiple UI cards, the engine synthesizes **ONE single Underwriting Assessment Summary** grounded strictly in verified numbers:

- References average observed inflows, observation months, and variance percentage.
- Summarizes utility bill fulfillment (on-time count, total cycles, average delay days).
- Notes gig platform continuity and active working days per month.
- Evaluates multi-source corroboration and flags policy recommendations (Standard Approval vs Manual Review).

```json
{
  "assessment_summary": "Observed monthly cash inflows average ₹26467 across 3 active months (a 17.3% variance from declared ₹32000/mo). Utility payment discipline reflects 4 of 5 bills fulfilled on-time (80% on-time rate) with an average delay of 0.4 days. Platform work continuity is corroborated over 3 consecutive months averaging 26 active days/mo. Multi-source corroboration across 3 independent evidence sources validates low behavioral risk and sound financial resilience."
}
```

