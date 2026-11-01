import { defineConfig } from "vitest/config";

// Tests live next to the code they test, named *.test.ts (*.test.mjs in scripts/).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    environment: "node",
  },
});
