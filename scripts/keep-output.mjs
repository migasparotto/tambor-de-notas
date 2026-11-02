// Runs a command, showing its output and always keeping all of it in a folder:
// `saida.txt` has the last run, and each failure stays in its own file, so a later run that
// passes does not erase it. Used by `npm test` and `npm run build`, so "never filter without
// saving" is a mechanism and not just a written rule.
import { spawn } from "node:child_process";
import { copyFileSync, createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

/**
 * Runs `command` through the shell, keeping its output in `outputDir`, and exits the process
 * with the command's exit code.
 * @param {string} outputDir folder for `saida.txt` and the `falha-*.txt` files (git-ignored)
 * @param {string} command what to run, as typed in a terminal
 * @param {string} failureLabel how to describe a failure to start the command
 */
export function runKeepingOutput(outputDir, command, failureLabel) {
  const lastRun = join(outputDir, "saida.txt");
  mkdirSync(outputDir, { recursive: true });
  const file = createWriteStream(lastRun);
  const child = spawn(command, { shell: true });
  const keep = (screen) => (chunk) => {
    file.write(chunk);
    screen.write(chunk);
  };
  child.stdout.on("data", keep(process.stdout));
  child.stderr.on("data", keep(process.stderr));
  child.on("error", (error) => file.write(`\n${failureLabel}: ${error.stack}\n`));

  child.on("close", (code, signal) => {
    file.end(`\nSaiu com o código ${code}, sinal ${signal}.\n`, () => {
      if (code === 0) process.exit(0);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const failure = join(outputDir, `falha-${stamp}.txt`);
      copyFileSync(lastRun, failure);
      process.stderr.write(`\nSaída completa da falha em ${failure}\n`);
      process.exit(code ?? 1);
    });
  });
}
