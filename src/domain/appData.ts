import type { AppDataStore } from "../storage/appDataStore";
import { defaultAppDataStore } from "../storage/defaultStore";
import { cyclesForToday, parseDailyCycles, type DailyCycles } from "./dailyCycles";
import {
  completeSettings,
  defaultSettings,
  parseSettings,
  serializeSettings,
  type Settings,
} from "./settings";

/** File names in the app folder (AppData). */
export const SETTINGS_FILE = "configuracoes.json";
export const CYCLES_FILE = "pomodoro.json";

/**
 * Loads the settings from the app folder. The first time, writes a file with the
 * defaults, so the user can find it and edit it. Later, adds to the file the settings
 * it lacks (new ones appear there), keeping the user's values. Problems are returned as messages.
 */
export async function loadSettings(
  store: AppDataStore = defaultAppDataStore(),
): Promise<{ settings: Settings; problems: string[] }> {
  try {
    const saved = await store.read(SETTINGS_FILE);
    if (saved !== null) {
      const read = parseSettings(saved);
      const completed = completeSettings(saved);
      if (completed !== null) {
        // The settings are already read: if the file cannot be completed, the app still works.
        await store.write(SETTINGS_FILE, completed).catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          read.problems.push(
            `Não foi possível acrescentar as configurações novas ao arquivo. (${detail})`,
          );
        });
      }
      return read;
    }
    await store.write(SETTINGS_FILE, serializeSettings(defaultSettings()));
    return { settings: defaultSettings(), problems: [] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      settings: defaultSettings(),
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
