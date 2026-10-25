import * as d3 from "d3";
import { html } from "htm/preact";
import { useChart } from "../../hooks/use-chart.js";
import { formatNumber, formatPercent } from "../../lib/format.js";
import { createSvg, createTooltip, escapeHtml, tooltipRow } from "./chart-utils.js";

const ROW_HEIGHT = 66;
const BAR_Y = 22;
const BAR_HEIGHT = 14;

export function renderFunnelChart(container, steps, { animate }) {
  d3.select(container).selectAll("*").remove();

  const width = container.clientWidth || 520;
  const height = steps.length * ROW_HEIGHT - 6;
  const top = steps[0].value;
  const rates = steps.map((d, i) => (i === 0 ? null : d.value / steps[i - 1].value));
  const worst = d3.minIndex(rates);
  const svg = createSvg(container, width, height, "Signup conversion funnel");
  const tooltip = createTooltip(container);

  const x = d3.scaleLinear().domain([0, top]).range([0, width]);

  const rows = svg
    .selectAll("g.funnel-row")
    .data(steps)
    .join("g")
    .attr("class", "funnel-row")
    .attr("transform", (_, i) => `translate(0,${i * ROW_HEIGHT})`);

  rows.append("text").attr("class", "chart-label").attr("y", 14).text((d) => d.stage);

  rows
    .append("text")
    .attr("class", "chart-value")
    .attr("x", width)
    .attr("y", 14)
    .attr("text-anchor", "end")
    .text((d) => formatNumber(d.value));

  rows.append("rect").attr("class", "chart-track").attr("y", BAR_Y).attr("width", width).attr("height", BAR_HEIGHT).attr("rx", 5);

  const bars = rows
    .append("rect")
    .attr("class", "chart-bar")
    .attr("y", BAR_Y)
    .attr("height", BAR_HEIGHT)
    .attr("rx", 5)
    .attr("width", animate ? 0 : (d) => Math.max(x(d.value), 4));

  if (animate) {
    bars
      .transition()
      .duration(650)
      .delay((_, i) => i * 70)
      .ease(d3.easeCubicOut)
      .attr("width", (d) => Math.max(x(d.value), 4));
  }

  rows
    .filter((_, i) => i > 0)
    .append("text")
    .attr("class", (_, i) => `chart-label-muted ${i + 1 === worst ? "is-warning" : ""}`)
    .attr("y", BAR_Y + BAR_HEIGHT + 15)
    .text((_, i) => `${formatPercent(rates[i + 1] * 100)} of previous step${i + 1 === worst ? ", largest drop-off" : ""}`);

  rows
    .append("text")
    .attr("class", "chart-label-muted")
    .attr("x", width)
    .attr("y", BAR_Y + BAR_HEIGHT + 15)
    .attr("text-anchor", "end")
    .text((d, i) => (i === 0 ? "" : `${formatPercent((d.value / top) * 100)} of visitors`));

  rows
    .append("rect")
    .attr("width", width)
    .attr("height", ROW_HEIGHT)
    .attr("fill", "transparent")
    .on("pointerenter", (_, d) => {
      const i = steps.indexOf(d);
      bars.classed("is-dimmed", (bar) => bar !== d);

      let rowsHtml = tooltipRow("Users", formatNumber(d.value));
      rowsHtml += tooltipRow("Of visitors", formatPercent((d.value / top) * 100));

      if (i > 0) {
        rowsHtml += tooltipRow("Step conversion", formatPercent(rates[i] * 100));
        rowsHtml += tooltipRow("Dropped", formatNumber(steps[i - 1].value - d.value));
      }

      tooltip.show(Math.min(x(d.value), width - 20), i * ROW_HEIGHT + BAR_Y, `<div class="tooltip-title">${escapeHtml(d.stage)}</div>${rowsHtml}`);
    })
    .on("pointerleave", () => {
      bars.classed("is-dimmed", false);
      tooltip.hide();
    });
}

export function FunnelChart({ steps }) {
  const ref = useChart((node, options) => renderFunnelChart(node, steps, options), [steps]);
  return html`<div ref=${ref} class="chart-host"></div>`;
}
