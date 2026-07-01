require("dotenv").config();

const { App } = require("@slack/bolt");
const { reviewAIOutput } = require("./reviewEngine");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

function parseInput(text) {
  const sections = {
    prompt: "",
    response: "",
    constraints: "",
    evidence: ""
  };

  const patterns = {
    prompt: /Prompt:\s*([\s\S]*?)(?=AI response:|Response:|Constraints:|Evidence:|$)/i,
    response: /(?:AI response:|Response:)\s*([\s\S]*?)(?=Constraints:|Evidence:|$)/i,
    constraints: /Constraints:\s*([\s\S]*?)(?=Evidence:|$)/i,
    evidence: /Evidence:\s*([\s\S]*?)$/i
  };

  for (const key of Object.keys(patterns)) {
    const match = text.match(patterns[key]);
    if (match) sections[key] = match[1].trim();
  }

  return sections;
}

function getStatusStyle(status) {
  if (status === "OK") {
    return {
      emoji: "🟩",
      title: "OK",
      message: "No major cross-layer incompatibility detected."
    };
  }

  if (status === "Review") {
    return {
      emoji: "🟨",
      title: "Review",
      message: "Human review is recommended before use."
    };
  }

  return {
    emoji: "🟥",
    title: "High Review",
    message: "High-priority human review is recommended before use."
  };
}

function buildReviewBlocks(result) {
  const status = getStatusStyle(result.status);

  const reasons =
    result.reasons.length > 0
      ? result.reasons.map(reason => `• ${reason}`).join("\n")
      : "• No major cross-layer incompatibility was detected by the MVP review logic.";

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${status.emoji} Coherix Review Agent — ${status.title}`,
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*AI-output review completed.*\n${status.message}`
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Prompt alignment*\n${result.promptAlignment}`
        },
        {
          type: "mrkdwn",
          text: `*Constraint adherence*\n${result.constraintAdherence}`
        },
        {
          type: "mrkdwn",
          text: `*Evidence support*\n${result.evidenceSupport}`
        },
        {
          type: "mrkdwn",
          text: `*Cross-layer risk*\n${result.crossLayerRisk}`
        }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Why this was flagged*\n${reasons}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Recommendation*\n${result.recommendation}`
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Triage signal only — this agent does not verify truth, detect hallucinations, guarantee compliance, or replace human review."
        }
      ]
    }
  ];
}

app.command("/coherix-review", async ({ command, ack, respond }) => {
  await ack();

  const input = parseInput(command.text);
  const result = reviewAIOutput(input);

  await respond({
    response_type: "ephemeral",
    text: `Coherix Review Agent — ${result.status}`,
    blocks: buildReviewBlocks(result)
  });
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("Coherix Review Agent is running.");
})();