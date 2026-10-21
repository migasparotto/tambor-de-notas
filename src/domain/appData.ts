import type { AppDataStore } from "../storage/appDataStore";
import { defaultAppDataStore } from "../storage/defaultStore";
import { cyclesForToday, parseDailyCycles, type DailyCycles } from "./dailyCycles";
import { DEFAULT_SETTINGS, parseSettings, serializeSettings, type Settings } from "./settings";

/** File names in the app folder (AppData). */
export const SETTINGS_FILE = "configuracoes.json";
export const CYCLES_FILE = "pomodoro.json";

/**
 * Loads the settings from the app folder. The first time, writes a file with the
 * defaults, so the user can find it and edit it. Problems are returned as messages.
 */
export async function loadSettings(
  store: AppDataStore = defaultAppDataStore(),
): Promise<{ settings: Settings; problems: string[] }> {
  try {
    const saved = await store.read(SETTINGS_FILE);
    if (saved !== null) return parseSettings(saved);
    await store.write(SETTINGS_FILE, serializeSettings(DEFAULT_SETTINGS));
    return { settings: { ...DEFAULT_SETTINGS }, problems: [] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      settings: { ...DEFAULT_SETTINGS },
      problems: [`Não foi possível ler as configurações; usando os padrões. (${detail})`],
    };
  }
}

/** Today's pomodoro cycles, from the app folder (zero on a new day or if nothing is saved). */
export async function loadDailyCycles(
  now: Date,
  store: AppDataStore = defaultAppDataStore(),
): Promise<DailyCycles> {
  const saved = await store.read(CYCLES_FILE);
  return cyclesForToday(saved === null ? null : parseDailyCycles(saved), now);
}

/** Saves the pomodoro cycles counter in the app folder. */
export function saveDailyCycles(
  cycles: DailyCycles,
  store: AppDataStore = defaultAppDataStore(),
): Promise<void> {
  return store.write(CYCLES_FILE, `${JSON.stringify(cycles)}\n`);
}
