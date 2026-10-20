import { defineConfig } from "vitest/config";

// Tests live next to the code they test, named *.test.ts.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
