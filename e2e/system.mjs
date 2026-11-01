// What the e2e tests need from Windows and the disk. They only touch their own two folders.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WEBVIEW2_KEY = "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
const WEBVIEW2_HIVES = [
  `HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\${WEBVIEW2_KEY}`,
  `HKLM\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\${WEBVIEW2_KEY}`,
  `HKCU\\Software\\Microsoft\\EdgeUpdate\\Clients\\${WEBVIEW2_KEY}`,
];

const powershell = (script) =>
  execFileSync("powershell.exe", ["-NoProfile", "-Command", script], { encoding: "utf8" }).trim();

/** The app built by `npm run e2e:build`: its own identifier, and notes in a test folder. */
export const E2E_APP = join(ROOT, "src-tauri", "target", "e2e", "debug", "tambor-de-notas.exe");

const documents = powershell("[Environment]::GetFolderPath('MyDocuments')");
/** Must match `notesRootFor` in `src/storage/tauriFileSystem.ts`. */
export const NOTES_DIR = join(documents, "Tambor de Notas (Dev)", "notas", "e2e");
/** Must match the identifier in `src-tauri/tauri.e2e.conf.json`. */
export const APP_DATA_DIR = join(process.env.APPDATA, "com.tambordenotas.app.e2e");

/** The version of the WebView2 installed on this machine. */
export function webView2Version() {
  for (const key of WEBVIEW2_HIVES) {
    try {
      const output = execFileSync("reg", ["query", key, "/v", "pv"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const version = /pv\s+REG_SZ\s+([\d.]+)/.exec(output)?.[1];
      if (version && version !== "0.0.0.0") return version;
    } catch {
      // Not in this hive: try the next one.
    }
  }
  throw new Error("Não achei a versão do WebView2 no registro do Windows.");
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
