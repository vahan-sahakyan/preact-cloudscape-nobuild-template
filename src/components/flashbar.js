import { html } from "htm/preact";
import { Icon } from "./icons.js";
import { flashes, dismissToast } from "../state/ui-signals.js";

const toneIcon = { success: "statusPositive", info: "statusInfo", error: "statusNegative", warning: "statusWarning" };

// Cloudscape Flashbar, pinned to the top of the content area
export function Flashbar() {
  return html`
    <div class="flashbar" role="status" aria-live="polite">
      ${flashes.value.map(
        (flash) => html`
          <div key=${flash.id} class=${`flash tone-${flash.tone}`}>
            <${Icon} name=${toneIcon[flash.tone] || "statusInfo"} class="flash-icon" />
            <span class="flash-message">${flash.message}</span>
            <button type="button" class="flash-dismiss" aria-label="Dismiss notification" onClick=${() => dismissToast(flash.id)}>
              <${Icon} name="x" />
            </button>
          </div>
        `
      )}
    </div>
  `;
}
