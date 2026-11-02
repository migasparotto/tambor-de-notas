// What the e2e tests need from Windows and the disk. They only touch their own two folders.
import { execFileSync, spawn } from "node:child_process";
import { appendFileSync, closeSync, mkdirSync, openSync, rmSync, writeFileSync } from "node:fs";
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
/** Where Windows may write a dump of the app: the CI's folder, the crash capture's and the default. */
const DUMP_FOLDERS = [
  process.env.TAMBOR_DUMPS,
  join(process.env.LOCALAPPDATA, "Tambor de Notas (quedas)", "dumps"),
  join(process.env.LOCALAPPDATA, "CrashDumps"),
].filter(Boolean);

const quoted = (text) => `'${text.replaceAll("'", "''")}'`;

/**
 * Keeps the system's evidence of a failed run in `folder`, with the same script as the crash
 * capture (`scripts/windows/collect-evidence.ps1`): Windows logs and crash events since `since`,
 * the app's logs, its dumps, and the e2e .exe with the .pdb that reads them.
 */
export function collectEvidence(folder, since) {
  const script = join(ROOT, "scripts", "windows", "collect-evidence.ps1");
  const binaries = [E2E_APP, join(dirname(E2E_APP), "tambor_de_notas.pdb")];
  powershell(
    `& ${quoted(script)} -Folder ${quoted(folder)} -Since ${quoted(since.toISOString())}` +
      ` -DumpFolders @(${DUMP_FOLDERS.map(quoted).join(",")}) -Binaries @(${binaries.map(quoted).join(",")})`,
  );
}

/**
 * Must match `--remote-debugging-port` in `src-tauri/tauri.e2e.conf.json`. Not the usual 9222:
 * other programs use it (on this notebook, Lenovo Vantage).
 */
export const DEBUG_ADDRESS = "127.0.0.1:19222";
/** What a failed run keeps (ignored by Git; `e2e/run.mjs` cleans it). */
export const FAILURES_DIR = join(ROOT, "e2e", "failures");
/** What the app writes while it runs, for every time it opens in this run. */
export const APP_LOG = join(FAILURES_DIR, "app.log");
/**
 * How long to wait for the app's page. In the CI the WebView2 once took 48 s to start (02/11/2026),
 * so 30 s was not enough; each opening time is written down to follow the trend.
 */
const APP_READY_TIMEOUT_MS = 120_000;
const APP_READY_WAIT_MS = 500;
/**
 * How long the debugging port may stay busy after the previous test closed the app: the port
 * belongs to the WebView2 process, which may take a few seconds to leave (seen in the CI on
 * 02/11/2026, when the next test found it still open).
 */
const PORT_FREE_TIMEOUT_MS = 15_000;
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
  const waitingSince = Date.now();
  while ((await debugInfo("/json/version")) !== null) {
    if (Date.now() - waitingSince > PORT_FREE_TIMEOUT_MS) {
      throw new Error(`Outro programa já usa a porta de depuração ${DEBUG_ADDRESS}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, APP_READY_WAIT_MS));
  }
  mkdirSync(FAILURES_DIR, { recursive: true });
  appendFileSync(APP_LOG, `--- O app abriu às ${new Date().toISOString()}\n`);
  const log = openSync(APP_LOG, "a");
  spawn(E2E_APP, { detached: true, stdio: ["ignore", log, log] }).unref();
  closeSync(log);
  const started = Date.now();
  let targets = null;
  while (Date.now() - started < APP_READY_TIMEOUT_MS) {
    targets = await debugInfo("/json/list");
    if ((targets ?? []).some(({ type, url }) => type === "page" && url.includes(APP_PAGE))) {
      recordOpeningTime(Date.now() - started);
      const { Browser: browser } = await debugInfo("/json/version");
      return browser.split("/")[1];
    }
    await new Promise((resolve) => setTimeout(resolve, APP_READY_WAIT_MS));
  }
  recordOpeningTime(null);
  // A hang leaves no crash event: keep the state and a dump of the stuck process.
  dumpHungApp();
  const port =
    targets === null
      ? "a porta de depuração nem respondeu"
      : `a porta respondeu com ${targets.length} alvo(s), sem a página do app`;
  throw new Error(
    `O app de teste abriu, mas a página dele não respondeu (${port}). Estado e dump em e2e/failures/travado.`,
  );
}

/**
 * Writes how long the app took to open (null = it never answered) in every run, passing or not:
 * in the output, in the app log and, in the CI, in the run's summary page.
 */
function recordOpeningTime(ms) {
  const line =
    ms === null
      ? `Abertura do app: sem resposta em ${APP_READY_TIMEOUT_MS / 1000} s`
      : `Abertura do app: ${(ms / 1000).toFixed(1)} s`;
  console.log(line);
  appendFileSync(APP_LOG, `${line}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${line}\n`);
}

/** Keeps the state and a full dump of the e2e app when it opens but never answers. */
function dumpHungApp() {
  const script = join(ROOT, "scripts", "windows", "dump-hung-app.ps1");
  try {
    powershell(
      `& ${quoted(script)} -ExePath ${quoted(E2E_APP)} -Folder ${quoted(join(FAILURES_DIR, "travado"))}`,
    );
  } catch (error) {
    writeFileSync(
      join(FAILURES_DIR, "travado.txt"),
      `Não consegui guardar o estado do app travado: ${error}\n`,
    );
  }
}

/** Closes the e2e app, if open. Only runs after checking no other copy of the app is open. */
export function closeE2eApp() {
  powershell(
    `Get-Process tambor-de-notas -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${E2E_APP}' } | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue; $_.WaitForExit(5000) | Out-Null }`,
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
