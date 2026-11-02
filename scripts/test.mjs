// Runs the unit tests, showing their output and always keeping all of it in `test-output/`:
// `saida.txt` has the last run, and each failure stays in its own file, so a later run that
// passes does not erase it. Any arguments go to Vitest (`npm test -- src/domain`).
import { spawn } from "node:child_process";
import { copyFileSync, createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const OUTPUT_DIR = "test-output";
const LAST_RUN = join(OUTPUT_DIR, "saida.txt");

mkdirSync(OUTPUT_DIR, { recursive: true });
const file = createWriteStream(LAST_RUN);
const vitest = spawn("npx", ["--no-install", "vitest", "run", ...process.argv.slice(2)], {
  shell: true,
});
const keep = (screen) => (chunk) => {
  file.write(chunk);
  screen.write(chunk);
};
vitest.stdout.on("data", keep(process.stdout));
vitest.stderr.on("data", keep(process.stderr));
vitest.on("error", (error) => file.write(`\nNão consegui rodar os testes: ${error.stack}\n`));

vitest.on("close", (code, signal) => {
  file.end(`\nSaiu com o código ${code}, sinal ${signal}.\n`, () => {
    if (code === 0) process.exit(0);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const failure = join(OUTPUT_DIR, `falha-${stamp}.txt`);
    copyFileSync(LAST_RUN, failure);
    process.stderr.write(`\nSaída completa da falha em ${failure}\n`);
    process.exit(code ?? 1);
  });
});
