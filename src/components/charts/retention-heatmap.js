import * as d3 from "d3";
import { html } from "htm/preact";
import { useChart } from "../../hooks/use-chart.js";
import { darkMode } from "../../state/settings-signals.js";
import { formatCompact, formatNumber } from "../../lib/format.js";
import { createSvg, createTooltip, escapeHtml, tooltipRow } from "./chart-utils.js";

const LABEL_WIDTH = 74;
const HEADER_HEIGHT = 24;
const CELL_HEIGHT = 42;
const GAP = 4;
const DARK_TEXT = "#0f141a";
const LIGHT_TEXT = "#ffffff";

// picks whichever text color has more contrast against the cell
function textOn(color) {
  const { r, g, b } = d3.rgb(color);
  const luminance = [r, g, b]
    .map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);

  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? DARK_TEXT : LIGHT_TEXT;
}

export function renderRetentionHeatmap(container, data, { mode }, { animate }) {
  d3.select(container).selectAll("*").remove();

  const { months, cohorts } = data;
  const styles = getComputedStyle(container);
  const width = container.clientWidth || 520;
  const cellWidth = (width - LABEL_WIDTH - GAP * (months.length - 1)) / months.length;
  const height = HEADER_HEIGHT + cohorts.length * (CELL_HEIGHT + GAP) - GAP;
  const svg = createSvg(container, width, height, "Monthly cohort retention heatmap");
  const tooltip = createTooltip(container);

  // colors come from the active theme, the chart is redrawn on theme change
  const color = d3
    .scaleLinear()
    .domain([30, 100])
    .range([styles.getPropertyValue("--heat-low").trim(), styles.getPropertyValue("--heat-high").trim()])
    .interpolate(d3.interpolateRgb)
    .clamp(true);

  svg
    .selectAll("text.heat-header")
    .data(months)
    .join("text")
    .attr("class", "chart-label-muted heat-header")
    .attr("x", (_, i) => LABEL_WIDTH + i * (cellWidth + GAP) + cellWidth / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .text((d) => d);

  const rows = svg
    .selectAll("g.heat-row")
    .data(cohorts)
    .join("g")
    .attr("class", "heat-row")
    .attr("transform", (_, i) => `translate(0,${HEADER_HEIGHT + i * (CELL_HEIGHT + GAP)})`);

  rows.append("text").attr("class", "chart-label").attr("y", CELL_HEIGHT / 2 - 2).text((d) => d.label);

  rows
    .append("text")
    .attr("class", "chart-label-muted")
    .attr("y", CELL_HEIGHT / 2 + 13)
    .text((d) => `${formatCompact(d.size)} users`);

  rows.each(function renderRow(cohort, rowIndex) {
    const cells = d3
      .select(this)
      .selectAll("g.heat-cell")
      .data(cohort.values)
      .join("g")
      .attr("class", (value) => `heat-cell ${value === null ? "is-empty" : ""}`)
      .attr("transform", (_, i) => `translate(${LABEL_WIDTH + i * (cellWidth + GAP)},0)`);

    cells
      .append("rect")
      .attr("width", cellWidth)
      .attr("height", CELL_HEIGHT)
      .attr("rx", 6)
      .style("fill", (value) => (value === null ? null : color(value)));

    const filled = cells.filter((value) => value !== null);

    filled
      .append("text")
      .attr("x", cellWidth / 2)
      .attr("y", CELL_HEIGHT / 2 + 4)
      .attr("text-anchor", "middle")
      .style("fill", (value) => textOn(color(value)))
      .text((value) => (mode === "users" ? formatCompact(Math.round((cohort.size * value) / 100)) : `${value}%`));

    filled
      .on("pointerenter", function onEnter(_, value) {
        const column = cohort.values.indexOf(value);
        const retained = Math.round((cohort.size * value) / 100);
        tooltip.show(
          LABEL_WIDTH + column * (cellWidth + GAP) + cellWidth / 2,
          HEADER_HEIGHT + rowIndex * (CELL_HEIGHT + GAP),
          `<div class="tooltip-title">${escapeHtml(cohort.label)} cohort, ${escapeHtml(months[column])}</div>${tooltipRow("Retained", `${value}%`)}${tooltipRow("Users", `${formatNumber(retained)} of ${formatNumber(cohort.size)}`)}`
        );
      })
      .on("pointerleave", () => tooltip.hide());

    if (animate) {
      cells
        .style("opacity", 0)
        .transition()
        .duration(400)
        .delay((_, i) => rowIndex * 40 + i * 50)
        .style("opacity", 1);
    }
  });
}

export function RetentionHeatmap({ data, mode = "percent" }) {
  const dark = darkMode.value;
  const ref = useChart((node, options) => renderRetentionHeatmap(node, data, { mode }, options), [data, mode, dark]);
  return html`<div ref=${ref} class="chart-host"></div>`;
}
