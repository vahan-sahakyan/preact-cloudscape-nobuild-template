const baseStages = [
  { stage: "Visited pricing", value: 18400 },
  { stage: "Started signup", value: 9200 },
  { stage: "Verified email", value: 7100 },
  { stage: "Created workspace", value: 5400 },
  { stage: "Activated (first action)", value: 3600 },
  { stage: "Converted to paid", value: 1860 }
];

// share of top-of-funnel traffic and per-step conversion lift relative to the blended funnel
export const funnelSegments = [
  { id: "all", label: "All", share: 1, lift: [1, 1, 1, 1, 1, 1] },
  { id: "organic", label: "Organic", share: 0.42, lift: [1, 1.12, 1.04, 1.02, 1.06, 1.1] },
  { id: "paid", label: "Paid", share: 0.33, lift: [1, 0.86, 0.95, 0.97, 0.9, 0.85] },
  { id: "referral", label: "Referral", share: 0.15, lift: [1, 1.2, 1.08, 1.06, 1.1, 1.18] }
];

export function getFunnel(segmentId) {
  const segment = funnelSegments.find((item) => item.id === segmentId) || funnelSegments[0];
  const steps = [];

  baseStages.forEach((step, i) => {
    if (i === 0) {
      steps.push({ stage: step.stage, value: Math.round(step.value * segment.share) });
      return;
    }

    const rate = Math.min((step.value / baseStages[i - 1].value) * segment.lift[i], 1);
    steps.push({ stage: step.stage, value: Math.round(steps[i - 1].value * rate) });
  });

  return steps;
}
