import { EditorSelection, EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { describe, expect, it } from "vitest";
import type { SymbolsMode } from "../../domain/settings";
import { DEFAULT_SETTINGS } from "../../domain/settings";
import { previewDecorations } from "./livePreview";

const MODE = DEFAULT_SETTINGS.symbolsMode;

/** What the live preview does to `doc` with the cursor at `cursor`: hidden text, widgets and styles. */
function preview(doc: string, cursor = doc.length, mode: SymbolsMode = MODE) {
  const state = EditorState.create({
    doc,
    selection: EditorSelection.single(cursor),
    extensions: [markdown()],
  });
  const hidden: string[] = [];
  const widgets: string[] = [];
  const styled: string[] = [];
  previewDecorations(state, mode).between(0, doc.length, (from, to, deco) => {
    const kind = (deco.spec as { kind: string }).kind;
    if (kind === "hide") hidden.push(doc.slice(from, to));
    else if (["bullet", "rule", "placeholder"].includes(kind))
      widgets.push(`${kind}:${doc.slice(from, to)}`);
    else
      styled.push(
        `${kind}:${doc.slice(from, from === to ? doc.indexOf("\n", from) : to).replace(/^$/, "")}`,
      );
  });
  return { hidden, widgets, styled, text: state.doc.toString() };
}

describe("previewDecorations", () => {
  it("never changes the text itself", () => {
    const doc = "# Aula\n## Listas\n**negrito** `code` [docs](https://x.org)\n- item\n---";
    expect(preview(doc).text).toBe(doc);
  });

  it("styles the title and hides '# ' while the cursor is elsewhere", () => {
    const { hidden, styled } = preview("# Aula\ntexto");
    expect(hidden).toEqual(["# "]);
    expect(styled).toContain("cm-h1:# Aula");
  });

  it("shows '# ' while the cursor is in the title", () => {
    expect(preview("# Aula\ntexto", 4).hidden).toEqual([]);
  });

  it("styles subtitles and hides '## '", () => {
    const { hidden, styled } = preview("# Aula\n## Listas\nfim");
    expect(hidden).toEqual(["# ", "## "]);
    expect(styled).toContain("cm-h2:## Listas");
  });

  it("hides ** and * only while the cursor is outside that stretch", () => {
    const doc = "# T\nvai **negrito** e *itálico* aqui";
    expect(preview(doc).hidden).toEqual(["# ", "**", "**", "*", "*"]);
    const insideBold = preview(doc, doc.indexOf("negrito") + 2);
    expect(insideBold.hidden).toEqual(["# ", "*", "*"]);
    expect(insideBold.styled).toContain("cm-strong:**negrito**");
  });

  it("hides the backticks of inline code", () => {
    const { hidden, styled } = preview("# T\nuse `print()` aqui");
    expect(hidden).toEqual(["# ", "`", "`"]);
    expect(styled).toContain("cm-code:`print()`");
  });

  it("shows only the text of a link", () => {
    const { hidden, styled } = preview("# T\nveja [docs](https://docs.python.org) já");
    expect(hidden).toEqual(["# ", "[", "](https://docs.python.org)"]);
    expect(styled).toContain("cm-link:docs");
  });

  it("draws a bullet instead of '-' in lists, but keeps numbers", () => {
    const { widgets, hidden } = preview("# T\n- um\n- dois\n1. primeiro\n", 0);
    expect(widgets).toEqual(["bullet:-", "bullet:-"]);
    expect(hidden).toEqual([]);
  });

  it("shows the '-' of the list item being edited", () => {
    const doc = "# T\n- um\n- dois";
    expect(preview(doc).widgets).toEqual(["bullet:-"]);
  });

  it("draws --- as a line", () => {
    expect(preview("# T\nantes\n\n---\n\ndepois").widgets).toEqual(["rule:---"]);
  });

  it("shows 'Título…' while the title is empty", () => {
    expect(preview("\ncorpo", 0).widgets).toEqual(["placeholder:"]);
    expect(preview("# A").widgets).toEqual([]);
  });

  it("leaves +texto+, 2+2, C++ and ~aprox~ as plain text", () => {
    const { hidden, widgets } = preview("# T\n+Listas+\n2+2 e C++ ~aprox~\n", 0);
    expect(hidden).toEqual([]);
    expect(widgets).toEqual([]);
  });

  describe("other modes", () => {
    const doc = "# T\nvai **negrito** aqui";
    const lineStart = doc.indexOf("vai");

    it("line: shows the symbols on the whole cursor line", () => {
      expect(preview(doc, lineStart, "line").hidden).toEqual(["# "]);
    });

    it("never: hides them even with the cursor inside", () => {
      expect(preview(doc, doc.indexOf("negrito") + 2, "never").hidden).toEqual(["# ", "**", "**"]);
    });
  });
});
