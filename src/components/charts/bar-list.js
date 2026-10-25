import * as d3 from "d3";
import { html } from "htm/preact";
import { useChart } from "../../hooks/use-chart.js";
import { formatCurrencyCompact, formatPercent } from "../../lib/format.js";
import { createSvg, createTooltip, escapeHtml, tooltipRow } from "./chart-utils.js";

const ROW_HEIGHT = 46;
const BAR_HEIGHT = 8;
const BAR_Y = 26;

const valueFormat = {
  percent: (value) => formatPercent(value),
  currency: (value) => formatCurrencyCompact(value)
};

// labelled horizontal bars, label and value above each bar so it stays readable at any width
export function renderBarList(container, items, { format, label }, { animate }) {
  d3.select(container).selectAll("*").remove();

  const width = container.clientWidth || 360;
  const height = items.length * ROW_HEIGHT - (ROW_HEIGHT - BAR_Y - BAR_HEIGHT);
  const total = d3.sum(items, (d) => d.value);
  const svg = createSvg(container, width, height, label);
  const tooltip = createTooltip(container);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(items, (d) => d.value)])
    .range([0, width]);

  const rows = svg
    .selectAll("g.bar-row")
    .data(items)
    .join("g")
    .attr("class", "bar-row")
    .attr("transform", (_, i) => `translate(0,${i * ROW_HEIGHT})`);

  rows.append("text").attr("class", "chart-label").attr("y", 16).text((d) => d.name);

  rows
    .append("text")
    .attr("class", "chart-value")
    .attr("x", width)
    .attr("y", 16)
    .attr("text-anchor", "end")
    .text((d) => valueFormat[format](d.value));

  rows
    .append("rect")
    .attr("class", "chart-track")
    .attr("y", BAR_Y)
    .attr("width", width)
    .attr("height", BAR_HEIGHT)
    .attr("rx", BAR_HEIGHT / 2);

  const bars = rows
    .append("rect")
    .attr("class", "chart-bar")
    .attr("y", BAR_Y)
    .attr("height", BAR_HEIGHT)
    .attr("rx", BAR_HEIGHT / 2)
    .attr("width", animate ? 0 : (d) => Math.max(x(d.value), BAR_HEIGHT));

  if (animate) {
    bars
      .transition()
      .duration(700)
      .delay((_, i) => i * 60)
      .ease(d3.easeCubicOut)
      .attr("width", (d) => Math.max(x(d.value), BAR_HEIGHT));
  }

  rows
    .append("rect")
    .attr("width", width)
    .attr("height", ROW_HEIGHT)
    .attr("fill", "transparent")
    .on("pointerenter", (_, d) => {
      const index = items.indexOf(d);
      bars.classed("is-dimmed", (bar) => bar !== d);
      tooltip.show(
        Math.min(x(d.value), width - 20),
        index * ROW_HEIGHT + BAR_Y,
        `<div class="tooltip-title">${escapeHtml(d.name)}</div>${tooltipRow("Value", valueFormat[format](d.value))}${tooltipRow("Share of total", formatPercent((d.value / total) * 100))}`
      );
    })
    .on("pointerleave", () => {
      bars.classed("is-dimmed", false);
      tooltip.hide();
    });
}

export function BarListChart({ items, format = "percent", label }) {
  const ref = useChart((node, options) => renderBarList(node, items, { format, label }, options), [items, format, label]);
  return html`<div ref=${ref} class="chart-host"></div>`;
}
