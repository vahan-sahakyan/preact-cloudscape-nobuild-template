import { planOrder, isAtRisk } from "./customers.js";
import { mulberry32 } from "../lib/random.js";

const MINUTE = 60_000;
const SEAT_PRICE = 45;

const clamp = (value) => Math.min(Math.max(Math.round(value), 0), 100);
const roundTo50 = (value) => Math.round(value / 50) * 50;
const nextPlan = (plan) => planOrder[Math.min(planOrder.indexOf(plan) + 1, planOrder.length - 1)];

// each template says when it can happen to an account (`when`), how to describe it as history
// (`seed`, using the account's current state) and what a live occurrence changes (`apply`)
const templates = [
  {
    type: "upgrade",
    weight: 3,
    tone: "success",
    icon: "arrowUp",
    when: (account) => account.status === "active" && account.plan !== "Enterprise",
    seedWhen: (account) => account.status !== "trial" && account.plan !== "Starter",
    seed: (account, random) => ({ text: `upgraded to ${account.plan}`, amount: roundTo50(300 + random() * 1500) }),
    apply: (account, random) => {
      const plan = nextPlan(account.plan);
      const amount = roundTo50(account.mrr * (0.25 + random() * 0.35));
      return { text: `upgraded to ${plan}`, amount, patch: { plan, mrr: account.mrr + amount, health: clamp(account.health + 4) } };
    }
  },
  {
    type: "seats",
    weight: 3,
    tone: "info",
    icon: "customers",
    when: (account) => account.status !== "past_due",
    seedWhen: (account) => account.status !== "trial",
    seed: (_, random) => {
      const seats = 2 + Math.floor(random() * 12);
      return { text: `added ${seats} seats`, amount: seats * SEAT_PRICE };
    },
    apply: (account, random) => {
      const seats = 2 + Math.floor(random() * 10);
      return {
        text: `added ${seats} seats`,
        amount: seats * SEAT_PRICE,
        patch: { seats: account.seats + seats, mrr: account.mrr + seats * SEAT_PRICE, health: clamp(account.health + 2) }
      };
    }
  },
  {
    type: "invite",
    weight: 2,
    tone: "info",
    icon: "plus",
    when: (account) => account.seatsUsed < account.seats,
    seedWhen: () => true,
    seed: (_, random) => ({ text: `invited ${2 + Math.floor(random() * 6)} teammates` }),
    apply: (account, random) => {
      const invited = Math.min(1 + Math.floor(random() * 5), account.seats - account.seatsUsed);
      return {
        text: `invited ${invited} teammate${invited === 1 ? "" : "s"}`,
        patch: { seatsUsed: account.seatsUsed + invited, health: clamp(account.health + 1) }
      };
    }
  },
  {
    type: "renewal",
    weight: 2,
    tone: "success",
    icon: "check",
    when: (account) => account.status === "active",
    seedWhen: (account) => account.status === "active",
    seed: () => ({ text: "renewed their annual contract" }),
    apply: (account) => ({ text: "renewed their annual contract", patch: { health: clamp(account.health + 3) } })
  },
  {
    type: "converted",
    weight: 2,
    tone: "success",
    icon: "check",
    when: (account) => account.status === "trial",
    seedWhen: () => false,
    apply: (account) => ({ text: `converted from trial to ${account.plan}`, amount: account.mrr, patch: { status: "active", health: clamp(account.health + 6) } })
  },
  {
    type: "ticket",
    weight: 2,
    tone: "pending",
    icon: "note",
    when: () => true,
    seedWhen: () => true,
    seed: () => ({ text: "opened a priority support ticket" }),
    apply: (account) => ({ text: "opened a priority support ticket", patch: { health: clamp(account.health - 3) } })
  },
  {
    type: "payment-failed",
    weight: 1,
    tone: "error",
    icon: "alert",
    when: (account) => account.status === "active",
    seedWhen: (account) => account.status === "past_due",
    seed: () => ({ text: "had a payment fail, retry scheduled" }),
    apply: (account) => ({ text: "had a payment fail, retry scheduled", patch: { status: "past_due", health: clamp(account.health - 12) } })
  },
  {
    type: "payment-recovered",
    weight: 2,
    tone: "success",
    icon: "check",
    when: (account) => account.status === "past_due",
    seedWhen: () => false,
    apply: (account) => ({ text: "settled an overdue invoice", patch: { status: "active", health: clamp(account.health + 10) } })
  },
  {
    type: "re-engaged",
    weight: 1,
    tone: "success",
    icon: "arrowUp",
    when: (account) => account.status === "churn_risk",
    seedWhen: () => false,
    apply: (account) => ({ text: "is active again after a quiet spell", patch: { status: "active", health: clamp(account.health + 15) } })
  },
  {
    type: "downgrade",
    weight: 1,
    tone: "warning",
    icon: "arrowDown",
    when: (account) => account.seats - account.seatsUsed >= 2,
    seedWhen: (account) => isAtRisk(account),
    seed: (_, random) => ({ text: "removed unused seats", amount: -roundTo50(100 + random() * 600) }),
    apply: (account, random) => {
      const removed = Math.max(1, Math.floor((account.seats - account.seatsUsed) * (0.3 + random() * 0.5)));
      return {
        text: `removed ${removed} unused seat${removed === 1 ? "" : "s"}`,
        amount: -removed * SEAT_PRICE,
        patch: { seats: account.seats - removed, mrr: Math.max(account.mrr - removed * SEAT_PRICE, 0), health: clamp(account.health - 2) }
      };
    }
  }
];

function pickWeighted(options, random) {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = random() * total;
  return options.find((option) => (roll -= option.weight) < 0) || options[0];
}

function toEvent(template, account, details, at, id) {
  return {
    id,
    type: template.type,
    tone: template.tone,
    icon: template.icon,
    customerId: account.id,
    customerName: account.name,
    region: account.region,
    at,
    text: details.text,
    amount: details.amount ?? null
  };
}

// seeded backlog consistent with the accounts' current state; describes the past, changes nothing
export function createSeedEvents(accounts, count = 16) {
  const random = mulberry32(7);
  const events = [];
  let at = Date.now() - MINUTE;

  for (let i = 0; i < count; i++) {
    const account = accounts[Math.floor(random() * accounts.length)];
    const options = templates.filter((template) => template.seed && template.seedWhen(account));
    const template = pickWeighted(options, random);
    events.push(toEvent(template, account, template.seed(account, random), at, `S-${i + 1}`));
    at -= (3 + random() * 28) * MINUTE;
  }

  return events;
}

// a new event for a random account, plus the patch it applies to that account
export function createLiveEvent(accounts, random = Math.random) {
  const account = accounts[Math.floor(random() * accounts.length)];
  const options = templates.filter((template) => template.when(account));
  const template = pickWeighted(options, random);
  const details = template.apply(account, random);
  const id = `E-${Date.now().toString(36)}-${Math.floor(random() * 1e6).toString(36)}`;

  return {
    event: toEvent(template, account, details, Date.now(), id),
    patch: { ...details.patch, lastActive: 0 }
  };
}
