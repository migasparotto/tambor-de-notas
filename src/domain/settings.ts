import {
  CYCLE_END_ANIMATIONS,
  CYCLE_END_SOUNDS,
  type CycleEndAnimation,
  type CycleEndSound,
} from "./cycleEnd";
import { parseShortcuts, type Shortcuts } from "./shortcuts";

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
  /** Sound at the end of each pomodoro phase ("off" for none). */
  cycleEndSound: CycleEndSound;
  /** Drum animation at the end of each pomodoro phase ("off" for none). */
  cycleEndAnimation: CycleEndAnimation;
  /** How long the ratchet and the spin last, in milliseconds; the final clack lands at the end. */
  cycleEndDurationMs: number;
  /** Volume of the app sounds, from 0 (silent) to 1. */
  soundVolume: number;
  /** Global shortcuts (they work with the app in the background). */
  shortcuts: Shortcuts;
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
  cycleEndSound: "ratchet",
  cycleEndAnimation: "spin",
  cycleEndDurationMs: 1800,
  soundVolume: 0.6,
  shortcuts: {
    openColor1: "Ctrl+Shift+Alt+1",
    openColor2: "Ctrl+Shift+Alt+2",
    openColor3: "Ctrl+Shift+Alt+3",
    openColor4: "Ctrl+Shift+Alt+4",
    togglePomodoro: "Ctrl+Shift+Alt+P",
  },
};

/** A fresh copy of the defaults, safe to change. */
export function defaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS, shortcuts: { ...DEFAULT_SETTINGS.shortcuts } };
}

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** What makes each simple setting valid; anything else falls back to the default. */
const VALID: Record<Exclude<keyof Settings, "shortcuts">, (value: unknown) => boolean> = {
  charLimit: (v) => isNumber(v) && Number.isInteger(v) && v > 0,
  drumHeightFraction: (v) => isNumber(v) && v > 0 && v <= 1,
  focusMinutes: (v) => isNumber(v) && v > 0,
  breakMinutes: (v) => isNumber(v) && v > 0,
  autosaveDelayMs: (v) => isNumber(v) && v >= 0,
  maxActiveNotesPerColor: (v) => isNumber(v) && Number.isInteger(v) && v >= 1,
  symbolsMode: (v) => SYMBOLS_MODES.includes(v as SymbolsMode),
  cycleEndSound: (v) => CYCLE_END_SOUNDS.includes(v as CycleEndSound),
  cycleEndAnimation: (v) => CYCLE_END_ANIMATIONS.includes(v as CycleEndAnimation),
  cycleEndDurationMs: (v) => isNumber(v) && v >= 200 && v <= 10000,
  soundVolume: (v) => isNumber(v) && v >= 0 && v <= 1,
};

/**
 * Reads the settings file content. Missing or invalid values use the default,
 * and each problem is described so the user can fix the file.
 */
export function parseSettings(json: string): { settings: Settings; problems: string[] } {
  const settings = defaultSettings();
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
  for (const key of Object.keys(VALID) as (keyof typeof VALID)[]) {
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
  if (values.shortcuts !== undefined) {
    const read = parseShortcuts(values.shortcuts, DEFAULT_SETTINGS.shortcuts);
    settings.shortcuts = read.shortcuts;
    problems.push(...read.problems);
  }
  return { settings, problems };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Adds to the settings file the settings it lacks (new ones, like the shortcuts), with
 * their defaults. The user's values stay as written, even invalid or unknown ones, and
 * come first. Returns the new file content, or null when nothing is missing or the file
 * cannot be read (then it is left alone for the user to fix).
 */
export function completeSettings(json: string): string | null {
  let saved: unknown;
  try {
    saved = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isObject(saved)) return null;

  const completed = withDefaults(saved, DEFAULT_SETTINGS);
  if (isObject(saved.shortcuts)) {
    completed.shortcuts = withDefaults(saved.shortcuts, DEFAULT_SETTINGS.shortcuts);
  }
  if (JSON.stringify(completed) === JSON.stringify(saved)) return null;
  return `${JSON.stringify(completed, null, 2)}\n`;
}

/** The saved values, in their order, followed by the defaults they lack. */
function withDefaults(saved: Record<string, unknown>, defaults: object): Record<string, unknown> {
  return { ...saved, ...defaults, ...saved };
}

/** The settings file content: readable JSON, one setting per line. */
export function serializeSettings(settings: Settings): string {
  return `${JSON.stringify(settings, null, 2)}\n`;
}
