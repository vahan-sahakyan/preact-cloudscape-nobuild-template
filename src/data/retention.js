import * as d3 from "d3";
import { seed } from "./api.js";

const currentMonth = d3.timeMonth.floor(new Date());
const { months, sizes, values } = seed.retention;

// cohorts are labelled relative to the current month, newest last
export const retentionCohorts = {
  months,
  cohorts: values.map((row, i) => ({
    label: d3.timeFormat("%b")(d3.timeMonth.offset(currentMonth, i - values.length + 1)),
    size: sizes[i],
    values: row
  }))
};
