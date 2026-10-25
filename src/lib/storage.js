import { signal, effect } from "@preact/signals";

const PREFIX = "pulse:";

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage can be blocked (private mode, quota), state just won't persist
  }
}

export function clearStored() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // nothing to clear
  }
}

// signal mirrored to localStorage under a namespaced key
export function persistedSignal(key, fallback) {
  const state = signal(readStored(key, fallback));

  effect(() => {
    writeStored(key, state.value);
  });

  return state;
}
