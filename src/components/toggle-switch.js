import { html } from "htm/preact";
import { useId } from "preact/hooks";

function Switch({ id, checked, describedBy, onChange }) {
  return html`
    <button
      id=${id}
      type="button"
      role="switch"
      class=${`toggle-switch ${checked ? "is-on" : ""}`}
      aria-checked=${checked}
      aria-describedby=${describedBy}
      onClick=${() => onChange(!checked)}
    >
      <span class="toggle-knob"></span>
    </button>
  `;
}

// settings row: label and description on the left, switch on the right
export function ToggleSwitch({ label, description, checked, onChange }) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return html`
    <div class="setting-row">
      <span class="setting-copy">
        <label class="setting-label" for=${id}>${label}</label>
        ${description ? html`<span class="setting-description" id=${descriptionId}>${description}</span>` : null}
      </span>
      <${Switch} id=${id} checked=${checked} describedBy=${descriptionId} onChange=${onChange} />
    </div>
  `;
}

// Cloudscape Toggle: switch followed by its label, for headers and toolbars
export function Toggle({ label, checked, onChange }) {
  const id = useId();

  return html`
    <span class="toggle-inline">
      <${Switch} id=${id} checked=${checked} onChange=${onChange} />
      <label for=${id}>${label}</label>
    </span>
  `;
}
