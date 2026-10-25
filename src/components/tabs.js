import { html } from "htm/preact";

// Cloudscape Tabs header; the panel content is rendered by the caller
export function Tabs({ label, tabs, activeId, onChange }) {
  const onKeyDown = (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    const index = tabs.findIndex((tab) => tab.id === activeId);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onChange(next.id);
    event.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus();
  };

  return html`
    <div class="tabs" role="tablist" aria-label=${label} onKeyDown=${onKeyDown}>
      ${tabs.map(
        (tab) => html`
          <button
            key=${tab.id}
            type="button"
            role="tab"
            data-tab=${tab.id}
            class="tab"
            aria-selected=${tab.id === activeId}
            tabindex=${tab.id === activeId ? 0 : -1}
            onClick=${() => onChange(tab.id)}
          >
            ${tab.label}${tab.counter != null ? ` (${tab.counter})` : ""}
          </button>
        `
      )}
    </div>
  `;
}
