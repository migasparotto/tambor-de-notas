import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileBusyError, isFileBusy, withRetry, type RetryOptions } from "./retry";

const OPTIONS: RetryOptions = { attempts: 3, delayMs: 100 };
const busy = () => new Error("The process cannot access the file (os error 32)");

describe("isFileBusy", () => {
  it("recognizes the Windows 'file in use' errors", () => {
    expect(isFileBusy(busy())).toBe(true);
    expect(isFileBusy("failed: Access is denied. (os error 5)")).toBe(true);
    expect(isFileBusy(new Error("lock violation (os error 33)"))).toBe(true);
  });

  it("does not mistake other errors for a busy file", () => {
    expect(isFileBusy(new Error("file not found (os error 2)"))).toBe(false);
    expect(isFileBusy(new Error("os error 320"))).toBe(false);
    expect(isFileBusy(new Error("forbidden path"))).toBe(false);
  });
});

describe("withRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns at once when the operation works", async () => {
    const operation = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(operation, "a.md", OPTIONS)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("tries again after the configured delay while the file is busy", async () => {
    const operation = vi.fn().mockRejectedValueOnce(busy()).mockResolvedValue("ok");
    const result = withRetry(operation, "a.md", OPTIONS);

    await vi.advanceTimersByTimeAsync(OPTIONS.delayMs - 1);
    expect(operation).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("gives up with a clear message after the configured attempts", async () => {
    const operation = vi.fn().mockRejectedValue(busy());
    const result = withRetry(operation, "Aula.md", OPTIONS);
    const assertion = expect(result).rejects.toThrow(FileBusyError);

    await vi.runAllTimersAsync();
    await assertion;
    await expect(result).rejects.toThrow(/"Aula.md" está em uso.*OneDrive/);
    expect(operation).toHaveBeenCalledTimes(OPTIONS.attempts);
  });

  it("throws other errors at once, without retrying", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("file not found (os error 2)"));
    await expect(withRetry(operation, "a.md", OPTIONS)).rejects.toThrow("file not found");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
