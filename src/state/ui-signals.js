import { signal } from "@preact/signals";
import { persistedSignal } from "../lib/storage.js";

export const paletteOpen = signal(false);
export const mobileNavOpen = signal(false);
export const flashes = signal([]);
export const breadcrumbs = signal([]);

// help panel: topic shown when open, pageTopic is what the toolbar info button opens
export const helpTopic = signal(null);
export const pageTopic = signal("overview");

export const welcomeDismissed = persistedSignal("welcomeDismissed", false);

let flashId = 0;

export function showToast(message, tone = "success") {
  flashId += 1;
  const id = flashId;
  flashes.value = [...flashes.value, { id, message, tone }];
  setTimeout(() => dismissToast(id), 5000);
}

export function dismissToast(id) {
  flashes.value = flashes.value.filter((flash) => flash.id !== id);
}
