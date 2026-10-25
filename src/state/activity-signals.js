import { signal, effect } from "@preact/signals";
import { createSeedEvents, createLiveEvent } from "../data/activity.js";
import { liveUpdates } from "./settings-signals.js";

const MAX_EVENTS = 40;

export const events = signal(createSeedEvents());

// coarse clock so "5m ago" labels stay fresh without re-rendering every second
export const now = signal(Date.now());

setInterval(() => {
  now.value = Date.now();
}, 30_000);

effect(() => {
  if (!liveUpdates.value) {
    return;
  }

  const timer = setInterval(() => {
    if (document.hidden || Math.random() < 0.4) {
      return;
    }

    events.value = [createLiveEvent(), ...events.value].slice(0, MAX_EVENTS);
    now.value = Date.now();
  }, 4500);

  return () => clearInterval(timer);
});
