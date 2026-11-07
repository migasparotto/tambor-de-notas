import process from "node:process";
import { describe, expect, it } from "vitest";
import { decide, DEV_PORT, parseProcesses, runningProcesses } from "./app-aberto.mjs";

const DEV = {
  pid: 15800,
  path: "C:\\Projetos\\tambor-de-notas\\src-tauri\\target\\debug\\tambor-de-notas.exe",
  dev: true,
};
const INSTALLED = {
  pid: 4242,
  path: "C:\\Program Files\\Tambor de Notas\\tambor-de-notas.exe",
  dev: false,
};

describe("parseProcesses", () => {
  it("reads PID and path, marks the target builds as dev and skips other lines", () => {
    const text = `${DEV.pid}|${DEV.path}\r\n\r\nalgum aviso\r\n${INSTALLED.pid}|${INSTALLED.path}\r\n`;
    expect(parseProcesses(text)).toEqual([DEV, INSTALLED]);
  });

  it("returns nothing when no Tambor is running", () => {
    expect(parseProcesses("")).toEqual([]);
  });
});

// Runs the real Windows query: "no process" must be a result, not a failure (hansei 2026-11-05-19).
describe.runIf(process.platform === "win32")("runningProcesses, on Windows", () => {
  it("lists nothing, without failing, when no process has the name", () => {
    expect(runningProcesses("tambor-processo-que-nao-existe")).toEqual([]);
  });

  it("lists a running process with its PID and path", () => {
    const node = runningProcesses("node").find((p) => p.pid === process.pid);
    expect(node?.path.toLowerCase()).toBe(process.execPath.toLowerCase());
  });
});

describe("decide, for app:dev", () => {
  it("skips without error when the dev app is open, naming its PID", () => {
    const result = decide("dev", [DEV], true);
    expect(result.action).toBe("skip");
    expect(result.message).toContain(String(DEV.pid));
  });

  it("skips when only the dev port is taken", () => {
    const result = decide("dev", [], true);
    expect(result.action).toBe("skip");
    expect(result.message).toContain(String(DEV_PORT));
  });

  it("opens the dev app next to the installed one, warning about the shortcuts", () => {
    const result = decide("dev", [INSTALLED], false);
    expect(result.action).toBe("run");
    expect(result.message).toContain(String(INSTALLED.pid));
  });

  it("opens the dev app silently when nothing is open", () => {
    expect(decide("dev", [], false)).toEqual({ action: "run" });
  });
});

describe("decide, for e2e", () => {
  it("stops while any Tambor is open, dev or installed", () => {
    for (const open of [[DEV], [INSTALLED], [DEV, INSTALLED]]) {
      const result = decide("e2e", open, false);
      expect(result.action).toBe("stop");
      for (const p of open) expect(result.message).toContain(String(p.pid));
    }
  });

  it("runs when no Tambor is open, even with something on the dev port", () => {
    expect(decide("e2e", [], true)).toEqual({ action: "run" });
  });
});
