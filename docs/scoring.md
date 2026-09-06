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

## 2. Five Behavioural Dimensions ($0–100$ Scale)

The prototype deterministically computes five human-readable behavioral dimensions:

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
$$\text{Score} = \text{round}(300 + 6 \times B)$$

**Example Calculation:**
- Cash-flow Stability ($C$) = 82
- Income Consistency ($I$) = 70
- Payment Discipline ($P$) = 88
- Activity Continuity ($A$) = 75
- Financial Resilience ($R$) = 62

$$B = (82 \times 0.30) + (70 \times 0.20) + (88 \times 0.20) + (75 \times 0.15) + (62 \times 0.15) = 76.75$$
$$\text{Score} = \text{round}(300 + (6 \times 76.75)) = 761$$

### Risk Bands
- **750 – 900:** Low Risk
- **670 – 749:** Low–Moderate Risk
- **580 – 669:** Moderate Risk
- **300 – 579:** Higher Risk

> **IMPORTANT:** These weights and formulas represent a **transparent prototype scoring framework** for underwriting decision support. In production, this transparent framework can be replaced with a calibrated statistical/ML risk model trained on historical repayment outcomes.

## 4. Production Model Evolution

With appropriate historical repayment-labelled data, candidate models include:
- Logistic regression as an interpretable baseline
- Gradient-boosted decision trees (XGBoost / LightGBM)
- Calibrated probability-of-default (PD) models with Scorecard scaling

## 5. Explainability & Grounded Reasons

Every reason shown to a user or underwriter originates from measurable mathematical features with complete provenance.

Structure:
```json
{
  "type": "positive",
  "title": "Consistent Monthly Inflows",
  "summary": "Observed low month-over-month inflow volatility (CV: 0.08) with an average of ₹31,450/month across 3 active months.",
  "source_type": "upi",
  "evidence_ref": "UPI Transaction Records",
  "observed_value": "₹31,450 avg/mo (CV 0.08)",
  "impact": "HIGH"
}
```

## 6. Confidence Calculation (Independent of Score)

Confidence measures how reliable and verifiable the evidence is. It **never modifies the credit score directly**.

$$\text{Confidence} = \text{round}\Big(0.35 \cdot Q_{\text{source}} + 0.30 \cdot E_{\text{extraction}} + 0.20 \cdot V_{\text{validation}} + 0.15 \cdot C_{\text{cross}}\Big) \in [10\%, 100\%]$$

- $Q_{\text{source}}$: Source Quality (Provider statement: 0.95, OCR: 0.75)
- $E_{\text{extraction}}$: Extraction Confidence (CSV/Direct: 0.98, Clean PDF: 0.95, Image: 0.85)
- $V_{\text{validation}}$: Validation Integrity (Passed: 1.0, Warning: 0.80, Failed: 0.40)
- $C_{\text{cross}}$: Cross-source reconciliation (3+ sources: 0.98, 2 sources: 0.90, single: 0.80)

## 7. Data Coverage (Independent of Score)

Data coverage answers: *"How much relevant financial evidence was actually available?"*

$$\text{Coverage} = 35\% \cdot \mathbb{I}(\text{UPI}) + 25\% \cdot \mathbb{I}(\text{Gig}) + 20\% \cdot \mathbb{I}(\text{Utility}) + 15\% \cdot \mathbb{I}(\text{GST}) + 5\% \cdot \mathbb{I}(\text{Telecom})$$

## 8. Missing Data Principle

**Missing data MUST NOT automatically reduce the credit score.**
```text
GST missing
    ↓
GST feature unavailable
    ↓
Data coverage remains lower (e.g., 80% instead of 100%)
    ↓
Confidence reflects observed sources
    ↓
Model assesses borrower fairly based on available observed evidence
```

## 9. Decision Policy & Underwriter Governance

Decision policy remains decoupled from the risk model:
```text
Alternative Credit Score (300 - 900) + Confidence + Coverage
                        ↓
            TVS Decision Policy Engine
       ├── Auto-Eligible (e.g., Score >= 750, Conf >= 80%, Cov >= 60%)
       ├── Underwriter Manual Review
       └── Outside Current Policy Limits
```
