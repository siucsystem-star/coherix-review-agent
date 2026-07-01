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

function formatReview(result) {
  const reasons =
    result.reasons.length > 0
      ? result.reasons.map(reason => `• ${reason}`).join("\n")
      : "• No major cross-layer incompatibility was detected by the MVP review logic.";

  return `
*Coherix Review Agent*

*Status:* ${result.status}

*Prompt alignment:* ${result.promptAlignment}
*Constraint adherence:* ${result.constraintAdherence}
*Evidence support:* ${result.evidenceSupport}
*Cross-layer risk:* ${result.crossLayerRisk}

*Reason:*
${reasons}

*Recommendation:*
${result.recommendation}

_Note: This agent does not verify truth, detect hallucinations, guarantee compliance, or replace human review._
`;
}

app.command("/coherix-review", async ({ command, ack, respond }) => {
  await ack();

  const input = parseInput(command.text);
  const result = reviewAIOutput(input);

  await respond(formatReview(result));
});



(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("Coherix Review Agent is running.");
})();