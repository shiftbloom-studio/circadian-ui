import { PersistedState } from "./types";

export const defaultStorageKey = "cui:preferences";

const hasStorage = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const loadPersistedState = (key: string = defaultStorageKey): PersistedState | null => {
  if (!hasStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
};

export const persistState = (state: PersistedState, key: string = defaultStorageKey): void => {
  if (!hasStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore write errors
  }
};

export const clearPersistedState = (key: string = defaultStorageKey): void => {
  if (!hasStorage()) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore cleanup errors
  }
};
