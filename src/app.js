import { html } from "htm/preact";
import { useEffect } from "preact/hooks";
import { currentPath, matchRoute } from "./router/router.js";
import { AppShell } from "./components/app-shell.js";
import { OverviewPage } from "./pages/overview-page.js";
import { CustomersPage } from "./pages/customers-page.js";
import { CustomerDetailPage } from "./pages/customer-detail-page.js";
import { AnalyticsPage } from "./pages/analytics-page.js";
import { SettingsPage } from "./pages/settings-page.js";
import { NotFoundPage } from "./pages/not-found-page.js";
import { mobileNavOpen } from "./state/ui-signals.js";
import { useHotkeys } from "./hooks/use-hotkeys.js";

const routes = [
  { pattern: "/", Page: OverviewPage },
  { pattern: "/customers", Page: CustomersPage },
  { pattern: "/customers/:id", Page: CustomerDetailPage },
  { pattern: "/analytics", Page: AnalyticsPage },
  { pattern: "/settings", Page: SettingsPage }
];

function resolveRoute(path) {
  for (const route of routes) {
    const params = matchRoute(route.pattern, path);

    if (params) {
      return { Page: route.Page, params };
    }
  }

  return { Page: NotFoundPage, params: {} };
}

export function App() {
  const path = currentPath.value;
  const { Page, params } = resolveRoute(path);

  useHotkeys();

  useEffect(() => {
    mobileNavOpen.value = false;
    window.scrollTo(0, 0);
  }, [path]);

  return html`
    <${AppShell}>
      <${Page} key=${path} ...${params} />
    <//>
  `;
}
