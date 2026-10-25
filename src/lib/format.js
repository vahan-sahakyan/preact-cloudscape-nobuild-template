const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

const currencyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1
});

const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// date-only ISO strings are parsed as local dates, not UTC midnight
export function parseDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

export function formatMetric(value, format) {
  if (format === "percent") {
    return `${Number(value.toFixed(2))}%`;
  }

  if (format === "currency") {
    return currencyCompact.format(value);
  }

  return compactNumber.format(value);
}

// percent metrics move in percentage points, everything else relative
export function formatDelta(delta, format) {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  const size = Math.abs(delta);
  return format === "percent" ? `${sign}${size.toFixed(2)} pp` : `${sign}${size.toFixed(1)}%`;
}

export function formatSignedCurrency(value) {
  return `${value >= 0 ? "+" : "-"}${currencyCompact.format(Math.abs(value))}`;
}

export function formatCurrency(value) {
  return currencyWhole.format(value);
}

export function formatCurrencyCompact(value) {
  return currencyCompact.format(value);
}

export function formatNumber(value) {
  return wholeNumber.format(value);
}

export function formatCompact(value) {
  return compactNumber.format(value);
}

export function formatPercent(value, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(value) {
  return shortDate.format(parseDate(value));
}

export function formatMonthYear(value) {
  return monthYear.format(parseDate(value));
}

export function formatTimeAgo(value, now = Date.now()) {
  const elapsed = Math.max(now - parseDate(value).getTime(), 0);

  if (elapsed < MINUTE) {
    return "just now";
  }

  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m ago`;
  }

  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h ago`;
  }

  if (elapsed < 30 * DAY) {
    return `${Math.floor(elapsed / DAY)}d ago`;
  }

  return formatDate(value);
}

export function formatTimeUntil(value, now = Date.now()) {
  const days = Math.round((parseDate(value).getTime() - now) / DAY);

  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }

  if (days === 0) {
    return "today";
  }

  if (days < 14) {
    return `in ${days}d`;
  }

  return days < 60 ? `in ${Math.round(days / 7)} wk` : `in ${Math.round(days / 30)} mo`;
}

export function initials(name) {
  return name
    .replace(/[^A-Za-z\s.]/g, "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
