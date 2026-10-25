import * as d3 from "d3";
import { mulberry32 } from "../lib/random.js";
import { seed } from "./api.js";

const HISTORY = 48;
const currentMonth = d3.timeMonth.floor(new Date());

export const months = d3.range(HISTORY).map((i) => d3.timeMonth.offset(currentMonth, i - HISTORY + 1));

// walks backwards from today's value so every series lands exactly on its headline number
function buildSeries({ seed, end, drift, noise, relative = false }) {
  const random = mulberry32(seed);
  const values = [end];

  for (let i = 1; i < HISTORY; i++) {
    const step = drift + (random() - 0.5) * noise;
    values.unshift(relative ? values[0] / (1 + step) : values[0] - step);
  }

  return values.map((value, i) => ({ date: months[i], value }));
}

export const kpis = seed.metrics.kpis.map(({ series, ...kpi }) => ({ ...kpi, series: buildSeries(series) }));

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
  const delta = kpi.format === "percent" ? value - baseline : ((value - baseline) / baseline) * 100;

  return { ...kpi, value, delta, visible, previous };
}

// splits last month's MRR change into the usual movement buckets
export function getMrrMovement() {
  const series = kpis[0].series;
  const start = series[series.length - 2].value;
  const end = series[series.length - 1].value;
  const expansion = start * 0.021;
  const contraction = start * 0.007;
  const churn = start * 0.012;

  return {
    start,
    end,
    items: [
      { label: "New", value: end - start - expansion + contraction + churn },
      { label: "Expansion", value: expansion },
      { label: "Contraction", value: -contraction },
      { label: "Churn", value: -churn }
    ]
  };
}

export const { channels, regions } = seed.metrics;
