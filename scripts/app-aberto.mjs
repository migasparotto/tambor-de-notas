// Checks whether the Tambor is already open before `npm run app:dev` and `npm run e2e`.
// app:dev: if the dev app is open (target\debug exe or Vite on its port), says so with the PID and
// exits without error instead of failing on "Port 1420 is already in use". e2e: refuses to start
// while any Tambor is open, because the run needs the app closed.
import { execFileSync, spawn } from "node:child_process";
import console from "node:console";
import { connect } from "node:net";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const DEV_PORT = 1420;
const EXE = "tambor-de-notas";

/** Turns lines like "15800|C:\...\tambor-de-notas.exe" into processes, marking the dev builds. */
export function parseProcesses(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\|/.test(line))
    .map((line) => {
      const [pid, ...rest] = line.split("|");
      const path = rest.join("|");
      return { pid: Number(pid), path, dev: /[\\/]target[\\/]/i.test(path) };
    });
}

/**
 * Decides what to do, given the mode ("dev" or "e2e"), the running Tambor processes and whether
 * the dev port is taken. Returns { action: "run" | "skip" | "stop", message? }.
 */
export function decide(mode, processes, portTaken) {
  const pids = (list) => list.map((p) => p.pid).join(", ");
  const dev = processes.filter((p) => p.dev);
  const installed = processes.filter((p) => !p.dev);
  if (mode === "dev") {
    if (dev.length > 0 || portTaken) {
      const who = dev.length > 0 ? `PID ${pids(dev)}` : `porta ${DEV_PORT} ocupada`;
      return {
        action: "skip",
        message: `O app de desenvolvimento já está aberto (${who}). Não abri outro.`,
      };
    }
    if (installed.length > 0) {
      return {
        action: "run",
        message: `O app instalado está aberto (PID ${pids(installed)}): os atalhos globais ficam com ele.`,
      };
    }
    return { action: "run" };
  }
  if (processes.length > 0) {
    return { action: "stop", message: `Feche o Tambor antes do e2e (PID ${pids(processes)}).` };
  }
  return { action: "run" };
}

/** Lists the running processes with this name (the Tambor by default) and their paths; Windows only, empty elsewhere. */
export function runningProcesses(name = EXE) {
  if (process.platform !== "win32") return [];
  // @() turns "no process" into an empty list: without it, PowerShell exits with 1.
  const script = `@(Get-Process ${name} -ErrorAction SilentlyContinue) | ForEach-Object { "$($_.Id)|$($_.Path)" }`;
  const out = execFileSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" });
  return parseProcesses(out);
}

/** True when something answers on localhost at the given port. */
function isPortTaken(port) {
  return new Promise((resolve) => {
    const socket = connect({ host: "localhost", port });
    socket.setTimeout(1000);
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("timeout", () => (socket.destroy(), resolve(false)));
    socket.once("error", () => resolve(false));
  });
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "dev" && mode !== "e2e") {
    console.error("Uso: node scripts/app-aberto.mjs dev|e2e");
    process.exit(2);
  }
  const { action, message } = decide(mode, runningProcesses(), await isPortTaken(DEV_PORT));
  if (message) (action === "stop" ? console.error : console.log)(message);
  if (action === "stop") process.exit(1);
  if (action === "skip" || mode === "e2e") process.exit(0);
  const tauri = spawn("tauri dev --config src-tauri/tauri.dev.conf.json", {
    shell: true,
    stdio: "inherit",
  });
  tauri.on("close", (code) => process.exit(code ?? 1));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
