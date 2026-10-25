import * as d3 from "d3";
import { mulberry32 } from "../lib/random.js";
import { seed } from "./api.js";

export const HISTORY = 48;
const currentMonth = d3.timeMonth.floor(new Date());

export const months = d3.range(HISTORY).map((i) => d3.timeMonth.offset(currentMonth, i - HISTORY + 1));

// walks backwards from today's value so every series lands exactly on its headline number
function buildSeries({ seed: randomSeed, end, drift, noise, relative = false }) {
  const random = mulberry32(randomSeed);
  const values = [end];

  for (let i = 1; i < HISTORY; i++) {
    const step = drift + (random() - 0.5) * noise;
    values.unshift(relative ? values[0] / (1 + step) : values[0] - step);
  }

  return values.map((value, i) => ({ date: months[i], value }));
}

// product analytics: user base metrics the account records don't model, generated from metrics.json
export const productKpis = seed.metrics.product.map(({ series, ...kpi }) => ({ ...kpi, series: buildSeries(series) }));

// revenue metrics: definitions only, their series are derived from accounts in src/state/metrics-signals.js
export const revenueKpiDefs = seed.metrics.revenue;

export const rangeOptions = [
  { id: 3, label: "3M" },
  { id: 6, label: "6M" },
  { id: 12, label: "12M" },
  { id: 24, label: "24M" }
];

// current window plus the window right before it, delta measured against the window start
export function summarizeKpi(kpi, monthsBack) {
  const visible = kpi.series.slice(-monthsBack);
  const previous = kpi.series.slice(-monthsBack * 2, -monthsBack);
  const value = visible[visible.length - 1].value;
  const baseline = previous.length ? previous[previous.length - 1].value : visible[0].value;
  const relative = baseline === 0 ? 0 : ((value - baseline) / baseline) * 100;
  const delta = kpi.format === "percent" ? value - baseline : relative;

  return { ...kpi, value, delta, visible, previous };
}

export const { channels } = seed.metrics;
