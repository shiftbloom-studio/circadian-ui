import { dateAtMinutes, formatMinutes, getPhaseBands } from "../src/react/CircadianTimeTravel";

describe("formatMinutes", () => {
  it("formats midnight as 00:00", () => {
    expect(formatMinutes(0)).toBe("00:00");
  });

  it("formats a morning time", () => {
    expect(formatMinutes(330)).toBe("05:30");
  });

  it("formats the last minute of the day", () => {
    expect(formatMinutes(1439)).toBe("23:59");
  });
});

describe("dateAtMinutes", () => {
  it("returns the base day at the given minutes", () => {
    const base = new Date(2026, 10, 26, 15, 30, 0);
    const date = dateAtMinutes(180, base);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10);
    expect(date.getDate()).toBe(26);
    expect(date.getHours()).toBe(3);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it("does not change the base date", () => {
    const base = new Date(2026, 10, 26, 15, 30, 0);
    dateAtMinutes(180, base);
    expect(base.getHours()).toBe(15);
    expect(base.getMinutes()).toBe(30);
  });
});

describe("getPhaseBands", () => {
  it("splits the default schedule into five bands across the day", () => {
    expect(getPhaseBands()).toEqual([
      { phase: "night", start: 0, end: 330 },
      { phase: "dawn", start: 330, end: 510 },
      { phase: "day", start: 510, end: 1050 },
      { phase: "dusk", start: 1050, end: 1290 },
      { phase: "night", start: 1290, end: 1440 }
    ]);
  });

  it("keeps a custom schedule in order", () => {
    expect(
      getPhaseBands({
        dawn: { start: "06:00", end: "09:00" },
        day: { start: "09:00", end: "18:00" },
        dusk: { start: "18:00", end: "21:00" },
        night: { start: "21:00", end: "06:00" }
      })
    ).toEqual([
      { phase: "night", start: 0, end: 360 },
      { phase: "dawn", start: 360, end: 540 },
      { phase: "day", start: 540, end: 1080 },
      { phase: "dusk", start: 1080, end: 1260 },
      { phase: "night", start: 1260, end: 1440 }
    ]);
  });
});
