/**
 * What a global shortcut does. `openColorN` opens the note of the Nth color chamber,
 * counting from the top, so the shortcut follows the chamber if its color changes.
 */
export type ShortcutAction =
  "openColor1" | "openColor2" | "openColor3" | "openColor4" | "togglePomodoro";

/** The key combination of each action, like "Ctrl+Shift+Alt+1". An empty text turns it off. */
export type Shortcuts = Record<ShortcutAction, string>;

/** Every action, in the order they appear in the settings file. */
export const SHORTCUT_ACTIONS: readonly ShortcutAction[] = [
  "openColor1",
  "openColor2",
  "openColor3",
  "openColor4",
  "togglePomodoro",
];

/** Index (0 = top) of the color chamber an action opens, or null if it is not a color action. */
export function colorIndexOf(action: ShortcutAction): number | null {
  const match = /^openColor(\d)$/.exec(action);
  return match ? Number(match[1]) - 1 : null;
}

/** Accepted spellings of each modifier, in the order they are written back. */
const MODIFIERS: readonly { name: string; spellings: readonly string[] }[] = [
  { name: "Ctrl", spellings: ["ctrl", "control"] },
  { name: "Shift", spellings: ["shift"] },
  { name: "Alt", spellings: ["alt"] },
  { name: "Super", spellings: ["super", "win", "meta"] },
];

/** Keys a shortcut can end with: a letter, a digit or F1 to F24. */
const KEY = /^([a-z]|[0-9]|f([1-9]|1[0-9]|2[0-4]))$/i;

/**
 * Checks a key combination and writes it the standard way ("ctrl + alt + p" → "Ctrl+Alt+P").
 * It needs Ctrl, Alt or Super, so it never steals plain typing. Returns null if invalid.
 */
export function normalizeShortcut(text: string): string | null {
  const parts = text.split("+").map((part) => part.trim().toLowerCase());
  const key = parts.pop();
  if (key === undefined || !KEY.test(key)) return null;

  const used = new Set<string>();
  for (const part of parts) {
    const modifier = MODIFIERS.find((m) => m.spellings.includes(part));
    if (!modifier) return null;
    used.add(modifier.name);
  }
  if (!used.has("Ctrl") && !used.has("Alt") && !used.has("Super")) return null;

  const names = MODIFIERS.map((m) => m.name).filter((name) => used.has(name));
  return [...names, key.toUpperCase()].join("+");
}

/**
 * Reads the `shortcuts` setting. Missing actions keep their default; an invalid
 * combination keeps the default and is explained. If two actions end up with the
 * same combination, all shortcuts go back to the defaults, since one would hide the other.
 */
export function parseShortcuts(
  value: unknown,
  defaults: Readonly<Shortcuts>,
): { shortcuts: Shortcuts; problems: string[] } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      shortcuts: { ...defaults },
      problems: ['"shortcuts" não tem o formato esperado; usando os atalhos padrão.'],
    };
  }

  const shortcuts: Shortcuts = { ...defaults };
  const problems: string[] = [];
  const saved = value as Record<string, unknown>;
  for (const action of SHORTCUT_ACTIONS) {
    const text = saved[action];
    if (text === undefined) continue;
    const normalized =
      typeof text === "string" ? (text.trim() === "" ? "" : normalizeShortcut(text)) : null;
    if (normalized === null) {
      problems.push(
        `O atalho "${action}" tem uma combinação inválida (${JSON.stringify(text)}); usando ${defaults[action]}. Use Ctrl, Alt ou Super com uma letra, um número ou F1 a F24.`,
      );
    } else {
      shortcuts[action] = normalized;
    }
  }

  const repeated = repeatedCombinations(shortcuts);
  if (repeated.length > 0) {
    problems.push(
      `A combinação ${repeated.join(", ")} aparece em mais de um atalho; usando os atalhos padrão.`,
    );
    return { shortcuts: { ...defaults }, problems };
  }
  return { shortcuts, problems };
}

/** Combinations used by more than one action (turned-off actions do not count). */
function repeatedCombinations(shortcuts: Shortcuts): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const action of SHORTCUT_ACTIONS) {
    const combination = shortcuts[action];
    if (combination === "") continue;
    if (seen.has(combination)) repeated.add(combination);
    seen.add(combination);
  }
  return [...repeated];
}

/**
 * What a color shortcut does: if that note is already open and the app has focus,
 * it collapses the panel (back to the video); otherwise it opens the note and takes focus.
 */
export function colorShortcutEffect(
  colorId: string,
  current: { openColorId: string | null; focused: boolean },
): "open" | "collapse" {
  return current.openColorId === colorId && current.focused ? "collapse" : "open";
}

/** The warning shown when other programs already use some of the combinations. */
export function shortcutsInUseMessage(combinations: readonly string[]): string | null {
  if (combinations.length === 0) return null;
  const list = combinations.join(", ");
  return combinations.length === 1
    ? `O atalho ${list} já está em uso por outro programa. Escolha outro em configuracoes.json.`
    : `Os atalhos ${list} já estão em uso por outros programas. Escolha outros em configuracoes.json.`;
}
