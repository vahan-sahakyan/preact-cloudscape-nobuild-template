import * as d3 from "d3";
import { html } from "htm/preact";
import { signal, computed } from "@preact/signals";
import { PageHeader, Panel, SectionHeader } from "../components/layout.js";
import { SegmentedControl } from "../components/segmented-control.js";
import { KeyValue } from "../components/ui.js";
import { Tabs } from "../components/tabs.js";
import { FunnelChart } from "../components/charts/funnel-chart.js";
import { RetentionHeatmap } from "../components/charts/retention-heatmap.js";
import { MrrWaterfallChart } from "../components/charts/mrr-waterfall.js";
import { BarListChart } from "../components/charts/bar-list.js";
import { funnelSegments, getFunnel } from "../data/funnel.js";
import { retentionCohorts } from "../data/retention.js";
import { selectedRegion } from "../state/dashboard-signals.js";
import { regionAccounts, planRevenue, mrrMovement } from "../state/metrics-signals.js";
import { formatCurrencyCompact, formatPercent, formatSignedCurrency } from "../lib/format.js";
import { usePage } from "../hooks/use-page.js";

const segment = signal("all");
const heatMode = signal("percent");
const funnel = computed(() => getFunnel(segment.value));

const avgM1 = d3.mean(retentionCohorts.cohorts, (cohort) => cohort.values[1] ?? undefined);

const heatModes = [
  { id: "percent", label: "%" },
  { id: "users", label: "Users" }
];

function largestDropOff(steps) {
  let worst = 1;

  for (let i = 2; i < steps.length; i++) {
    if (steps[i].value / steps[i - 1].value < steps[worst].value / steps[worst - 1].value) {
      worst = i;
    }
  }

  return { from: steps[worst - 1], to: steps[worst], lost: 1 - steps[worst].value / steps[worst - 1].value };
}

export function AnalyticsPage() {
  usePage({ title: "Analytics", topic: "analytics", crumbs: [{ label: "Analytics" }] });

  const steps = funnel.value;
  const drop = largestDropOff(steps);
  const segmentLabel = funnelSegments.find((item) => item.id === segment.value).label;

  const movement = mrrMovement.value;
  const scope = selectedRegion.value ? `in ${selectedRegion.value}` : "across all regions";
  const paying = regionAccounts.value.filter((account) => account.status !== "trial").length;

  return html`
    <${PageHeader} title="Analytics" info="analytics" description="Revenue movement from account records, plus product analytics" />

    <${SectionHeader} title="Revenue" info="revenue" description=${`From account records and their activity ${scope}, live`} />

    <div class="grid-halves">
      <${Panel}
        title="MRR movement"
        description=${`Last 30 days of account events: ${formatCurrencyCompact(movement.start)} -> ${formatCurrencyCompact(movement.end)}, ${formatSignedCurrency(movement.net)} net`}
      >
        <${MrrWaterfallChart} items=${movement.items} />
      <//>

      <${Panel} title="MRR by plan" description=${`${paying} paying accounts, ${formatCurrencyCompact(d3.sum(planRevenue.value, (d) => d.value))} combined, trials excluded`}>
        <${BarListChart} items=${planRevenue.value} format="currency" label="MRR by plan" />
      <//>
    </div>

    <${SectionHeader} title="Product analytics" info="product" description="Signup and usage data for the whole user base, all regions" />

    <${Panel} title="Highlights">
      <div class="column-layout" style=${{ "--columns": 3 }}>
        <${KeyValue}
          label="Visit to paid"
          value=${formatPercent((steps[steps.length - 1].value / steps[0].value) * 100)}
          hint=${`${segmentLabel} traffic`}
        />
        <${KeyValue}
          label="Largest drop-off"
          value=${`${formatPercent(drop.lost * 100)} lost`}
          hint=${`${drop.from.stage} -> ${drop.to.stage}`}
          tone="warning"
        />
        <${KeyValue} label="Average M1 retention" value=${formatPercent(avgM1)} hint=${`Across ${retentionCohorts.cohorts.length - 1} cohorts`} />
      </div>
    <//>

    <div class="grid-halves">
      <${Panel}
        title="Signup funnel"
        description="Conversion from pricing visit through to paid plan"
      >
        <${Tabs}
          label="Acquisition channel"
          tabs=${funnelSegments.map((item) => ({ id: item.id, label: item.label }))}
          activeId=${segment.value}
          onChange=${(value) => {
            segment.value = value;
          }}
        />
        <div class="tab-content" role="tabpanel">
          <${FunnelChart} steps=${steps} />
        </div>
      <//>

      <${Panel}
        title="Cohort retention"
        description="Share of each signup cohort still active by month"
        actions=${html`
          <${SegmentedControl}
            label="Retention unit"
            options=${heatModes}
            value=${heatMode.value}
            onChange=${(value) => {
              heatMode.value = value;
            }}
          />
        `}
      >
        <${RetentionHeatmap} data=${retentionCohorts} mode=${heatMode.value} />
        <div class="heat-legend" aria-hidden="true">
          <span>Lower</span><i class="heat-legend-ramp"></i><span>Higher retention</span>
        </div>
      <//>
    </div>
  `;
}
