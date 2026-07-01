# Devpost Text — Coherix Review Agent

## Project name

Coherix Review Agent

## Tagline

A Slack agent that helps teams decide when AI-generated outputs need human review.

## Short description

Coherix Review Agent is a Slack agent that evaluates AI-generated outputs across the original prompt, response, constraints, and optional evidence to decide whether human review is needed before use.

## Built with

Slack Agent Builder, Slack, Slack Bolt, Node.js, JavaScript, Socket Mode, AI output review, cross-layer compatibility analysis, Coherix, human review workflow

## Inspiration

AI-generated outputs are increasingly used inside team workflows, but teams often lack a simple way to decide when an output should be reviewed by a human before use.

Coherix Review Agent was inspired by the need for a practical observability layer for AI outputs inside Slack. The goal is not to verify truth, detect hallucinations, or replace human reviewers. Instead, the agent helps teams evaluate whether the different layers of an AI interaction hold together: the original prompt, the AI response, stated constraints, optional evidence, and the intended use.

## What it does

Coherix Review Agent is a Slack agent that helps teams decide when AI-generated outputs need human review.

A user provides the original prompt, the AI-generated response, relevant constraints, and optional evidence or source material.

The agent returns:

- Status: OK, Review, or High Review
- Prompt alignment
- Constraint adherence
- Evidence support
- Cross-layer risk
- A short recommendation

The agent flags possible cross-layer incompatibilities, such as a response that does not fully answer the prompt, violates stated constraints, makes claims not supported by the provided evidence, or gives a recommendation stronger than the evidence allows.

## How we built it

The project was designed as a Slack-based review workflow for AI-generated outputs. The core logic is based on cross-layer compatibility analysis: instead of scoring a response as true or false, the agent compares the relationship between the prompt, response, constraints, and evidence.

The MVP uses a Node.js review engine connected to Slack through Slack Bolt and Socket Mode. Users interact with the agent through the `/coherix-review` slash command.

The output is designed to support human judgment, not replace it.

## Challenges we ran into

The main challenge was positioning the system responsibly. Many AI review tools claim to detect hallucinations or verify truth, but those claims are difficult to guarantee in real-world settings.

We deliberately avoided those claims. Instead, we reframed the project around human review support, AI-output governance, and cross-layer incompatibility detection.

Another challenge was keeping the MVP simple enough for a hackathon while preserving the deeper idea behind Coherix: measuring whether different layers of a system remain compatible.

## Accomplishments that we're proud of

We created a clear and practical use case for AI-output governance inside Slack.

We built a working Slack agent with a functional slash command and a local review engine that returns OK, Review, or High Review.

We also established a careful claim boundary: the agent helps flag outputs that may need human review, supports review workflows, and detects cross-layer incompatibilities. It does not claim to verify truth, guarantee compliance, or replace human review.

This makes the project useful, understandable, and responsible.

## What we learned

We learned that a useful AI governance tool does not need to make extreme claims. A simple, interpretable review agent can provide value by helping teams notice when an AI-generated output should not be used without further review.

We also learned that Slack is a strong environment for this kind of workflow because review decisions often happen in team conversations.

## What's next for Coherix Review Agent

The next step is to strengthen the review logic and test the agent on more examples of AI-generated outputs.

The current MVP focuses on a simple but useful workflow: helping a Slack user decide whether an AI-generated response should be accepted, reviewed, or escalated for human review.

Future versions could add saved review history, configurable team thresholds, evidence-aware workflows, and lightweight dashboards. These are not required for the MVP, but they show how the project could grow into a broader AI-output governance tool.

The long-term goal is to make Coherix Review Agent a practical observability layer for reviewing AI-generated outputs in team environments.

## Responsible claims

Allowed claims:

- Flags outputs that may need human review
- Supports AI-output governance
- Detects cross-layer incompatibilities
- Helps review AI responses before use
- Provides interpretable review signals

Avoided claims:

- Detects hallucinations
- Verifies truth
- Guarantees compliance
- Replaces human review
- Certifies AI responses as safe
