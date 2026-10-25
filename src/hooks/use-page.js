import { useEffect } from "preact/hooks";
import { breadcrumbs, pageTopic } from "../state/ui-signals.js";

// sets document title, toolbar breadcrumbs and the help topic for the current page
export function usePage({ title, crumbs = [], topic }) {
  const trail = [{ label: "Pulse Ops", href: "#/" }, ...crumbs];
  const key = trail.map((crumb) => crumb.label).join("/");

  useEffect(() => {
    document.title = title ? `${title} | Pulse Ops` : "Pulse Ops";
    breadcrumbs.value = trail;
    pageTopic.value = topic;
  }, [title, key, topic]);
}
