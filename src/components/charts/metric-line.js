import * as d3 from "d3";
import { html } from "htm/preact";
import { useChart } from "../../hooks/use-chart.js";
import { formatMetric, formatDelta, formatMonthYear, formatCurrencyCompact, formatCompact } from "../../lib/format.js";
import { createSvg, createTooltip, escapeHtml, nextId, tooltipRow } from "./chart-utils.js";

const DEFAULT_HEIGHT = 300;

const axisFormat = {
  currency: (value) => formatCurrencyCompact(value),
  number: (value) => formatCompact(value),
  percent: (value) => `${Number(value.toFixed(1))}%`
};

const monthTick = (date) => d3.timeFormat(date.getMonth() === 0 ? "%Y" : "%b")(date);

export function renderMetricLine(container, { series, compare, target, format, label, height }, { animate }) {
  d3.select(container).selectAll("*").remove();

  const width = container.clientWidth || 640;
  const margin = { top: 18, right: 16, bottom: 30, left: 54 };
  const innerWidth = width - margin.left - margin.right;
  const bottom = height - margin.bottom;
  const svg = createSvg(container, width, height, `${label} over the last ${series.length} months`);

  // previous period is drawn on the current period's dates so the two line up month by month
  const aligned = compare ? compare.slice(-series.length).map((point, i) => ({ date: series[i].date, value: point.value })) : null;

  const x = d3
    .scaleTime()
    .domain(d3.extent(series, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const values = [...series.map((d) => d.value), ...(aligned ? aligned.map((d) => d.value) : []), ...(target != null ? [target] : [])];
  const [min, max] = d3.extent(values);
  const pad = (max - min) * 0.12 || Math.abs(max) * 0.05 || 1;
  const y = d3
    .scaleLinear()
    .domain([min - pad, max + pad])
    .nice()
    .range([bottom, margin.top]);

  svg
    .append("g")
    .attr("class", "chart-axis chart-grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickPadding(10).tickFormat(axisFormat[format]))
    .call((g) => g.select(".domain").remove());

  const tickEvery = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(innerWidth / 64))));

  svg
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${bottom})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(tickEvery)).tickFormat(monthTick).tickSize(0).tickPadding(12))
    .call((g) => g.select(".domain").remove());

  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0(bottom)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const gradientId = nextId("metric-fill");
  const gradient = svg.append("defs").append("linearGradient").attr("id", gradientId).attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
  gradient.append("stop").attr("class", "chart-fill-stop").attr("offset", "0%").attr("stop-opacity", 0.26);
  gradient.append("stop").attr("class", "chart-fill-stop").attr("offset", "100%").attr("stop-opacity", 0);

  svg.append("path").datum(series).attr("fill", `url(#${gradientId})`).attr("d", area);

  if (target != null) {
    const targetY = y(target);
    const group = svg.append("g").attr("class", "chart-target");
    group.append("line").attr("x1", margin.left).attr("x2", width - margin.right).attr("y1", targetY).attr("y2", targetY);
    group
      .append("text")
      .attr("x", width - margin.right)
      .attr("y", targetY - 6)
      .attr("text-anchor", "end")
      .text(`Target ${formatMetric(target, format)}`);
  }

  if (aligned) {
    svg.append("path").datum(aligned).attr("class", "chart-line-compare").attr("d", line);
  }

  const path = svg.append("path").datum(series).attr("class", "chart-line").attr("d", line);

  if (animate) {
    const length = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${length} ${length}`)
      .attr("stroke-dashoffset", length)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0)
      .on("end", () => path.attr("stroke-dasharray", null));
  }

  if (series.length <= 13) {
    svg
      .append("g")
      .selectAll("circle")
      .data(series)
      .join("circle")
      .attr("class", "chart-point")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", 3.5);
  }

  const focus = svg.append("g").attr("class", "chart-focus").style("display", "none");
  const focusLine = focus.append("line").attr("class", "chart-focus-line").attr("y1", margin.top).attr("y2", bottom);
  const compareDot = aligned ? focus.append("circle").attr("class", "chart-focus-dot is-compare").attr("r", 4.5) : null;
  const dot = focus.append("circle").attr("class", "chart-focus-dot").attr("r", 5.5);
  const tooltip = createTooltip(container);
  const bisect = d3.bisector((d) => d.date);
  let activeIndex = -1;

  function showIndex(index) {
    activeIndex = index;
    const point = series[index];
    const px = x(point.date);
    let rows = tooltipRow(label, formatMetric(point.value, format), "is-primary");
    let anchorY = y(point.value);

    focus.style("display", null);
    focusLine.attr("x1", px).attr("x2", px);
    dot.attr("cx", px).attr("cy", y(point.value));

    if (aligned) {
      const prior = aligned[index].value;
      const delta = format === "percent" ? point.value - prior : ((point.value - prior) / prior) * 100;
      compareDot.attr("cx", px).attr("cy", y(prior));
      anchorY = Math.min(anchorY, y(prior));
      rows += tooltipRow("Previous period", formatMetric(prior, format), "is-compare");
      rows += tooltipRow("Change", formatDelta(delta, format));
    }

    tooltip.show(px, anchorY, `<div class="tooltip-title">${escapeHtml(formatMonthYear(point.date))}</div>${rows}`);
  }

  function hide() {
    activeIndex = -1;
    focus.style("display", "none");
    tooltip.hide();
  }

  svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", Math.max(innerWidth, 0))
    .attr("height", Math.max(bottom - margin.top, 0))
    .attr("fill", "transparent")
    .style("cursor", "crosshair")
    .on("pointermove pointerdown", (event) => {
      const [mouseX] = d3.pointer(event);
      showIndex(bisect.center(series, x.invert(mouseX)));
    })
    .on("pointerleave", hide);

  // arrow keys walk the points for keyboard users
  svg
    .attr("tabindex", 0)
    .on("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      const step = event.key === "ArrowLeft" ? -1 : 1;
      const start = activeIndex === -1 ? series.length - 1 : activeIndex + step;
      showIndex(Math.min(Math.max(start, 0), series.length - 1));
    })
    .on("blur", hide);
}

export function MetricLineChart({ series, compare = null, target = null, format, label, height = DEFAULT_HEIGHT }) {
  const ref = useChart(
    (node, options) => renderMetricLine(node, { series, compare, target, format, label, height }, options),
    [series, compare, target, format, label, height]
  );

  return html`<div ref=${ref} class="chart-host" style=${{ minHeight: `${height}px` }}></div>`;
}
