import { html } from "htm/preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "./icons.js";
import { Keys } from "./ui.js";
import { navigate } from "../router/router.js";
import { paletteOpen } from "../state/ui-signals.js";
import { theme, themeCycle, cycleTheme, liveUpdates, navCollapsed } from "../state/settings-signals.js";
import { starredIds, exportCustomers } from "../state/customers-signals.js";
import { customers } from "../data/customers.js";
import { modKey } from "../hooks/use-hotkeys.js";

const pages = [
  { id: "page-overview", group: "Pages", label: "Overview", icon: "overview", keys: ["G", "O"], run: () => navigate("/") },
  { id: "page-customers", group: "Pages", label: "Customers", icon: "customers", keys: ["G", "C"], run: () => navigate("/customers") },
  { id: "page-analytics", group: "Pages", label: "Analytics", icon: "analytics", keys: ["G", "A"], run: () => navigate("/analytics") },
  { id: "page-settings", group: "Pages", label: "Settings", icon: "settings", keys: ["G", "S"], run: () => navigate("/settings") }
];

function getActions() {
  const live = liveUpdates.value;
  const collapsed = navCollapsed.value;

  return [
    { id: "action-theme", label: `Switch to ${themeCycle[theme.value] || "light"} theme`, icon: "monitor", run: cycleTheme },
    {
      id: "action-live",
      label: live ? "Pause live activity" : "Resume live activity",
      icon: live ? "pause" : "play",
      run: () => (liveUpdates.value = !live)
    },
    {
      id: "action-sidebar",
      label: collapsed ? "Show navigation" : "Hide navigation",
      icon: "sidebar",
      keys: ["["],
      run: () => (navCollapsed.value = !collapsed)
    },
    { id: "action-export", label: "Export all accounts as CSV", icon: "download", run: () => exportCustomers(customers) }
  ].map((action) => ({ ...action, group: "Actions" }));
}

function getAccounts(query) {
  if (!query) {
    const starred = new Set(starredIds.value);
    return customers.filter((customer) => starred.has(customer.id)).slice(0, 5).map((customer) => toAccountItem(customer, "Starred accounts"));
  }

  return customers
    .filter((customer) => `${customer.name} ${customer.id} ${customer.owner}`.toLowerCase().includes(query))
    .slice(0, 6)
    .map((customer) => toAccountItem(customer, "Accounts"));
}

function toAccountItem(customer, group) {
  return {
    id: `account-${customer.id}`,
    group,
    label: customer.name,
    sub: `${customer.id} - ${customer.plan} - ${customer.region}`,
    icon: "customers",
    run: () => navigate(`/customers/${customer.id}`)
  };
}

export function CommandPalette() {
  const dialogRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const open = paletteOpen.value;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (open && !dialog.open) {
      setQuery("");
      setActiveIndex(0);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const normalized = query.trim().toLowerCase();
  const matches = (item) => !normalized || item.label.toLowerCase().includes(normalized);
  const items = [...pages.filter(matches), ...getAccounts(normalized), ...getActions().filter(matches)];
  const active = Math.min(activeIndex, Math.max(items.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, normalized]);

  const run = (item) => {
    paletteOpen.value = false;
    item.run();
  };

  const onKeyDown = (event) => {
    if (items.length === 0) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((active + step + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(items[active]);
    }
  };

  let lastGroup = null;

  return html`
    <dialog
      ref=${dialogRef}
      class="palette"
      aria-label="Command palette"
      onClose=${() => (paletteOpen.value = false)}
      onClick=${(event) => {
        if (event.target === event.currentTarget) {
          paletteOpen.value = false;
        }
      }}
    >
      <div class="palette-inner">
        <div class="palette-search">
          <${Icon} name="search" />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant=${items[active] ? `palette-${items[active].id}` : undefined}
            placeholder="Search pages, accounts and actions"
            autocomplete="off"
            spellcheck="false"
            value=${query}
            onInput=${(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
            }}
            onKeyDown=${onKeyDown}
          />
          <kbd>Esc</kbd>
        </div>

        <ul id="palette-list" ref=${listRef} class="palette-list" role="listbox" aria-label="Results">
          ${items.length === 0
            ? html`<li class="palette-empty" role="presentation">No results for "${query}"</li>`
            : items.flatMap((item, index) => {
                const header = item.group !== lastGroup ? html`<li key=${`group-${item.group}`} class="palette-group" role="presentation">${item.group}</li>` : null;
                lastGroup = item.group;

                return [
                  header,
                  html`
                    <li
                      key=${item.id}
                      id=${`palette-${item.id}`}
                      role="option"
                      aria-selected=${index === active}
                      class="palette-item"
                      onMouseMove=${() => index !== active && setActiveIndex(index)}
                      onClick=${() => run(item)}
                    >
                      <span class="palette-icon"><${Icon} name=${item.icon} /></span>
                      <span class="palette-item-label">
                        ${item.label}
                        ${item.sub ? html`<span class="cell-sub">${item.sub}</span>` : null}
                      </span>
                      ${item.keys ? html`<${Keys} keys=${item.keys} />` : null}
                    </li>
                  `
                ];
              })}
        </ul>

        <footer class="palette-footer">
          <span><${Keys} keys=${["Up", "Down"]} /> navigate</span>
          <span><${Keys} keys=${["Enter"]} /> open</span>
          <span><${Keys} keys=${[modKey, "K"]} /> toggle</span>
        </footer>
      </div>
    </dialog>
  `;
}
