import { describe, expect, it } from "vitest";
import { flipDurationMs, otherSide, SIDE_ANGLE } from "./drumSide";
import { DEFAULT_SETTINGS } from "./settings";

const settings = DEFAULT_SETTINGS;

describe("otherSide", () => {
  it("goes to the back and returns to the front", () => {
    expect(otherSide("front")).toBe("back");
    expect(otherSide(otherSide("front"))).toBe("front");
  });
});

describe("SIDE_ANGLE", () => {
  it("has the two sides half a turn apart", () => {
    expect(Math.abs(SIDE_ANGLE.back - SIDE_ANGLE.front)).toBe(180);
  });
});

describe("flipDurationMs", () => {
  it("takes half of the configured full turn", () => {
    expect(flipDurationMs(settings, false)).toBe(settings.cycleEndDurationMs / 2);
    expect(flipDurationMs({ ...settings, cycleEndDurationMs: 3000 }, false)).toBe(1500);
  });

  it("is a half turn also when the end of a cycle uses the short jolt", () => {
    expect(flipDurationMs({ ...settings, cycleEndAnimation: "jolt" }, false)).toBe(
      settings.cycleEndDurationMs / 2,
    );
  });

  it("has no animation when Windows asks to reduce motion", () => {
    expect(flipDurationMs(settings, true)).toBeNull();
  });

  it("has no animation when the drum animation is off", () => {
    expect(flipDurationMs({ ...settings, cycleEndAnimation: "off" }, false)).toBeNull();
  });
});
