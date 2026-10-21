import type { SymbolsMode } from "./settings";

/** A stretch of the document, as character positions. */
export interface Span {
  from: number;
  to: number;
}

/**
 * Whether a formatted element (a heading, a bold stretch, a link...) shows its Markdown
 * symbols, given the mode and where the cursors are. `element` is the whole element,
 * symbols included; `line` is the line it starts on.
 */
export function showsSymbols(
  mode: SymbolsMode,
  element: Span,
  line: Span,
  cursors: readonly number[],
): boolean {
  if (mode === "never") return false;
  const area = mode === "element" ? element : line;
  return cursors.some((c) => c >= area.from && c <= area.to);
}
