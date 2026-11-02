// End-to-end tests: the real app, controlled by WebdriverIO through the Edge driver.
// The app opens by itself with a debugging port (see `src-tauri/tauri.e2e.conf.json`) and the
// driver connects to it. tauri-driver is not used: it relies on a WebView2 environment variable
// that Windows Server, on the CI runner, ignores.
import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { browser } from "@wdio/globals";
import { download } from "edgedriver";
import {
  APP_LOG,
  DEBUG_ADDRESS,
  FAILURES_DIR,
  assertNoOtherAppRunning,
  openE2eApp,
  closeE2eApp,
  resetTestFolders,
} from "./system.mjs";

const DRIVER_PORT = 4444;
let edgeDriver;
let failures = 0;

/** Tries to keep one piece of evidence; if it cannot, says why in its place. */
async function keep(folder, name, save) {
  try {
    await save(join(folder, name));
  } catch (error) {
    writeFileSync(join(folder, `${name}.erro.txt`), String(error));
  }
}

export const config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: DRIVER_PORT,
  specs: ["./*.spec.mjs"],
  maxInstances: 1,
  // Without browserName and BiDi: with them, connecting sends the page to about:blank.
  capabilities: [
    {
      "ms:edgeOptions": { debuggerAddress: DEBUG_ADDRESS },
      "ms:loggingPrefs": { browser: "ALL" },
      "wdio:enforceWebDriverClassic": true,
    },
  ],
  logLevel: "warn",
  waitforTimeout: 15000,
  framework: "mocha",
  // No retries: a test that passes and fails without a change must show up, not be hidden.
  specFileRetries: 0,
  connectionRetryCount: 0,
  reporters: ["spec"],
  mochaOpts: { ui: "bdd", timeout: 120000 },

  async onPrepare() {
    assertNoOtherAppRunning();
    resetTestFolders();
    // The driver must match the WebView2 in use, which updates by itself: the version comes
    // from the open app at run time, here and in the CI, and is never fixed in the repository.
    const version = await openE2eApp();
    // One folder per version: the download reuses any driver it finds, without checking it.
    const cache = join(process.cwd(), "node_modules", ".cache", "edge", version);
    mkdirSync(cache, { recursive: true });
    const driver = await download(version, cache);
    console.log(`WebView2 ${version}, driver ${driver}`);
    edgeDriver = spawn(driver, [`--port=${DRIVER_PORT}`], { stdio: "ignore" });
  },

  /** A failed test keeps its full message, a picture of the window and the logs. */
  async afterTest(test, _context, { error, passed }) {
    if (passed) return;
    failures += 1;
    const slug = test.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60);
    const folder = join(FAILURES_DIR, `${String(failures).padStart(2, "0")}-${slug}`);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "erro.txt"), `${test.title}\n\n${error?.stack ?? error}\n`);
    await keep(folder, "tela.png", (path) => browser.saveScreenshot(path));
    await keep(folder, "console.json", async (path) =>
      writeFileSync(path, JSON.stringify(await browser.getLogs("browser"), null, 2)),
    );
    await keep(folder, "app.log", (path) => copyFileSync(APP_LOG, path));
  },

  onComplete() {
    edgeDriver?.kill();
    closeE2eApp();
  },
};
