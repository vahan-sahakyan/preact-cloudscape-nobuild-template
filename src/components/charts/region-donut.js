import * as d3 from "d3";
import { html } from "htm/preact";
import { useEffect } from "preact/hooks";
import { useChart } from "../../hooks/use-chart.js";
import { formatPercent } from "../../lib/format.js";
import { chartPalette } from "../../lib/cloudscape-tokens.js";
import { createSvg } from "./chart-utils.js";

const MAX_SIZE = 220;
const INNER_RATIO = 0.64;
const DIMMED_OPACITY = 0.3;

function arcFor(radius, grow = 0) {
  return d3
    .arc()
    .innerRadius(radius * INNER_RATIO)
    .outerRadius(radius + grow)
    .cornerRadius(4);
}

export function renderRegionDonut(container, regions, { animate, onHover, onSelect }) {
  d3.select(container).selectAll("*").remove();

  const size = Math.min(container.clientWidth || MAX_SIZE, MAX_SIZE);
  const radius = size / 2 - 6;
  const arc = arcFor(radius);
  const svg = createSvg(container, size, size, "Customer share by region").attr("data-radius", radius);
  const group = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);

  const pie = d3
    .pie()
    .sort(null)
    .padAngle(0.014)
    .value((d) => d.value);

  const arcs = group
    .selectAll("path")
    .data(pie(regions))
    .join("path")
    .attr("class", "region-arc")
    .style("fill", (_, i) => chartPalette[i % chartPalette.length])
    .on("pointerenter", (_, d) => onHover(d.data.name))
    .on("pointerleave", () => onHover(null))
    .on("click", (_, d) => onSelect(d.data.name));

  if (animate) {
    arcs
      .transition()
      .duration(700)
      .attrTween("d", (d) => {
        const interpolate = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
        return (t) => arc(interpolate(t));
      });
  } else {
    arcs.attr("d", arc);
  }

  group.append("text").attr("class", "donut-center-value").attr("text-anchor", "middle").attr("y", 4);
  group.append("text").attr("class", "donut-center-label").attr("text-anchor", "middle").attr("y", 24);
}

// updates highlight in place, keeps transitions and listeners intact
export function updateRegionDonutHighlight(container, focused) {
  const svg = d3.select(container).select("svg");

  if (svg.empty()) {
    return;
  }

  const radius = Number(svg.attr("data-radius"));
  const arc = arcFor(radius);
  const grown = arcFor(radius, 5);
  const arcs = svg.selectAll("path.region-arc");
  const active = arcs.data().find((d) => d.data.name === focused);
  const total = d3.sum(arcs.data(), (d) => d.data.value);

  arcs
    .attr("opacity", (d) => (!focused || d.data.name === focused ? 1 : DIMMED_OPACITY))
    .filter(function settled() {
      return !d3.active(this);
    })
    .attr("d", (d) => (d.data.name === focused ? grown(d) : arc(d)));

  svg.select(".donut-center-value").text(active ? formatPercent((active.data.value / total) * 100, 0) : arcs.size());
  svg.select(".donut-center-label").text(active ? active.data.name : "regions");
}

export function RegionDonutChart({ regions, focused, pinned, onHover, onSelect }) {
  const ref = useChart(
    (node, options) => {
      renderRegionDonut(node, regions, { ...options, onHover, onSelect });
      updateRegionDonutHighlight(node, focused);
    },
    [regions]
  );

  useEffect(() => {
    if (ref.current) {
      updateRegionDonutHighlight(ref.current, focused);
    }
  }, [focused]);

  return html`
    <div class="donut-layout">
      <div ref=${ref} class="chart-host donut-host"></div>
      <ul class="chart-legend">
        ${regions.map(
          (region, i) => html`
            <li key=${region.name}>
              <button
                type="button"
                class=${`legend-button ${focused && focused !== region.name ? "is-dimmed" : ""}`}
                aria-pressed=${pinned === region.name}
                onMouseEnter=${() => onHover(region.name)}
                onMouseLeave=${() => onHover(null)}
                onFocus=${() => onHover(region.name)}
                onBlur=${() => onHover(null)}
                onClick=${() => onSelect(region.name)}
              >
                <span class="legend-dot" style=${{ background: chartPalette[i % chartPalette.length] }}></span>
                <span class="legend-name">${region.name}</span>
                <strong>${formatPercent(region.value, 0)}</strong>
              </button>
            </li>
          `
        )}
      </ul>
    </div>
  `;
}
