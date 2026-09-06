# System Architecture

## 1. Architecture principle

Separate **orchestration, AI interpretation, deterministic computation and lending decisioning**.

```text
AI agents → structured evidence/findings
Feature engine → mathematical features
Risk model → risk score
Decision policy → business decision
```

## 2. Full architecture

```text
                         CUSTOMER
                            │
                            ▼
                      ┌───────────┐
                      │ Next.js   │
                      │ Web App   │
                      └─────┬─────┘
                            │
                            ▼
                      ┌───────────┐
                      │  Go API   │
                      └─────┬─────┘
                            │
                            ▼
                      ┌───────────┐
                      │    n8n    │
                      │Orchestrator│
                      └─────┬─────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       Document Agent   UPI Agent     GST Agent
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                  Evidence Extraction
                            │
                            ▼
                       Validation
                            │
                            ▼
                 Normalization Layer
                            │
                            ▼
                  Deterministic Features
                            │
                            ▼
                Evidence Reconciliation
                       Agent
                            │
                            ▼
                       Risk Model
                            │
                            ▼
                    Decision Policy
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
              Score               Explanation
                 │                     │
                 └──────────┬──────────┘
                            ▼
                      Customer Profile
```

## 3. What is an AI model?

An AI model is the underlying machine-learning system that processes input and generates output.

For this prototype, Gemini is the foundation model.

Gemini can be used for:

- document understanding
- classification
- extraction
- semantic interpretation
- reconciliation
- explanation generation

Gemini is **not the credit-scoring model**.

## 4. What is an agent?

An agent is an application built around a model that has:

```text
Model
+ Instructions
+ Context
+ Tools
+ Output schema
+ Guardrails
```

Example:

```text
UPI Analysis Agent
    │
    ├── Gemini
    ├── UPI-specific instructions
    ├── normalized transaction context
    ├── calculation/anomaly tools
    ├── structured JSON output
    └── financial-data guardrails
```

An agent should have one clear responsibility.

## 5. Proposed agents

### Document Classification Agent

Question:

> What kind of evidence is this?

Output:

```json
{
  "document_type": "utility_bill",
  "provider": "electricity",
  "period": "2026-01",
  "confidence": 0.97
}
```

### Evidence Extraction Agent

Question:

> What structured facts are present in this evidence?

It should return fields, source references and extraction confidence.

### UPI Analysis Agent

Analyzes:

- inflows
- outflows
- transaction frequency
- active days
- recurring payments
- volatility
- trends

### GST Analysis Agent

Analyzes:

- reported turnover
- turnover trend
- filing consistency
- tax-related fields
- business activity patterns

### Gig/Work Earnings Agent

Analyzes:

- monthly earnings
- active days
- trips/jobs where present
- earnings per active day
- continuity
- volatility

### Evidence Reconciliation Agent

Cross-checks multiple sources.

Examples:

```text
GST turnover ↔ business transaction activity
Gig earnings ↔ transaction inflows
Utility bill dates ↔ payment records
Duplicate/inconsistent records
```

It produces findings and confidence, not lending decisions.

## 6. Tools

Agents should use deterministic tools for calculations.

Examples:

```text
calculate_monthly_inflow()
calculate_monthly_outflow()
calculate_volatility()
calculate_payment_delay()
detect_recurring_payments()
detect_duplicate_transactions()
calculate_income_continuity()
```

The model can decide which tool is useful, while the tool performs the arithmetic.

## 7. n8n

n8n coordinates the workflow.

Example:

```text
Webhook
 ↓
Store evidence
 ↓
Document classification
 ↓
Route by evidence type
 ↓
Extraction
 ↓
Validation
 ↓
Normalization
 ↓
Feature service
 ↓
Evidence reconciliation
 ↓
Risk model
 ↓
Explanation
 ↓
Persist result
```

n8n is not the credit model and does not replace Gemini.

## 8. AI provider abstraction

Do not hard-code the application around one provider.

Use an internal interface such as:

```go
type DocumentAI interface {
    Classify(ctx context.Context, input DocumentInput) (Classification, error)
    Extract(ctx context.Context, input DocumentInput) (Evidence, error)
    Analyze(ctx context.Context, input AnalysisContext) (Analysis, error)
}
```

Gemini is the initial provider.

The interface allows future comparison or replacement without rewriting the product.

## 9. Storage

Original evidence:

```text
Object storage
```

Structured information:

```text
PostgreSQL
```

Store provenance:

```text
source
document_id
page/row/reference
extracted_value
confidence
timestamp
```

Every important score reason should be traceable.

## 10. Production evolution

Prototype:

```text
Next.js + Go + n8n + Gemini + Python scoring service + PostgreSQL
```

Production can later evolve toward:

```text
Next.js
→ Go services
→ durable queue
→ workers
→ AI provider
→ feature platform
→ production risk model
→ decision engine
```

Kubernetes, Kafka and complex workflow infrastructure are not required for the prototype.
