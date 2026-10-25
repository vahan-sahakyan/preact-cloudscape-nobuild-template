import { html } from "htm/preact";
import { useEffect, useId, useRef, useState } from "preact/hooks";
import { Icon } from "./icons.js";

// Cloudscape ButtonDropdown: menu button with keyboard support, closes on outside click or Escape
export function ButtonDropdown({ label, items, onItemClick, variant = "normal", align = "end", ariaLabel, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    rootRef.current?.querySelector('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);

    if (refocus) {
      rootRef.current?.querySelector(".dropdown-trigger")?.focus();
    }
  };

  const onMenuKeyDown = (event) => {
    const options = [...rootRef.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
    const index = options.indexOf(document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      options[(index + step + options.length) % options.length]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return html`
    <div class="dropdown" ref=${rootRef}>
      <button
        type="button"
        class=${`dropdown-trigger ${variant === "top-nav" ? "top-nav-dropdown" : "btn"}`}
        aria-haspopup="menu"
        aria-expanded=${open}
        aria-controls=${menuId}
        aria-label=${ariaLabel}
        disabled=${disabled}
        onClick=${() => setOpen(!open)}
      >
        ${label}<${Icon} name="caretDown" class="dropdown-caret" />
      </button>
      ${open
        ? html`
            <ul id=${menuId} class=${`dropdown-menu align-${align}`} role="menu" onKeyDown=${onMenuKeyDown}>
              ${items.map((item) =>
                item.divider
                  ? html`<li key=${item.id} class="dropdown-divider" role="separator"></li>`
                  : html`
                      <li key=${item.id} role="none">
                        <button
                          type="button"
                          role=${item.checked != null ? "menuitemradio" : "menuitem"}
                          aria-checked=${item.checked != null ? item.checked : undefined}
                          aria-disabled=${item.disabled ? "true" : undefined}
                          class="dropdown-item"
                          onClick=${() => {
                            if (item.disabled) {
                              return;
                            }

                            close();
                            onItemClick(item.id);
                          }}
                        >
                          <span>${item.text}</span>
                          ${item.description ? html`<span class="dropdown-item-description">${item.description}</span>` : null}
                          ${item.checked ? html`<${Icon} name="check" class="dropdown-check" />` : null}
                        </button>
                      </li>
                    `
              )}
            </ul>
          `
        : null}
    </div>
  `;
}
