import * as d3 from "d3";
import { html } from "htm/preact";
import { useChart } from "../../hooks/use-chart.js";
import { formatCurrencyCompact, formatSignedCurrency } from "../../lib/format.js";
import { createSvg, createTooltip, escapeHtml, tooltipRow } from "./chart-utils.js";

const HEIGHT = 260;

// zero-based waterfall of MRR movements, ending in a net change total
export function renderMrrWaterfall(container, items, { animate }) {
  d3.select(container).selectAll("*").remove();

  const steps = [];
  let running = 0;

  for (const item of items) {
    steps.push({ ...item, start: running, end: running + item.value, kind: item.value >= 0 ? "is-positive" : "is-negative" });
    running += item.value;
  }

  steps.push({ label: "Net change", value: running, start: 0, end: running, kind: "is-total" });

  const width = container.clientWidth || 420;
  const margin = { top: 26, right: 8, bottom: 30, left: 52 };
  const svg = createSvg(container, width, HEIGHT, "MRR movement waterfall for the last month");
  const tooltip = createTooltip(container);

  const x = d3
    .scaleBand()
    .domain(steps.map((d) => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.32);

  const y = d3
    .scaleLinear()
    .domain([Math.min(0, d3.min(steps, (d) => Math.min(d.start, d.end))), d3.max(steps, (d) => Math.max(d.start, d.end))])
    .nice()
    .range([HEIGHT - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("class", "chart-axis chart-grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(4).tickSize(-(width - margin.left - margin.right)).tickPadding(10).tickFormat(formatCurrencyCompact))
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${HEIGHT - margin.bottom})`)
    .call(d3.axisBottom(x).tickSize(0).tickPadding(12))
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .selectAll("line")
    .data(steps.slice(0, -1))
    .join("line")
    .attr("class", "chart-connector")
    .attr("x1", (d) => x(d.label) + x.bandwidth())
    .attr("x2", (_, i) => x(steps[i + 1].label))
    .attr("y1", (d) => y(d.end))
    .attr("y2", (d) => y(d.end));

  const bars = svg
    .append("g")
    .selectAll("rect")
    .data(steps)
    .join("rect")
    .attr("class", (d) => `chart-bar ${d.kind}`)
    .attr("x", (d) => x(d.label))
    .attr("width", x.bandwidth())
    .attr("rx", 4)
    .attr("y", (d) => (animate ? y(d.start) : y(Math.max(d.start, d.end))))
    .attr("height", (d) => (animate ? 0 : Math.max(Math.abs(y(d.start) - y(d.end)), 2)));

  if (animate) {
    bars
      .transition()
      .duration(600)
      .delay((_, i) => i * 90)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(Math.max(d.start, d.end)))
      .attr("height", (d) => Math.max(Math.abs(y(d.start) - y(d.end)), 2));
  }

  svg
    .append("g")
    .selectAll("text")
    .data(steps)
    .join("text")
    .attr("class", "chart-value chart-value-sm")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("y", (d) => y(Math.max(d.start, d.end)) - 7)
    .attr("text-anchor", "middle")
    .text((d) => formatSignedCurrency(d.value));

  bars
    .on("pointerenter", (_, d) => {
      bars.classed("is-dimmed", (bar) => bar !== d);
      tooltip.show(
        x(d.label) + x.bandwidth() / 2,
        y(Math.max(d.start, d.end)) - 22,
        `<div class="tooltip-title">${escapeHtml(d.label)}</div>${tooltipRow("Change", formatSignedCurrency(d.value))}${tooltipRow("Running total", formatSignedCurrency(d.end))}`
      );
    })
    .on("pointerleave", () => {
      bars.classed("is-dimmed", false);
      tooltip.hide();
    });
}

export function MrrWaterfallChart({ items }) {
  const ref = useChart((node, options) => renderMrrWaterfall(node, items, options), [items]);
  return html`<div ref=${ref} class="chart-host" style=${{ minHeight: `${HEIGHT}px` }}></div>`;
}
