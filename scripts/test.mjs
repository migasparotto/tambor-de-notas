// Runs the unit tests, keeping all of their output in `test-output/` (see keep-output.mjs).
// Any arguments go to Vitest (`npm test -- src/domain`).
import process from "node:process";
import { runKeepingOutput } from "./keep-output.mjs";

const args = process.argv.slice(2).join(" ");
runKeepingOutput(
  "test-output",
  `npx --no-install vitest run ${args}`.trim(),
  "Não consegui rodar os testes",
);
