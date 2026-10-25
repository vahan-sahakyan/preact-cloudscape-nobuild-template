import { html } from "htm/preact";
import { useEffect, useState } from "preact/hooks";
import { PageHeader, Panel } from "../components/layout.js";
import { Icon } from "../components/icons.js";
import { Keys } from "../components/ui.js";
import { SegmentedControl } from "../components/segmented-control.js";
import { ToggleSwitch } from "../components/toggle-switch.js";
import { theme, compactDensity, reduceMotion, navCollapsed, liveUpdates } from "../state/settings-signals.js";
import { starredIds, notesById } from "../state/customers-signals.js";
import { clearStored } from "../lib/storage.js";
import { shortcuts } from "../hooks/use-hotkeys.js";
import { usePage } from "../hooks/use-page.js";

const themeOptions = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
  { id: "system", label: "System", icon: "monitor" }
];

const densityOptions = [
  { id: "comfortable", label: "Comfortable" },
  { id: "compact", label: "Compact" }
];

function ResetData() {
  const [confirming, setConfirming] = useState(false);
  const noteCount = Object.values(notesById.value).reduce((sum, notes) => sum + notes.length, 0);

  // confirmation step expires so a stray second click later can't wipe data
  useEffect(() => {
    if (!confirming) {
      return;
    }

    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return html`
    <${Panel} title="Local data" description="Preferences, starred accounts and notes live in this browser only">
      <ul class="data-summary">
        <li><span>Starred accounts</span><strong>${starredIds.value.length}</strong></li>
        <li><span>Account notes</span><strong>${noteCount}</strong></li>
      </ul>
      <div class="setting-actions">
        <button
          type="button"
          class=${`btn ${confirming ? "btn-danger" : ""}`}
          onClick=${() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }

            clearStored();
            window.location.hash = "/";
            window.location.reload();
          }}
        >
          <${Icon} name="trash" />${confirming ? "Click again to reset everything" : "Reset local data"}
        </button>
      </div>
    <//>
  `;
}

export function SettingsPage() {
  usePage({ title: "Settings", topic: "settings", crumbs: [{ label: "Settings" }] });

  return html`
    <${PageHeader}
      title="Settings"
      info="settings"
      description="Theme, density and motion use Cloudscape's applyMode, applyDensity and disableMotion helpers"
    />

    <div class="settings-layout">
      <${Panel} title="Appearance">
        <div class="setting-row">
          <span class="setting-copy">
            <span class="setting-label">Theme</span>
            <span class="setting-description">System follows your OS setting</span>
          </span>
          <${SegmentedControl}
            label="Theme"
            options=${themeOptions}
            value=${theme.value}
            onChange=${(value) => {
              theme.value = value;
            }}
          />
        </div>
        <div class="setting-row">
          <span class="setting-copy">
            <span class="setting-label">Density</span>
            <span class="setting-description">Tighter spacing for more data on screen</span>
          </span>
          <${SegmentedControl}
            label="Density"
            options=${densityOptions}
            value=${compactDensity.value ? "compact" : "comfortable"}
            onChange=${(value) => {
              compactDensity.value = value === "compact";
            }}
          />
        </div>
        <${ToggleSwitch}
          label="Reduce motion"
          description="Turns off chart and interface animations"
          checked=${reduceMotion.value}
          onChange=${(value) => {
            reduceMotion.value = value;
          }}
        />
      <//>

      <${Panel} title="Workspace">
        <${ToggleSwitch}
          label="Live activity"
          description="Stream new account events into the overview feed"
          checked=${liveUpdates.value}
          onChange=${(value) => {
            liveUpdates.value = value;
          }}
        />
        <${ToggleSwitch}
          label="Hide navigation"
          description="Hide the navigation panel on wide screens, the menu button reopens it"
          checked=${navCollapsed.value}
          onChange=${(value) => {
            navCollapsed.value = value;
          }}
        />
      <//>

      <${Panel} title="Keyboard shortcuts">
        <ul class="shortcut-list">
          ${shortcuts.map(
            (shortcut) => html`
              <li key=${shortcut.label}>
                <span>${shortcut.label}</span>
                <${Keys} keys=${shortcut.keys} />
              </li>
            `
          )}
        </ul>
      <//>

      <${ResetData} />
    </div>
  `;
}
