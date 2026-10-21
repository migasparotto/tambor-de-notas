import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";
import {
  charCount,
  fillLevel,
  markdownToText,
  subtitleOf,
  textToMarkdown,
  titleOf,
} from "./noteText";

describe("titleOf", () => {
  it("is the first line, trimmed", () => {
    expect(titleOf("  Aula de Python \nconteúdo")).toBe("Aula de Python");
  });

  it("is empty for an empty note or an empty first line", () => {
    expect(titleOf("")).toBe("");
    expect(titleOf("\nsó o corpo")).toBe("");
  });
});

describe("subtitleOf", () => {
  it("recognizes a whole line in the +texto+ format", () => {
    expect(subtitleOf("+Listas+")).toBe("Listas");
    expect(subtitleOf("  + Listas e tuplas +  ")).toBe("Listas e tuplas");
  });

  it("ignores + inside ordinary text", () => {
    expect(subtitleOf("2+2")).toBeNull();
    expect(subtitleOf("C++")).toBeNull();
    expect(subtitleOf("+C++")).toBeNull();
    expect(subtitleOf("soma: +1 e +2")).toBeNull();
    expect(subtitleOf("+início+ e mais texto")).toBeNull();
  });

  it("needs something between the plus signs", () => {
    expect(subtitleOf("++")).toBeNull();
    expect(subtitleOf("+ +")).toBeNull();
    expect(subtitleOf("+++")).toBeNull();
  });
});

describe("Markdown conversion", () => {
  const typed = "Aula de Python\n+Listas+\nCriar: [1, 2]\n2+2 = 4\n+Tuplas+";
  const saved = "Aula de Python\n## Listas\nCriar: [1, 2]\n2+2 = 4\n## Tuplas";

  it("saves +texto+ lines as ## texto", () => {
    expect(textToMarkdown(typed)).toBe(saved);
  });

  it("shows ## texto lines as +texto+ again", () => {
    expect(markdownToText(saved)).toBe(typed);
  });

  it("never turns the title line into a subtitle", () => {
    expect(textToMarkdown("+Título+\ncorpo")).toBe("+Título+\ncorpo");
    expect(markdownToText("## Título\ncorpo")).toBe("## Título\ncorpo");
  });
});

describe("charCount", () => {
  it("counts letters, accents and emoji as people see them", () => {
    expect(charCount("")).toBe(0);
    expect(charCount("ação")).toBe(4);
    expect(charCount("🚀👩🏽‍💻")).toBe(2);
    expect(charCount("a\nb")).toBe(3);
  });
});

describe("fillLevel", () => {
  const limit = DEFAULT_SETTINGS.charLimit;

  it("grows with the text, relative to the configured limit", () => {
    expect(fillLevel("", limit)).toBe(0);
    expect(fillLevel("a".repeat(limit / 2), limit)).toBe(0.5);
    expect(fillLevel("a".repeat(limit), limit)).toBe(1);
  });

  it("stops at full when the text goes past the limit", () => {
    expect(fillLevel("a".repeat(limit * 2), limit)).toBe(1);
  });

  it("follows a different limit", () => {
    expect(fillLevel("abcd", 8)).toBe(0.5);
  });
});
