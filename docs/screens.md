# Product Screens

## Screen 1 — Entry

```text
BUILD YOUR FINANCIAL PROFILE

Share evidence that can help us assess your financial reliability.

[ + Add financial evidence ]
[ + Connect a data source ]

PDF • CSV • Excel • Image

You don't need to provide everything.
```

Purpose:
- explain the product
- avoid segment selection
- communicate optional evidence

## Screen 2 — Consent

```text
YOUR DATA, YOUR CHOICE

We will use the selected financial evidence
to assess financial behaviour and generate
an explainable risk profile.

[ What we'll use ]
[ Why we need it ]
[ How long it is used ]

[ Continue ]
```

Include explicit consent controls.

## Screen 3 — Evidence Hub

```text
YOUR EVIDENCE

UPI / Bank transactions     ✓
GST                        —
Gig earnings               ✓
Utility payments           ✓
Telecom                    —
E-commerce                 —
Vehicle evidence           —

[ + Add evidence ]
```

Do not make missing categories look like failures.

## Screen 4 — Add Evidence

```text
ADD FINANCIAL EVIDENCE

[ Upload file ]
[ Connect source ]

Supported:
PDF • CSV • Excel • Image

We automatically identify the evidence type.
```

## Screen 5 — Processing

Show meaningful processing stages:

```text
Processing evidence

✓ File received
✓ Document identified
✓ Information extracted
● Validating records
○ Calculating financial behaviour
○ Building profile
```

Avoid fake AI animations.

## Screen 6 — Detected Evidence

```text
EVIDENCE DETECTED

✓ UPI transaction data
  Jan–Jun 2026
  1,284 records
  High data quality

✓ Gig earnings statement
  Jan–Jun 2026
  6 monthly records
  High data quality

✓ Electricity payment records
  Feb–Jun 2026
  5 records
  Medium data quality
```

Allow the customer to inspect/remove evidence where appropriate.

## Screen 7 — Profile

```text
ALTERNATIVE CREDIT PROFILE

742 / 900
LOW–MODERATE RISK

Confidence      84%
Data coverage   71%

Cash-flow stability       82
Income consistency        76
Payment discipline        91
Activity continuity       73
Financial resilience      79
```

## Screen 8 — Why this score?

```text
WHY THIS PROFILE?

+ Consistent monthly inflows
+ Strong payment regularity
+ Sustained work activity
- Moderate income volatility

[ View supporting evidence ]
```

Every reason should be traceable.

## Screen 9 — Evidence used

```text
EVIDENCE USED

UPI transactions
Jan–Jun 2026
1,284 records

Gig earnings
Jan–Jun 2026
6 statements

Utility payments
Feb–Jun 2026
5 records
```

## Screen 10 — Explainability detail

Example:

```text
CONSISTENT MONTHLY INFLOWS

Observed:
₹71,200 → ₹76,400 → ₹81,900 → ₹79,300

Feature:
Low monthly inflow volatility

Evidence:
UPI/bank transaction records
Jan–Apr 2026
```

## Screen 11 — Review / warnings

```text
VALIDATION

✓ No major duplicate pattern detected
✓ Sources cover multiple months
⚠ One utility record has low image quality

[ Review ]
```

## Screen 12 — Optional what-if

```text
WHAT-IF

Improve income stability

Current:
742

Scenario:
10% lower monthly volatility

Estimated change:
+X points

This is a scenario, not an approval guarantee.
```

## Design system

The visual language should be inspired by TVS Credit's public brand direction:

- white/light surfaces
- blue for trust/navigation
- green for primary actions and positive states
- subtle borders
- moderate corner radius
- clear financial-product typography
- restrained animation

Avoid:

- neon gradients
- crypto/gaming aesthetics
- excessive glassmorphism
- generic "AI robot" visuals
- dark futuristic dashboards

Prototype colour approximations:

```css
--tvs-blue: #1F4E8C;
--tvs-green: #0B9348;
--tvs-green-dark: #08783B;
--tvs-blue-dark: #173D70;
--surface: #FFFFFF;
--surface-soft: #F7F9F8;
--surface-muted: #F1F4F3;
--text-primary: #222222;
--text-secondary: #5F6368;
--text-muted: #858585;
--border: #DDE3E0;
```

These are prototype design approximations, not claims about official TVS hex specifications.
