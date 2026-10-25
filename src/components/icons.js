import { html } from "htm/preact";

// 20x20 stroke icons, inherit currentColor so active/hover states just work.
// shapes are factories so the same icon can render in many places at once
const shapes = {
  overview: () => html`
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" />
    <rect x="11" y="11" width="6.5" height="6.5" rx="1.4" />
  `,
  customers: () => html`
    <circle cx="7.3" cy="6.3" r="2.6" />
    <path d="M2.5 16.3c0-2.9 2.1-4.6 4.8-4.6s4.8 1.7 4.8 4.6" />
    <circle cx="14" cy="6.8" r="2" />
    <path d="M13 11.9c2 .2 3.5 1.7 3.5 4.1" />
  `,
  analytics: () => html`<path d="M3 17V9M9.5 17V3M16 17v-6.5" />`,
  settings: () => html`
    <circle cx="10" cy="10" r="2.4" />
    <path
      d="M15.4 8.6L17.7 8.9L17.7 11.1L15.4 11.4L14.8 12.9L16.2 14.7L14.7 16.2L12.9 14.8L11.4 15.4L11.1 17.7L8.9 17.7L8.6 15.4L7.1 14.8L5.3 16.2L3.8 14.7L5.2 12.9L4.6 11.4L2.3 11.1L2.3 8.9L4.6 8.6L5.2 7.1L3.8 5.3L5.3 3.8L7.1 5.2L8.6 4.6L8.9 2.3L11.1 2.3L11.4 4.6L12.9 5.2L14.7 3.8L16.2 5.3L14.8 7.1z"
    />
  `,
  pulse: () => html`<path d="M2.5 10h3l2-4.5 3.5 9 2-4.5h4.5" />`,
  search: () => html`<circle cx="9" cy="9" r="5.5" /><path d="M13.2 13.2L17 17" />`,
  menu: () => html`<path d="M3 5.5h14M3 10h14M3 14.5h14" />`,
  chevronLeft: () => html`<path d="M12 4.5L6.5 10l5.5 5.5" />`,
  chevronRight: () => html`<path d="M8 4.5l5.5 5.5L8 15.5" />`,
  chevronDown: () => html`<path d="M5.5 8l4.5 4.5L14.5 8" />`,
  chevronUp: () => html`<path d="M5.5 12L10 7.5l4.5 4.5" />`,
  sort: () => html`<path d="M6.5 8L10 4.5 13.5 8M6.5 12l3.5 3.5 3.5-3.5" />`,
  arrowUp: () => html`<path d="M10 16V4M5 9l5-5 5 5" />`,
  arrowDown: () => html`<path d="M10 4v12M5 11l5 5 5-5" />`,
  arrowLeft: () => html`<path d="M16 10H4M9 5l-5 5 5 5" />`,
  arrowRight: () => html`<path d="M4 10h12M11 5l5 5-5 5" />`,
  sun: () => html`
    <circle cx="10" cy="10" r="3.2" />
    <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7L14 6M6 14l-1.3 1.3M15.3 15.3L14 14M6 6L4.7 4.7" />
  `,
  moon: () => html`<path d="M16 12.3A6.5 6.5 0 0 1 7.7 4a6.5 6.5 0 1 0 8.3 8.3z" />`,
  monitor: () => html`<rect x="2.5" y="3.5" width="15" height="10" rx="1.6" /><path d="M7 17h6M10 13.5V17" />`,
  star: () => html`<path d="M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5L10 14.2l-4.5 2.4.9-5-3.6-3.5 5-.7z" />`,
  download: () => html`<path d="M10 3v9.5M6 8.5l4 4 4-4M3.5 16.5h13" />`,
  x: () => html`<path d="M5 5l10 10M15 5L5 15" />`,
  plus: () => html`<path d="M10 4v12M4 10h12" />`,
  check: () => html`<path d="M4.5 10.5l3.5 3.5 7.5-8" />`,
  alert: () => html`<path d="M10 3l7.5 13.5h-15z" /><path d="M10 8.5v3.5M10 14.3v.2" />`,
  note: () => html`<path d="M4 3.5h12v9.5l-4 4H4z" /><path d="M12 17v-4h4M7 7.5h6M7 10.5h4" />`,
  copy: () => html`
    <rect x="7" y="7" width="9.5" height="9.5" rx="1.6" />
    <path d="M13 7V5a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 4 5v6a1.5 1.5 0 0 0 1.5 1.5H7" />
  `,
  trash: () => html`<path d="M4 6h12M8 6V4.5h4V6M5.5 6l.8 10h7.4l.8-10" />`,
  pause: () => html`<path d="M7.5 5v10M12.5 5v10" />`,
  play: () => html`<path d="M7 4.5l8 5.5-8 5.5z" />`,
  sidebar: () => html`<rect x="3" y="3.5" width="14" height="13" rx="2" /><path d="M8 3.5v13" />`,
  compare: () => html`<path d="M3 14l4-5 3 3 4-6 3 3" /><path d="M3 16.5h14" stroke-dasharray="2 2" />`,
  inbox: () => html`<path d="M3 11l2-6.5h10l2 6.5v5H3z" /><path d="M3 11h4l1 2h4l1-2h4" />`,
  keyboard: () => html`<rect x="2.5" y="5" width="15" height="10" rx="1.6" /><path d="M6 8.5h.01M9 8.5h.01M12 8.5h.01M15 8.5h.01M6.5 11.8h7" />`,
  database: () => html`<ellipse cx="10" cy="5" rx="6" ry="2.2" /><path d="M4 5v10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5M4 10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" />`,
  statusPositive: () => html`<circle cx="10" cy="10" r="7.5" /><path d="M6.8 10.2l2.2 2.2 4.3-4.6" />`,
  statusNegative: () => html`<circle cx="10" cy="10" r="7.5" /><path d="M7.4 7.4l5.2 5.2M12.6 7.4l-5.2 5.2" />`,
  statusWarning: () => html`<path d="M10 2.8l7.8 13.7H2.2z" /><path d="M10 8v4M10 14.3v.1" />`,
  statusInfo: () => html`<circle cx="10" cy="10" r="7.5" /><path d="M10 9.2v4.8M10 6.3v.1" />`,
  statusPending: () => html`<circle cx="10" cy="10" r="7.5" /><path d="M10 5.8V10l2.8 1.8" />`,
  caretDown: () => html`<path d="M5.5 7.5h9L10 12.5z" fill="currentColor" stroke="none" />`,
  caretUp: () => html`<path d="M5.5 12.5h9L10 7.5z" fill="currentColor" stroke="none" />`,
  caretRight: () => html`<path d="M7.5 5.5v9l5-4.5z" fill="currentColor" stroke="none" />`,
  grid: () => html`
    <path
      d="M3.5 3.5h3v3h-3zM8.5 3.5h3v3h-3zM13.5 3.5h3v3h-3zM3.5 8.5h3v3h-3zM8.5 8.5h3v3h-3zM13.5 8.5h3v3h-3zM3.5 13.5h3v3h-3zM8.5 13.5h3v3h-3zM13.5 13.5h3v3h-3z"
      fill="currentColor"
      stroke="none"
    />
  `,
  help: () => html`<circle cx="10" cy="10" r="7.5" /><path d="M7.8 7.9a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.5v.4M10 14.3v.1" />`,
  external: () => html`<path d="M11.5 3.5H16.5V8.5M16.5 3.5L9.5 10.5M14 12v4.5H3.5V6H8" />`,
  terminal: () => html`<rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><path d="M6 8l2.5 2L6 12M10.5 12.5h3.5" />`,
  refresh: () => html`<path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.6h-3.6" />`
};

export function Icon({ name, filled = false, class: className = "" }) {
  return html`
    <svg
      class=${`icon ${className}`}
      viewBox="0 0 20 20"
      fill=${filled ? "currentColor" : "none"}
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      ${shapes[name] ? shapes[name]() : null}
    </svg>
  `;
}
