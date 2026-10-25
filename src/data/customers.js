import * as d3 from "d3";
import { mulberry32, seedFromString } from "../lib/random.js";
import { DAY, parseDate } from "../lib/format.js";

export const planOrder = ["Starter", "Growth", "Scale", "Enterprise"];

// lastActive is days since the last seat activity
export const customers = [
  { id: "C-1042", name: "Nimbus Robotics", plan: "Scale", mrr: 4200, seats: 60, seatsUsed: 54, status: "active", owner: "A. Petrosyan", region: "North America", health: 88, since: "2023-03-14", lastActive: 0 },
  { id: "C-1043", name: "Vantage Freight", plan: "Growth", mrr: 1800, seats: 25, seatsUsed: 11, status: "trial", owner: "L. Howard", region: "Europe", health: 64, since: "2026-09-28", lastActive: 1 },
  { id: "C-1044", name: "Solvetic Labs", plan: "Scale", mrr: 6100, seats: 90, seatsUsed: 86, status: "active", owner: "A. Petrosyan", region: "North America", health: 92, since: "2022-11-02", lastActive: 0 },
  { id: "C-1045", name: "Brightline Health", plan: "Starter", mrr: 420, seats: 10, seatsUsed: 7, status: "past_due", owner: "R. Keane", region: "North America", health: 41, since: "2025-01-19", lastActive: 6 },
  { id: "C-1046", name: "Orbital Finance", plan: "Growth", mrr: 2650, seats: 30, seatsUsed: 27, status: "active", owner: "L. Howard", region: "Europe", health: 79, since: "2024-06-07", lastActive: 2 },
  { id: "C-1047", name: "Fernway Logistics", plan: "Scale", mrr: 5300, seats: 75, seatsUsed: 61, status: "active", owner: "M. Diallo", region: "APAC", health: 83, since: "2023-08-21", lastActive: 0 },
  { id: "C-1048", name: "Kestrel Analytics", plan: "Starter", mrr: 310, seats: 8, seatsUsed: 2, status: "churn_risk", owner: "R. Keane", region: "LATAM", health: 22, since: "2025-04-03", lastActive: 19 },
  { id: "C-1049", name: "Haven Collective", plan: "Growth", mrr: 1950, seats: 20, seatsUsed: 15, status: "trial", owner: "M. Diallo", region: "Europe", health: 70, since: "2026-10-06", lastActive: 0 },
  { id: "C-1050", name: "Quillstone Partners", plan: "Enterprise", mrr: 12400, seats: 220, seatsUsed: 198, status: "active", owner: "S. Okafor", region: "North America", health: 90, since: "2021-09-15", lastActive: 0 },
  { id: "C-1051", name: "Lumenfield Energy", plan: "Scale", mrr: 4800, seats: 70, seatsUsed: 52, status: "active", owner: "J. Lindqvist", region: "Europe", health: 76, since: "2023-12-01", lastActive: 1 },
  { id: "C-1052", name: "Tidewater Foods", plan: "Growth", mrr: 2200, seats: 28, seatsUsed: 19, status: "active", owner: "S. Okafor", region: "North America", health: 72, since: "2024-09-12", lastActive: 3 },
  { id: "C-1053", name: "Copperleaf Media", plan: "Starter", mrr: 540, seats: 10, seatsUsed: 9, status: "active", owner: "L. Howard", region: "Europe", health: 68, since: "2025-07-22", lastActive: 2 },
  { id: "C-1054", name: "Meridale Legal", plan: "Growth", mrr: 2900, seats: 35, seatsUsed: 21, status: "churn_risk", owner: "J. Lindqvist", region: "Europe", health: 38, since: "2024-02-29", lastActive: 12 },
  { id: "C-1055", name: "Pinecrest Learning", plan: "Scale", mrr: 3900, seats: 80, seatsUsed: 74, status: "active", owner: "M. Diallo", region: "North America", health: 85, since: "2023-05-10", lastActive: 0 },
  { id: "C-1056", name: "Atlas Mobility", plan: "Enterprise", mrr: 9800, seats: 160, seatsUsed: 131, status: "active", owner: "A. Petrosyan", region: "APAC", health: 81, since: "2022-04-18", lastActive: 0 },
  { id: "C-1057", name: "Saffron & Sage Retail", plan: "Starter", mrr: 380, seats: 6, seatsUsed: 6, status: "trial", owner: "R. Keane", region: "LATAM", health: 58, since: "2026-10-12", lastActive: 0 },
  { id: "C-1058", name: "Bluefin Security", plan: "Scale", mrr: 5600, seats: 65, seatsUsed: 63, status: "active", owner: "S. Okafor", region: "North America", health: 94, since: "2022-08-30", lastActive: 0 },
  { id: "C-1059", name: "Cobalt Ridge Mining", plan: "Growth", mrr: 2400, seats: 30, seatsUsed: 14, status: "past_due", owner: "J. Lindqvist", region: "LATAM", health: 47, since: "2024-11-05", lastActive: 9 },
  { id: "C-1060", name: "Juniper Voyages", plan: "Growth", mrr: 1700, seats: 22, seatsUsed: 18, status: "active", owner: "L. Howard", region: "APAC", health: 74, since: "2025-03-17", lastActive: 1 },
  { id: "C-1061", name: "Redfern Capital", plan: "Enterprise", mrr: 14200, seats: 240, seatsUsed: 221, status: "active", owner: "S. Okafor", region: "Europe", health: 91, since: "2021-06-01", lastActive: 0 },
  { id: "C-1062", name: "Sable Arcade Games", plan: "Starter", mrr: 460, seats: 12, seatsUsed: 5, status: "churn_risk", owner: "M. Diallo", region: "APAC", health: 29, since: "2025-08-08", lastActive: 24 },
  { id: "C-1063", name: "Ostrava Manufacturing", plan: "Scale", mrr: 4400, seats: 55, seatsUsed: 47, status: "active", owner: "J. Lindqvist", region: "Europe", health: 80, since: "2023-10-23", lastActive: 2 },
  { id: "C-1064", name: "Wrenfield Insurance", plan: "Growth", mrr: 3100, seats: 40, seatsUsed: 36, status: "active", owner: "A. Petrosyan", region: "North America", health: 77, since: "2024-04-15", lastActive: 1 },
  { id: "C-1065", name: "Glasshouse Design", plan: "Starter", mrr: 290, seats: 5, seatsUsed: 4, status: "trial", owner: "R. Keane", region: "LATAM", health: 61, since: "2026-10-15", lastActive: 0 }
];

export const owners = [...new Set(customers.map((customer) => customer.owner))].sort();

export const statusTone = {
  active: { tone: "success", label: "Active", rank: 0 },
  trial: { tone: "info", label: "Trial", rank: 1 },
  past_due: { tone: "warning", label: "Past due", rank: 2 },
  churn_risk: { tone: "error", label: "Churn risk", rank: 3 }
};

export function healthTone(score) {
  return score >= 75 ? "success" : score >= 50 ? "warning" : "error";
}

export function isAtRisk(customer) {
  return customer.status === "past_due" || customer.status === "churn_risk";
}

export function findCustomer(id) {
  return customers.find((customer) => customer.id === id);
}

// deterministic MRR history per customer, always ending at their current MRR
export function getCustomerTrend(customer, points = 12) {
  const random = mulberry32(seedFromString(customer.id));
  const declining = isAtRisk(customer);
  const trend = [];
  let value = customer.mrr * (declining ? 1.25 : 0.6);

  for (let i = 0; i < points; i++) {
    if (i === points - 1) {
      value = customer.mrr;
    } else {
      value *= declining ? 1 + (random() - 0.65) * 0.14 : 1 + (random() - 0.3) * 0.18;
    }

    trend.push(Math.max(Math.round(value), 10));
  }

  return trend;
}

export function getCustomerSeries(customer, points = 12) {
  const currentMonth = d3.timeMonth.floor(new Date());
  return getCustomerTrend(customer, points).map((value, i) => ({
    date: d3.timeMonth.offset(currentMonth, i - points + 1),
    value
  }));
}

export function getRenewalDate(customer, now = new Date()) {
  const since = parseDate(customer.since);
  const renewal = new Date(now.getFullYear(), since.getMonth(), since.getDate());

  if (renewal <= now) {
    renewal.setFullYear(renewal.getFullYear() + 1);
  }

  return renewal;
}

export function getCustomerTimeline(customer) {
  const random = mulberry32(seedFromString(`${customer.id}-timeline`));
  const since = parseDate(customer.since);
  const now = Date.now();
  const lifetime = now - since.getTime();
  const startPlan = customer.status === "trial" ? customer.plan : planOrder[Math.max(planOrder.indexOf(customer.plan) - 1, 0)];
  const entries = [
    {
      at: since,
      title: customer.status === "trial" ? "Started a trial" : "Became a customer",
      detail: `Signed up on the ${startPlan} plan`,
      tone: "info"
    }
  ];

  if (customer.status !== "trial") {
    const milestones = [
      { title: "Onboarding completed", detail: `Kickoff with ${customer.owner}`, tone: "pending" },
      startPlan !== customer.plan ? { title: `Upgraded to ${customer.plan}`, detail: "Self-serve upgrade", tone: "success" } : null,
      { title: "Quarterly business review", detail: `Held with ${customer.owner}`, tone: "pending" },
      { title: `Expanded to ${customer.seats} seats`, detail: "Added through admin console", tone: "success" }
    ].filter(Boolean);

    // spread milestones across the account's lifetime with a little jitter
    milestones.forEach((milestone, i) => {
      const position = (i + 1) / (milestones.length + 1) + (random() - 0.5) * 0.08;
      entries.push({ ...milestone, at: new Date(since.getTime() + lifetime * position) });
    });
  }

  if (customer.status === "past_due") {
    entries.push({ at: new Date(now - 4 * DAY), title: "Payment failed", detail: "Card declined, automatic retry scheduled", tone: "error" });
  }

  if (customer.status === "churn_risk") {
    entries.push({
      at: new Date(now - customer.lastActive * DAY),
      title: "Usage dropped",
      detail: `Active seats down to ${customer.seatsUsed} of ${customer.seats}`,
      tone: "warning"
    });
  }

  return entries.sort((a, b) => b.at - a.at);
}
