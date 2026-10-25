import { customers, planOrder } from "./customers.js";
import { mulberry32 } from "../lib/random.js";

const MINUTE = 60_000;

const templates = [
  {
    type: "upgrade",
    weight: 3,
    tone: "success",
    icon: "arrowUp",
    build: (customer, random) => {
      const next = planOrder[Math.min(planOrder.indexOf(customer.plan) + 1, planOrder.length - 1)];
      return { text: `upgraded to ${next}`, amount: Math.round((300 + random() * 1500) / 50) * 50 };
    }
  },
  {
    type: "seats",
    weight: 3,
    tone: "info",
    icon: "customers",
    build: (_, random) => {
      const seats = 2 + Math.floor(random() * 12);
      return { text: `added ${seats} seats`, amount: seats * 45 };
    }
  },
  { type: "renewal", weight: 2, tone: "success", icon: "check", build: () => ({ text: "renewed their annual contract" }) },
  { type: "ticket", weight: 2, tone: "pending", icon: "note", build: () => ({ text: "opened a priority support ticket" }) },
  { type: "invite", weight: 2, tone: "info", icon: "plus", build: (_, random) => ({ text: `invited ${2 + Math.floor(random() * 6)} teammates` }) },
  { type: "payment", weight: 1, tone: "error", icon: "alert", build: () => ({ text: "had a payment fail, retry scheduled" }) },
  {
    type: "downgrade",
    weight: 1,
    tone: "warning",
    icon: "arrowDown",
    build: (_, random) => ({ text: "removed unused seats", amount: -Math.round((100 + random() * 600) / 50) * 50 })
  }
];

const totalWeight = templates.reduce((sum, template) => sum + template.weight, 0);
let eventId = 0;

function pickTemplate(random) {
  let roll = random() * totalWeight;
  return templates.find((template) => (roll -= template.weight) < 0) || templates[0];
}

function createEvent(random, at, isLive) {
  const template = pickTemplate(random);
  const customer = customers[Math.floor(random() * customers.length)];
  eventId += 1;

  return {
    id: `E-${eventId}`,
    type: template.type,
    tone: template.tone,
    icon: template.icon,
    customerId: customer.id,
    customerName: customer.name,
    region: customer.region,
    at,
    isLive,
    amount: null,
    ...template.build(customer, random)
  };
}

// seeded backlog so the feed is never empty on load
export function createSeedEvents(count = 16) {
  const random = mulberry32(7);
  const events = [];
  let at = Date.now() - MINUTE;

  for (let i = 0; i < count; i++) {
    events.push(createEvent(random, at, false));
    at -= (3 + random() * 28) * MINUTE;
  }

  return events;
}

export function createLiveEvent() {
  return createEvent(Math.random, Date.now(), true);
}
