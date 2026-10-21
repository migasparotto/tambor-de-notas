import { describe, expect, it } from "vitest";
import { noteFileBase, parseNote, serializeNote, type Note } from "./noteFile";

const note: Note = {
  id: "8f1c",
  colorId: "red",
  text: '# Aula de Python: "listas" 🐍\n## Listas\nCriar: [1, 2]',
  createdAt: "2026-10-21T19:05:00.000Z",
  updatedAt: "2026-10-21T19:30:00.000Z",
};

describe("serializeNote", () => {
  it("writes the frontmatter and the text as Markdown", () => {
    expect(serializeNote(note)).toBe(
      [
        "---",
        'id: "8f1c"',
        'title: "Aula de Python: \\"listas\\" 🐍"',
        'color: "red"',
        'createdAt: "2026-10-21T19:05:00.000Z"',
        'updatedAt: "2026-10-21T19:30:00.000Z"',
        "---",
        '# Aula de Python: "listas" 🐍',
        "## Listas",
        "Criar: [1, 2]",
      ].join("\n"),
    );
  });

  it("writes an empty title for an empty note", () => {
    expect(serializeNote({ ...note, text: "" })).toContain('title: ""');
  });
});

describe("parseNote", () => {
  it("reads back exactly the note that was saved", () => {
    expect(parseNote(serializeNote(note))).toEqual(note);
  });

  it("keeps a body that contains --- lines", () => {
    const withRule = { ...note, text: "# Título\nantes\n---\ndepois" };
    expect(parseNote(serializeNote(withRule))).toEqual(withRule);
  });

  it("accepts Windows line endings", () => {
    const content = serializeNote(note).replace(/\n/g, "\r\n");
    expect(parseNote(content)).toEqual(note);
  });

  it("accepts unquoted values and ignores unknown fields", () => {
    const content = [
      "---",
      "id: 8f1c",
      "color: red",
      "createdAt: 2026-10-21T19:05:00.000Z",
      "updatedAt: 2026-10-21T19:30:00.000Z",
      'subject: "Cálculo"',
      "---",
      "Título",
    ].join("\n");
    expect(parseNote(content)).toMatchObject({ id: "8f1c", colorId: "red", text: "Título" });
  });

  it("refuses a file without frontmatter", () => {
    expect(() => parseNote("só texto")).toThrow("cabeçalho");
    expect(() => parseNote("---\nid: x\nsem fim")).toThrow("cabeçalho");
  });

  it("refuses a frontmatter without a required field", () => {
    expect(() => parseNote('---\nid: "x"\n---\ntexto')).toThrow('"color"');
  });
});

describe("noteFileBase", () => {
  const october = new Date(2026, 9, 21, 16, 5);

  it("is year-month, color and title", () => {
    expect(noteFileBase(october, "Vermelho", "Aula de Python")).toBe(
      "2026-10 vermelho - Aula de Python",
    );
  });

  it("uses 'sem título' while there is no title", () => {
    expect(noteFileBase(october, "Azul", "")).toBe("2026-10 azul - sem título");
  });

  it("pads the month with a zero", () => {
    expect(noteFileBase(new Date(2027, 0, 5), "Verde", "x")).toBe("2027-01 verde - x");
  });
});
