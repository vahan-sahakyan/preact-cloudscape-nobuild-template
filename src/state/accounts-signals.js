import { computed } from "@preact/signals";
import { seed } from "../data/api.js";
import { isAtRisk } from "../data/customers.js";
import { createSeedEvents } from "../data/activity.js";
import { DAY } from "../lib/format.js";
import { persistedSignal } from "../lib/storage.js";
import { seedFromString } from "../lib/random.js";

// storage keys follow the record shape and the json content, so either change replaces stale saved copies
const SCHEMA = 2;
export const SEED_VERSION = `${SCHEMA}.${seedFromString(JSON.stringify(seed.accounts)).toString(36)}`;

// history describing the seed accounts; also dates their last update
export const seedEvents = createSeedEvents(seed.accounts);

// updatedAt: the account's latest history event, else a stable point in the last 30 days
function withUpdatedAt(account) {
  const latestEvent = seedEvents.find((event) => event.customerId === account.id);
  const fallback = Date.now() - ((seedFromString(account.id) % 29) + 1) * DAY;
  return { ...account, updatedAt: latestEvent ? latestEvent.at : fallback };
}

// live activity changes these records; they persist and sync across tabs
export const accounts = persistedSignal(`accounts.${SEED_VERSION}`, seed.accounts.map(withUpdatedAt));

export const accountsById = computed(() => new Map(accounts.value.map((account) => [account.id, account])));
export const owners = computed(() => [...new Set(accounts.value.map((account) => account.owner))].sort());
export const atRiskCount = computed(() => accounts.value.filter(isAtRisk).length);
export const regionNames = computed(() => [...new Set(accounts.value.map((account) => account.region))]);

export function findAccount(id) {
  return accountsById.value.get(id);
}

export function updateAccount(id, patch) {
  accounts.value = accounts.value.map((account) => (account.id === id ? { ...account, ...patch } : account));
}
