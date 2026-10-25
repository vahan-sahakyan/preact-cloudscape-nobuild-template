import * as d3 from "d3";
import { html } from "htm/preact";

export function TrendSparkline({ values, width = 120, height = 32, class: className = "" }) {
  const [min, max] = d3.extent(values);
  const x = d3
    .scaleLinear()
    .domain([0, values.length - 1])
    .range([1, width - 1]);
  const y = d3
    .scaleLinear()
    .domain([min, max === min ? min + 1 : max])
    .range([height - 3, 3]);
  const line = d3
    .line()
    .x((_, i) => x(i))
    .y((value) => y(value))
    .curve(d3.curveMonotoneX);
  const area = d3
    .area()
    .x((_, i) => x(i))
    .y0(height)
    .y1((value) => y(value))
    .curve(d3.curveMonotoneX);

  return html`
    <svg class=${`sparkline ${className}`} viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <path class="sparkline-area" d=${area(values)}></path>
      <path class="sparkline-line" d=${line(values)}></path>
    </svg>
  `;
}
