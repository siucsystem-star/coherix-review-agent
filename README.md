# Coherix Review Agent

Coherix Review Agent is a Slack agent that helps teams decide when AI-generated outputs need human review before use.

The agent evaluates cross-layer compatibility between:
- the original prompt
- the AI-generated response
- stated constraints
- optional evidence or source material

It returns:
- Status: OK / Review / High Review
- Prompt alignment
- Constraint adherence
- Evidence support
- Cross-layer risk
- Recommendation

## What makes this different

Most AI-review tools ask another LLM to judge the output — one model's opinion checking another. Coherix Review Agent is built on **CMCI**, a coherence-measurement engine grounded in peer-reviewed research (*Frontiers in Artificial Intelligence*, 2026) and prototyped in hardware through a live FPGA demonstration of coherence dynamics.

The review signal comes from a **structural measurement of cross-layer compatibility** — not from another model's guess. This is the same coherence framework I published and prototyped in silicon, adapted into a simple, interpretable Slack workflow.

## Hackathon MVP
The MVP runs inside Slack through the slash command:

`/coherix-review`

## Example input
```text
/coherix-review Prompt: Write a short customer email explaining a delayed shipment.
AI response: Your package will arrive tomorrow. We guarantee delivery within 24 hours.
Constraints: Do not promise a specific delivery date.
Evidence: The shipping provider reported a delay but did not provide a confirmed delivery date.
```

## Example output
```text
Coherix Review Agent
Status: High Review
Prompt alignment: High
Constraint adherence: Low
Evidence support: Partial
Cross-layer risk: High

Reason:
- The response may violate the constraint by promising a specific date or guarantee.

Recommendation:
High-priority human review is recommended before using this output.

Note: This agent does not verify truth, detect hallucinations, guarantee compliance, or replace human review.
```

## Responsible claim boundary
This project does not claim to:
- detect hallucinations
- verify truth
- guarantee compliance
- replace human reviewers

It helps flag AI-generated outputs that may need human review.

## Core idea
The agent does not score general truth or coherence. It evaluates whether the layers of an AI interaction hold together:

```text
prompt ↔ response ↔ constraints ↔ evidence ↔ intended use
```

This is framed as cross-layer compatibility analysis for human review support, powered by the CMCI coherence engine.

## Local setup
Install dependencies:
```bash
npm install
```

Create a `.env` file:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-token-here
PORT=3000
```

Run the local test engine:
```bash
node src/examples.js
```

Run the Slack agent:
```bash
npm start
```

## Slack setup
The app uses Slack Bolt with Socket Mode.

Required Slack configuration:
- Socket Mode enabled
- App-level token with `connections:write`
- Bot token scopes:
  - `commands`
  - `chat:write`
  - `app_mentions:read`
  - `channels:history`
- Slash command:
  - `/coherix-review`

## Status
MVP functional.

Current version:
- Local review engine works
- Slack Socket Mode works
- Slash command works
- OK / Review / High Review outputs validated
