import { signal, effect } from "@preact/signals";

const PREFIX = "pulse:";

export function readStored(key, fallback, area = localStorage) {
  try {
    const raw = area.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStored(key, value, area = localStorage) {
  try {
    area.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage can be blocked (private mode, quota), state just won't persist
  }
}

export function clearStored() {
  for (const area of [localStorage, sessionStorage]) {
    try {
      Object.keys(area)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => area.removeItem(key));
    } catch {
      // nothing to clear
    }
  }
}

// signal mirrored to localStorage under a namespaced key, kept in sync across tabs
export function persistedSignal(key, fallback) {
  const state = signal(readStored(key, fallback));
  let lastRaw = JSON.stringify(state.value);

  effect(() => {
    const raw = JSON.stringify(state.value);

    // skips values that came from another tab, so they aren't written straight back
    if (raw === lastRaw) {
      return;
    }

    lastRaw = raw;
    writeStored(key, state.value);
  });

  // fires only in the other tabs; a null key means storage was cleared
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage || (event.key !== null && event.key !== PREFIX + key)) {
      return;
    }

    const next = readStored(key, fallback);
    lastRaw = JSON.stringify(next);
    state.value = next;
  });

  return state;
}

// signal mirrored to sessionStorage: survives reloads, stays local to one tab
export function sessionSignal(key, fallback) {
  const state = signal(readStored(key, fallback, sessionStorage));

  effect(() => {
    writeStored(key, state.value, sessionStorage);
  });

  return state;
}
