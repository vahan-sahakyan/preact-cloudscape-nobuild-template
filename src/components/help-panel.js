import { html } from "htm/preact";
import { Icon } from "./icons.js";
import { Keys } from "./ui.js";
import { seed } from "../data/api.js";
import { helpTopic } from "../state/ui-signals.js";
import { modKey } from "../hooks/use-hotkeys.js";

// Cloudscape HelpPanel in the tools drawer
export function HelpPanel() {
  const topic = seed.help[helpTopic.value];

  if (!topic) {
    return null;
  }

  return html`
    <aside class="help-panel" aria-label="Help panel">
      <header class="help-panel-header">
        <h2>${topic.title}</h2>
        <button type="button" class="icon-button" aria-label="Close help panel" onClick=${() => (helpTopic.value = null)}>
          <${Icon} name="x" />
        </button>
      </header>
      <div class="help-panel-body">
        ${topic.body.map((paragraph) => html`<p key=${paragraph}>${paragraph}</p>`)}
        ${topic.items ? html`<ul>${topic.items.map((item) => html`<li key=${item}>${item}</li>`)}</ul>` : null}
      </div>
      <footer class="help-panel-footer">
        <h3>Learn more</h3>
        <p>Press <${Keys} keys=${[modKey, "K"]} /> to search pages, accounts and actions.</p>
        <a href="#/settings">Keyboard shortcuts</a>
      </footer>
    </aside>
  `;
}
