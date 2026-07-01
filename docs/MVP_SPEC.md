# Coherix Review Agent — MVP Spec v0.1

## Purpose

Coherix Review Agent is a Slack agent that helps teams decide when AI-generated outputs need human review before use.

The MVP focuses on one practical workflow:

> Given a prompt, an AI response, constraints, and optional evidence, return a human-review recommendation.

## Core concept

The agent does not measure general truth, hallucination, or universal coherence.

It evaluates cross-layer compatibility between:

```text
prompt ↔ response ↔ constraints ↔ evidence ↔ intended use
```

The transversal signal is not a separate fourth score. It is the compatibility condition across the layers.

## Claim boundary

The MVP does not claim to:

- detect hallucinations
- verify truth
- guarantee compliance
- replace human reviewers
- certify AI responses as safe

The MVP does claim to:

- flag outputs that may need human review
- support AI-output governance
- detect cross-layer incompatibilities
- provide interpretable review signals
- help review AI responses before use

## Slack command

The Slack slash command is:

```text
/coherix-review
```

## Expected input format

```text
/coherix-review Prompt: ...
AI response: ...
Constraints: ...
Evidence: ...
```

Evidence is optional.

## Output format

The agent returns:

```text
Coherix Review Agent

Status: OK / Review / High Review

Prompt alignment: High / Medium / Low
Constraint adherence: High / Medium / Low
Evidence support: Strong / Partial / Weak or Missing
Cross-layer risk: Low / Moderate / Elevated / High

Reason:
...

Recommendation:
...

Note:
This agent does not verify truth, detect hallucinations, guarantee compliance, or replace human review.
```

## Review signals

### Prompt alignment

Measures whether the AI response appears to address the original prompt.

Possible values:

- High
- Medium
- Low

### Constraint adherence

Measures whether the AI response appears to respect the stated constraints.

Example:

```text
Constraint:
Do not promise a specific delivery date.

Problematic response:
Your package will arrive tomorrow. We guarantee delivery within 24 hours.
```

Expected result:

```text
Constraint adherence: Low
Status: High Review
```

### Evidence support

Measures whether the AI response is connected to the provided evidence or source material.

Possible values:

- Strong
- Partial
- Weak or Missing

### Cross-layer risk

Measures whether the layers hold together.

The risk increases when:

- the response answers a different task than the prompt
- the response violates stated constraints
- the evidence is missing, weak, or mismatched
- the recommendation is stronger than the evidence allows
- the local response conflicts with the intended use

Possible values:

- Low
- Moderate
- Elevated
- High

## Status logic

### OK

No major cross-layer incompatibility is detected.

The response appears usable, while human judgment remains recommended for important decisions.

### Review

A partial weakness, missing support, or moderate uncertainty is detected.

Human review is recommended before using the output.

### High Review

A strong cross-layer incompatibility is detected.

This includes a clear constraint violation, a risky unsupported claim, or a response that should not be used without high-priority human review.

## Demo examples

### Example 1 — OK

Input:

```text
/coherix-review Prompt: Write a short customer email explaining a delayed shipment.
AI response: Your shipment is delayed because the shipping provider reported a delay. We are sorry for the inconvenience and will update you as soon as we receive more information.
Constraints: Do not promise a specific delivery date.
Evidence: The shipping provider reported a delay but did not provide a confirmed delivery date.
```

Expected output:

```text
Status: OK
Prompt alignment: High
Constraint adherence: High
Evidence support: Strong
Cross-layer risk: Low
```

### Example 2 — Review

Input:

```text
/coherix-review Prompt: Write a short customer email explaining a delayed shipment.
AI response: Your shipment is delayed. We are sorry for the inconvenience and will update you soon.
Constraints: Do not promise a specific delivery date.
Evidence: The shipping provider reported a delay but did not provide a confirmed delivery date.
```

Expected output:

```text
Status: Review
Prompt alignment: High
Constraint adherence: High
Evidence support: Partial
Cross-layer risk: Moderate
```

### Example 3 — High Review

Input:

```text
/coherix-review Prompt: Write a short customer email explaining a delayed shipment.
AI response: Your package will arrive tomorrow. We guarantee delivery within 24 hours.
Constraints: Do not promise a specific delivery date.
Evidence: The shipping provider reported a delay but did not provide a confirmed delivery date.
```

Expected output:

```text
Status: High Review
Prompt alignment: High
Constraint adherence: Low
Evidence support: Partial
Cross-layer risk: High
```

## MVP delivery

The hackathon MVP delivers:

- a working Slack slash command
- a local Node.js review engine
- Slack Bolt integration with Socket Mode
- three validated demo cases
- interpretable review output
- responsible claim boundaries

## Not included in MVP

The MVP does not include:

- a full dashboard
- saved review history
- legal compliance certification
- truth verification
- hallucination detection
- replacement of human review

## Possible future extensions

Future versions could add:

- saved review history
- configurable review thresholds
- team-level review settings
- evidence-aware workflows
- lightweight dashboard views
- integrations with internal documentation or knowledge bases
