import * as d3 from "d3";
import { mulberry32, seedFromString } from "../lib/random.js";
import { DAY, parseDate } from "../lib/format.js";

export const planOrder = ["Starter", "Growth", "Scale", "Enterprise"];

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
