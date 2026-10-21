import {
  EditorSelection,
  EditorState,
  Prec,
  type Extension,
  type StateCommand,
} from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { subtitleMarkdown, withTitleMark } from "../../domain/noteText";

/** Accented letters typed with dead keys are "composed"; the document is left alone meanwhile. */
const composing = (tr: { isUserEvent: (event: string) => boolean }) =>
  tr.isUserEvent("input.type.compose");

/** Keeps the first line as a `# título` heading while typing (and empties a line left with only `#`). */
export const titleMark: Extension = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || composing(tr)) return tr;
  const first = tr.newDoc.line(1);
  const fixed = withTitleMark(first.text);
  if (fixed === first.text) return tr;
  const change =
    fixed === ""
      ? { from: first.from, to: first.to }
      : { from: first.from, insert: fixed.slice(0, fixed.length - first.text.length) };
  return [tr, { changes: change, sequential: true }];
});

/** A whole `+texto+` line becomes `## texto` when the cursor leaves it (Enter, arrows, click). */
export const subtitleOnLeave: Extension = EditorState.transactionFilter.of((tr) => {
  if (composing(tr)) return tr;
  const oldLine = tr.startState.doc.lineAt(tr.startState.selection.main.head);
  if (oldLine.number === 1) return tr;
  const line = tr.newDoc.lineAt(tr.changes.mapPos(oldLine.from));
  if (line.number === tr.newDoc.lineAt(tr.newSelection.main.head).number) return tr;
  const subtitle = subtitleMarkdown(line.text);
  if (subtitle === null) return tr;
  return [tr, { changes: { from: line.from, to: line.to, insert: subtitle }, sequential: true }];
});

/**
 * Puts `mark` around each selection (or removes it, if the selection is already
 * between marks). With nothing selected, inserts the pair and leaves the cursor inside.
 */
export function toggleMark(mark: string): StateCommand {
  const n = mark.length;
  return ({ state, dispatch }) => {
    const doc = state.doc;
    const isMarked = (from: number, to: number) =>
      from >= n &&
      doc.sliceString(from - n, from) === mark &&
      doc.sliceString(to, to + n) === mark &&
      // "*" must not be half of a "**" (bold).
      (n > 1 ||
        (doc.sliceString(from - 2, from - 1) !== "*" && doc.sliceString(to + 1, to + 2) !== "*"));

    dispatch(
      state.update(
        state.changeByRange((range) => {
          if (isMarked(range.from, range.to)) {
            return {
              changes: [
                { from: range.from - n, to: range.from },
                { from: range.to, to: range.to + n },
              ],
              range: EditorSelection.range(range.from - n, range.to - n),
            };
          }
          return {
            changes: [
              { from: range.from, insert: mark },
              { from: range.to, insert: mark },
            ],
            range: EditorSelection.range(range.from + n, range.to + n),
          };
        }),
        { userEvent: "input.format", scrollIntoView: true },
      ),
    );
    return true;
  };
}

/** Ctrl+B (bold) and Ctrl+I (italic). */
export const formattingKeys: Extension = keymap.of([
  { key: "Mod-b", run: toggleMark("**") },
  { key: "Mod-i", run: toggleMark("*") },
]);

/** Calls `onConfirm` when Enter is pressed on the title line; the new line is still inserted. */
export function confirmTitleOnEnter(onConfirm: () => void): Extension {
  return Prec.highest(
    keymap.of([
      {
        key: "Enter",
        run: (view) => {
          if (view.state.doc.lineAt(view.state.selection.main.head).number === 1) onConfirm();
          return false;
        },
      },
    ]),
  );
}
