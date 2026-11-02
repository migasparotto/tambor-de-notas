import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAppDataStore } from "../storage/appDataStore";
import { nodeFileSystem } from "../storage/nodeFileSystem";
import { createNotesStore } from "../storage/notesStore";
import { COLORS_FILE, loadColorsData, saveColorsData } from "./appData";
import { COLOR_PALETTE, INITIAL_COLORS } from "./chambers";
import { Notebook, type ColorsDataStore, type NotebookEvents } from "./notebook";
import { DEFAULT_SETTINGS } from "./settings";

const RED = "red";
const AMBER = "#C9832B";
const DOUBT = { name: "Dúvida", role: "Perguntas", hex: AMBER };
const RED_CHAMBER = INITIAL_COLORS.findIndex((color) => color.id === RED);

// New colors and chamber changes on the real disk, always in a new temporary folder.
describe("Notebook colors on the real disk", () => {
  let root: string;

  const diskColorsStore = (): ColorsDataStore => {
    const appStore = createAppDataStore(nodeFileSystem(root));
    return {
      load: () => loadColorsData(appStore),
      save: (data) => saveColorsData(data, appStore),
    };
  };
  /** What the app does when it is opened again on the same folder. */
  const openApp = async (
    events?: NotebookEvents,
    colorsStore: ColorsDataStore = diskColorsStore(),
  ) => {
    const notebook = new Notebook({
      store: createNotesStore(nodeFileSystem(root)),
      colorsStore,
      colors: INITIAL_COLORS,
      settings: DEFAULT_SETTINGS,
      events,
    });
    await notebook.load();
    return notebook;
  };
  const colorIdOf = (result: ReturnType<Notebook["createColor"]>) => {
    if (!result.ok) throw new Error(result.error);
    return result.colorId;
  };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "tambor-colors-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("keeps a new color and its chamber after reopening the app", async () => {
    const notebook = await openApp();
    const colorId = colorIdOf(notebook.createColor(DOUBT, RED_CHAMBER));
    await notebook.flush();

    const { colors, chambers } = (await openApp()).resolvedColors();
    expect(chambers[RED_CHAMBER]).toBe(colorId);
    expect(colors.find((color) => color.id === colorId)).toMatchObject(DOUBT);
  });

  it("keeps the active note of the color that left, listed off the drum", async () => {
    const notebook = await openApp();
    notebook.edit(RED, "# Aula\ntexto");
    await notebook.flush();
    expect(notebook.offDrumColors()).toEqual([]);

    notebook.createColor(DOUBT, RED_CHAMBER);
    await notebook.flush();

    const reopened = await openApp();
    expect(reopened.offDrumColors().map((color) => color.id)).toEqual([RED]);
    expect(reopened.text(RED)).toBe("# Aula\ntexto");
  });

  it("does not list a color that left the drum without an active note", async () => {
    const notebook = await openApp();
    notebook.createColor(DOUBT, RED_CHAMBER);
    await notebook.flush();
    expect(notebook.offDrumColors()).toEqual([]);
  });

  it("stops listing a color off the drum once its note is closed", async () => {
    const notebook = await openApp();
    notebook.edit(RED, "# Aula");
    notebook.createColor(DOUBT, RED_CHAMBER);
    await notebook.close(RED);
    expect(notebook.offDrumColors()).toEqual([]);
  });

  it("refuses a repeated name or a tone in use, and changes nothing", async () => {
    const notebook = await openApp();
    const before = notebook.resolvedColors();
    const taken = INITIAL_COLORS[0]!;
    expect(notebook.createColor({ ...DOUBT, name: taken.name }, 0).ok).toBe(false);
    expect(notebook.createColor({ ...DOUBT, hex: taken.hex }, 0).ok).toBe(false);
    expect(notebook.resolvedColors()).toEqual(before);
  });

  it("offers only the tones no color uses", async () => {
    const notebook = await openApp();
    const free = COLOR_PALETTE.length - INITIAL_COLORS.length;
    expect(notebook.availableTones()).toHaveLength(free);
    notebook.createColor(DOUBT, RED_CHAMBER);
    await notebook.flush();
    expect(notebook.availableTones()).toHaveLength(free - 1);
    expect(notebook.availableTones()).not.toContain(AMBER);
  });

  it("does not touch a broken cores.json: the new color lasts only while open", async () => {
    const broken = "{ isto não é json";
    await writeFile(join(root, COLORS_FILE), broken);
    const notebook = await openApp();
    const colorId = colorIdOf(notebook.createColor(DOUBT, RED_CHAMBER));
    await notebook.flush();

    expect(notebook.resolvedColors().chambers[RED_CHAMBER]).toBe(colorId);
    expect(await readFile(join(root, COLORS_FILE), "utf8")).toBe(broken);
  });

  it("reports a failure to save, keeping the new color in the app", async () => {
    const onError = vi.fn();
    const notebook = await openApp(
      { onError },
      {
        load: () => Promise.resolve({ data: {}, blocked: false }),
        save: () => Promise.reject(new Error("disco cheio")),
      },
    );
    const colorId = colorIdOf(notebook.createColor(DOUBT, RED_CHAMBER));
    await notebook.flush();

    expect(onError).toHaveBeenCalledOnce();
    expect(notebook.resolvedColors().chambers[RED_CHAMBER]).toBe(colorId);
  });
});
