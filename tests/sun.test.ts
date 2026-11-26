import {
  computeNextSunTransition,
  defaultSunSchedule,
  deriveSunSchedule,
  getPhaseFromSunTimes,
  getScheduleFromProvider
} from "../src/core/sun";
import { SunTimes, SunTimesProvider } from "../src/core/types";

// Dates are built from local wall-clock fields, and src/core/sun.ts only reads
// getHours()/getMinutes(), so these tests behave the same in every time zone.
const makeDate = (hours: number, minutes: number) => new Date(2024, 0, 1, hours, minutes, 0);

const toMinutes = (hours: number, minutes: number) => hours * 60 + minutes;

const sunTimes = (sunrise: [number, number], sunset: [number, number]): SunTimes => ({
  sunrise: makeDate(...sunrise),
  sunset: makeDate(...sunset)
});

// Sunrise 06:30, sunset 18:00.
const regularDay = sunTimes([6, 30], [18, 0]);

describe("sun schedule", () => {
  describe("deriveSunSchedule", () => {
    it("uses 45 minute offsets by default", () => {
      expect(defaultSunSchedule).toEqual({
        dawnOffsetMinutesBefore: 45,
        dawnOffsetMinutesAfter: 45,
        duskOffsetMinutesBefore: 45,
        duskOffsetMinutesAfter: 45
      });
    });

    it("derives the four windows from sunrise and sunset with the default offsets", () => {
      expect(deriveSunSchedule(makeDate(12, 0), regularDay)).toEqual({
        dawn: { start: toMinutes(5, 45), end: toMinutes(7, 15) },
        day: { start: toMinutes(7, 15), end: toMinutes(17, 15) },
        dusk: { start: toMinutes(17, 15), end: toMinutes(18, 45) },
        night: { start: toMinutes(18, 45), end: toMinutes(5, 45) }
      });
    });

    it("applies custom offsets", () => {
      const schedule = deriveSunSchedule(makeDate(12, 0), regularDay, {
        dawnOffsetMinutesBefore: 30,
        dawnOffsetMinutesAfter: 60,
        duskOffsetMinutesBefore: 20,
        duskOffsetMinutesAfter: 90
      });
      expect(schedule).toEqual({
        dawn: { start: toMinutes(6, 0), end: toMinutes(7, 30) },
        day: { start: toMinutes(7, 30), end: toMinutes(17, 40) },
        dusk: { start: toMinutes(17, 40), end: toMinutes(19, 30) },
        night: { start: toMinutes(19, 30), end: toMinutes(6, 0) }
      });
    });

    it("falls back to the default for offsets that are not overridden", () => {
      const schedule = deriveSunSchedule(makeDate(12, 0), regularDay, {
        duskOffsetMinutesAfter: 120
      });
      expect(schedule.dawn).toEqual({ start: toMinutes(5, 45), end: toMinutes(7, 15) });
      expect(schedule.dusk).toEqual({ start: toMinutes(17, 15), end: toMinutes(20, 0) });
      expect(schedule.night).toEqual({ start: toMinutes(20, 0), end: toMinutes(5, 45) });
    });

    it("wraps a dusk window that crosses midnight", () => {
      // Sunset 23:30 + 90 minutes ends at 01:00 the next day.
      const schedule = deriveSunSchedule(makeDate(12, 0), sunTimes([6, 30], [23, 30]), {
        duskOffsetMinutesAfter: 90
      });
      expect(schedule.dusk).toEqual({ start: toMinutes(22, 45), end: toMinutes(1, 0) });
      expect(schedule.night).toEqual({ start: toMinutes(1, 0), end: toMinutes(5, 45) });
    });

    it("wraps a dawn window that starts before midnight", () => {
      // Sunrise 00:20 - 45 minutes starts at 23:35 the previous day.
      const schedule = deriveSunSchedule(makeDate(12, 0), sunTimes([0, 20], [18, 0]));
      expect(schedule.dawn).toEqual({ start: toMinutes(23, 35), end: toMinutes(1, 5) });
      expect(schedule.night).toEqual({ start: toMinutes(18, 45), end: toMinutes(23, 35) });
    });

    it("keeps every boundary inside a single day", () => {
      const schedule = deriveSunSchedule(makeDate(12, 0), sunTimes([0, 10], [23, 50]), {
        dawnOffsetMinutesBefore: 24 * 60 + 30,
        duskOffsetMinutesAfter: 24 * 60 + 30
      });
      for (const window of Object.values(schedule)) {
        expect(window.start).toBeGreaterThanOrEqual(0);
        expect(window.start).toBeLessThan(24 * 60);
        expect(window.end).toBeGreaterThanOrEqual(0);
        expect(window.end).toBeLessThan(24 * 60);
      }
      expect(schedule.dawn.start).toBe(toMinutes(23, 40));
      expect(schedule.dusk.end).toBe(toMinutes(0, 20));
    });
  });

  describe("getPhaseFromSunTimes", () => {
    // Boundaries for regularDay with the default offsets.
    it.each([
      ["dawn start", [5, 45], "night", "dawn"],
      ["day start", [7, 15], "dawn", "day"],
      ["dusk start", [17, 15], "day", "dusk"],
      ["night start", [18, 45], "dusk", "night"]
    ] as const)("switches phase at the %s boundary", (_label, [hours, minutes], before, after) => {
      expect(getPhaseFromSunTimes(makeDate(hours, minutes - 1), regularDay)).toBe(before);
      expect(getPhaseFromSunTimes(makeDate(hours, minutes), regularDay)).toBe(after);
      expect(getPhaseFromSunTimes(makeDate(hours, minutes + 1), regularDay)).toBe(after);
    });

    it("stays in night across midnight", () => {
      expect(getPhaseFromSunTimes(makeDate(23, 59), regularDay)).toBe("night");
      expect(getPhaseFromSunTimes(makeDate(0, 0), regularDay)).toBe("night");
      expect(getPhaseFromSunTimes(makeDate(0, 1), regularDay)).toBe("night");
    });

    it("keeps dusk after midnight when the dusk window wraps", () => {
      const lateSunset = sunTimes([6, 30], [23, 30]);
      const options = { duskOffsetMinutesAfter: 90 };
      expect(getPhaseFromSunTimes(makeDate(22, 44), lateSunset, options)).toBe("day");
      expect(getPhaseFromSunTimes(makeDate(22, 45), lateSunset, options)).toBe("dusk");
      expect(getPhaseFromSunTimes(makeDate(23, 59), lateSunset, options)).toBe("dusk");
      expect(getPhaseFromSunTimes(makeDate(0, 0), lateSunset, options)).toBe("dusk");
      expect(getPhaseFromSunTimes(makeDate(0, 59), lateSunset, options)).toBe("dusk");
      expect(getPhaseFromSunTimes(makeDate(1, 0), lateSunset, options)).toBe("night");
      expect(getPhaseFromSunTimes(makeDate(1, 1), lateSunset, options)).toBe("night");
    });

    it("starts dawn before midnight when the dawn window wraps", () => {
      const earlySunrise = sunTimes([0, 20], [18, 0]);
      expect(getPhaseFromSunTimes(makeDate(23, 34), earlySunrise)).toBe("night");
      expect(getPhaseFromSunTimes(makeDate(23, 35), earlySunrise)).toBe("dawn");
      expect(getPhaseFromSunTimes(makeDate(0, 0), earlySunrise)).toBe("dawn");
      expect(getPhaseFromSunTimes(makeDate(1, 4), earlySunrise)).toBe("dawn");
      expect(getPhaseFromSunTimes(makeDate(1, 5), earlySunrise)).toBe("day");
    });

    it("uses custom offsets for the boundaries", () => {
      const options = { dawnOffsetMinutesBefore: 10, dawnOffsetMinutesAfter: 5 };
      expect(getPhaseFromSunTimes(makeDate(6, 19), regularDay, options)).toBe("night");
      expect(getPhaseFromSunTimes(makeDate(6, 20), regularDay, options)).toBe("dawn");
      expect(getPhaseFromSunTimes(makeDate(6, 34), regularDay, options)).toBe("dawn");
      expect(getPhaseFromSunTimes(makeDate(6, 35), regularDay, options)).toBe("day");
    });
  });

  describe("computeNextSunTransition", () => {
    it("returns the end of the current window", () => {
      const next = computeNextSunTransition(makeDate(7, 0), regularDay);
      expect(next.getDate()).toBe(1);
      expect(next.getHours()).toBe(7);
      expect(next.getMinutes()).toBe(15);
    });

    it("wraps to the next day from the night window", () => {
      const next = computeNextSunTransition(makeDate(23, 0), regularDay);
      expect(next.getDate()).toBe(2);
      expect(next.getHours()).toBe(5);
      expect(next.getMinutes()).toBe(45);
    });
  });

  describe("getScheduleFromProvider", () => {
    it("returns null without a provider", () => {
      expect(getScheduleFromProvider(makeDate(12, 0))).toBeNull();
    });

    it("returns null when the provider returns null", () => {
      const provider = jest.fn<ReturnType<SunTimesProvider>, Parameters<SunTimesProvider>>(
        () => null
      );
      const date = makeDate(12, 0);
      expect(getScheduleFromProvider(date, provider)).toBeNull();
      expect(provider).toHaveBeenCalledWith(date);
    });

    it("formats the derived windows as HH:MM strings", () => {
      expect(getScheduleFromProvider(makeDate(12, 0), () => regularDay)).toEqual({
        dawn: { start: "05:45", end: "07:15" },
        day: { start: "07:15", end: "17:15" },
        dusk: { start: "17:15", end: "18:45" },
        night: { start: "18:45", end: "05:45" }
      });
    });

    it("passes custom offsets through and pads wrapped times", () => {
      const schedule = getScheduleFromProvider(makeDate(12, 0), () => sunTimes([6, 30], [23, 30]), {
        duskOffsetMinutesAfter: 90
      });
      expect(schedule?.dusk).toEqual({ start: "22:45", end: "01:00" });
      expect(schedule?.night).toEqual({ start: "01:00", end: "05:45" });
    });
  });
});
