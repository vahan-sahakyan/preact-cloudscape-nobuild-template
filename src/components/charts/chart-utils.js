import * as d3 from "d3";

let uid = 0;

export function nextId(prefix) {
  uid += 1;
  return `${prefix}-${uid}`;
}

export function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

export function createSvg(container, width, height, label) {
  return d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", label);
}

// html tooltip anchored at (x, y) inside the chart host, clamped to its width and flipped below near the top
export function createTooltip(container) {
  const tooltip = d3.select(container).append("div").attr("class", "chart-tooltip").attr("aria-hidden", "true");

  return {
    show(x, y, content) {
      const node = tooltip.node();
      node.innerHTML = content;
      const half = node.offsetWidth / 2;
      const left = Math.min(Math.max(x, half + 4), container.clientWidth - half - 4);

      tooltip
        .classed("is-below", y - node.offsetHeight - 14 < 0)
        .classed("is-visible", true)
        .style("left", `${left}px`)
        .style("top", `${y}px`);
    },
    hide() {
      tooltip.classed("is-visible", false);
    }
  };
}

export function tooltipRow(label, value, swatchClass) {
  const swatch = swatchClass ? `<span class="tooltip-swatch ${swatchClass}"></span>` : "";
  return `<div class="tooltip-row">${swatch}<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}
