// Runs the e2e tests, showing their output and keeping it. Failures outside any test (the app or
// the session not starting) only leave a trace here. The evidence stays only when a run fails.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { stripVTControlCharacters } from "node:util";
import { FAILURES_DIR } from "./system.mjs";

rmSync(FAILURES_DIR, { recursive: true, force: true });
mkdirSync(FAILURES_DIR, { recursive: true });

const wdio = spawn("npx --no-install wdio run e2e/wdio.conf.mjs", { shell: true });
const output = [];
const keep = (screen) => (chunk) => {
  output.push(chunk);
  screen.write(chunk);
};
wdio.stdout.on("data", keep(process.stdout));
wdio.stderr.on("data", keep(process.stderr));

wdio.on("close", (code, signal) => {
  if (code === 0) {
    rmSync(FAILURES_DIR, { recursive: true, force: true });
    process.exit(0);
  }
  const text = stripVTControlCharacters(Buffer.concat(output).toString("utf8"));
  writeFileSync(
    join(FAILURES_DIR, "execucao.txt"),
    `Saiu com o código ${code}, sinal ${signal}.\n\n${text}`,
  );
  console.error(`\nEvidências da falha em ${FAILURES_DIR}`);
  process.exit(code ?? 1);
});
