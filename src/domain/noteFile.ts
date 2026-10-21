import { markdownToText, textToMarkdown, titleOf } from "./noteText";

/** A note as the app holds it. `text` is what the user typed (with `+subtitle+` lines). */
export interface Note {
  id: string;
  /** Id of the note color; never changes after the note is created. */
  colorId: string;
  text: string;
  /** ISO dates, e.g. "2026-10-21T19:05:00.000Z". */
  createdAt: string;
  updatedAt: string;
}

const FENCE = "---";
const FIELDS = ["id", "title", "color", "createdAt", "updatedAt"] as const;
const UNTITLED = "sem título";

/** Turns a note into the `.md` file content: frontmatter, then the Markdown text. */
export function serializeNote(note: Note): string {
  const values: Record<(typeof FIELDS)[number], string> = {
    id: note.id,
    title: titleOf(note.text),
    color: note.colorId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
  // JSON strings are valid YAML, so quotes, colons and emoji in the title are safe.
  const header = FIELDS.map((field) => `${field}: ${JSON.stringify(values[field])}`);
  return [FENCE, ...header, FENCE, textToMarkdown(note.text)].join("\n");
}

/** Reads a `.md` file back into a note. Throws if the frontmatter is missing or incomplete. */
export function parseNote(content: string): Note {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const end = lines.indexOf(FENCE, 1);
  if (lines[0] !== FENCE || end === -1) throw new Error("Nota sem cabeçalho (frontmatter)");

  const fields = new Map<string, string>();
  for (const line of lines.slice(1, end)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const raw = line.slice(colon + 1).trim();
    fields.set(line.slice(0, colon).trim(), raw.startsWith('"') ? String(JSON.parse(raw)) : raw);
  }

  const field = (name: string): string => {
    const value = fields.get(name);
    if (value === undefined) throw new Error(`Nota sem o campo "${name}" no cabeçalho`);
    return value;
  };
  return {
    id: field("id"),
    colorId: field("color"),
    text: markdownToText(lines.slice(end + 1).join("\n")),
    createdAt: field("createdAt"),
    updatedAt: field("updatedAt"),
  };
}

/**
 * The file name (without extension) for a note: `AAAA-MM cor - título`,
 * using the month the note was created, in local time. Empty title → "sem título".
 */
export function noteFileBase(createdAt: Date, colorName: string, title: string): string {
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  return `${year}-${month} ${colorName.toLowerCase()} - ${title || UNTITLED}`;
}
