import * as d3 from "d3";
import { mulberry32 } from "../lib/random.js";

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

export const kpis = [
  {
    id: "revenue",
    label: "MRR",
    format: "currency",
    target: 200000,
    series: buildSeries({ seed: 11, end: 184200, drift: 0.02, noise: 0.024, relative: true })
  },
  {
    id: "activeUsers",
    label: "Active users",
    format: "number",
    target: 100000,
    series: buildSeries({ seed: 23, end: 92640, drift: 0.015, noise: 0.03, relative: true })
  },
  {
    id: "conversion",
    label: "Trial conversion",
    format: "percent",
    target: 5.5,
    series: buildSeries({ seed: 37, end: 4.83, drift: -0.025, noise: 0.16 })
  },
  {
    id: "retention",
    label: "D30 retention",
    format: "percent",
    target: 65,
    series: buildSeries({ seed: 41, end: 62.1, drift: 0.2, noise: 0.7 })
  }
];

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

export const channels = [
  { name: "Organic", value: 42.2 },
  { name: "Paid", value: 24.7 },
  { name: "Referral", value: 18.5 },
  { name: "Partnerships", value: 9.8 },
  { name: "Outbound", value: 4.8 }
];

export const regions = [
  { name: "North America", value: 41 },
  { name: "Europe", value: 29 },
  { name: "APAC", value: 19 },
  { name: "LATAM", value: 11 }
];
