import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";
import {
  colorIndexOf,
  colorShortcutEffect,
  normalizeShortcut,
  parseShortcuts,
  SHORTCUT_ACTIONS,
  shortcutsInUseMessage,
} from "./shortcuts";

const defaults = DEFAULT_SETTINGS.shortcuts;

describe("normalizeShortcut", () => {
  it("writes combinations the standard way", () => {
    expect(normalizeShortcut("ctrl + alt + shift + p")).toBe("Ctrl+Shift+Alt+P");
    expect(normalizeShortcut("Control+Alt+9")).toBe("Ctrl+Alt+9");
    expect(normalizeShortcut("Win+F12")).toBe("Super+F12");
    expect(normalizeShortcut("Ctrl+Ctrl+K")).toBe("Ctrl+K");
  });

  it("keeps every default as it is", () => {
    for (const action of SHORTCUT_ACTIONS) {
      expect(normalizeShortcut(defaults[action])).toBe(defaults[action]);
    }
  });

  it("refuses combinations that would steal plain typing", () => {
    expect(normalizeShortcut("P")).toBeNull();
    expect(normalizeShortcut("Shift+P")).toBeNull();
  });

  it("refuses unknown modifiers and keys", () => {
    for (const bad of ["", "Ctrl+", "Ctrl+Alt", "Hyper+P", "Ctrl+Enter", "Ctrl+F25", "Ctrl+PP"]) {
      expect(normalizeShortcut(bad)).toBeNull();
    }
  });
});

describe("parseShortcuts", () => {
  it("keeps the defaults for missing actions", () => {
    expect(parseShortcuts({ togglePomodoro: "Ctrl+Alt+F9" }, defaults)).toEqual({
      shortcuts: { ...defaults, togglePomodoro: "Ctrl+Alt+F9" },
      problems: [],
    });
  });

  it("turns an action off with an empty text", () => {
    expect(parseShortcuts({ openColor4: "" }, defaults).shortcuts.openColor4).toBe("");
  });

  it("keeps the default for an invalid combination and explains it", () => {
    const { shortcuts, problems } = parseShortcuts(
      { openColor2: "Shift+2", openColor3: 3 },
      defaults,
    );
    expect(shortcuts).toEqual(defaults);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('"openColor2"');
    expect(problems[0]).toContain(defaults.openColor2);
  });

  it("goes back to the defaults when two actions share a combination", () => {
    const { shortcuts, problems } = parseShortcuts(
      { togglePomodoro: defaults.openColor1 },
      defaults,
    );
    expect(shortcuts).toEqual(defaults);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(defaults.openColor1);
  });

  it("does not count turned-off actions as repeated", () => {
    expect(parseShortcuts({ openColor1: "", openColor2: "" }, defaults).problems).toEqual([]);
  });

  it("refuses a value that is not an object", () => {
    for (const bad of ["Ctrl+1", null, [], 7]) {
      const { shortcuts, problems } = parseShortcuts(bad, defaults);
      expect(shortcuts).toEqual(defaults);
      expect(problems).toHaveLength(1);
    }
  });
});

describe("colorIndexOf", () => {
  it("gives the chamber of each color action, from the top", () => {
    expect(colorIndexOf("openColor1")).toBe(0);
    expect(colorIndexOf("openColor4")).toBe(3);
    expect(colorIndexOf("togglePomodoro")).toBeNull();
  });
});

describe("colorShortcutEffect", () => {
  it("collapses the note only when it is open and the app has focus", () => {
    expect(colorShortcutEffect("red", { openColorId: "red", focused: true })).toBe("collapse");
  });

  it("opens (and takes focus) in every other case", () => {
    expect(colorShortcutEffect("red", { openColorId: "red", focused: false })).toBe("open");
    expect(colorShortcutEffect("red", { openColorId: "blue", focused: true })).toBe("open");
    expect(colorShortcutEffect("red", { openColorId: null, focused: false })).toBe("open");
  });
});

describe("shortcutsInUseMessage", () => {
  it("says nothing when every shortcut works", () => {
    expect(shortcutsInUseMessage([])).toBeNull();
  });

  it("names the combinations in use and where to change them", () => {
    expect(shortcutsInUseMessage(["Ctrl+Alt+1"])).toContain("Ctrl+Alt+1 já está em uso");
    const many = shortcutsInUseMessage(["Ctrl+Alt+1", "Ctrl+Alt+2"]);
    expect(many).toContain("Ctrl+Alt+1, Ctrl+Alt+2");
    expect(many).toContain("configuracoes.json");
  });
});
