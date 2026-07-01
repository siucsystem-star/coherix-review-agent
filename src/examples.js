const { reviewAIOutput } = require("./reviewEngine");

const examples = [
  {
    name: "Example 1 — OK",
    input: {
      prompt: "Write a short customer email explaining a delayed shipment.",
      response: "Your shipment is delayed because the shipping provider reported a delay. We are sorry for the inconvenience and will update you as soon as we receive more information.",
      constraints: "Do not promise a specific delivery date.",
      evidence: "The shipping provider reported a delay but did not provide a confirmed delivery date."
    }
  },
  {
    name: "Example 2 — Review",
    input: {
      prompt: "Write a short customer email explaining a delayed shipment.",
      response: "Your shipment is delayed. We are sorry for the inconvenience and will update you soon.",
      constraints: "Do not promise a specific delivery date.",
      evidence: "The shipping provider reported a delay but did not provide a confirmed delivery date."
    }
  },
  {
    name: "Example 3 — High Review",
    input: {
      prompt: "Write a short customer email explaining a delayed shipment.",
      response: "Your package will arrive tomorrow. We guarantee delivery within 24 hours.",
      constraints: "Do not promise a specific delivery date.",
      evidence: "The shipping provider reported a delay but did not provide a confirmed delivery date."
    }
  }
];

for (const example of examples) {
  console.log("\n==============================");
  console.log(example.name);
  console.log("==============================");
  console.log(reviewAIOutput(example.input));
}