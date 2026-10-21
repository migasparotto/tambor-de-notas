import { EditorSelection, EditorState, type TransactionSpec } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { describe, expect, it } from "vitest";
import { subtitleOnLeave, titleMark, toggleMark } from "./editingRules";

/** An editor state with the rules, and the cursor at `cursor` (default: end). */
function editor(doc: string, cursor = doc.length, to = cursor) {
  return EditorState.create({
    doc,
    selection: EditorSelection.single(cursor, to),
    extensions: [markdown(), titleMark, subtitleOnLeave],
  });
}

const apply = (state: EditorState, spec: TransactionSpec) => state.update(spec).state;
const type = (state: EditorState, text: string) => {
  const at = state.selection.main.head;
  return apply(state, {
    changes: { from: at, insert: text },
    selection: { anchor: at + text.length },
    userEvent: "input.type",
  });
};
const run = (state: EditorState, command: ReturnType<typeof toggleMark>) => {
  let next = state;
  command({ state, dispatch: (tr) => (next = tr.state) });
  return next;
};

describe("titleMark", () => {
  it("adds '# ' when the first letter of the title is typed, keeping the cursor after it", () => {
    const state = type(editor(""), "A");
    expect(state.doc.toString()).toBe("# A");
    expect(state.selection.main.head).toBe(3);
  });

  it("keeps the title while it is typed", () => {
    let state = editor("");
    for (const letter of "Aula") state = type(state, letter);
    expect(state.doc.toString()).toBe("# Aula");
  });

  it("lets the title be erased letter by letter", () => {
    let state = editor("# A\ncorpo", 3);
    state = apply(state, { changes: { from: 2, to: 3 }, userEvent: "delete.backward" });
    expect(state.doc.toString()).toBe("\ncorpo");
  });

  it("leaves the text alone while an accented letter is being composed", () => {
    const state = apply(editor(""), {
      changes: { from: 0, insert: "á" },
      userEvent: "input.type.compose",
    });
    expect(state.doc.toString()).toBe("á");
  });

  it("does not touch the other lines", () => {
    const state = type(editor("# Aula\n"), "texto");
    expect(state.doc.toString()).toBe("# Aula\ntexto");
  });
});

describe("subtitleOnLeave", () => {
  it("turns +texto+ into ## texto when Enter moves to a new line", () => {
    const state = type(editor("# Aula\n+Listas+"), "\n");
    expect(state.doc.toString()).toBe("# Aula\n## Listas\n");
    expect(state.selection.main.head).toBe(state.doc.length);
  });

  it("also converts when the cursor moves away with the arrows or a click", () => {
    const onSubtitle = editor("# Aula\n+Listas+\nfim", "# Aula\n+Lis".length);
    const state = apply(onSubtitle, { selection: { anchor: 3 } });
    expect(state.doc.toString()).toBe("# Aula\n## Listas\nfim");
  });

  it("waits while the cursor is still on the line", () => {
    const state = type(editor("# Aula\n+Listas"), "+");
    expect(state.doc.toString()).toBe("# Aula\n+Listas+");
  });

  it("leaves 2+2, C++ and the title line alone", () => {
    for (const line of ["2+2 = 4", "C++", "+C++"]) {
      const state = type(editor(`# Aula\n${line}`), "\n");
      expect(state.doc.toString()).toBe(`# Aula\n${line}\n`);
    }
    const title = apply(editor("# +Título+\nx", 5), { selection: { anchor: 12 } });
    expect(title.doc.toString()).toBe("# +Título+\nx");
  });
});

describe("toggleMark (Ctrl+B / Ctrl+I)", () => {
  it("puts ** around the selection, keeping it selected", () => {
    const state = run(editor("# T\nvai negrito aqui", 8, 15), toggleMark("**"));
    expect(state.doc.toString()).toBe("# T\nvai **negrito** aqui");
    expect(state.sliceDoc(state.selection.main.from, state.selection.main.to)).toBe("negrito");
  });

  it("removes ** when the selection is already bold", () => {
    const bold = run(editor("# T\nvai negrito aqui", 8, 15), toggleMark("**"));
    expect(run(bold, toggleMark("**")).doc.toString()).toBe("# T\nvai negrito aqui");
  });

  it("with nothing selected, inserts the pair with the cursor inside", () => {
    const state = run(editor("# T\n"), toggleMark("*"));
    expect(state.doc.toString()).toBe("# T\n**");
    expect(state.selection.main.head).toBe(5);
  });

  it("does not take italic for half of a bold", () => {
    const bold = run(editor("# T\nvai negrito aqui", 8, 15), toggleMark("**"));
    expect(run(bold, toggleMark("*")).doc.toString()).toBe("# T\nvai ***negrito*** aqui");
  });
});
