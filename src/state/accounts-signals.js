import { computed } from "@preact/signals";
import { seed } from "../data/api.js";
import { isAtRisk } from "../data/customers.js";
import { persistedSignal } from "../lib/storage.js";
import { seedFromString } from "../lib/random.js";

// storage keys follow the json content, so editing accounts.json replaces stale saved copies
export const SEED_VERSION = seedFromString(JSON.stringify(seed.accounts)).toString(36);

// live activity changes these records; they persist and sync across tabs
export const accounts = persistedSignal(`accounts.${SEED_VERSION}`, seed.accounts);

export const accountsById = computed(() => new Map(accounts.value.map((account) => [account.id, account])));
export const owners = computed(() => [...new Set(accounts.value.map((account) => account.owner))].sort());
export const atRiskCount = computed(() => accounts.value.filter(isAtRisk).length);

export function findAccount(id) {
  return accountsById.value.get(id);
}

export function updateAccount(id, patch) {
  accounts.value = accounts.value.map((account) => (account.id === id ? { ...account, ...patch } : account));
}
