import { seed } from "./api.js";

// share of top-of-funnel traffic and per-step conversion lift relative to the blended funnel
export const funnelSegments = seed.funnel.segments;

export function getFunnel(segmentId) {
  const baseStages = seed.funnel.stages;
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
