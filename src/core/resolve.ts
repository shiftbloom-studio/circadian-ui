import { AccessibilityOptions, CircadianConfig, ScheduleMode, SystemPreferences } from "./types";

export const defaultAccessibility: AccessibilityOptions = {
  enforceContrast: true,
  minimumRatio: 4.5,
  largeTextRatio: 3,
  preferPreserveHue: true,
  maxIterations: 24
};

export const defaultSystemOptions = {
  respectColorScheme: true,
  respectContrastPreference: true,
  respectReducedMotion: true
};

export const defaultColorSchemeBias = {
  dark: -8,
  light: 8
};

export const defaultTransition = {
  enabled: false,
  durationMs: 200
};

export const resolveMode = (
  userMode: ScheduleMode | undefined,
  system: SystemPreferences,
  config?: CircadianConfig
): ScheduleMode => {
  return userMode ?? config?.mode ?? "auto";
};

export const resolveAccessibility = (
  system: SystemPreferences,
  config?: CircadianConfig
): AccessibilityOptions => {
  const base = { ...defaultAccessibility, ...config?.accessibility };
  if (config?.system?.respectContrastPreference !== false) {
    if (system.prefersContrast === "more") {
      base.minimumRatio = Math.max(base.minimumRatio, 7);
    }
    if (system.prefersContrast === "less") {
      base.minimumRatio = Math.min(base.minimumRatio, 3);
    }
  }
  return base;
};
