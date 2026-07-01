function normalizeText(value) {
  return (value || "").toString().trim();
}

function containsSpecificDatePromise(text) {
  const lower = text.toLowerCase();

  const dateLikePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\bby monday\b/,
    /\bby tuesday\b/,
    /\bby wednesday\b/,
    /\bby thursday\b/,
    /\bby friday\b/,
    /\bby saturday\b/,
    /\bby sunday\b/,
    /\btomorrow\b/,
    /\bin \d+ days\b/,
    /\bwithin \d+ hours\b/,
    /\bguaranteed\b/,
    /\bwe guarantee\b/
  ];

  return dateLikePatterns.some(pattern => pattern.test(lower));
}

function detectConstraintAdherence(constraints, response, reasons) {
  if (!constraints) {
    reasons.push("No explicit constraints were provided.");
    return { label: "Medium", risk: 0 };
  }

  const c = constraints.toLowerCase();
  const r = response.toLowerCase();

  if (
    c.includes("do not promise") &&
    (c.includes("date") || c.includes("delivery"))
  ) {
    if (containsSpecificDatePromise(r)) {
      reasons.push("The response may violate the constraint by promising a specific date or guarantee.");
      return { label: "Low", risk: 3 };
    }

    return { label: "High", risk: 0 };
  }

  if (c.includes("do not") || c.includes("must not") || c.includes("avoid")) {
    const forbiddenWords = c
      .replace(/do not|must not|avoid/g, "")
      .split(/[^a-zA-Z0-9]+/)
      .filter(word => word.length > 5);

    const matchedForbidden = forbiddenWords.filter(word => r.includes(word));

    if (matchedForbidden.length > 0) {
      reasons.push("The response may include content that conflicts with a stated constraint.");
      return { label: "Low", risk: 2 };
    }
  }

  return { label: "Medium", risk: 1 };
}

function detectEvidenceSupport(evidence, response, reasons) {
  if (!evidence) {
    reasons.push("No evidence or source material was provided.");
    return { label: "Weak or Missing", risk: 1 };
  }

  const evidenceWords = evidence
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter(word => word.length > 6);

  const responseLower = response.toLowerCase();
  const matched = evidenceWords.filter(word => responseLower.includes(word));

  if (matched.length >= 2) {
    return { label: "Strong", risk: 0 };
  }

  if (matched.length >= 1) {
    return { label: "Partial", risk: 0 };
  }

  reasons.push("The response is only weakly connected to the provided evidence.");
  return { label: "Partial", risk: 1 };
}

function detectPromptAlignment(prompt, response, reasons) {
  if (!prompt || !response) {
    reasons.push("The prompt or AI response is missing, so the output cannot be reviewed reliably.");
    return { label: "Low", risk: 3 };
  }

  if (response.length < 40) {
    reasons.push("The AI response appears too short to fully address the prompt.");
    return { label: "Low", risk: 1 };
  }

  return { label: "High", risk: 0 };
}

function reviewAIOutput({ prompt, response, constraints, evidence }) {
  prompt = normalizeText(prompt);
  response = normalizeText(response);
  constraints = normalizeText(constraints);
  evidence = normalizeText(evidence);

  const reasons = [];

  const promptAlignment = detectPromptAlignment(prompt, response, reasons);
  const constraintAdherence = detectConstraintAdherence(constraints, response, reasons);
  const evidenceSupport = detectEvidenceSupport(evidence, response, reasons);

  const riskPoints =
    promptAlignment.risk +
    constraintAdherence.risk +
    evidenceSupport.risk;

  let status = "OK";
  let crossLayerRisk = "Low";

if (riskPoints >= 3) {
  status = "High Review";
  crossLayerRisk = "High";
} else if (riskPoints >= 2) {
  status = "Review";
  crossLayerRisk = "Elevated";
} else if (riskPoints === 1) {
  status = "Review";
  crossLayerRisk = "Moderate";
}

  const recommendation =
    status === "OK"
      ? "The output appears usable, but human judgment remains recommended for important decisions."
      : status === "Review"
        ? "Human review is recommended before using this output."
        : "High-priority human review is recommended before using this output.";

  return {
    status,
    promptAlignment: promptAlignment.label,
    constraintAdherence: constraintAdherence.label,
    evidenceSupport: evidenceSupport.label,
    crossLayerRisk,
    reasons,
    recommendation
  };
}

module.exports = {
  reviewAIOutput
};