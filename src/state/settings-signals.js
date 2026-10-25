import { signal, computed, effect } from "@preact/signals";
import { applyMode, applyDensity, disableMotion, Mode, Density } from "@cloudscape-design/global-styles";
import { persistedSignal } from "../lib/storage.js";

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// "light" | "dark" | "system"
export const theme = persistedSignal("theme", "system");
export const compactDensity = persistedSignal("compact", false);
export const reduceMotion = persistedSignal("reduceMotion", motionQuery.matches);
export const navCollapsed = persistedSignal("navCollapsed", false);
export const liveUpdates = persistedSignal("liveUpdates", true);

const systemDark = signal(darkQuery.matches);

darkQuery.addEventListener("change", (event) => {
  systemDark.value = event.matches;
});

export const darkMode = computed(() => (theme.value === "system" ? systemDark.value : theme.value === "dark"));

// light -> dark -> system -> light
export const themeCycle = { light: "dark", dark: "system", system: "light" };

export function cycleTheme() {
  theme.value = themeCycle[theme.value] || "light";
}

// these wire straight into Cloudscape's own runtime helpers, not reimplementations
effect(() => {
  applyMode(darkMode.value ? Mode.Dark : Mode.Light);
});

effect(() => {
  applyDensity(compactDensity.value ? Density.Compact : Density.Comfortable);
});

effect(() => {
  disableMotion(reduceMotion.value);
});
