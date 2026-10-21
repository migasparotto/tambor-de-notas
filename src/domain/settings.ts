/**
 * When the editor shows Markdown symbols (`#`, `**`...): only while the cursor is inside
 * that heading or bold ("element"), on the whole cursor line ("line"), or never.
 */
export type SymbolsMode = "element" | "line" | "never";

const SYMBOLS_MODES: readonly SymbolsMode[] = ["element", "line", "never"];

/** Settings the user can change. Every default lives here, in one place. */
export interface Settings {
  /** Character limit per note: fills the chamber (stage 1) and triggers auto-send (stage 3). */
  charLimit: number;
  /** Maximum drum height, as a fraction of the screen height. */
  drumHeightFraction: number;
  /** Length of a pomodoro focus period, in minutes. */
  focusMinutes: number;
  /** Length of a pomodoro break, in minutes. */
  breakMinutes: number;
  /** How long after the last change a note is saved by itself, in milliseconds. */
  autosaveDelayMs: number;
  /** How many active notes a color may have at once (stage 2 may show several as tabs). */
  maxActiveNotesPerColor: number;
  /** When the editor shows Markdown symbols. */
  symbolsMode: SymbolsMode;
}

/** Default settings used until the user changes them. */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  charLimit: 300,
  drumHeightFraction: 1 / 3,
  focusMinutes: 25,
  breakMinutes: 5,
  autosaveDelayMs: 1000,
  maxActiveNotesPerColor: 1,
  symbolsMode: "element",
};

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** What makes each setting valid; anything else falls back to the default. */
const VALID: Record<keyof Settings, (value: unknown) => boolean> = {
  charLimit: (v) => isNumber(v) && Number.isInteger(v) && v > 0,
  drumHeightFraction: (v) => isNumber(v) && v > 0 && v <= 1,
  focusMinutes: (v) => isNumber(v) && v > 0,
  breakMinutes: (v) => isNumber(v) && v > 0,
  autosaveDelayMs: (v) => isNumber(v) && v >= 0,
  maxActiveNotesPerColor: (v) => isNumber(v) && Number.isInteger(v) && v >= 1,
  symbolsMode: (v) => SYMBOLS_MODES.includes(v as SymbolsMode),
};

/**
 * Reads the settings file content. Missing or invalid values use the default,
 * and each problem is described so the user can fix the file.
 */
export function parseSettings(json: string): { settings: Settings; problems: string[] } {
  const settings: Settings = { ...DEFAULT_SETTINGS };
  let saved: unknown;
  try {
    saved = JSON.parse(json);
  } catch {
    return {
      settings,
      problems: ["O arquivo de configurações não é um JSON válido; usando os padrões."],
    };
  }
  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) {
    return {
      settings,
      problems: ["O arquivo de configurações não tem o formato esperado; usando os padrões."],
    };
  }

  const problems: string[] = [];
  const values = saved as Record<string, unknown>;
  for (const key of Object.keys(VALID) as (keyof Settings)[]) {
    const value = values[key];
    if (value === undefined) continue;
    if (VALID[key](value)) {
      (settings as unknown as Record<string, unknown>)[key] = value;
    } else {
      problems.push(
        `"${key}" tem um valor inválido (${JSON.stringify(value)}); usando ${JSON.stringify(DEFAULT_SETTINGS[key])}.`,
      );
    }
  }
  return { settings, problems };
}

/** The settings file content: readable JSON, one setting per line. */
export function serializeSettings(settings: Settings): string {
  return `${JSON.stringify(settings, null, 2)}\n`;
}
