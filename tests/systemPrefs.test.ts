import { getSystemPreferences, subscribeSystemPreferences } from "../src/core/systemPrefs";

describe("system preferences", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("detects prefers color scheme and contrast", () => {
    window.matchMedia = ((query: string) => {
      return {
        matches: query === "(prefers-color-scheme: dark)" || query === "(prefers-contrast: more)",
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    const prefs = getSystemPreferences();
    expect(prefs.prefersColorScheme).toBe("dark");
    expect(prefs.prefersContrast).toBe("more");
  });

  it("detects reduced motion", () => {
    window.matchMedia = ((query: string) => {
      return {
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    const prefs = getSystemPreferences();
    expect(prefs.reducedMotion).toBe(true);
  });

  it("falls back to no-preference", () => {
    window.matchMedia = ((query: string) => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    const prefs = getSystemPreferences();
    expect(prefs.prefersColorScheme).toBe("no-preference");
    expect(prefs.prefersContrast).toBe("no-preference");
    expect(prefs.reducedMotion).toBe(false);
  });

  it("is safe when matchMedia is unavailable", () => {
    // Some SSR/test environments may not provide matchMedia.
    window.matchMedia = undefined as unknown as typeof window.matchMedia;

    const prefs = getSystemPreferences();
    expect(prefs.prefersColorScheme).toBe("no-preference");
    expect(prefs.prefersContrast).toBe("no-preference");
    expect(prefs.reducedMotion).toBe(false);

    const unsubscribe = subscribeSystemPreferences(() => undefined);
    expect(typeof unsubscribe).toBe("function");
    // Should be a no-op and not throw.
    expect(() => unsubscribe()).not.toThrow();
  });

  it("subscribes via addEventListener and unsubscribes cleanly", () => {
    const listenersByQuery = new Map<string, Set<() => void>>();

    window.matchMedia = ((query: string) => {
      const listeners = new Set<() => void>();
      listenersByQuery.set(query, listeners);

      return {
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: () => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: () => void) => {
          listeners.delete(listener);
        },
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    const handler = jest.fn();
    const unsubscribe = subscribeSystemPreferences(handler);

    // No immediate notification; only on change.
    expect(handler).not.toHaveBeenCalled();

    const darkQuery = "(prefers-color-scheme: dark)";
    const listeners = listenersByQuery.get(darkQuery);
    expect(listeners?.size).toBe(1);

    // Simulate a change event.
    for (const listener of listeners ?? []) {
      listener();
    }

    expect(handler).toHaveBeenCalledTimes(1);
    const prefs = handler.mock.calls[0]?.[0];
    expect(prefs.prefersColorScheme).toBe("dark");

    unsubscribe();
    expect(listenersByQuery.get(darkQuery)?.size).toBe(0);

    // Further changes should not notify after unsubscribe.
    for (const listener of listeners ?? []) {
      listener();
    }
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("subscribes via addListener/removeListener when addEventListener is missing", () => {
    const listenersByQuery = new Map<string, Set<() => void>>();

    window.matchMedia = ((query: string) => {
      const listeners = new Set<() => void>();
      listenersByQuery.set(query, listeners);

      return {
        matches: query === "(prefers-contrast: more)",
        media: query,
        onchange: null,
        addListener: (listener: () => void) => {
          listeners.add(listener);
        },
        removeListener: (listener: () => void) => {
          listeners.delete(listener);
        },
        dispatchEvent: () => false
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;

    const handler = jest.fn();
    const unsubscribe = subscribeSystemPreferences(handler);

    const contrastQuery = "(prefers-contrast: more)";
    const listeners = listenersByQuery.get(contrastQuery);
    expect(listeners?.size).toBe(1);

    for (const listener of listeners ?? []) {
      listener();
    }
    expect(handler).toHaveBeenCalledTimes(1);
    const prefs = handler.mock.calls[0]?.[0];
    expect(prefs.prefersContrast).toBe("more");

    unsubscribe();
    expect(listenersByQuery.get(contrastQuery)?.size).toBe(0);
  });
});
