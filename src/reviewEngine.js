function normalizeText(value) {
  return (value || "").toLowerCase().trim();
}

function includesAny(text, keywords) {
  return keywords.some(keyword => text.includes(keyword));
}

function computeRiskScore(signals) {
  let score = 0;

  if (signals.missingPrompt) score += 15;
  if (signals.missingResponse) score += 25;
  if (signals.missingConstraints) score += 15;
  if (signals.missingEvidence) score += 10;

  if (signals.uncertainLanguage) score += 15;
  if (signals.unsupportedClaim) score += 20;
  if (signals.policyOrConstraintRisk) score += 25;
  if (signals.overconfidentTone) score += 15;
  if (signals.actionableHighImpactAdvice) score += 20;

  return Math.min(score, 100);
}

function determineStatus(score) {
  if (score >= 70) return "High Review";
  if (score >= 35) return "Review";
  return "OK";
}

function determinePrimaryIssue(signals) {
  if (signals.missingResponse) return "Missing AI response";
  if (signals.policyOrConstraintRisk) return "Constraint or policy drift";
  if (signals.unsupportedClaim) return "Evidence support mismatch";
  if (signals.actionableHighImpactAdvice) return "High-impact actionable advice";
  if (signals.overconfidentTone) return "Overconfident output";
  if (signals.uncertainLanguage) return "Uncertainty or weak grounding";
  if (signals.missingEvidence) return "Missing evidence context";
  if (signals.missingConstraints) return "Missing constraints";
  if (signals.missingPrompt) return "Missing original prompt";
  return "No major issue detected";
}
function detectsConstraintConflict(constraints, response) {
  const rules = [
    {
      constraintKeywords: ["do not provide financial advice", "avoid financial advice", "no financial advice"],
      responseKeywords: ["investment advice", "financial advice", "buy", "sell", "stock", "portfolio", "guaranteed return"]
    },
    {
      constraintKeywords: ["avoid guarantees", "do not guarantee", "no guarantees", "do not promise"],
      responseKeywords: ["guaranteed", "100%", "no risk", "cannot fail", "definitely work", "will work"]
    },
    {
      constraintKeywords: ["do not provide medical advice", "avoid medical advice", "no medical advice"],
      responseKeywords: ["diagnosis", "prescription", "dosage", "treatment", "medical advice"]
    },
    {
      constraintKeywords: ["do not provide legal advice", "avoid legal advice", "no legal advice"],
      responseKeywords: ["legal advice", "lawsuit", "sue", "contract", "court", "liable"]
    },
    {
      constraintKeywords: ["do not use private data", "avoid private data", "no private data"],
      responseKeywords: ["private data", "personal information", "confidential", "secret", "password", "ssn"]
    }
  ];

  return rules.some(rule => {
    const constraintMatched = includesAny(constraints, rule.constraintKeywords);
    const responseMatched = includesAny(response, rule.responseKeywords);
    return constraintMatched && responseMatched;
  });
}

function buildExecutiveSummary(status, score, primaryIssue) {
  if (status === "High Review") {
    return `High-priority review recommended. The output shows a strong risk signal (${score}/100), mainly due to: ${primaryIssue}.`;
  }

  if (status === "Review") {
    return `Human review recommended. The output shows a moderate risk signal (${score}/100), mainly due to: ${primaryIssue}.`;
  }

  return `No major cross-layer incompatibility detected. The output shows a low risk signal (${score}/100).`;
}

function reviewAIOutput(input) {
  const prompt = normalizeText(input.prompt);
  const response = normalizeText(input.response);
  const constraints = normalizeText(input.constraints);
  const evidence = normalizeText(input.evidence);

const combined = `${prompt}\n${response}\n${constraints}\n${evidence}`;
const constraintConflict = detectsConstraintConflict(constraints, response);

const signals = {
    missingPrompt: prompt.length === 0,
    missingResponse: response.length === 0,
    missingConstraints: constraints.length === 0,
    missingEvidence: evidence.length === 0,

    uncertainLanguage: includesAny(response, [
      "maybe",
      "possibly",
      "not sure",
      "unclear",
      "i think",
      "probably",
      "it seems"
    ]),

    unsupportedClaim:
      evidence.length === 0 &&
      includesAny(response, [
        "proven",
        "guaranteed",
        "always",
        "never",
        "definitely",
        "certainly",
        "scientifically proven"
      ]),

policyOrConstraintRisk:
  constraintConflict ||
  (
    constraints.length > 0 &&
    includesAny(response, [
      "ignore",
      "bypass",
      "workaround",
      "without permission",
      "secret",
      "confidential",
      "private data"
    ])
  ),

    overconfidentTone: includesAny(response, [
      "guaranteed",
      "100%",
      "no risk",
      "cannot fail",
      "perfectly safe",
      "definitely true"
    ]),

    actionableHighImpactAdvice: includesAny(combined, [
      "medical",
      "legal",
      "financial",
      "investment",
      "diagnosis",
      "prescription",
      "lawsuit",
      "tax",
      "contract",
      "safety-critical"
    ])
  };

  const score = computeRiskScore(signals);
  const status = determineStatus(score);
  const primaryIssue = determinePrimaryIssue(signals);
  const executiveSummary = buildExecutiveSummary(status, score, primaryIssue);

  const reasons = [];

  if (signals.missingPrompt) {
    reasons.push("The original prompt is missing, so prompt-response alignment cannot be fully assessed.");
  }

  if (signals.missingResponse) {
    reasons.push("The AI response is missing, so the output cannot be reviewed.");
  }

  if (signals.missingConstraints) {
    reasons.push("No explicit constraints were provided, limiting the ability to detect constraint drift.");
  }

  if (signals.missingEvidence) {
    reasons.push("No evidence or source material was provided, limiting support assessment.");
  }

  if (signals.uncertainLanguage) {
    reasons.push("The response contains uncertainty markers that may require clarification or grounding.");
  }

  if (signals.unsupportedClaim) {
    reasons.push("The response appears to make strong claims without supporting evidence.");
  }

  if (signals.policyOrConstraintRisk) {
    reasons.push("The response may conflict with provided constraints or policy-sensitive boundaries.");
  }

  if (signals.overconfidentTone) {
    reasons.push("The response uses overconfident language that may exceed what the evidence supports.");
  }

  if (signals.actionableHighImpactAdvice) {
    reasons.push("The content appears to involve high-impact advice where human review is recommended.");
  }

  return {
    status,
    score,
    primaryIssue,
    executiveSummary,
    promptAlignment: signals.missingPrompt || signals.missingResponse ? "Limited" : "Checked",
    constraintAdherence: signals.policyOrConstraintRisk ? "Potential drift" : "No major drift detected",
    evidenceSupport: signals.missingEvidence || signals.unsupportedClaim ? "Limited" : "Supported by provided context",
    crossLayerRisk: score >= 70 ? "High" : score >= 35 ? "Moderate" : "Low",
    recommendation:
      status === "High Review"
        ? "Do not use this output without human review."
        : status === "Review"
          ? "Review before use, especially for evidence support and constraint adherence."
          : "Output appears acceptable under the current MVP review logic.",
    reasons
  };
}

module.exports = {
  reviewAIOutput
};