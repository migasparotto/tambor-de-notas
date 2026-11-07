import { defineConfig } from "vitest/config";

// Tests live next to the code they test, named *.test.ts (*.test.mjs in scripts/ and e2e/).
// The WebdriverIO tests in e2e/ are *.spec.mjs and run with `npm run e2e`, not here.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs", "e2e/**/*.test.mjs"],
    environment: "node",
  },
});
