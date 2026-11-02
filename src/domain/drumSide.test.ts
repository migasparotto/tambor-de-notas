import { describe, expect, it } from "vitest";
import { ratchetEvents } from "./cycleEnd";
import { flipEffects, otherSide, SIDE_ANGLE } from "./drumSide";
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

describe("flipEffects", () => {
  const halfTurn = settings.cycleEndDurationMs / 2;
  const lastEventAt = (events: readonly { atMs: number }[]) =>
    Math.max(...events.map((event) => event.atMs));

  it("takes half of the configured full turn", () => {
    expect(flipEffects(settings, false).durationMs).toBe(halfTurn);
    expect(flipEffects({ ...settings, cycleEndDurationMs: 3000 }, false).durationMs).toBe(1500);
  });

  it("is a half turn also when the end of a cycle uses the short jolt", () => {
    expect(flipEffects({ ...settings, cycleEndAnimation: "jolt" }, false).durationMs).toBe(
      halfTurn,
    );
  });

  it("plays the ratchet at the configured volume, ending with the half turn", () => {
    const { sound, volume } = flipEffects({ ...settings, soundVolume: 0.3 }, false);
    expect(volume).toBe(0.3);
    expect(sound).toEqual(ratchetEvents(halfTurn));
    expect(lastEventAt(sound)).toBe(halfTurn);
  });

  it("plays the ratchet whichever sound the end of a cycle uses, unless it is off", () => {
    const chime = flipEffects({ ...settings, cycleEndSound: "chime" }, false);
    expect(chime.sound).toEqual(ratchetEvents(halfTurn));
    expect(flipEffects({ ...settings, cycleEndSound: "off" }, false).sound).toEqual([]);
  });

  it("is silent with the volume at 0", () => {
    expect(flipEffects({ ...settings, soundVolume: 0 }, false).sound).toEqual([]);
  });

  it("has no animation when Windows asks to reduce motion, but the sound still plays", () => {
    const effects = flipEffects(settings, true);
    expect(effects.durationMs).toBeNull();
    expect(effects.sound).toEqual(ratchetEvents(halfTurn));
  });

  it("has no animation when the drum animation is off, but the sound still plays", () => {
    const effects = flipEffects({ ...settings, cycleEndAnimation: "off" }, false);
    expect(effects.durationMs).toBeNull();
    expect(effects.sound).not.toEqual([]);
  });
});
