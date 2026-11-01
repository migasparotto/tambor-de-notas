// Prints one version's notes from CHANGELOG.md: the CD uses them as the release body.
// Usage: node scripts/release-notes.mjs 0.3.0
import { readFileSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

/** Returns the text under the "## [version]" heading, or null if it is missing or empty. */
export function releaseNotes(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) return null;

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  const notes = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  return notes === "" ? null : notes;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const version = process.argv[2];
  const notes = releaseNotes(readFileSync("CHANGELOG.md", "utf8"), version);
  if (notes === null) {
    process.stdout.write(`::error::O CHANGELOG.md não tem notas para a versão ${version}.\n`);
    process.exit(1);
  }
  process.stdout.write(`${notes}\n`);
}
