import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import { findInRepository, findProblems } from "./caminhos.mjs";

const B = String.fromCharCode(92); // a backslash, built so this file does not break its own rules

describe("findProblems", () => {
  it("finds a broken path, where the backslash after C: was lost", () => {
    expect(findProblems(`worktree em C:Projetosminhas-skills`)).toHaveLength(1);
  });

  it("finds personal paths in the three spellings", () => {
    for (const path of [`C:${B}Users${B}fulano`, "C:/Users/fulano", "/c/Users/fulano"]) {
      expect(findProblems(`em ${path}${B}notas`)).toHaveLength(1);
    }
  });

  it("accepts relative paths, ~, other drives' folders and text that only looks similar", () => {
    const ok = [
      "~/.claude/skills",
      `C:${B}Projetos${B}tambor-de-notas`,
      "C:/Dados/notas/a.md",
      "%USERPROFILE%",
      'toSafeFileName("a<b>c:d")',
      "http://localhost:1420",
    ];
    for (const line of ok) expect(findProblems(line)).toEqual([]);
  });

  it("gives the line number", () => {
    expect(findProblems(`ok\nok\n/c/Users/x`)[0]?.line).toBe(3);
  });
});

describe("the repository", () => {
  it("has no broken or personal path in its versioned files", () => {
    const root = fileURLToPath(new URL("..", import.meta.url));
    expect(findInRepository(root)).toEqual([]);
  });
});
