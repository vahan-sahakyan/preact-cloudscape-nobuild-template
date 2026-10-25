import { signal, computed } from "@preact/signals";
import { kpis, summarizeKpi } from "../data/metrics.js";
import { persistedSignal } from "../lib/storage.js";

export const selectedKpiId = persistedSignal("kpi", "revenue");
export const monthsBack = persistedSignal("range", 12);
export const compareEnabled = persistedSignal("compare", true);
export const hoveredRegion = signal(null);

// workspace-wide region, like the console region selector; null means all regions
export const selectedRegion = persistedSignal("region", null);

// hover previews a region on the donut, selection sticks
export const focusRegion = computed(() => hoveredRegion.value || selectedRegion.value);

export const kpiSummaries = computed(() => kpis.map((kpi) => summarizeKpi(kpi, monthsBack.value)));

export const activeKpi = computed(() => {
  return kpiSummaries.value.find((kpi) => kpi.id === selectedKpiId.value) || kpiSummaries.value[0];
});

export function toggleRegion(name) {
  selectedRegion.value = selectedRegion.value === name ? null : name;
}
