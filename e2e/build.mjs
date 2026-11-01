// Builds the app the e2e tests open: its own identifier and notes in a test folder.
// Nothing here goes into the installer, which the CD builds without these settings.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import process from "node:process";

const { status } = spawnSync(
  "npx --no-install tauri build --debug --no-bundle --config src-tauri/tauri.e2e.conf.json",
  {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_E2E: "1",
      CARGO_TARGET_DIR: join(process.cwd(), "src-tauri", "target", "e2e"),
    },
  },
);
process.exit(status ?? 1);
