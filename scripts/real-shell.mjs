// Helpers for tests that run a real system command (PowerShell, Get-Process, Stop-Process).
// The first such call on a cold CI runner took 6548 ms (PR #54, run 44266831451), above
// Vitest's default 5000 ms meant for pure logic.
import console from "node:console";
import { performance } from "node:perf_hooks";

/** Time limit (ms) for a test that runs a real system command. */
export const REAL_SHELL_TIMEOUT_MS = 30_000;

/** Runs `fn`, prints how long it took (so the CI log shows the real duration) and returns its result. */
export function timed(label, fn) {
  const start = performance.now();
  const result = fn();
  console.info(`[tempo real] ${label}: ${Math.round(performance.now() - start)} ms`);
  return result;
}
