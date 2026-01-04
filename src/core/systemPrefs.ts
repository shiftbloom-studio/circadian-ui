import { SystemPreferences } from "./types";

const getPreference = (query: string): MediaQueryList | null => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return null;
  }
  return window.matchMedia(query);
};

export const getSystemPreferences = (): SystemPreferences => {
  const colorScheme = getPreference("(prefers-color-scheme: dark)");
  const lightScheme = getPreference("(prefers-color-scheme: light)");
  const contrastMore = getPreference("(prefers-contrast: more)");
  const contrastLess = getPreference("(prefers-contrast: less)");
  const reduceMotion = getPreference("(prefers-reduced-motion: reduce)");

  return {
    prefersColorScheme: colorScheme?.matches
      ? "dark"
      : lightScheme?.matches
        ? "light"
        : "no-preference",
    prefersContrast: contrastMore?.matches
      ? "more"
      : contrastLess?.matches
        ? "less"
        : "no-preference",
    reducedMotion: Boolean(reduceMotion?.matches)
  };
};

export const subscribeSystemPreferences = (
  handler: (prefs: SystemPreferences) => void
): (() => void) => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => undefined;
  }

  const notify = () => handler(getSystemPreferences());
  const mediaQueries = [
    "(prefers-color-scheme: dark)",
    "(prefers-color-scheme: light)",
    "(prefers-contrast: more)",
    "(prefers-contrast: less)",
    "(prefers-reduced-motion: reduce)"
  ];

  const listeners = mediaQueries.map((query) => {
    const list = window.matchMedia(query);
    const listener = () => notify();
    if (list.addEventListener) {
      list.addEventListener("change", listener);
    } else {
      list.addListener(listener);
    }
    return { list, listener };
  });

  return () => {
    for (const { list, listener } of listeners) {
      if (list.removeEventListener) {
        list.removeEventListener("change", listener);
      } else {
        list.removeListener(listener);
      }
    }
  };
};
