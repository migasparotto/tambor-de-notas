/** A whole line like `+texto+`; the inside cannot start or end with "+", so `+C++` is not one. */
const SUBTITLE_LINE = /^\+([^+](?:.*[^+])?)\+$/;
const MARKDOWN_SUBTITLE = /^## (.+)$/;
const MARKDOWN_TITLE = "# ";

const splitLines = (text: string): string[] => text.split("\n");

/** The note title: its first line, without surrounding spaces. */
export function titleOf(text: string): string {
  return (splitLines(text)[0] ?? "").trim();
}

/** If the whole line is `+texto+`, returns `texto`; otherwise null. */
export function subtitleOf(line: string): string | null {
  const inner = SUBTITLE_LINE.exec(line.trim())?.[1]?.trim();
  return inner ? inner : null;
}

/**
 * Converts the text as typed into the Markdown saved on disk:
 * the first line becomes `# título` and `+texto+` lines become `## texto`.
 */
export function textToMarkdown(text: string): string {
  return splitLines(text)
    .map((line, i) => {
      if (i === 0) return line === "" ? line : MARKDOWN_TITLE + line;
      const subtitle = subtitleOf(line);
      return subtitle === null ? line : `## ${subtitle}`;
    })
    .join("\n");
}

/** Converts the Markdown on disk back into the text shown for editing (the reverse of `textToMarkdown`). */
export function markdownToText(markdown: string): string {
  return splitLines(markdown)
    .map((line, i) => {
      if (i === 0)
        return line.startsWith(MARKDOWN_TITLE) ? line.slice(MARKDOWN_TITLE.length) : line;
      const subtitle = MARKDOWN_SUBTITLE.exec(line)?.[1];
      return subtitle === undefined ? line : `+${subtitle}+`;
    })
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
