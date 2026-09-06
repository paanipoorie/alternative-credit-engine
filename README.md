# Alternative Credit Engine

## TVS Credit E.P.I.C. — Problem Statement 4

**Alternative Data Credit Engine for the Invisible Customer**

Develop an AI-powered alternative credit scoring engine leveraging GST data, UPI transaction trends, telecom recharge patterns, utility bill payments, e-commerce activity, and mobility/vehicle usage patterns to generate explainable risk scores for first-time borrowers, gig workers, small merchants, and informal sector workers.

## Product thesis

Traditional underwriting can struggle when a customer has little or no conventional credit history. The product adds an **evidence-first behavioural intelligence layer**: customers provide financial evidence they are willing and able to share; the system converts that evidence into normalized, explainable financial behaviour signals.

The system does **not** treat missing evidence as bad credit.

It reports three separate concepts:

- **Risk score:** observed behavioural risk.
- **Confidence:** reliability of the evidence and analysis.
- **Data coverage:** how much relevant evidence was available.

## Core architecture

```text
Customer
   ↓
Next.js Customer UI
   ↓
Go API
   ↓
n8n Workflow Orchestrator
   ↓
Document / Data Processing
   ↓
Gemini-powered specialized agents
   ├── Document Classification Agent
   ├── Evidence Extraction Agent
   ├── UPI Analysis Agent
   ├── GST Analysis Agent
   ├── Gig/Work Earnings Agent
   └── Evidence Reconciliation Agent
   ↓
Validation
   ↓
Deterministic Feature Engine
   ↓
Risk Model
   ↓
Decision Policy
   ↓
Score + Confidence + Coverage
   ↓
Evidence-backed Explanation
   ↓
Go API → Next.js Profile
```

## Technology roles

| Component | Role |
|---|---|
| Next.js | Customer-facing product UI |
| Go | Backend/API and application services |
| n8n | Workflow orchestration |
| Gemini | Foundation AI model used by agents |
| AI agents | Specialized interpretation, extraction and reconciliation |
| Python | Feature/risk-model service where useful |
| PostgreSQL | Structured evidence, features, profiles and results |
| Object storage | Original uploaded evidence |
| Risk model | Actual statistical/algorithmic risk calculation |

## Critical architecture rule

**An AI agent must not directly approve/decline a borrower or invent a credit score.**

Agents produce structured evidence and findings.

Deterministic code calculates financial features.

A separate risk model produces the score.

A separate decision policy maps the score and business rules to outcomes.

## Prototype strategy

Build one complete vertical slice first:

```text
UPI CSV upload
→ n8n
→ evidence extraction
→ validation
→ financial features
→ illustrative risk model
→ score
→ explanation
→ evidence trace
```

Then add additional evidence types.

The prototype score and weights are illustrative because TVS repayment-labelled training data is not available to the team. They must not be presented as TVS's production credit policy.

## Non-goals

- Replacing TVS's existing underwriting system.
- Creating a generic chatbot.
- Continuous GPS surveillance.
- Inferring sensitive personal characteristics.
- Treating e-commerce purchases or telecom usage as dominant credit signals.
- Letting an LLM make autonomous lending decisions.

## Repository

```text
alternative-credit-engine/
├── apps/
│   ├── web/
│   └── api/
├── services/
│   ├── processor/
│   └── risk-model/
├── workflows/
│   └── n8n/
├── docs/
├── data/
│   └── synthetic/
└── README.md
```
