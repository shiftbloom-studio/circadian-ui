import { CircadianConfig, CircadianSchedule, Phase, ScheduleMode } from "./types";
import { defaultSchedule } from "./schedule";
import { defaultStorageKey } from "./storage";
import { defaultTokens, tokensToCssVars } from "./tokens";

const serialize = (value: unknown): string => JSON.stringify(value);

const getMergedSchedule = (schedule?: Partial<CircadianSchedule>): CircadianSchedule => ({
  ...defaultSchedule,
  ...schedule,
  dawn: { ...defaultSchedule.dawn, ...schedule?.dawn },
  day: { ...defaultSchedule.day, ...schedule?.day },
  dusk: { ...defaultSchedule.dusk, ...schedule?.dusk },
  night: { ...defaultSchedule.night, ...schedule?.night }
});

const getMode = (mode?: ScheduleMode): ScheduleMode => mode ?? "time";

export const createInlineScript = (config?: CircadianConfig): string => {
  const schedule = getMergedSchedule(config?.schedule);
  const storageKey = config?.storageKey ?? defaultStorageKey;
  const persist = config?.persist !== false;
  const tokens = {
    dawn: tokensToCssVars({
      ...defaultTokens.dawn,
      ...config?.tokens?.dawn
    }),
    day: tokensToCssVars({
      ...defaultTokens.day,
      ...config?.tokens?.day
    }),
    dusk: tokensToCssVars({
      ...defaultTokens.dusk,
      ...config?.tokens?.dusk
    }),
    night: tokensToCssVars({
      ...defaultTokens.night,
      ...config?.tokens?.night
    })
  };

  return `(() => {
  try {
    const schedule = ${serialize(schedule)};
    const tokens = ${serialize(tokens)};
    const storageKey = ${serialize(storageKey)};
    const persist = ${serialize(persist)};
    const fallbackMode = ${serialize(getMode(config?.mode))};
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();

    const isWithin = (value, start, end) => {
      if (start === end) return true;
      if (start < end) return value >= start && value < end;
      return value >= start || value < end;
    };

    const parse = (time) => {
      const [h, m] = time.split(":").map(Number);
      return ((h % 24) * 60 + m) % 1440;
    };

    const normalized = {
      dawn: { start: parse(schedule.dawn.start), end: parse(schedule.dawn.end) },
      day: { start: parse(schedule.day.start), end: parse(schedule.day.end) },
      dusk: { start: parse(schedule.dusk.start), end: parse(schedule.dusk.end) },
      night: { start: parse(schedule.night.start), end: parse(schedule.night.end) }
    };

    const order = ["dawn", "day", "dusk", "night"];
    let phase = "night";
    for (const key of order) {
      const window = normalized[key];
      if (isWithin(minutes, window.start, window.end)) {
        phase = key;
        break;
      }
    }

    let mode = fallbackMode;
    const persisted = persist && window.localStorage ? window.localStorage.getItem(storageKey) : null;
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        if (parsed.mode) mode = parsed.mode;
        if (parsed.phase) phase = parsed.phase;
      } catch {
        // ignore
      }
    }

    const root = document.documentElement;
    root.setAttribute("data-cui-phase", phase);
    const vars = tokens[phase] || tokens.night;
    for (const key in vars) {
      root.style.setProperty(key, vars[key]);
    }
  } catch {
    // ignore
  }
})();`;
};

export const resolveInitialPhase = (date: Date, schedule?: Partial<CircadianSchedule>): Phase => {
  const merged = getMergedSchedule(schedule);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const isWithin = (value: number, start: number, end: number) => {
    if (start === end) return true;
    if (start < end) return value >= start && value < end;
    return value >= start || value < end;
  };
  const parse = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return ((h % 24) * 60 + m) % 1440;
  };
  const order: Phase[] = ["dawn", "day", "dusk", "night"];
  for (const phase of order) {
    const window = merged[phase];
    if (isWithin(minutes, parse(window.start), parse(window.end))) {
      return phase;
    }
  }
  return "night";
};
