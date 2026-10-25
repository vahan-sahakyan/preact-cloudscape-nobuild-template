import { html } from "htm/preact";
import { Icon } from "./icons.js";
import { helpTopic } from "../state/ui-signals.js";

const statusIcons = {
  success: "statusPositive",
  error: "statusNegative",
  warning: "statusWarning",
  info: "statusInfo",
  pending: "statusPending"
};

// Cloudscape StatusIndicator: colored icon plus text, no background
export function StatusIndicator({ tone, label }) {
  return html`
    <span class=${`status-indicator tone-${tone}`}>
      <${Icon} name=${statusIcons[tone] || "statusInfo"} />${label}
    </span>
  `;
}

export function ProgressBar({ value, max = 100, tone = "info", label, showValue = true, unit = "%" }) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return html`
    <span class="progress" role="progressbar" aria-valuemin="0" aria-valuemax=${max} aria-valuenow=${Math.round(value)} aria-label=${label}>
      <span class="progress-track"><span class=${`progress-fill tone-${tone}`} style=${{ width: `${percent}%` }}></span></span>
      ${showValue ? html`<span class="progress-value">${Math.round(value)}${unit}</span>` : null}
    </span>
  `;
}

export function Badge({ tone = "grey", children }) {
  return html`<span class=${`badge badge-${tone}`}>${children}</span>`;
}

export function InfoLink({ topic, label = "Info" }) {
  return html`
    <button type="button" class="info-link" aria-label=${`${label}: open help panel`} onClick=${() => (helpTopic.value = topic)}>
      ${label}
    </button>
  `;
}

// Cloudscape KeyValuePairs item: bold label over a large value
export function KeyValue({ label, value, hint, tone, children }) {
  return html`
    <div class="key-value">
      <p class="key-value-label">${label}</p>
      <p class=${`key-value-value ${tone ? `tone-text-${tone}` : ""}`}>${value}</p>
      ${hint ? html`<p class="key-value-hint">${hint}</p>` : null}
      ${children}
    </div>
  `;
}

export function EmptyState({ icon = "inbox", title, children }) {
  return html`
    <div class="empty-state">
      <${Icon} name=${icon} />
      <h3>${title}</h3>
      ${children}
    </div>
  `;
}

export function Keys({ keys }) {
  return html`<span class="keys">${keys.map((key) => html`<kbd key=${key}>${key}</kbd>`)}</span>`;
}
