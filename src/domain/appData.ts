import type { AppDataStore } from "../storage/appDataStore";
import { defaultAppDataStore } from "../storage/defaultStore";
import { parseColorsData, serializeColorsData, type ColorsData } from "./colorData";
import { cyclesForToday, parseDailyCycles, type DailyCycles } from "./dailyCycles";
import {
  DEFAULT_PLACEMENT,
  parsePlacement,
  serializePlacement,
  type DrumPlacement,
} from "./placement";
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
export const PLACEMENT_FILE = "janela.json";
export const COLORS_FILE = "cores.json";

/** The colors data read from the file, and whether the file must be left as it is. */
export interface LoadedColorsData {
  data: ColorsData;
  blocked: boolean;
}

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

/** Where the drum was left last time (the default the first time, or if the file cannot be read). */
export async function loadPlacement(
  store: AppDataStore = defaultAppDataStore(),
): Promise<DrumPlacement> {
  try {
    const saved = await store.read(PLACEMENT_FILE);
    return saved === null ? DEFAULT_PLACEMENT : parsePlacement(saved);
  } catch {
    return DEFAULT_PLACEMENT;
  }
}

/** Saves where the drum is, so it opens there next time. */
export function savePlacement(
  placement: DrumPlacement,
  store: AppDataStore = defaultAppDataStore(),
): Promise<void> {
  return store.write(PLACEMENT_FILE, serializePlacement(placement));
}

/**
 * What the app remembers about each color (no data the first time). If the file is broken or
 * cannot be read, `blocked` says it must not be overwritten: it may hold the user's colors.
 */
export async function loadColorsData(
  store: AppDataStore = defaultAppDataStore(),
): Promise<LoadedColorsData> {
  try {
    const saved = await store.read(COLORS_FILE);
    if (saved === null) return { data: {}, blocked: false };
    const data = parseColorsData(saved);
    return data === null ? { data: {}, blocked: true } : { data, blocked: false };
  } catch {
    return { data: {}, blocked: true };
  }
}

/** Saves what the app remembers about each color. */
export function saveColorsData(
  data: ColorsData,
  store: AppDataStore = defaultAppDataStore(),
): Promise<void> {
  return store.write(COLORS_FILE, serializeColorsData(data));
}
