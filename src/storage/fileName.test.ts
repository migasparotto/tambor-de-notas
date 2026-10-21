import { describe, expect, it } from "vitest";
import { toSafeFileName, uniqueFileName } from "./fileName";

describe("toSafeFileName", () => {
  it("keeps a normal title, with accents and emoji", () => {
    expect(toSafeFileName("Derivadas e integrais — revisão 🚀")).toBe(
      "Derivadas e integrais — revisão 🚀",
    );
  });

  it("replaces every character Windows rejects", () => {
    expect(toSafeFileName('a<b>c:d"e/f\\g|h?i*j')).toBe("a b c d e f g h i j");
  });

  it("removes control characters and squeezes spaces", () => {
    expect(toSafeFileName("  linha\num \t  dois  ")).toBe("linha um dois");
  });

  it("drops trailing dots and spaces", () => {
    expect(toSafeFileName("Fim da aula... ")).toBe("Fim da aula");
  });

  it("uses a fallback when nothing is left", () => {
    expect(toSafeFileName("")).toBe("nota");
    expect(toSafeFileName("???")).toBe("nota");
    expect(toSafeFileName(" . . ")).toBe("nota");
  });

  it("avoids names Windows reserves for devices", () => {
    expect(toSafeFileName("CON")).toBe("CON_");
    expect(toSafeFileName("lpt1")).toBe("lpt1_");
    expect(toSafeFileName("nul.backup")).toBe("nul.backup_");
    expect(toSafeFileName("console")).toBe("console");
  });

  it("limits the length without splitting an emoji", () => {
    const name = toSafeFileName("🚀".repeat(150));
    expect(Array.from(name)).toHaveLength(100);
    expect(name).toBe("🚀".repeat(100));
  });
});

describe("uniqueFileName", () => {
  it("adds the extension when the name is free", () => {
    expect(uniqueFileName("Aula", [])).toBe("Aula.md");
  });

  it("adds a number when the name is taken", () => {
    expect(uniqueFileName("Aula", ["Aula.md"])).toBe("Aula-2.md");
    expect(uniqueFileName("Aula", ["Aula.md", "Aula-2.md"])).toBe("Aula-3.md");
  });

  it("treats names that differ only in case as the same, like Windows", () => {
    expect(uniqueFileName("aula", ["AULA.md"])).toBe("aula-2.md");
  });
});
