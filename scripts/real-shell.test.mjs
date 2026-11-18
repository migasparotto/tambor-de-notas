import console from "node:console";
import { performance } from "node:perf_hooks";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REAL_SHELL_TIMEOUT_MS, timed } from "./real-shell.mjs";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("timed", () => {
  it("returns the result and prints how long the call took", () => {
    vi.spyOn(performance, "now").mockReturnValueOnce(1000).mockReturnValueOnce(7548);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(timed("Get-Process", () => [])).toEqual([]);
    expect(info).toHaveBeenCalledWith("[tempo real] Get-Process: 6548 ms");
  });

  it("prints the time even for an instant call", () => {
    vi.spyOn(performance, "now").mockReturnValue(5);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    timed("nada", () => undefined);
    expect(info).toHaveBeenCalledWith("[tempo real] nada: 0 ms");
  });
});

describe("REAL_SHELL_TIMEOUT_MS", () => {
  it("is above the slowest real call seen on CI (6548 ms, PR #54)", () => {
    expect(REAL_SHELL_TIMEOUT_MS).toBeGreaterThan(6548);
  });
});
