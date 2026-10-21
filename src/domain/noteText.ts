// The note text is the Markdown itself: the first line is the title (`# título`),
// and `## texto` lines are subtitles. The editor shows it formatted (live preview).

/** A whole line like `+texto+`; the inside cannot start or end with "+", so `+C++` is not one. */
const SUBTITLE_LINE = /^\+([^+](?:.*[^+])?)\+$/;
const TITLE_MARK = "# ";

const splitLines = (text: string): string[] => text.split("\n");

/** The note title: its first line, without the `# ` mark and surrounding spaces. */
export function titleOf(text: string): string {
  const first = splitLines(text)[0] ?? "";
  return (first.startsWith(TITLE_MARK) ? first.slice(TITLE_MARK.length) : first).trim();
}

/**
 * The first line as a `# título` heading. A line left with only `#` (the title was
 * deleted) becomes empty, so the title can be erased letter by letter.
 */
export function withTitleMark(line: string): string {
  if (/^#\s*$/.test(line)) return "";
  if (line === "" || line.startsWith(TITLE_MARK)) return line;
  return TITLE_MARK + line;
}

/** If the whole line is `+texto+`, returns `texto`; otherwise null. */
export function subtitleOf(line: string): string | null {
  const inner = SUBTITLE_LINE.exec(line.trim())?.[1]?.trim();
  return inner ? inner : null;
}

/** The `## texto` line for a `+texto+` line, or null if it is not one. */
export function subtitleMarkdown(line: string): string | null {
  const subtitle = subtitleOf(line);
  return subtitle === null ? null : `## ${subtitle}`;
}

/**
 * The Markdown saved on disk. The editor already writes `# título` and turns `+texto+`
 * into `## texto` when the cursor leaves the line; this also covers a line still being
 * typed when the note is saved. Running it twice changes nothing.
 */
export function toDiskMarkdown(text: string): string {
  return splitLines(text)
    .map((line, i) => (i === 0 ? withTitleMark(line) : (subtitleMarkdown(line) ?? line)))
    .join("\n");
}

const graphemes = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });

/** Characters as a person counts them: an accented letter or an emoji like 👩🏽‍💻 counts as one. */
export function charCount(text: string): number {
  return Array.from(graphemes.segment(text)).length;
}

/** How full the chamber is, from 0 (empty) to 1 (reached the character limit). */
export function fillLevel(text: string, charLimit: number): number {
  if (charLimit <= 0) return 1;
  return Math.min(charCount(text) / charLimit, 1);
}
