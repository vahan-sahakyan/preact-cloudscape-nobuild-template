import { signal, computed } from "@preact/signals";
import { persistedSignal } from "../lib/storage.js";

export const selectedKpiId = persistedSignal("kpi", "revenue");
export const monthsBack = persistedSignal("range", 12);
export const compareEnabled = persistedSignal("compare", true);
export const hoveredRegion = signal(null);

// workspace-wide region, like the console region selector; null means all regions
export const selectedRegion = persistedSignal("region", null);

// hover previews a region on the donut, selection sticks
export const focusRegion = computed(() => hoveredRegion.value || selectedRegion.value);

export function toggleRegion(name) {
  selectedRegion.value = selectedRegion.value === name ? null : name;
}
