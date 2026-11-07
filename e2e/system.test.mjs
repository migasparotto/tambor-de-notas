import { spawn } from "node:child_process";
import { join } from "node:path";
import process from "node:process";
import { beforeAll, describe, expect, it } from "vitest";

// Runs the real Windows commands: closing when nothing is open must not fail, or every e2e test
// after an app that never opened fails too (hansei 2026-11-05-17 and -20).
describe.runIf(process.platform === "win32")("stopProcesses, on Windows", () => {
  let stopProcesses;
  beforeAll(async () => {
    ({ stopProcesses } = await import("./system.mjs"));
  });

  it("does not fail when no process has the name", () => {
    expect(() => stopProcesses("tambor-processo-que-nao-existe", "C:\\nada.exe")).not.toThrow();
  });

  it("stops a running process with that name and path", async () => {
    const ping = join(process.env.SystemRoot, "System32", "PING.EXE");
    const child = spawn(ping, ["-n", "60", "127.0.0.1"], { stdio: "ignore" });
    const exited = new Promise((resolve) => child.once("exit", resolve));
    await new Promise((resolve) => child.once("spawn", resolve));
    stopProcesses("PING", ping);
    await exited;
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
  });
});
