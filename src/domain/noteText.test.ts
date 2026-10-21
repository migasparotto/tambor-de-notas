import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";
import {
  charCount,
  fillLevel,
  subtitleMarkdown,
  subtitleOf,
  titleOf,
  toDiskMarkdown,
  withTitleMark,
} from "./noteText";

describe("titleOf", () => {
  it("is the first line without the # mark", () => {
    expect(titleOf("# Aula de Python \n## Listas")).toBe("Aula de Python");
  });

  it("also reads a first line without the mark", () => {
    expect(titleOf("Aula\ncorpo")).toBe("Aula");
  });

  it("is empty for an empty note or an empty first line", () => {
    expect(titleOf("")).toBe("");
    expect(titleOf("\nsó o corpo")).toBe("");
  });
});

describe("withTitleMark", () => {
  it("adds # to the title line", () => {
    expect(withTitleMark("Aula")).toBe("# Aula");
  });

  it("keeps a line that already has it", () => {
    expect(withTitleMark("# Aula")).toBe("# Aula");
  });

  it("leaves an empty line empty, and empties a line left with only #", () => {
    expect(withTitleMark("")).toBe("");
    expect(withTitleMark("#")).toBe("");
    expect(withTitleMark("# ")).toBe("");
  });
});

describe("subtitleOf", () => {
  it("recognizes a whole line in the +texto+ format", () => {
    expect(subtitleOf("+Listas+")).toBe("Listas");
    expect(subtitleOf("  + Listas e tuplas +  ")).toBe("Listas e tuplas");
    expect(subtitleMarkdown("+Listas+")).toBe("## Listas");
  });

  it("ignores + inside ordinary text", () => {
    expect(subtitleOf("2+2")).toBeNull();
    expect(subtitleOf("C++")).toBeNull();
    expect(subtitleOf("+C++")).toBeNull();
    expect(subtitleOf("soma: +1 e +2")).toBeNull();
    expect(subtitleOf("+início+ e mais texto")).toBeNull();
    expect(subtitleMarkdown("2+2")).toBeNull();
  });

  it("needs something between the plus signs", () => {
    expect(subtitleOf("++")).toBeNull();
    expect(subtitleOf("+ +")).toBeNull();
    expect(subtitleOf("+++")).toBeNull();
  });
});

describe("toDiskMarkdown", () => {
  it("keeps Markdown that is already right exactly as it is", () => {
    const md = "# Aula de Python — ação 🐍\n## Listas\nCriar: [1, 2]\n2+2 = 4, a*b, x < y ~aprox~";
    expect(toDiskMarkdown(md)).toBe(md);
  });

  it("adds the title mark and converts a +texto+ line still being typed", () => {
    expect(toDiskMarkdown("Aula\n+Listas+\ncorpo")).toBe("# Aula\n## Listas\ncorpo");
  });

  it("never turns the title line into a subtitle", () => {
    expect(toDiskMarkdown("+Título+\ncorpo")).toBe("# +Título+\ncorpo");
  });

  it("changes nothing when run twice", () => {
    const once = toDiskMarkdown("Aula\n+Listas+\n- item");
    expect(toDiskMarkdown(once)).toBe(once);
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
