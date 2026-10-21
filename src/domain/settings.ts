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
}

/** Default settings used until the user changes them. */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  charLimit: 300,
  drumHeightFraction: 1 / 3,
  focusMinutes: 25,
  breakMinutes: 5,
  autosaveDelayMs: 1000,
  maxActiveNotesPerColor: 1,
};

/** What makes each setting valid; anything else falls back to the default. */
const VALID: Record<keyof Settings, (value: number) => boolean> = {
  charLimit: (v) => Number.isInteger(v) && v > 0,
  drumHeightFraction: (v) => v > 0 && v <= 1,
  focusMinutes: (v) => v > 0,
  breakMinutes: (v) => v > 0,
  autosaveDelayMs: (v) => v >= 0,
  maxActiveNotesPerColor: (v) => Number.isInteger(v) && v >= 1,
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
    if (typeof value === "number" && Number.isFinite(value) && VALID[key](value)) {
      settings[key] = value;
    } else {
      problems.push(
        `"${key}" tem um valor inválido (${JSON.stringify(value)}); usando ${DEFAULT_SETTINGS[key]}.`,
      );
    }
  }
  return { settings, problems };
}

/** The settings file content: readable JSON, one setting per line. */
export function serializeSettings(settings: Settings): string {
  return `${JSON.stringify(settings, null, 2)}\n`;
}
