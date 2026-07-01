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

function containsLegalOrComplianceOverclaim(response) {
  const r = response.toLowerCase();

  const riskyPatterns = [
    /\bfully gdpr compliant\b/,
    /\bgdpr compliant\b/,
    /\bfully compliant\b/,
    /\bcompliant with gdpr\b/,
    /\bno privacy risks\b/,
    /\bno privacy risk\b/,
    /\bno legal risk\b/,
    /\bsafe to use with any customer data\b/,
    /\bguarantee compliance\b/,
    /\bwe guarantee compliance\b/,
    /\b100% compliant\b/,
    /\blegally approved\b/,
    /\bapproved by legal\b/
  ];

  return riskyPatterns.some(pattern => pattern.test(r));
}

function containsCautiousLegalLanguage(response) {
  const r = response.toLowerCase();

  return (
    r.includes("under privacy review") ||
    r.includes("currently under privacy review") ||
    r.includes("cannot make a final") ||
    r.includes("cannot make a final gdpr compliance claim") ||
    r.includes("connect you with our legal") ||
    r.includes("connect you with our privacy") ||
    r.includes("legal or privacy team") ||
    r.includes("for the most accurate information")
  );
}

function containsWeakButSafeLegalLanguage(response) {
  const r = response.toLowerCase();

  return (
    r.includes("take data protection seriously") ||
    r.includes("strong privacy practices") ||
    r.includes("designed with customer data protection") ||
    r.includes("share more details after internal review")
  );
}

function constraintsForbidLegalGuarantees(constraints) {
  const c = constraints.toLowerCase();

  return (
    c.includes("do not make legal guarantees") ||
    c.includes("do not claim full compliance") ||
    c.includes("unless verified by the legal team") ||
    c.includes("recommend legal review") ||
    c.includes("legal review") ||
    c.includes("do not guarantee compliance")
  );
}

function evidenceSaysReviewPending(evidence) {
  const e = evidence.toLowerCase();

  return (
    e.includes("under privacy review") ||
    e.includes("under review") ||
    e.includes("legal team has not approved") ||
    e.includes("has not approved") ||
    e.includes("not approved") ||
    e.includes("pending legal review") ||
    e.includes("no public compliance claim")
  );
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

function detectConstraintAdherence(constraints, response, evidence, reasons) {
  if (!constraints) {
    reasons.push("No explicit constraints were provided.");
    return { label: "Medium", risk: 1 };
  }

  const c = constraints.toLowerCase();
  const r = response.toLowerCase();

  // Special legal/compliance path.
  // This avoids treating the word "compliance" itself as a violation.
  if (constraintsForbidLegalGuarantees(c)) {
    if (containsLegalOrComplianceOverclaim(r)) {
      reasons.push(
        "The response makes a strong compliance or legal guarantee, while the constraints forbid unverified compliance claims and recommend legal review."
      );
      return { label: "Low", risk: 3 };
    }

    if (containsCautiousLegalLanguage(r)) {
      return { label: "High", risk: 0 };
    }

    if (containsWeakButSafeLegalLanguage(r)) {
      reasons.push(
        "The response is cautious, but it does not clearly route the compliance question to legal or privacy review."
      );
      return { label: "Medium", risk: 1 };
    }

    reasons.push(
      "The response does not make a clear legal guarantee, but it also does not clearly follow the requested legal-review pathway."
    );
    return { label: "Medium", risk: 1 };
  }

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

  return { label: "High", risk: 0 };
}

function detectEvidenceSupport(evidence, response, constraints, reasons) {
  if (!evidence) {
    reasons.push("No evidence or source material was provided.");
    return { label: "Weak or Missing", risk: 1 };
  }

  if (
    constraintsForbidLegalGuarantees(constraints) &&
    containsLegalOrComplianceOverclaim(response) &&
    evidenceSaysReviewPending(evidence)
  ) {
    reasons.push(
      "The evidence says the feature is still under review or not approved, but the response makes a stronger public claim."
    );
    return { label: "Partial", risk: 1 };
  }

  if (
    constraintsForbidLegalGuarantees(constraints) &&
    containsCautiousLegalLanguage(response) &&
    evidenceSaysReviewPending(evidence)
  ) {
    return { label: "Strong", risk: 0 };
  }

  if (
    constraintsForbidLegalGuarantees(constraints) &&
    containsWeakButSafeLegalLanguage(response) &&
    evidenceSaysReviewPending(evidence)
  ) {
    return { label: "Partial", risk: 0 };
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

function reviewAIOutput({ prompt, response, constraints, evidence }) {
  prompt = normalizeText(prompt);
  response = normalizeText(response);
  constraints = normalizeText(constraints);
  evidence = normalizeText(evidence);

  const reasons = [];

  const promptAlignment = detectPromptAlignment(prompt, response, reasons);
  const constraintAdherence = detectConstraintAdherence(constraints, response, evidence, reasons);
  const evidenceSupport = detectEvidenceSupport(evidence, response, constraints, reasons);

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