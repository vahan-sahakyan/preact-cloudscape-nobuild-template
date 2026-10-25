import { html } from "htm/preact";
import { Panel } from "./layout.js";
import { StatusIndicator } from "./ui.js";
import { TrendSparkline } from "./trend-sparkline.js";
import { formatMetric, formatDelta } from "../lib/format.js";

function MetricColumn({ kpi, selected, monthsBack, onSelect }) {
  const isUp = kpi.delta >= 0;

  return html`
    <button type="button" class="metric-column" aria-pressed=${selected} onClick=${() => onSelect(kpi.id)}>
      <span class="key-value-label">${kpi.label}</span>
      <span class="metric-value">${formatMetric(kpi.value, kpi.format)}</span>
      <span class="metric-meta">
        <${StatusIndicator} tone=${isUp ? "success" : "error"} label=${formatDelta(kpi.delta, kpi.format)} />
        <span>vs ${monthsBack} months ago</span>
      </span>
      <${TrendSparkline} class="metric-spark" values=${kpi.visible.map((point) => point.value)} width=${200} height=${36} />
    </button>
  `;
}

// Cloudscape ColumnLayout with vertical borders, each column selects the charted metric
export function KpiStrip({ title, description, info, kpis, selectedId, monthsBack, onSelect, actions }) {
  return html`
    <${Panel} class="kpi-panel" title=${title} info=${info} description=${description} actions=${actions}>
      <div class="metric-columns" style=${{ "--columns": kpis.length }}>
        ${kpis.map(
          (kpi) => html`
            <${MetricColumn} key=${kpi.id} kpi=${kpi} selected=${kpi.id === selectedId} monthsBack=${monthsBack} onSelect=${onSelect} />
          `
        )}
      </div>
    <//>
  `;
}
