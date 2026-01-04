import {
  clearPersistedState,
  defaultStorageKey,
  loadPersistedState,
  persistState
} from "../src/core/storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and restores overrides", () => {
    persistState({ mode: "manual", phase: "dusk" }, defaultStorageKey);
    const loaded = loadPersistedState(defaultStorageKey);
    expect(loaded).toEqual({ mode: "manual", phase: "dusk" });
  });

  it("clears overrides", () => {
    persistState({ mode: "manual", phase: "night" }, defaultStorageKey);
    clearPersistedState(defaultStorageKey);
    expect(loadPersistedState(defaultStorageKey)).toBeNull();
  });
});
