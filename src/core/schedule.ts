import { CircadianSchedule, Phase } from "./types";

export const defaultSchedule: CircadianSchedule = {
  dawn: { start: "05:30", end: "08:30" },
  day: { start: "08:30", end: "17:30" },
  dusk: { start: "17:30", end: "21:30" },
  night: { start: "21:30", end: "05:30" }
};

export interface PhaseWindowMinutes {
  start: number;
  end: number;
}

export type CircadianScheduleMinutes = Record<Phase, PhaseWindowMinutes>;

const minutesInDay = 24 * 60;

export const parseTimeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time format: ${value}`);
  }
  return ((hours % 24) * 60 + minutes) % minutesInDay;
};

export const normalizeSchedule = (
  schedule?: Partial<CircadianSchedule>
): CircadianScheduleMinutes => {
  const merged: CircadianSchedule = {
    ...defaultSchedule,
    ...schedule,
    dawn: { ...defaultSchedule.dawn, ...schedule?.dawn },
    day: { ...defaultSchedule.day, ...schedule?.day },
    dusk: { ...defaultSchedule.dusk, ...schedule?.dusk },
    night: { ...defaultSchedule.night, ...schedule?.night }
  };

  return {
    dawn: {
      start: parseTimeToMinutes(merged.dawn.start),
      end: parseTimeToMinutes(merged.dawn.end)
    },
    day: {
      start: parseTimeToMinutes(merged.day.start),
      end: parseTimeToMinutes(merged.day.end)
    },
    dusk: {
      start: parseTimeToMinutes(merged.dusk.start),
      end: parseTimeToMinutes(merged.dusk.end)
    },
    night: {
      start: parseTimeToMinutes(merged.night.start),
      end: parseTimeToMinutes(merged.night.end)
    }
  };
};

export const getMinutesFromDate = (date: Date): number => date.getHours() * 60 + date.getMinutes();

const isWithinRange = (minutes: number, start: number, end: number): boolean => {
  if (start === end) {
    return true;
  }
  if (start < end) {
    return minutes >= start && minutes < end;
  }
  return minutes >= start || minutes < end;
};

export const getPhaseFromTime = (date: Date, schedule?: Partial<CircadianSchedule>): Phase => {
  const minutes = getMinutesFromDate(date);
  const normalized = normalizeSchedule(schedule);
  const phases: Phase[] = ["dawn", "day", "dusk", "night"];
  for (const phase of phases) {
    const window = normalized[phase];
    if (isWithinRange(minutes, window.start, window.end)) {
      return phase;
    }
  }
  return "night";
};

export const computeNextTransition = (date: Date, schedule?: Partial<CircadianSchedule>): Date => {
  const normalized = normalizeSchedule(schedule);
  const currentPhase = getPhaseFromTime(date, schedule);
  const minutes = getMinutesFromDate(date);
  const endMinutes = normalized[currentPhase].end;
  let delta = endMinutes - minutes;
  if (delta <= 0) {
    delta += minutesInDay;
  }
  return new Date(date.getTime() + delta * 60 * 1000);
};
