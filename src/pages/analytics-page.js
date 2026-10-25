import * as d3 from "d3";
import { html } from "htm/preact";
import { signal, computed } from "@preact/signals";
import { PageHeader, Panel } from "../components/layout.js";
import { SegmentedControl } from "../components/segmented-control.js";
import { KeyValue } from "../components/ui.js";
import { Tabs } from "../components/tabs.js";
import { FunnelChart } from "../components/charts/funnel-chart.js";
import { RetentionHeatmap } from "../components/charts/retention-heatmap.js";
import { MrrWaterfallChart } from "../components/charts/mrr-waterfall.js";
import { BarListChart } from "../components/charts/bar-list.js";
import { funnelSegments, getFunnel } from "../data/funnel.js";
import { retentionCohorts } from "../data/retention.js";
import { getMrrMovement } from "../data/metrics.js";
import { planOrder } from "../data/customers.js";
import { accounts } from "../state/accounts-signals.js";
import { formatCurrencyCompact, formatPercent, formatSignedCurrency } from "../lib/format.js";
import { usePage } from "../hooks/use-page.js";

const segment = signal("all");
const heatMode = signal("percent");
const funnel = computed(() => getFunnel(segment.value));

const movement = getMrrMovement();
const netChange = d3.sum(movement.items, (item) => item.value);
const avgM1 = d3.mean(retentionCohorts.cohorts, (cohort) => cohort.values[1] ?? undefined);

const planRevenue = computed(() =>
  planOrder
    .map((plan) => ({ name: plan, value: d3.sum(accounts.value.filter((customer) => customer.plan === plan), (customer) => customer.mrr) }))
    .sort((a, b) => b.value - a.value)
);

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

  return html`
    <${PageHeader} title="Analytics" info="analytics" description="Signup conversion, cohort retention and revenue movement" />

    <${Panel} title="Highlights">
      <div class="column-layout">
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
      <${KeyValue}
        label="Net new MRR"
        value=${formatSignedCurrency(netChange)}
        hint=${`Last month, ${formatCurrencyCompact(movement.start)} -> ${formatCurrencyCompact(movement.end)}`}
        tone=${netChange >= 0 ? "success" : "error"}
      />
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

    <div class="grid-halves">
      <${Panel} title="MRR movement" description="Where last month's net change came from">
        <${MrrWaterfallChart} items=${movement.items} />
      <//>

      <${Panel} title="Key account MRR by plan" description=${`${accounts.value.length} named accounts, ${formatCurrencyCompact(d3.sum(planRevenue.value, (d) => d.value))} combined`}>
        <${BarListChart} items=${planRevenue.value} format="currency" label="Key account MRR by plan" />
      <//>
    </div>
  `;
}
