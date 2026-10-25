import { html } from "htm/preact";
import { PageHeader, Panel } from "../components/layout.js";
import { Icon } from "../components/icons.js";
import { SegmentedControl } from "../components/segmented-control.js";
import { Toggle } from "../components/toggle-switch.js";
import { KpiStrip } from "../components/kpi-strip.js";
import { ActivityFeed } from "../components/activity-feed.js";
import { Keys, ProgressBar, StatusIndicator } from "../components/ui.js";
import { MetricLineChart } from "../components/charts/metric-line.js";
import { BarListChart } from "../components/charts/bar-list.js";
import { RegionDonutChart } from "../components/charts/region-donut.js";
import { channels, regions, rangeOptions } from "../data/metrics.js";
import { customers, healthTone } from "../data/customers.js";
import { initiatives } from "../data/initiatives.js";
import {
  monthsBack,
  compareEnabled,
  selectedKpiId,
  kpiSummaries,
  activeKpi,
  hoveredRegion,
  selectedRegion,
  focusRegion,
  toggleRegion
} from "../state/dashboard-signals.js";
import { paletteOpen, welcomeDismissed } from "../state/ui-signals.js";
import { formatMetric, formatCurrencyCompact, formatTimeUntil } from "../lib/format.js";
import { modKey } from "../hooks/use-hotkeys.js";
import { usePage } from "../hooks/use-page.js";

const onRegionHover = (name) => {
  hoveredRegion.value = name;
};

const onKpiSelect = (id) => {
  selectedKpiId.value = id;
};

function WelcomeAlert() {
  if (welcomeDismissed.value) {
    return null;
  }

  return html`
    <section class="promo-alert" aria-label="Getting started">
      <div class="promo-alert-body">
        <h2>Jump anywhere with command search</h2>
        <p>
          Search pages, accounts and actions from one place, or use the region selector in the top navigation to scope the whole console to one
          region.
        </p>
        <div class="promo-alert-actions">
          <button type="button" class="btn" onClick=${() => (paletteOpen.value = true)}>Open command search</button>
          <span class="promo-alert-meta">Shortcut <${Keys} keys=${[modKey, "K"]} /> | Works on every page</span>
        </div>
      </div>
      <button type="button" class="icon-button" aria-label="Dismiss" onClick=${() => (welcomeDismissed.value = true)}>
        <${Icon} name="x" />
      </button>
    </section>
  `;
}

function MetricPanel() {
  const kpi = activeKpi.value;
  const compare = compareEnabled.value;

  return html`
    <${Panel}
      title=${`${kpi.label} trend`}
      description=${`${formatMetric(kpi.value, kpi.format)} now, target ${formatMetric(kpi.target, kpi.format)}`}
      actions=${html`
        <${Toggle}
          label="Compare to previous period"
          checked=${compare}
          onChange=${(value) => {
            compareEnabled.value = value;
          }}
        />
      `}
    >
      <${MetricLineChart}
        series=${kpi.visible}
        compare=${compare ? kpi.previous : null}
        target=${kpi.target}
        format=${kpi.format}
        label=${kpi.label}
      />
      <div class="chart-legend-inline" aria-hidden="true">
        <span><i class="legend-swatch"></i>${kpi.label}</span>
        ${compare ? html`<span><i class="legend-swatch is-compare"></i>Previous period</span>` : null}
        <span><i class="legend-swatch is-target"></i>Target</span>
      </div>
    <//>
  `;
}

function RegionPanel() {
  return html`
    <${Panel} class="donut-panel" title="Regional footprint" description="Customer share by region. Select one to scope the console.">
      <${RegionDonutChart}
        regions=${regions}
        focused=${focusRegion.value}
        pinned=${selectedRegion.value}
        onHover=${onRegionHover}
        onSelect=${toggleRegion}
      />
    <//>
  `;
}

function TopAccountsPanel() {
  const region = selectedRegion.value;
  const rows = customers
    .filter((customer) => !region || customer.region === region)
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 5);

  return html`
    <${Panel}
      title="Top accounts"
      description=${region ? `Highest MRR in ${region}` : "Highest MRR across all regions"}
      actions=${region ? html`<button type="button" class="btn" onClick=${() => (selectedRegion.value = null)}>All regions</button>` : null}
      footer=${html`<a href="#/customers">View all customers</a>`}
    >
      <ul class="link-list">
        ${rows.map(
          (customer) => html`
            <li key=${customer.id} class="account-row">
              <span class="account-row-main">
                <a href=${`#/customers/${customer.id}`}>${customer.name}</a>
                <span class="cell-sub">${customer.plan} | ${customer.region}</span>
              </span>
              <span class="account-row-side">
                <strong>${formatCurrencyCompact(customer.mrr)}</strong>
                <${ProgressBar} value=${customer.health} tone=${healthTone(customer.health)} label="Health score" showValue=${false} />
              </span>
            </li>
          `
        )}
      </ul>
    <//>
  `;
}

function InitiativesPanel() {
  return html`
    <${Panel} title="Now tracking" counter=${initiatives.length} description="Growth initiatives in motion">
      <div class="table-wrap">
        <table class="data-table is-static">
          <thead>
            <tr>
              <th scope="col">Initiative</th>
              <th scope="col">Owner</th>
              <th scope="col">Status</th>
              <th scope="col">Progress</th>
              <th scope="col">Due</th>
            </tr>
          </thead>
          <tbody>
            ${initiatives.map(
              (item) => html`
                <tr key=${item.id}>
                  <td>${item.title}</td>
                  <td>${item.owner}</td>
                  <td><${StatusIndicator} tone=${item.tone} label=${item.status} /></td>
                  <td class="cell-progress"><${ProgressBar} value=${item.progress} label="Progress" /></td>
                  <td>${formatTimeUntil(item.due)}</td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    <//>
  `;
}

export function OverviewPage() {
  usePage({ title: "Overview", topic: "overview", crumbs: [{ label: "Overview" }] });

  return html`
    <${WelcomeAlert} />

    <${PageHeader}
      title="Overview"
      info="overview"
      description=${selectedRegion.value ? `Growth and engagement in ${selectedRegion.value}` : "Growth and engagement across all regions"}
      actions=${html`
        <${SegmentedControl}
          label="Time range"
          options=${rangeOptions}
          value=${monthsBack.value}
          onChange=${(value) => {
            monthsBack.value = value;
          }}
        />
        <a class="btn btn-primary" href="#/customers"><${Icon} name="customers" />View customers</a>
      `}
    />

    <${KpiStrip} kpis=${kpiSummaries.value} selectedId=${selectedKpiId.value} monthsBack=${monthsBack.value} onSelect=${onKpiSelect} />

    <div class="grid-main">
      <${MetricPanel} />
      <${ActivityFeed} region=${selectedRegion.value} />
    </div>

    <div class="grid-auto">
      <${Panel} title="Acquisition mix" description="Share of converted signups by channel">
        <${BarListChart} items=${channels} format="percent" label="Acquisition mix by channel" />
      <//>
      <${RegionPanel} />
      <${TopAccountsPanel} />
    </div>

    <${InitiativesPanel} />
  `;
}
