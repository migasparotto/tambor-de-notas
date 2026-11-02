// End-to-end tests: the real app, controlled by WebdriverIO through the Edge driver.
// The app opens by itself with a debugging port (see `src-tauri/tauri.e2e.conf.json`) and the
// driver connects to it. tauri-driver is not used: it relies on a WebView2 environment variable
// that Windows Server, on the CI runner, ignores.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { download } from "edgedriver";
import {
  DEBUG_ADDRESS,
  assertNoOtherAppRunning,
  openE2eApp,
  closeE2eApp,
  resetTestFolders,
} from "./system.mjs";

const DRIVER_PORT = 4444;
let edgeDriver;

export const config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: DRIVER_PORT,
  specs: ["./*.spec.mjs"],
  maxInstances: 1,
  // Without browserName and BiDi: with them, connecting sends the page to about:blank.
  capabilities: [
    { "ms:edgeOptions": { debuggerAddress: DEBUG_ADDRESS }, "wdio:enforceWebDriverClassic": true },
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

  onComplete() {
    edgeDriver?.kill();
    closeE2eApp();
  },
};
