// What the e2e tests need from Windows and the disk. They only touch their own two folders.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const powershell = (script) =>
  execFileSync("powershell.exe", ["-NoProfile", "-Command", script], { encoding: "utf8" }).trim();

/** The app built by `npm run e2e:build`: its own identifier, and notes in a test folder. */
export const E2E_APP = join(ROOT, "src-tauri", "target", "e2e", "debug", "tambor-de-notas.exe");

const documents = powershell("[Environment]::GetFolderPath('MyDocuments')");
/** Must match `notesRootFor` in `src/storage/tauriFileSystem.ts`. */
export const NOTES_DIR = join(documents, "Tambor de Notas (Dev)", "notas", "e2e");
/** Must match the identifier in `src-tauri/tauri.e2e.conf.json`. */
export const APP_DATA_DIR = join(process.env.APPDATA, "com.tambordenotas.app.e2e");

/**
 * Must match `--remote-debugging-port` in `src-tauri/tauri.e2e.conf.json`. Not the usual 9222:
 * other programs use it (on this notebook, Lenovo Vantage).
 */
export const DEBUG_ADDRESS = "127.0.0.1:19222";
const APP_READY_ATTEMPTS = 60;
const APP_READY_WAIT_MS = 500;
/** The address of the app's page, in the WebView2. */
const APP_PAGE = "tauri.localhost";

const debugInfo = async (path) => {
  try {
    const response = await fetch(`http://${DEBUG_ADDRESS}${path}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

/**
 * Opens the e2e app and waits for its page. Returns the WebView2 version it is using. Refuses a
 * port already in use, so the tests never connect to another program.
 */
export async function openE2eApp() {
  if ((await debugInfo("/json/version")) !== null) {
    throw new Error(`Outro programa já usa a porta de depuração ${DEBUG_ADDRESS}.`);
  }
  spawn(E2E_APP, { detached: true, stdio: "ignore" }).unref();
  for (let attempt = 0; attempt < APP_READY_ATTEMPTS; attempt++) {
    const targets = (await debugInfo("/json/list")) ?? [];
    if (targets.some(({ type, url }) => type === "page" && url.includes(APP_PAGE))) {
      const { Browser: browser } = await debugInfo("/json/version");
      return browser.split("/")[1];
    }
    await new Promise((resolve) => setTimeout(resolve, APP_READY_WAIT_MS));
  }
  throw new Error("O app de teste abriu, mas a página dele não respondeu na porta de depuração.");
}

/** Closes the e2e app, if open. Only runs after checking no other copy of the app is open. */
export function closeE2eApp() {
  powershell(
    `Get-Process tambor-de-notas -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${E2E_APP}' } | ForEach-Object { Stop-Process -Id $_.Id -Force; $_.WaitForExit(5000) | Out-Null }`,
  );
}

/** Stops the run if another copy of the app is open: it would hold the global shortcuts. */
export function assertNoOtherAppRunning() {
  const running = powershell("@(Get-Process tambor-de-notas -ErrorAction SilentlyContinue).Count");
  if (running !== "0") {
    throw new Error(
      `Feche o Tambor de Notas antes de rodar o e2e (${running} aberto): ele ficaria com os atalhos.`,
    );
  }
}

/** Empties the test folders, refusing anything else. Never touches the real or DEV notes. */
export function resetTestFolders() {
  if (basename(NOTES_DIR) !== "e2e" || !NOTES_DIR.includes("Tambor de Notas (Dev)")) {
    throw new Error(`Pasta de notas inesperada: ${NOTES_DIR}`);
  }
  if (!APP_DATA_DIR.endsWith(".app.e2e")) {
    throw new Error(`Pasta de dados inesperada: ${APP_DATA_DIR}`);
  }
  rmSync(NOTES_DIR, { recursive: true, force: true });
  rmSync(APP_DATA_DIR, { recursive: true, force: true });
  mkdirSync(join(NOTES_DIR, "ativas"), { recursive: true });
  mkdirSync(APP_DATA_DIR, { recursive: true });
}

/** Writes the test's `cores.json` as it is (it can be broken on purpose). */
export function writeColorsFile(text) {
  writeFileSync(join(APP_DATA_DIR, "cores.json"), text);
}

/** Writes a file straight into the active notes folder. */
export function writeActiveFile(name, text) {
  writeFileSync(join(NOTES_DIR, "ativas", name), text);
}

/** Presses Ctrl+Shift+Alt and a digit at the Windows level, as the keyboard would. */
export function pressGlobalShortcut(digit) {
  const key = `0x${(0x30 + digit).toString(16)}`;
  powershell(`
    Add-Type -Name K -Namespace E2E -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);'
    $keys = 0x11, 0x10, 0x12, ${key}
    foreach ($k in $keys) { [E2E.K]::keybd_event($k, 0, 0, [UIntPtr]::Zero) }
    Start-Sleep -Milliseconds 60
    [array]::Reverse($keys)
    foreach ($k in $keys) { [E2E.K]::keybd_event($k, 0, 2, [UIntPtr]::Zero) }
  `);
}
