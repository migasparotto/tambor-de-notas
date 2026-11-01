// End-to-end tests: the real app, controlled by WebdriverIO through tauri-driver.
import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";
import { download } from "edgedriver";
import { E2E_APP, assertNoOtherAppRunning, webView2Version } from "./system.mjs";

let tauriDriver;

export const config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: 4444,
  specs: ["./*.spec.mjs"],
  maxInstances: 1,
  capabilities: [{ "tauri:options": { application: E2E_APP } }],
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
    // The driver must match the WebView2 of this machine, which updates by itself: it is
    // always looked up at run time, here and in the CI, and never fixed in the repository.
    const version = webView2Version();
    const driver = await download(version, join(process.cwd(), "node_modules", ".cache", "edge"));
    console.log(`WebView2 ${version}, driver ${driver}`);
    execFileSync("tauri-driver", ["--help"], { stdio: "ignore" });
    tauriDriver = spawn("tauri-driver", ["--native-driver", driver], {
      stdio: ["ignore", "inherit", "inherit"],
    });
  },

  onComplete() {
    tauriDriver?.kill();
  },
};
