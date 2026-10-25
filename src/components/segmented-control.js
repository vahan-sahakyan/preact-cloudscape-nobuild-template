import { html } from "htm/preact";
import { Icon } from "./icons.js";

export function SegmentedControl({ label, options, value, onChange }) {
  return html`
    <div class="segmented" role="group" aria-label=${label}>
      ${options.map(
        (option) => html`
          <button
            key=${option.id}
            type="button"
            class="segmented-option"
            aria-pressed=${option.id === value}
            onClick=${() => onChange(option.id)}
          >
            ${option.icon ? html`<${Icon} name=${option.icon} />` : null}${option.label}
          </button>
        `
      )}
    </div>
  `;
}
