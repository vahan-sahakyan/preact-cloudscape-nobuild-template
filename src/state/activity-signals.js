import { signal, effect, batch } from "@preact/signals";
import { createLiveEvent } from "../data/activity.js";
import { persistedSignal } from "../lib/storage.js";
import { liveUpdates } from "./settings-signals.js";
import { accounts, updateAccount, seedEvents, SEED_VERSION } from "./accounts-signals.js";

// enough history to cover the 30-day MRR movement window
const MAX_EVENTS = 200;
const LOCK_NAME = "pulse:live-activity";

export const events = persistedSignal(`events.${SEED_VERSION}`, seedEvents);

// coarse clock so "5m ago" labels stay fresh without re-rendering every second
export const now = signal(Date.now());

setInterval(() => {
  now.value = Date.now();
}, 30_000);

// true in the single tab that currently generates events
export const isGenerator = signal(false);

function tick() {
  if (Math.random() < 0.4) {
    return;
  }

  const { event, patch } = createLiveEvent(accounts.value);

  batch(() => {
    updateAccount(event.customerId, patch);
    events.value = [event, ...events.value].slice(0, MAX_EVENTS);
    now.value = Date.now();
  });
}

function generate() {
  isGenerator.value = true;

  effect(() => {
    if (!liveUpdates.value) {
      return;
    }

    const timer = setInterval(tick, 4500);
    return () => clearInterval(timer);
  });
}

// one tab generates and the rest receive its changes through storage sync, so tabs never
// produce conflicting events; the lock is held until the tab closes, then the next tab takes over
if (navigator.locks) {
  navigator.locks.request(LOCK_NAME, () => new Promise(() => generate()));
} else {
  generate();
}
