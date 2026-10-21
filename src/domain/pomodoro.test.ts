import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Pomodoro, formatClock, type PomodoroDurations } from "./pomodoro";
import { DEFAULT_SETTINGS } from "./settings";

// The lengths are settings, so every test runs with the configured values and a few others,
// on simulated time (fake timers).
const configured: PomodoroDurations[] = [
  { focusMinutes: DEFAULT_SETTINGS.focusMinutes, breakMinutes: DEFAULT_SETTINGS.breakMinutes },
  { focusMinutes: 1, breakMinutes: 1 },
  { focusMinutes: 50, breakMinutes: 10 },
];

const MIN = 60_000;

describe("Pomodoro", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(configured)("starts idle with a full focus period (%o)", (d) => {
    const p = new Pomodoro(d);
    expect(p.getState()).toEqual({
      phase: "focus",
      status: "idle",
      remainingMs: d.focusMinutes * MIN,
      cycles: 0,
    });
  });

  it.each(configured)("counts down while running (%o)", (d) => {
    const p = new Pomodoro(d);
    p.toggle();
    vi.advanceTimersByTime(d.focusMinutes * MIN - 1000);
    expect(p.getState()).toMatchObject({ phase: "focus", status: "running", remainingMs: 1000 });
    p.dispose();
  });

  it.each(configured)("freezes the clock while paused and resumes from there (%o)", (d) => {
    const p = new Pomodoro(d);
    p.toggle();
    vi.advanceTimersByTime(10_000);
    p.toggle();
    const paused = p.getState();
    expect(paused).toMatchObject({ status: "paused", remainingMs: d.focusMinutes * MIN - 10_000 });

    vi.advanceTimersByTime(10 * MIN);
    expect(p.getState()).toEqual(paused);

    p.toggle();
    vi.advanceTimersByTime(10_000);
    expect(p.getState().remainingMs).toBe(d.focusMinutes * MIN - 20_000);
    p.dispose();
  });

  it.each(configured)("ends focus, counts a cycle and starts the break (%o)", (d) => {
    const onPhaseEnd = vi.fn();
    const p = new Pomodoro(d, { onPhaseEnd });
    p.toggle();
    vi.advanceTimersByTime(d.focusMinutes * MIN);

    expect(onPhaseEnd).toHaveBeenCalledExactlyOnceWith("focus", expect.anything());
    expect(p.getState()).toMatchObject({
      phase: "break",
      status: "running",
      remainingMs: d.breakMinutes * MIN,
      cycles: 1,
    });
    p.dispose();
  });

  it.each(configured)("ends the break and waits for play in focus (%o)", (d) => {
    const onPhaseEnd = vi.fn();
    const p = new Pomodoro(d, { onPhaseEnd });
    p.toggle();
    vi.advanceTimersByTime((d.focusMinutes + d.breakMinutes) * MIN);

    expect(onPhaseEnd).toHaveBeenLastCalledWith("break", expect.anything());
    const done = p.getState();
    expect(done).toEqual({
      phase: "focus",
      status: "idle",
      remainingMs: d.focusMinutes * MIN,
      cycles: 1,
    });

    vi.advanceTimersByTime(d.focusMinutes * MIN);
    expect(p.getState()).toEqual(done);
  });

  it.each(configured)("stop resets to a full focus period and keeps cycles (%o)", (d) => {
    const p = new Pomodoro(d, {}, 3);
    p.toggle();
    vi.advanceTimersByTime(d.focusMinutes * MIN + 1000);
    p.stop();

    expect(p.getState()).toEqual({
      phase: "focus",
      status: "idle",
      remainingMs: d.focusMinutes * MIN,
      cycles: 4,
    });
    vi.advanceTimersByTime(d.focusMinutes * MIN);
    expect(p.getState().status).toBe("idle");
  });

  it("reports every change so the clock can redraw", () => {
    const onChange = vi.fn();
    const p = new Pomodoro(configured[0]!, { onChange });
    p.toggle();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: "running" }));
    vi.advanceTimersByTime(1000);
    expect(onChange.mock.calls.length).toBeGreaterThan(1);
    p.dispose();
  });
});

describe("formatClock", () => {
  it.each([
    [
      DEFAULT_SETTINGS.focusMinutes * MIN,
      `${String(DEFAULT_SETTINGS.focusMinutes).padStart(2, "0")}:00`,
    ],
    [65_000, "01:05"],
    [59_001, "01:00"],
    [1, "00:01"],
    [0, "00:00"],
    [-5, "00:00"],
  ])("shows %i ms as %s", (ms, text) => {
    expect(formatClock(ms)).toBe(text);
  });
});
