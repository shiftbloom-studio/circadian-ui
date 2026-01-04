import { computeNextTransition, getPhaseFromTime } from "../src/core/schedule";

const makeDate = (hours: number, minutes: number) => new Date(2024, 0, 1, hours, minutes, 0);

describe("schedule", () => {
  it("resolves phases across default windows", () => {
    expect(getPhaseFromTime(makeDate(5, 30))).toBe("dawn");
    expect(getPhaseFromTime(makeDate(8, 30))).toBe("day");
    expect(getPhaseFromTime(makeDate(17, 30))).toBe("dusk");
    expect(getPhaseFromTime(makeDate(21, 30))).toBe("night");
    expect(getPhaseFromTime(makeDate(2, 0))).toBe("night");
  });

  it("computes the next transition boundary", () => {
    const now = makeDate(8, 0);
    const next = computeNextTransition(now);
    expect(next.getHours()).toBe(8);
    expect(next.getMinutes()).toBe(30);
  });

  it("wraps to the next day when needed", () => {
    const now = makeDate(23, 0);
    const next = computeNextTransition(now);
    expect(next.getDate()).toBe(2);
    expect(next.getHours()).toBe(5);
    expect(next.getMinutes()).toBe(30);
  });
});
