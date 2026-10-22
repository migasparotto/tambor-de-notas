import { describe, expect, it } from "vitest";
import { CYCLE_END_SOUNDS, cycleEndEffects, JOLT_MS, ratchetEvents, soundEvents } from "./cycleEnd";
import { DEFAULT_SETTINGS } from "./settings";

const DURATION = DEFAULT_SETTINGS.cycleEndDurationMs;

describe("ratchetEvents", () => {
  const events = ratchetEvents(DURATION);
  const clicks = events.filter((e) => e.kind === "click");

  it("ends with the clack exactly at the configured duration", () => {
    expect(events.at(-1)).toMatchObject({ kind: "clack", atMs: DURATION });
    expect(events.filter((e) => e.kind === "clack")).toHaveLength(1);
  });

  it("starts at once and keeps every tick before the clack", () => {
    expect(clicks[0]?.atMs).toBe(0);
    for (const click of clicks) expect(click.atMs).toBeLessThan(DURATION);
  });

  it("slows down: each gap between ticks is longer than the one before", () => {
    const gaps = clicks.slice(1).map((c, i) => c.atMs - (clicks[i]?.atMs ?? 0));
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1] ?? 0);
  });

  it("follows another configured duration", () => {
    const longer = ratchetEvents(DURATION * 2);
    expect(longer.at(-1)?.atMs).toBe(DURATION * 2);
    expect(longer[5]?.atMs).toBeCloseTo((events[5]?.atMs ?? 0) * 2);
  });

  it("keeps every gain between 0 and 1", () => {
    for (const e of events) {
      expect(e.gain).toBeGreaterThan(0);
      expect(e.gain).toBeLessThanOrEqual(1);
    }
  });
});

describe("soundEvents", () => {
  it("has something to play for every sound except off", () => {
    for (const sound of CYCLE_END_SOUNDS) {
      expect(soundEvents(sound, DURATION).length > 0).toBe(sound !== "off");
    }
  });

  it("uses the duration only for the ratchet", () => {
    expect(soundEvents("cock", DURATION)).toEqual(soundEvents("cock", DURATION * 3));
    expect(soundEvents("chime", DURATION)).toEqual(soundEvents("chime", DURATION * 3));
  });
});

describe("cycleEndEffects", () => {
  it("by default plays the ratchet and spins for the same duration", () => {
    const effects = cycleEndEffects(DEFAULT_SETTINGS, false);
    expect(effects.sound).toEqual(ratchetEvents(DURATION));
    expect(effects.volume).toBe(DEFAULT_SETTINGS.soundVolume);
    expect(effects.animation).toEqual({ kind: "spin", durationMs: DURATION });
  });

  it("does not animate when Windows asks to reduce motion, but still plays the sound", () => {
    const effects = cycleEndEffects(DEFAULT_SETTINGS, true);
    expect(effects.animation).toBeNull();
    expect(effects.sound.length).toBeGreaterThan(0);
  });

  it("turns each part off on its own", () => {
    expect(cycleEndEffects({ ...DEFAULT_SETTINGS, cycleEndSound: "off" }, false).sound).toEqual([]);
    expect(
      cycleEndEffects({ ...DEFAULT_SETTINGS, cycleEndAnimation: "off" }, false).animation,
    ).toBeNull();
    expect(cycleEndEffects({ ...DEFAULT_SETTINGS, soundVolume: 0 }, false).sound).toEqual([]);
  });

  it("gives the jolt its own short duration", () => {
    expect(
      cycleEndEffects({ ...DEFAULT_SETTINGS, cycleEndAnimation: "jolt" }, false).animation,
    ).toEqual({ kind: "jolt", durationMs: JOLT_MS });
  });
});
