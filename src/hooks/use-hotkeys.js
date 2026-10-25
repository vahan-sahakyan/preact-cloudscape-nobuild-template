import { useEffect } from "preact/hooks";
import { navigate } from "../router/router.js";
import { paletteOpen } from "../state/ui-signals.js";
import { navCollapsed } from "../state/settings-signals.js";

export const modKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "Cmd" : "Ctrl";

export const shortcuts = [
  { keys: [modKey, "K"], label: "Open command palette" },
  { keys: ["/"], label: "Search accounts" },
  { keys: ["G", "O"], label: "Go to overview" },
  { keys: ["G", "C"], label: "Go to customers" },
  { keys: ["G", "A"], label: "Go to analytics" },
  { keys: ["G", "S"], label: "Go to settings" },
  { keys: ["["], label: "Show or hide navigation" }
];

const goTargets = { o: "/", c: "/customers", a: "/analytics", s: "/settings" };

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function useHotkeys() {
  useEffect(() => {
    let goPending = false;
    let goTimer = 0;

    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        paletteOpen.value = !paletteOpen.value;
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || paletteOpen.value || isTyping(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      // two-key "g then x" navigation, the second key has a short window
      if (goPending && goTargets[key]) {
        event.preventDefault();
        goPending = false;
        navigate(goTargets[key]);
        return;
      }

      goPending = key === "g";
      clearTimeout(goTimer);

      if (goPending) {
        goTimer = setTimeout(() => (goPending = false), 1200);
      } else if (key === "/") {
        event.preventDefault();
        const search = document.getElementById("customer-search");

        if (search) {
          search.focus();
        } else {
          paletteOpen.value = true;
        }
      } else if (key === "[") {
        navCollapsed.value = !navCollapsed.value;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(goTimer);
    };
  }, []);
}
