import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { Icon } from "./icons.js";
import { Badge } from "./ui.js";
import { currentPath } from "../router/router.js";
import { navCollapsed } from "../state/settings-signals.js";
import { mobileNavOpen } from "../state/ui-signals.js";
import { starredIds } from "../state/customers-signals.js";
import { customers, isAtRisk } from "../data/customers.js";

const atRiskCount = customers.filter(isAtRisk).length;

const mainLinks = [
  { path: "/", label: "Overview" },
  { path: "/analytics", label: "Analytics" },
  { path: "/customers", label: "Customers", badge: atRiskCount, badgeLabel: `${atRiskCount} accounts at risk` }
];

function isActive(linkPath, path) {
  return linkPath === "/" ? path === "/" : path === linkPath || path.startsWith(`${linkPath}/`);
}

function NavLink({ href, label, active, children }) {
  return html`
    <li>
      <a href=${`#${href}`} class=${`nav-link ${active ? "is-active" : ""}`} aria-current=${active ? "page" : undefined}>
        <span class="nav-text">${label}</span>${children}
      </a>
    </li>
  `;
}

// Cloudscape SideNavigation: header link, plain links, dividers and expandable sections
export function SideNav() {
  const path = currentPath.value;
  const [starredOpen, setStarredOpen] = useState(true);
  const starred = customers.filter((customer) => starredIds.value.includes(customer.id));

  return html`
    <nav id="side-nav" class="side-nav" aria-label="Pulse Ops navigation">
      <div class="side-nav-header">
        <a href="#/" class="side-nav-title">Pulse Ops</a>
        <button
          type="button"
          class="icon-button"
          aria-label="Close navigation"
          onClick=${() => {
            navCollapsed.value = true;
            mobileNavOpen.value = false;
          }}
        >
          <${Icon} name="x" />
        </button>
      </div>

      <hr class="nav-divider" />

      <ul class="nav-list">
        ${mainLinks.map(
          (link) => html`
            <${NavLink} key=${link.path} href=${link.path} label=${link.label} active=${isActive(link.path, path)}>
              ${link.badge ? html`<span title=${link.badgeLabel}><${Badge} tone="red">${link.badge}<//></span>` : null}
            <//>
          `
        )}
      </ul>

      <hr class="nav-divider" />

      <div class="nav-section">
        <button type="button" class="nav-section-toggle" aria-expanded=${starredOpen} onClick=${() => setStarredOpen(!starredOpen)}>
          <${Icon} name=${starredOpen ? "caretDown" : "caretRight"} />Starred accounts
        </button>
        ${starredOpen
          ? html`
              <ul class="nav-list nav-list-nested">
                ${starred.length === 0
                  ? html`<li class="nav-empty">Star an account to pin it here.</li>`
                  : starred.map(
                      (customer) => html`
                        <${NavLink}
                          key=${customer.id}
                          href=${`/customers/${customer.id}`}
                          label=${customer.name}
                          active=${path === `/customers/${customer.id}`}
                        />
                      `
                    )}
              </ul>
            `
          : null}
      </div>

      <hr class="nav-divider" />

      <ul class="nav-list">
        <${NavLink} href="/settings" label="Settings" active=${path === "/settings"} />
      </ul>
    </nav>
  `;
}
