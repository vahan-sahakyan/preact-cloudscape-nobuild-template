import * as d3 from "d3";

const currentMonth = d3.timeMonth.floor(new Date());
const values = [
  [100, 68, 54, 47, 41, 38],
  [100, 71, 58, 50, 44, null],
  [100, 74, 61, 53, null, null],
  [100, 77, 64, null, null, null],
  [100, 80, null, null, null, null],
  [100, null, null, null, null, null]
];
const sizes = [1240, 1310, 1420, 1385, 1510, 1600];

// cohorts are labelled relative to the current month, newest last
export const retentionCohorts = {
  months: ["M0", "M1", "M2", "M3", "M4", "M5"],
  cohorts: values.map((row, i) => ({
    label: d3.timeFormat("%b")(d3.timeMonth.offset(currentMonth, i - values.length + 1)),
    size: sizes[i],
    values: row
  }))
};
