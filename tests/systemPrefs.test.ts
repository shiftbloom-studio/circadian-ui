import { getSystemPreferences } from "../src/core/systemPrefs";

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
  });
});
