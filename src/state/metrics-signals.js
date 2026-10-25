import { computed } from "@preact/signals";
import { HISTORY, months, productKpis, revenueKpiDefs, summarizeKpi } from "../data/metrics.js";
import { planOrder, getAccountHistory } from "../data/customers.js";
import { DAY } from "../lib/format.js";
import { accounts } from "./accounts-signals.js";
import { events, now } from "./activity-signals.js";
import { monthsBack, selectedKpiId, selectedRegion } from "./dashboard-signals.js";

const WINDOW_DAYS = 30;

// everything revenue-related derives from these records, scoped by the region selector
export const regionAccounts = computed(() => {
  const region = selectedRegion.value;
  return region ? accounts.value.filter((account) => account.region === region) : accounts.value;
});

// one MRR history per account on the shared month axis; the last point is live
const histories = computed(() => regionAccounts.value.map((account) => getAccountHistory(account, HISTORY)));

const revenueSeries = computed(() => {
  const mrr = months.map((_, i) => histories.value.reduce((sum, history) => sum + history[i], 0));
  const paying = months.map((_, i) => histories.value.filter((history) => history[i] > 0).length);

  return {
    revenue: mrr,
    payingAccounts: paying,
    arpa: mrr.map((value, i) => (paying[i] ? value / paying[i] : 0))
  };
});

export const revenueKpis = computed(() =>
  revenueKpiDefs.map((kpi) => ({
    ...kpi,
    series: revenueSeries.value[kpi.id].map((value, i) => ({ date: months[i], value }))
  }))
);

export const revenueSummaries = computed(() => revenueKpis.value.map((kpi) => summarizeKpi(kpi, monthsBack.value)));
export const productSummaries = computed(() => productKpis.map((kpi) => summarizeKpi(kpi, monthsBack.value)));

export const activeKpi = computed(() => {
  const all = [...revenueSummaries.value, ...productSummaries.value];
  return all.find((kpi) => kpi.id === selectedKpiId.value) || all[0];
});

const payingMrr = (list) => list.reduce((sum, account) => sum + (account.status === "trial" ? 0 : account.mrr), 0);

// share of paying MRR per region; not scoped, it is the region selector itself
export const regionShares = computed(() => {
  const total = payingMrr(accounts.value) || 1;
  const byRegion = new Map();

  accounts.value.forEach((account) => {
    byRegion.set(account.region, (byRegion.get(account.region) || 0) + (account.status === "trial" ? 0 : account.mrr));
  });

  return [...byRegion].map(([name, mrr]) => ({ name, mrr, value: (mrr / total) * 100 }));
});

export const planRevenue = computed(() =>
  planOrder
    .map((plan) => ({ name: plan, value: payingMrr(regionAccounts.value.filter((account) => account.plan === plan)) }))
    .sort((a, b) => b.value - a.value)
);

const movementBucket = { converted: "New", upgrade: "Expansion", seats: "Expansion", downgrade: "Contraction" };

// last 30 days of account events grouped into the usual buckets; start is back-solved from live MRR
export const mrrMovement = computed(() => {
  const region = selectedRegion.value;
  const since = now.value - WINDOW_DAYS * DAY;
  const totals = { New: 0, Expansion: 0, Contraction: 0, Churn: 0 };

  events.value
    .filter((event) => event.at >= since && event.amount && movementBucket[event.type] && (!region || event.region === region))
    .forEach((event) => {
      totals[movementBucket[event.type]] += event.amount;
    });

  const items = Object.entries(totals).map(([label, value]) => ({ label, value }));
  const net = items.reduce((sum, item) => sum + item.value, 0);
  const end = payingMrr(regionAccounts.value);

  return { start: end - net, end, net, items };
});
