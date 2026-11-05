// Finds, in the versioned files, Windows paths that are broken (a "C:" glued to a letter, with the
// backslash lost) or personal (a user folder, which exposes the user name in a public repository).
// Use relative paths or ~ instead. Run by its test (scripts/caminhos.test.mjs) in `npm test`.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BACKSLASH = String.fromCharCode(92);
const SEP = `[${BACKSLASH}${BACKSLASH}/]`;

/** The rules, each with a name and the pattern that breaks it. */
export const RULES = [
  { name: "caminho quebrado (C: seguido de letra, sem barra)", pattern: /(?<![A-Za-z])C:[A-Za-z]/ },
  {
    name: "caminho pessoal (pasta de usuário)",
    pattern: new RegExp(`[Cc]:${SEP}+Users${SEP}|/c/Users/`, "i"),
  },
];

/** Problems in one file's text: { line, rule, text } for each line that breaks a rule. */
export function findProblems(text) {
  const problems = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line))
        problems.push({ line: index + 1, rule: rule.name, text: line.trim() });
    }
  });
  return problems;
}

/** Problems in every versioned text file of the repository at `root` (lockfiles skipped). */
export function findInRepository(root) {
  const files = execFileSync("git", ["-C", root, "ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter((f) => f && !/(^|\/)(package-lock\.json|Cargo\.lock)$/.test(f));
  const problems = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(join(root, file), "utf8");
    } catch {
      continue; // listed but missing (deleted, not yet committed)
    }
    if (text.includes("\0")) continue; // binary
    for (const p of findProblems(text)) problems.push({ file, ...p });
  }
  return problems;
}
