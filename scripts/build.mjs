// Type-checks and builds the interface, keeping all of the output in `build-output/`
// (see keep-output.mjs). Also used by Tauri before building the app (beforeBuildCommand).
import { runKeepingOutput } from "./keep-output.mjs";

runKeepingOutput(
  "build-output",
  "npx --no-install tsc && npx --no-install vite build",
  "Não consegui rodar o build",
);
