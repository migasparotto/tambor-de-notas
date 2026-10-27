import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import type { SymbolsMode } from "../domain/settings";
import {
  confirmTitleOnEnter,
  formattingKeys,
  subtitleOnLeave,
  titleMark,
} from "./editor/editingRules";
import { livePreview } from "./editor/livePreview";

interface NoteEditorProps {
  /** The note Markdown; its first line is the `# título`. */
  text: string;
  /** Called with the whole new Markdown on every change. */
  onChange: (text: string) => void;
  /** Called when Enter is pressed in the title. */
  onConfirmTitle: () => void;
  /** When the Markdown symbols show (from the settings). */
  symbolsMode: SymbolsMode;
  ref?: Ref<NoteEditorHandle>;
}

/** What the panel can ask of the editor. */
export interface NoteEditorHandle {
  /** Puts the keyboard in the editor, at the end of the title line. */
  focusTitle: () => void;
}

const theme = EditorView.theme(
  {
    "&": { height: "100%", color: "rgb(255 255 255 / .9)", fontSize: "14px" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      lineHeight: "1.6",
      scrollbarWidth: "thin",
      scrollbarColor: "rgb(255 255 255 / .3) transparent",
    },
    ".cm-content": { padding: "0", caretColor: "white" },
    ".cm-line": { padding: "0" },
    ".cm-cursor": { borderLeftColor: "white" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgb(255 255 255 / .22) !important",
    },
    ".cm-h1": { fontSize: "19px", fontWeight: "600", color: "white", paddingBottom: "2px" },
    ".cm-h2": { fontSize: "15.5px", fontWeight: "700", color: "white" },
    ".cm-h3": { fontWeight: "700", color: "white" },
    ".cm-strong": { fontWeight: "700" },
    ".cm-em": { fontStyle: "italic" },
    ".cm-code, .cm-codeblock": {
      fontFamily: "Consolas, ui-monospace, monospace",
      fontSize: "13px",
      backgroundColor: "rgb(0 0 0 / .25)",
      borderRadius: "3px",
    },
    ".cm-link": { color: "#9cc7ff", textDecoration: "underline" },
    ".cm-bullet": { color: "rgb(255 255 255 / .7)" },
    ".cm-rule": {
      display: "inline-block",
      width: "100%",
      verticalAlign: "middle",
      borderTop: "1px solid rgb(255 255 255 / .35)",
    },
    ".cm-title-placeholder": {
      fontSize: "19px",
      fontWeight: "600",
      color: "rgb(255 255 255 / .4)",
      pointerEvents: "none",
    },
  },
  { dark: true },
);

/**
 * The note editor (CodeMirror 6). It edits the Markdown itself and shows it formatted,
 * hiding the symbols ("live preview"). Its contract is `text` in and `onChange` out,
 * the same as the simple field it replaced.
 */
export function NoteEditor({ text, onChange, onConfirmTitle, symbolsMode, ref }: NoteEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  useImperativeHandle(ref, () => ({
    focusTitle: () => {
      const view = editor.current;
      if (!view) return;
      view.dispatch({ selection: { anchor: view.state.doc.line(1).to } });
      view.focus();
    },
  }));
  // The editor is created once; these refs always point to the latest callbacks.
  const callbacks = useRef({ onChange, onConfirmTitle });
  useEffect(() => {
    callbacks.current = { onChange, onConfirmTitle };
  });

  useEffect(() => {
    if (!host.current) return;
    // Start in the title for a new note, or at the end of the text for an existing one.
    const start = text === "" ? 0 : text.length;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: text,
        selection: { anchor: start },
        extensions: [
          confirmTitleOnEnter(() => callbacks.current.onConfirmTitle()),
          formattingKeys,
          history(),
          keymap.of([...historyKeymap, ...defaultKeymap]),
          markdown(),
          titleMark,
          subtitleOnLeave,
          livePreview(symbolsMode),
          theme,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": "Texto da nota", spellcheck: "true" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    editor.current = view;
    view.focus();
    return () => {
      editor.current = null;
      view.destroy();
    };
    // The editor is created when the panel opens; later changes come from the editor itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="min-h-0 flex-1 overflow-hidden" />;
}
