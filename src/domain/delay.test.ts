import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay } from "./delay";

// Durations come from configuration in the app, so tests never rely on one fixed value:
// each case uses a configured duration and simulated time (fake timers).
const configuredDurations = [1, 300, 25 * 60 * 1000];

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(configuredDurations)("waits the configured %i ms before resolving", async (ms) => {
    const done = vi.fn();
    void delay(ms).then(done);

    await vi.advanceTimersByTimeAsync(ms - 1);
    expect(done).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledOnce();
  });
});
