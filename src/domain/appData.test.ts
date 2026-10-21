import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppDataStore, type AppDataStore } from "../storage/appDataStore";
import { MemoryFileSystem } from "../storage/memoryFileSystem";
import {
  CYCLES_FILE,
  SETTINGS_FILE,
  loadDailyCycles,
  loadSettings,
  saveDailyCycles,
} from "./appData";
import { DEFAULT_SETTINGS, parseSettings } from "./settings";

describe("app data", () => {
  let fs: MemoryFileSystem;
  let store: AppDataStore;

  beforeEach(() => {
    fs = new MemoryFileSystem();
    store = createAppDataStore(fs, { attempts: 1, delayMs: 0 });
  });

  describe("loadSettings", () => {
    it("creates the settings file with the defaults the first time", async () => {
      expect(await loadSettings(store)).toEqual({ settings: DEFAULT_SETTINGS, problems: [] });
      const written = fs.files.get(SETTINGS_FILE) ?? "";
      expect(parseSettings(written).settings).toEqual(DEFAULT_SETTINGS);
    });

    it("uses the values saved in the file, such as the drum size", async () => {
      await store.write(SETTINGS_FILE, '{ "drumHeightFraction": 0.25 }');
      const { settings } = await loadSettings(store);
      expect(settings.drumHeightFraction).toBe(0.25);
    });

    it("does not overwrite a file with problems, so the user can fix it", async () => {
      await store.write(SETTINGS_FILE, "{ quebrado");
      const { settings, problems } = await loadSettings(store);
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(problems).toHaveLength(1);
      expect(fs.files.get(SETTINGS_FILE)).toBe("{ quebrado");
    });

    it("keeps working with the defaults if the disk fails", async () => {
      vi.spyOn(store, "read").mockRejectedValueOnce(new Error("disco"));
      const { settings, problems } = await loadSettings(store);
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(problems[0]).toContain("disco");
    });
  });

  describe("daily cycles", () => {
    const today = new Date(2026, 9, 21, 10);
    const tomorrow = new Date(2026, 9, 22, 8);

    it("comes back after the app is reopened the same day", async () => {
      await saveDailyCycles({ date: "2026-10-21", cycles: 3 }, store);
      expect(await loadDailyCycles(today, store)).toEqual({ date: "2026-10-21", cycles: 3 });
    });

    it("starts at zero on the next day", async () => {
      await saveDailyCycles({ date: "2026-10-21", cycles: 3 }, store);
      expect(await loadDailyCycles(tomorrow, store)).toEqual({ date: "2026-10-22", cycles: 0 });
    });

    it("starts at zero when the file is missing or broken", async () => {
      expect(await loadDailyCycles(today, store)).toEqual({ date: "2026-10-21", cycles: 0 });
      await store.write(CYCLES_FILE, "lixo");
      expect(await loadDailyCycles(today, store)).toEqual({ date: "2026-10-21", cycles: 0 });
    });
  });
});
