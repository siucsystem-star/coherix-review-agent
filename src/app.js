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
        text: `*Coherix Risk Signal:* *${result.score}/100*\n*Primary Issue:* ${result.primaryIssue}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Executive Summary*\n${result.executiveSummary}`
      }
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Prompt alignment*\n${result.promptAlignment}` },
        { type: "mrkdwn", text: `*Constraint adherence*\n${result.constraintAdherence}` },
        { type: "mrkdwn", text: `*Evidence support*\n${result.evidenceSupport}` },
        { type: "mrkdwn", text: `*Cross-layer risk*\n${result.crossLayerRisk}` }
      ]
    },
    { type: "divider" },
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

function buildReviewModal(channelId) {
  return {
    type: "modal",
    callback_id: "coherix_review_modal",
    private_metadata: JSON.stringify({ channelId }),
    title: {
      type: "plain_text",
      text: "Coherix Review"
    },
    submit: {
      type: "plain_text",
      text: "Submit Review"
    },
    close: {
      type: "plain_text",
      text: "Cancel"
    },
    blocks: [
      {
        type: "input",
        block_id: "prompt_block",
        label: { type: "plain_text", text: "Original prompt" },
        element: {
          type: "plain_text_input",
          action_id: "prompt_input",
          multiline: true,
          placeholder: { type: "plain_text", text: "Paste the original user prompt here." }
        }
      },
      {
        type: "input",
        block_id: "response_block",
        label: { type: "plain_text", text: "AI response" },
        element: {
          type: "plain_text_input",
          action_id: "response_input",
          multiline: true,
          placeholder: { type: "plain_text", text: "Paste the AI-generated response here." }
        }
      },
      {
        type: "input",
        block_id: "constraints_block",
        label: { type: "plain_text", text: "Constraints" },
        element: {
          type: "plain_text_input",
          action_id: "constraints_input",
          multiline: true,
          placeholder: { type: "plain_text", text: "Paste rules, limits, policies, or review constraints here." }
        }
      },
      {
        type: "input",
        block_id: "evidence_block",
        optional: true,
        label: { type: "plain_text", text: "Evidence or source material" },
        element: {
          type: "plain_text_input",
          action_id: "evidence_input",
          multiline: true,
          placeholder: { type: "plain_text", text: "Optional: paste source material, policy notes, or evidence here." }
        }
      }
    ]
  };
}

app.command("/coherix-review", async ({ command, ack, respond, client }) => {
  await ack();

  if (command.text && command.text.trim().length > 0) {
    const input = parseInput(command.text);
    const result = reviewAIOutput(input);

    await respond({
      response_type: "ephemeral",
      text: `Coherix Review Agent — ${result.status}`,
      blocks: buildReviewBlocks(result)
    });

    return;
  }

  await client.views.open({
    trigger_id: command.trigger_id,
    view: buildReviewModal(command.channel_id)
  });
});

app.view("coherix_review_modal", async ({ ack, body, view, client }) => {
  await ack();

  const values = view.state.values;

  const prompt = values.prompt_block.prompt_input.value || "";
  const response = values.response_block.response_input.value || "";
  const constraints = values.constraints_block.constraints_input.value || "";
  const evidence = values.evidence_block.evidence_input.value || "";

  const metadata = JSON.parse(view.private_metadata || "{}");
  const channelId = metadata.channelId;

  const result = reviewAIOutput({ prompt, response, constraints, evidence });

  await client.chat.postEphemeral({
    channel: channelId,
    user: body.user.id,
    text: `Coherix Review Agent — ${result.status}`,
    blocks: buildReviewBlocks(result)
  });
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("Coherix Review Agent is running.");
})();