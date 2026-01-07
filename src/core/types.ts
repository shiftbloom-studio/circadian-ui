export type Phase = "dawn" | "day" | "dusk" | "night";
export type ScheduleMode = "time" | "sun" | "manual" | "auto";

export interface PhaseWindow {
  start: string; // HH:MM
  end: string; // HH:MM
}

export type CircadianSchedule = Record<Phase, PhaseWindow>;

export interface CircadianTokens {
  bg: string;
  fg: string;
  muted: string;
  mutedFg: string;
  card: string;
  cardFg: string;
  border: string;
  ring: string;
  accent: string;
  accentFg: string;
  destructive: string;
  destructiveFg: string;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

export type SunTimesProvider = (date: Date) => SunTimes | null;

export interface SunScheduleOptions {
  dawnOffsetMinutesBefore: number;
  dawnOffsetMinutesAfter: number;
  duskOffsetMinutesBefore: number;
  duskOffsetMinutesAfter: number;
}

export interface AccessibilityOptions {
  enforceContrast: boolean;
  minimumRatio: number;
  largeTextRatio: number;
  preferPreserveHue: boolean;
  maxIterations: number;
}

export interface SystemPreferenceOptions {
  respectColorScheme: boolean;
  respectContrastPreference: boolean;
  respectReducedMotion: boolean;
}

export interface ColorSchemeBias {
  dark: number;
  light: number;
}

export interface TransitionOptions {
  enabled: boolean;
  durationMs: number;
}

export interface CircadianConfig {
  schedule?: Partial<CircadianSchedule>;
  tokens?: Partial<Record<Phase, Partial<CircadianTokens>>>;
  mode?: ScheduleMode;
  sunTimesProvider?: SunTimesProvider;
  sunSchedule?: Partial<SunScheduleOptions>;
  initialPhase?: Phase;
  persist?: boolean;
  storageKey?: string;
  accessibility?: Partial<AccessibilityOptions>;
  system?: Partial<SystemPreferenceOptions>;
  colorSchemeBias?: Partial<ColorSchemeBias>;
  transition?: Partial<TransitionOptions>;
  setAttributeOn?: "html" | "body";
}

export interface PersistedState {
  mode?: ScheduleMode;
  phase?: Phase | null;
}

export interface SystemPreferences {
  prefersColorScheme: "dark" | "light" | "no-preference";
  prefersContrast: "more" | "less" | "no-preference";
  reducedMotion: boolean;
}

export interface CircadianState {
  phase: Phase;
  mode: ScheduleMode;
  tokens: CircadianTokens;
  nextChangeAt: Date | null;
}
