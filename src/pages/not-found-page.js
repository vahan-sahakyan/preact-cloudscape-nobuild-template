import { html } from "htm/preact";
import { PageHeader } from "../components/layout.js";
import { Icon } from "../components/icons.js";
import { EmptyState } from "../components/ui.js";
import { currentPath } from "../router/router.js";
import { usePage } from "../hooks/use-page.js";

export function NotFoundPage() {
  usePage({ title: "Page not found", topic: "overview", crumbs: [{ label: "Page not found" }] });

  return html`
    <${PageHeader} title="Page not found" />
    <section class="panel">
      <${EmptyState} icon="search" title=${`Nothing lives at ${currentPath.value}`}>
        <p>The link may be outdated. Use the navigation or search to find your way.</p>
        <a class="btn btn-primary" href="#/"><${Icon} name="overview" />Go to overview</a>
      <//>
    </section>
  `;
}
