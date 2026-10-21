import { describe, expect, it } from "vitest";
import { addCycle, cyclesForToday, localDay, parseDailyCycles } from "./dailyCycles";

const morning = new Date(2026, 9, 21, 9, 0);
const lateNight = new Date(2026, 9, 21, 23, 59);
const nextDay = new Date(2026, 9, 22, 0, 1);

describe("localDay", () => {
  it("is the local date as AAAA-MM-DD", () => {
    expect(localDay(morning)).toBe("2026-10-21");
    expect(localDay(new Date(2027, 0, 5))).toBe("2027-01-05");
  });
});

describe("cyclesForToday", () => {
  it("keeps the count saved today", () => {
    expect(cyclesForToday({ date: "2026-10-21", cycles: 3 }, lateNight)).toEqual({
      date: "2026-10-21",
      cycles: 3,
    });
  });

  it("starts at zero on a new day", () => {
    expect(cyclesForToday({ date: "2026-10-21", cycles: 3 }, nextDay)).toEqual({
      date: "2026-10-22",
      cycles: 0,
    });
  });

  it("starts at zero when nothing is saved", () => {
    expect(cyclesForToday(null, morning)).toEqual({ date: "2026-10-21", cycles: 0 });
  });
});

describe("addCycle", () => {
  it("adds one to today's count", () => {
    expect(addCycle({ date: "2026-10-21", cycles: 3 }, lateNight)).toEqual({
      date: "2026-10-21",
      cycles: 4,
    });
  });

  it("restarts at one when the cycle ends on a new day", () => {
    expect(addCycle({ date: "2026-10-21", cycles: 3 }, nextDay)).toEqual({
      date: "2026-10-22",
      cycles: 1,
    });
  });
});

describe("parseDailyCycles", () => {
  it("reads a saved counter", () => {
    expect(parseDailyCycles('{"date":"2026-10-21","cycles":2}')).toEqual({
      date: "2026-10-21",
      cycles: 2,
    });
  });

  it("treats anything unexpected as nothing saved", () => {
    for (const broken of [
      "",
      "{",
      "null",
      '{"date":"2026-10-21"}',
      '{"date":1,"cycles":2}',
      '{"date":"x","cycles":-1}',
      '{"date":"x","cycles":1.5}',
    ]) {
      expect(parseDailyCycles(broken)).toBeNull();
    }
  });
});
