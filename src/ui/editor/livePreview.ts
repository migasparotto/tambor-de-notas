import { ensureSyntaxTree } from "@codemirror/language";
import type { EditorState, Extension, Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { showsSymbols, type Span } from "../../domain/livePreview";
import type { SymbolsMode } from "../../domain/settings";

// "Live preview": the document is the Markdown itself; here the symbols (#, **, `, [](), -, ---)
// are hidden and the text is styled, except where the settings say they should show.

class TextWidget extends WidgetType {
  constructor(
    private readonly text: string,
    private readonly className: string,
  ) {
    super();
  }
  eq(other: TextWidget) {
    return other.text === this.text && other.className === this.className;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = this.className;
    span.textContent = this.text;
    return span;
  }
}

const hide = Decoration.replace({ kind: "hide" });
const bullet = Decoration.replace({ kind: "bullet", widget: new TextWidget("•", "cm-bullet") });
const rule = Decoration.replace({ kind: "rule", widget: new TextWidget("", "cm-rule") });
const titlePlaceholder = Decoration.widget({
  kind: "placeholder",
  side: 1,
  widget: new TextWidget("Título…", "cm-title-placeholder"),
});
const style = (className: string) => Decoration.mark({ class: className, kind: className });
const lineStyle = (className: string) => Decoration.line({ class: className, kind: className });

const HEADING_LEVEL: Record<string, number> = {
  ATXHeading1: 1,
  ATXHeading2: 2,
  ATXHeading3: 3,
  ATXHeading4: 3,
  ATXHeading5: 3,
  ATXHeading6: 3,
};

/** Computes the live preview for a document (no screen needed, so it can be tested). */
export function previewDecorations(state: EditorState, mode: SymbolsMode): DecorationSet {
  const { doc } = state;
  const cursors = state.selection.ranges.map((r) => r.head);
  const shows = (element: Span) => {
    const line = doc.lineAt(element.from);
    return showsSymbols(mode, element, { from: line.from, to: line.to }, cursors);
  };
  const found: Range<Decoration>[] = [];

  if (doc.line(1).length === 0) found.push(titlePlaceholder.range(0));

  ensureSyntaxTree(state, doc.length)?.iterate({
    enter: (ref) => {
      const node = ref.node;
      const level = HEADING_LEVEL[node.name];
      if (level !== undefined) {
        found.push(lineStyle(`cm-h${level}`).range(doc.lineAt(node.from).from));
        const mark = node.getChild("HeaderMark");
        if (mark && !shows(node)) {
          const spaceAfter = doc.sliceString(mark.to, mark.to + 1) === " " ? 1 : 0;
          found.push(hide.range(mark.from, mark.to + spaceAfter));
        }
        return;
      }

      switch (node.name) {
        case "StrongEmphasis":
        case "Emphasis":
        case "InlineCode": {
          const className = {
            StrongEmphasis: "cm-strong",
            Emphasis: "cm-em",
            InlineCode: "cm-code",
          }[node.name];
          found.push(style(className).range(node.from, node.to));
          if (!shows(node)) {
            const markName = node.name === "InlineCode" ? "CodeMark" : "EmphasisMark";
            for (const mark of node.getChildren(markName))
              found.push(hide.range(mark.from, mark.to));
          }
          return;
        }
        case "Link": {
          const marks = node.getChildren("LinkMark");
          const open = marks[0];
          const close = marks.find((m) => doc.sliceString(m.from, m.to) === "]");
          if (!open || !close) return;
          found.push(style("cm-link").range(open.to, close.from));
          if (!shows(node)) {
            found.push(hide.range(open.from, open.to));
            found.push(hide.range(close.from, node.to));
          }
          return false; // the link text is styled as a whole
        }
        case "ListMark": {
          const isBullet = node.parent?.parent?.name === "BulletList";
          const line = doc.lineAt(node.from);
          if (isBullet && !shows({ from: node.from, to: line.to })) {
            found.push(bullet.range(node.from, node.to));
          }
          return;
        }
        case "HorizontalRule": {
          if (!shows(node)) found.push(rule.range(node.from, node.to));
          return;
        }
        case "FencedCode": {
          for (let pos = node.from; pos <= node.to;) {
            const line = doc.lineAt(pos);
            found.push(lineStyle("cm-codeblock").range(line.from));
            pos = line.to + 1;
          }
          return false;
        }
      }
    },
  });

  return Decoration.set(found, true);
}

/** The live preview as an editor extension, redrawn when the text or the cursor changes. */
export function livePreview(mode: SymbolsMode): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = previewDecorations(view.state, mode);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = previewDecorations(update.state, mode);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
