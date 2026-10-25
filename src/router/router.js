import { signal } from "@preact/signals";

function normalize(hash) {
  const path = hash.replace(/^#/, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export const currentPath = signal(normalize(window.location.hash));

window.addEventListener("hashchange", () => {
  currentPath.value = normalize(window.location.hash);
});

export function navigate(path) {
  window.location.hash = path;
}

// matches a "/customers/:id" style pattern against a real path, returning params or null
export function matchRoute(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];

    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (part !== pathParts[i]) {
      return null;
    }
  }

  return params;
}