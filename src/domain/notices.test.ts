import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoticeQueue } from "./notices";

const DURATION = 1000;

describe("NoticeQueue", () => {
  let onChange: ReturnType<typeof vi.fn>;
  let queue: NoticeQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    onChange = vi.fn();
    queue = new NoticeQueue(DURATION, onChange as () => void);
  });

  afterEach(() => vi.useRealTimers());

  it("starts with no notice", () => {
    expect(queue.current).toBeNull();
  });

  it("shows a notice for its duration, and then none", () => {
    queue.add("um");
    expect(queue.current).toBe("um");
    expect(onChange).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DURATION - 1);
    expect(queue.current).toBe("um");
    vi.advanceTimersByTime(1);
    expect(queue.current).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("shows two notices of the same opening one after the other, each for its full time", () => {
    queue.add("um");
    queue.add("dois");
    expect(queue.current).toBe("um");

    vi.advanceTimersByTime(DURATION);
    expect(queue.current).toBe("dois");
    vi.advanceTimersByTime(DURATION - 1);
    expect(queue.current).toBe("dois");
    vi.advanceTimersByTime(1);
    expect(queue.current).toBeNull();
  });

  it("does not repeat a notice that is already waiting", () => {
    queue.add("um");
    queue.add("um");
    vi.advanceTimersByTime(DURATION);
    expect(queue.current).toBeNull();
  });

  it("shows a notice again if it comes back after it was gone", () => {
    queue.add("um");
    vi.advanceTimersByTime(DURATION);
    queue.add("um");
    expect(queue.current).toBe("um");
  });
});
