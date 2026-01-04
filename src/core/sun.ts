import { CircadianSchedule } from "./types";
import { CircadianScheduleMinutes, getMinutesFromDate } from "./schedule";
import { Phase, SunScheduleOptions, SunTimes, SunTimesProvider } from "./types";

const minutesInDay = 24 * 60;

export const defaultSunSchedule: SunScheduleOptions = {
  dawnOffsetMinutesBefore: 45,
  dawnOffsetMinutesAfter: 45,
  duskOffsetMinutesBefore: 45,
  duskOffsetMinutesAfter: 45
};

const normalizeMinutes = (value: number): number =>
  ((value % minutesInDay) + minutesInDay) % minutesInDay;

export const deriveSunSchedule = (
  date: Date,
  sunTimes: SunTimes,
  options?: Partial<SunScheduleOptions>
): CircadianScheduleMinutes => {
  const config = { ...defaultSunSchedule, ...options };
  const sunriseMinutes = getMinutesFromDate(sunTimes.sunrise);
  const sunsetMinutes = getMinutesFromDate(sunTimes.sunset);

  const dawnStart = normalizeMinutes(sunriseMinutes - config.dawnOffsetMinutesBefore);
  const dawnEnd = normalizeMinutes(sunriseMinutes + config.dawnOffsetMinutesAfter);
  const duskStart = normalizeMinutes(sunsetMinutes - config.duskOffsetMinutesBefore);
  const duskEnd = normalizeMinutes(sunsetMinutes + config.duskOffsetMinutesAfter);

  return {
    dawn: { start: dawnStart, end: dawnEnd },
    day: { start: dawnEnd, end: duskStart },
    dusk: { start: duskStart, end: duskEnd },
    night: { start: duskEnd, end: dawnStart }
  };
};

export const getPhaseFromSunTimes = (
  date: Date,
  sunTimes: SunTimes,
  options?: Partial<SunScheduleOptions>
): Phase => {
  const schedule = deriveSunSchedule(date, sunTimes, options);
  const minutes = getMinutesFromDate(date);
  const phases: Phase[] = ["dawn", "day", "dusk", "night"];
  for (const phase of phases) {
    const window = schedule[phase];
    const start = window.start;
    const end = window.end;
    if (start === end) {
      return phase;
    }
    if (start < end && minutes >= start && minutes < end) {
      return phase;
    }
    if (start > end && (minutes >= start || minutes < end)) {
      return phase;
    }
  }
  return "night";
};

export const getScheduleFromProvider = (
  date: Date,
  provider?: SunTimesProvider,
  options?: Partial<SunScheduleOptions>
): CircadianSchedule | null => {
  if (!provider) {
    return null;
  }
  const sunTimes = provider(date);
  if (!sunTimes) {
    return null;
  }
  const schedule = deriveSunSchedule(date, sunTimes, options);
  const toTimeString = (minutes: number): string => {
    const normalized = normalizeMinutes(minutes);
    const hours = Math.floor(normalized / 60)
      .toString()
      .padStart(2, "0");
    const mins = (normalized % 60).toString().padStart(2, "0");
    return `${hours}:${mins}`;
  };
  return {
    dawn: {
      start: toTimeString(schedule.dawn.start),
      end: toTimeString(schedule.dawn.end)
    },
    day: {
      start: toTimeString(schedule.day.start),
      end: toTimeString(schedule.day.end)
    },
    dusk: {
      start: toTimeString(schedule.dusk.start),
      end: toTimeString(schedule.dusk.end)
    },
    night: {
      start: toTimeString(schedule.night.start),
      end: toTimeString(schedule.night.end)
    }
  };
};
