import { html } from "htm/preact";
import { Icon } from "./icons.js";
import { Breadcrumbs } from "./layout.js";
import { SideNav } from "./side-nav.js";
import { HelpPanel } from "./help-panel.js";
import { Flashbar } from "./flashbar.js";
import { ButtonDropdown } from "./button-dropdown.js";
import { CommandPalette } from "./command-palette.js";
import { theme, themeCycle, cycleTheme, darkMode, navCollapsed, liveUpdates } from "../state/settings-signals.js";
import { selectedRegion } from "../state/dashboard-signals.js";
import { now } from "../state/activity-signals.js";
import { mobileNavOpen, paletteOpen, breadcrumbs, helpTopic, pageTopic } from "../state/ui-signals.js";
import { regionNames } from "../state/accounts-signals.js";
import { navigate } from "../router/router.js";
import { modKey } from "../hooks/use-hotkeys.js";

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });

function isMobile() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function RegionSelector() {
  const region = selectedRegion.value;
  const items = [
    { id: "all", text: "All regions", checked: !region },
    { id: "divider", divider: true },
    ...regionNames.value.map((name) => ({ id: name, text: name, checked: region === name }))
  ];

  return html`
    <${ButtonDropdown}
      variant="top-nav"
      label=${region || "All regions"}
      ariaLabel=${`Region: ${region || "All regions"}`}
      items=${items}
      onItemClick=${(id) => {
        selectedRegion.value = id === "all" ? null : id;
      }}
    />
  `;
}

const themeStates = {
  light: { label: "Light", icon: "sun" },
  dark: { label: "Dark", icon: "moon" },
  system: { label: "System", icon: "monitor" }
};

// icon shows the current state, each click moves to the next one
function ThemeSwitch() {
  const current = themeStates[theme.value] ? theme.value : "system";
  const next = themeStates[themeCycle[current]].label;
  const resolved = current === "system" ? ` (${darkMode.value ? "dark" : "light"})` : "";
  const summary = `Theme: ${themeStates[current].label}${resolved}. Switch to ${next}`;

  return html`
    <button type="button" class="top-nav-icon" aria-label=${summary} title=${summary} onClick=${cycleTheme}>
      <${Icon} name=${themeStates[current].icon} />
    </button>
  `;
}

function TopNav() {
  return html`
    <header class="top-nav">
      <a class="top-nav-logo" href="#/" aria-label="Pulse Ops home">
        <span class="logo-mark" aria-hidden="true"><${Icon} name="pulse" /></span>
        <span class="logo-text">pulse<span>ops</span></span>
      </a>

      <span class="top-nav-divider" aria-hidden="true"></span>

      <button type="button" class="top-nav-icon" aria-label="All pages and actions" title="All pages and actions" onClick=${() => (paletteOpen.value = true)}>
        <${Icon} name="grid" />
      </button>

      <button type="button" class="top-nav-search" onClick=${() => (paletteOpen.value = true)}>
        <${Icon} name="search" />
        <span class="top-nav-search-label">Search</span>
        <span class="top-nav-search-hint">[${modKey}+K]</span>
      </button>

      <div class="top-nav-utilities">
        <${ThemeSwitch} />
        <span class="top-nav-divider" aria-hidden="true"></span>
        <button type="button" class="top-nav-icon" aria-label="Help" title="Help" onClick=${() => (helpTopic.value = helpTopic.value ? null : pageTopic.value)}>
          <${Icon} name="help" />
        </button>
        <span class="top-nav-divider" aria-hidden="true"></span>
        <a class="top-nav-icon" href="#/settings" aria-label="Settings" title="Settings"><${Icon} name="settings" /></a>
        <span class="top-nav-divider" aria-hidden="true"></span>
        <${RegionSelector} />
      </div>
    </header>
  `;
}

function Toolbar() {
  const navOpen = isMobile() ? mobileNavOpen.value : !navCollapsed.value;

  return html`
    <div class="app-toolbar">
      <button
        type="button"
        class="icon-button"
        aria-label=${navOpen ? "Close navigation" : "Open navigation"}
        aria-expanded=${navOpen}
        aria-controls="side-nav"
        onClick=${() => {
          if (isMobile()) {
            mobileNavOpen.value = !mobileNavOpen.value;
          } else {
            navCollapsed.value = !navCollapsed.value;
          }
        }}
      >
        <${Icon} name="menu" />
      </button>
      <${Breadcrumbs} items=${breadcrumbs.value} />
      <button
        type="button"
        class=${`icon-button toolbar-info ${helpTopic.value ? "is-active" : ""}`}
        aria-label="Open help panel"
        aria-pressed=${Boolean(helpTopic.value)}
        onClick=${() => (helpTopic.value = helpTopic.value ? null : pageTopic.value)}
      >
        <${Icon} name="statusInfo" />
      </button>
    </div>
  `;
}

function Footer() {
  const live = liveUpdates.value;

  return html`
    <footer class="app-footer">
      <button type="button" class="footer-item" onClick=${() => (paletteOpen.value = true)}>
        <${Icon} name="terminal" />Command search
      </button>
      <button type="button" class="footer-item" aria-pressed=${live} onClick=${() => (liveUpdates.value = !live)}>
        <span class=${`live-dot ${live ? "is-live" : ""}`} aria-hidden="true"></span>Live activity: ${live ? "on" : "paused"}
      </button>
      <button type="button" class="footer-item" onClick=${() => navigate("/settings")}>Keyboard shortcuts</button>
      <span class="footer-spacer"></span>
      <span class="footer-meta">Demo data, refreshed ${timeFormat.format(now.value)}</span>
      <a class="footer-item" href="#/settings">Preferences</a>
    </footer>
  `;
}

export function AppShell({ children }) {
  const shellClass = [
    "app-shell",
    navCollapsed.value ? "is-nav-collapsed" : "",
    mobileNavOpen.value ? "is-nav-open" : "",
    helpTopic.value ? "is-help-open" : ""
  ].join(" ");

  return html`
    <div class=${shellClass}>
      <button type="button" class="skip-link" onClick=${() => document.getElementById("main")?.focus()}>Skip to main content</button>
      <${TopNav} />
      <${Toolbar} />
      <div class="app-body">
        <${SideNav} />
        <div class="nav-scrim" hidden=${!mobileNavOpen.value} onClick=${() => (mobileNavOpen.value = false)}></div>
        <main id="main" class="app-main" tabindex="-1">
          <div class="app-content">
            <${Flashbar} />
            ${children}
          </div>
        </main>
        <${HelpPanel} />
      </div>
      <${Footer} />
      <${CommandPalette} />
    </div>
  `;
}
