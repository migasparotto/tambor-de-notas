import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAppDataStore } from "../storage/appDataStore";
import { nodeFileSystem } from "../storage/nodeFileSystem";
import { createNotesStore } from "../storage/notesStore";
import { COLORS_FILE, loadColorsData, saveColorsData } from "./appData";
import { INITIAL_COLORS } from "./chambers";
import { resolveColors } from "./colorData";
import { availableTones, createColor } from "./colorRules";
import { COLORS_BLOCKED_MESSAGE, Notebook } from "./notebook";
import { parseNote } from "./noteFile";
import { DEFAULT_SETTINGS } from "./settings";

const RED = "red";
const UNTITLED_RED = "2026-10 vermelho - sem título.md";
const TITLED_RED = "2026-10 vermelho - Aula de Python.md";

// The notes rules on the real disk, always in a new temporary folder (never the real notes).
// Only the date is simulated, for the file names; each test saves right away, without timers.
describe("Notebook on the real disk", () => {
  let root: string;

  /** A new Notebook on the same folder: what the app does when it is opened again. */
  const openApp = () =>
    new Notebook({
      store: createNotesStore(nodeFileSystem(root)),
      colors: INITIAL_COLORS,
      settings: DEFAULT_SETTINGS,
    });
  const filesIn = async (folder: string) => (await readdir(join(root, folder))).sort();
  const fileText = (...path: string[]) => readFile(join(root, ...path), "utf8");

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 21, 16, 5));
    root = await mkdtemp(join(tmpdir(), "tambor-teste-"));
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(root, { recursive: true, force: true });
  });

  it("only works inside the temporary folder", () => {
    expect(root.startsWith(tmpdir())).toBe(true);
  });

  it("saves a note under the provisional name until the title is confirmed", async () => {
    const notebook = openApp();
    notebook.edit(RED, "# Aula de Python\ntexto");
    await notebook.flush();
    expect(await filesIn("ativas")).toEqual([UNTITLED_RED]);
  });

  it("uses the first line as the title, in the file name and in the file", async () => {
    const notebook = openApp();
    notebook.edit(RED, "# Aula de Python\ntexto");
    await notebook.confirmTitle(RED);

    expect(await filesIn("ativas")).toEqual([TITLED_RED]);
    const content = await fileText("ativas", TITLED_RED);
    expect(content).toContain('title: "Aula de Python"');
    expect(content).toContain("\n# Aula de Python\ntexto");
  });

  it("brings the subject and the text back when the app is opened again", async () => {
    const before = openApp();
    before.edit(RED, "# Derivadas\nregra da cadeia");
    before.editSubject(RED, "Cálculo");
    await before.flush();

    const after = openApp();
    await after.load();
    expect(after.subject(RED)).toBe("Cálculo");
    expect(after.text(RED)).toBe("# Derivadas\nregra da cadeia");
  });

  it("keeps accents and emoji unchanged", async () => {
    const text = "# Coração 🥁\nAção, pão — ñ ü ç e 👩🏽‍💻";
    const before = openApp();
    before.edit(RED, text);
    await before.confirmTitle(RED);
    expect(await filesIn("ativas")).toEqual(["2026-10 vermelho - Coração 🥁.md"]);

    const after = openApp();
    await after.load();
    expect(after.text(RED)).toBe(text);
  });

  it("gives a valid file name to a title with forbidden characters", async () => {
    const notebook = openApp();
    notebook.edit(RED, "# Aula: 1/2?\ntexto");
    await notebook.confirmTitle(RED);
    expect(await filesIn("ativas")).toEqual(["2026-10 vermelho - Aula 1 2.md"]);
  });

  it("moves a closed note to the archive, with its content and subject", async () => {
    const notebook = openApp();
    notebook.edit(RED, "# Aula de Python\ntexto");
    notebook.editSubject(RED, "Cálculo");
    await notebook.close(RED);

    expect(await filesIn("ativas")).toEqual([]);
    expect(await filesIn("arquivadas")).toEqual([TITLED_RED]);
    const note = parseNote(await fileText("arquivadas", TITLED_RED));
    expect(note.subject).toBe("Cálculo");
    expect(note.text).toBe("# Aula de Python\ntexto");
  });

  it("keeps a broken cores.json intact, warning and still saving the note", async () => {
    await writeFile(join(root, COLORS_FILE), "{ quebrado");
    const appStore = createAppDataStore(nodeFileSystem(root));
    const onNotice = vi.fn();
    const notebook = new Notebook({
      store: createNotesStore(nodeFileSystem(root)),
      colorsStore: {
        load: () => loadColorsData(appStore),
        save: (data) => saveColorsData(data, appStore),
      },
      colors: INITIAL_COLORS,
      settings: DEFAULT_SETTINGS,
      events: { onNotice },
    });
    await notebook.load();
    notebook.edit(RED, "# Aula\ntexto");
    notebook.editSubject(RED, "Cálculo");
    await notebook.flush();

    expect(onNotice).toHaveBeenCalledWith(COLORS_BLOCKED_MESSAGE);
    expect(await fileText(COLORS_FILE)).toBe("{ quebrado");
    expect(await filesIn("ativas")).toEqual([UNTITLED_RED]);
    expect(notebook.subject(RED)).toBe("Cálculo");
  });

  it("saves and reads back a created color and a chamber change in cores.json", async () => {
    const appStore = createAppDataStore(nodeFileSystem(root));
    const leaving = INITIAL_COLORS[0]!.id;
    const color = { name: "Dúvida", role: "Perguntas", hex: availableTones({})[0]! };
    const result = createColor({}, color, 0);
    if (!result.ok) throw new Error(result.error);
    await saveColorsData(result.data, appStore);

    const { data, blocked } = await loadColorsData(appStore);
    expect(blocked).toBe(false);
    const { colors, chambers } = resolveColors(data);
    expect(chambers[0]).toBe(result.colorId);
    expect(chambers).not.toContain(leaving);
    expect(colors.find((c) => c.id === result.colorId)).toMatchObject(color);
    expect(colors.find((c) => c.id === leaving)).toBeDefined();
  });

  it("leaves no .tmp file behind after saving", async () => {
    const notebook = openApp();
    notebook.edit(RED, "# Aula\num");
    await notebook.flush();
    notebook.edit(RED, "# Aula\ndois");
    await notebook.flush();

    const files = await filesIn("ativas");
    expect(files).toEqual([UNTITLED_RED]);
    expect(parseNote(await fileText("ativas", UNTITLED_RED)).text).toBe("# Aula\ndois");
  });

  it("moves the .tmp left by an interrupted save to sobras, with all its text", async () => {
    await mkdir(join(root, "ativas"));
    await writeFile(join(root, "ativas", "Aula.md.tmp"), "texto mais novo");

    await openApp().load();

    expect(await filesIn("ativas")).toEqual([]);
    expect(await fileText("sobras", "Aula.md")).toBe("texto mais novo");
  });
});
