import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryFileSystem } from "../storage/memoryFileSystem";
import { createNotesStore, type NotesStore } from "../storage/notesStore";
import { FileBusyError } from "../storage/retry";
import { INITIAL_COLORS } from "./chambers";
import { createAppDataStore, type AppDataStore } from "../storage/appDataStore";
import { COLORS_FILE, loadColorsData, saveColorsData } from "./appData";
import { leftoversMessage, Notebook, type ColorsDataStore, type NotebookEvents } from "./notebook";
import { parseNote, serializeNote } from "./noteFile";
import { DEFAULT_SETTINGS } from "./settings";

const DELAY = DEFAULT_SETTINGS.autosaveDelayMs;
const MAX_ACTIVE = DEFAULT_SETTINGS.maxActiveNotesPerColor;
const RED = "red";
const BLUE = "blue";
const UNTITLED_RED = "2026-10 vermelho - sem título.md";

describe("Notebook", () => {
  let fs: MemoryFileSystem;
  let store: NotesStore;
  let events: Required<NotebookEvents>;
  let notebook: Notebook;

  const files = () => [...fs.files.keys()].sort();
  const make = (autosaveDelayMs = DELAY, maxActiveNotesPerColor = MAX_ACTIVE) =>
    new Notebook({
      store,
      colors: INITIAL_COLORS,
      settings: { autosaveDelayMs, maxActiveNotesPerColor },
      events,
    });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 16, 5));
    fs = new MemoryFileSystem();
    store = createNotesStore(fs, { attempts: 2, delayMs: 10 });
    events = { onChange: vi.fn(), onError: vi.fn(), onNotice: vi.fn() };
    notebook = make();
  });

  afterEach(() => vi.useRealTimers());

  it("starts with no note in any color", () => {
    for (const color of INITIAL_COLORS) {
      expect(notebook.text(color.id)).toBe("");
      expect(notebook.hasNote(color.id)).toBe(false);
    }
  });

  describe("markdown (ver Markdown)", () => {
    it("is empty when the color has no note", () => {
      expect(notebook.markdown(RED)).toBe("");
    });

    it("is exactly the file on disk once the note is saved", async () => {
      notebook.edit(RED, "# Aula\ntexto");
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(notebook.markdown(RED)).toBe(fs.files.get(`ativas/${UNTITLED_RED}`));
    });

    it("shows the header and the text as it goes to disk", () => {
      notebook.edit(RED, "# Aula\n+Parte 1+");
      const markdown = notebook.markdown(RED);
      expect(markdown.startsWith("---\n")).toBe(true);
      expect(markdown).toContain('title: "Aula"');
      expect(markdown.endsWith("# Aula\n## Parte 1")).toBe(true);
    });
  });

  describe("autosave", () => {
    it("saves by itself after the configured delay, with the provisional name", async () => {
      notebook.edit(RED, "# Aula");
      await vi.advanceTimersByTimeAsync(DELAY - 1);
      expect(files()).toEqual([]);

      await vi.advanceTimersByTimeAsync(1);
      expect(files()).toEqual([`ativas/${UNTITLED_RED}`]);
      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").text).toBe("# Aula");
    });

    it("follows a different configured delay", async () => {
      notebook = make(5000);
      notebook.edit(RED, "# Aula");
      await vi.advanceTimersByTimeAsync(4999);
      expect(files()).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      expect(files()).toHaveLength(1);
    });

    it("waits for the typing to stop instead of saving on every key", async () => {
      const saveSpy = vi.spyOn(store, "save");
      const createSpy = vi.spyOn(store, "create");
      for (const text of ["# A", "# Au", "# Aul", "# Aula"]) {
        notebook.edit(RED, text);
        await vi.advanceTimersByTimeAsync(DELAY / 2);
      }
      await vi.advanceTimersByTimeAsync(DELAY);

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(notebook.text(RED)).toBe("# Aula");
    });

    it("does not write a file for a note that is still empty", async () => {
      notebook.edit(RED, "");
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(files()).toEqual([]);
      expect(notebook.hasNote(RED)).toBe(false);
    });

    it("keeps one active note per color", async () => {
      notebook.edit(RED, "# Primeira versão");
      await vi.advanceTimersByTimeAsync(DELAY);
      notebook.edit(RED, "# Segunda versão");
      notebook.edit(BLUE, "# Termo");
      await vi.advanceTimersByTimeAsync(DELAY);

      expect(files()).toEqual(["ativas/2026-10 azul - sem título.md", `ativas/${UNTITLED_RED}`]);
      expect(notebook.text(RED)).toBe("# Segunda versão");
      expect(notebook.hasNote(RED)).toBe(true);
    });

    it("saves a +subtitle+ line still being typed as ## on disk", async () => {
      notebook.edit(RED, "# Aula\n+Listas+\n[1, 2]");
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(fs.files.get(`ativas/${UNTITLED_RED}`)).toContain("\n## Listas\n[1, 2]");
    });

    it("saves what was typed during a save", async () => {
      notebook.edit(RED, "# v1");
      await vi.advanceTimersByTimeAsync(DELAY);
      vi.spyOn(store, "save").mockImplementationOnce(async (folder, name, content) => {
        notebook.edit(RED, "# v3");
        await createNotesStore(fs).save(folder, name, content);
      });
      notebook.edit(RED, "# v2");
      await vi.advanceTimersByTimeAsync(DELAY * 2);

      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").text).toBe("# v3");
    });

    it("reports a busy file, keeps the text and saves once it is free", async () => {
      notebook.edit(RED, "# v1");
      await vi.advanceTimersByTimeAsync(DELAY);
      fs.holdBusy(`ativas/${UNTITLED_RED}`, 2);
      notebook.edit(RED, "# v2");

      await vi.advanceTimersByTimeAsync(DELAY + 10);
      expect(events.onError).toHaveBeenCalledWith(expect.any(FileBusyError));
      expect(notebook.text(RED)).toBe("# v2");

      await vi.advanceTimersByTimeAsync(DELAY);
      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").text).toBe("# v2");
    });
  });

  describe("confirmTitle (Enter on the first line)", () => {
    it("renames the file to the title once", async () => {
      notebook.edit(RED, "# Aula de Python");
      await notebook.confirmTitle(RED);
      expect(files()).toEqual(["ativas/2026-10 vermelho - Aula de Python.md"]);
    });

    it("does not rename again when the title changes later", async () => {
      notebook.edit(RED, "# Aula de Python");
      await notebook.confirmTitle(RED);
      notebook.edit(RED, "# Aula de Python 2\ntexto");
      await notebook.confirmTitle(RED);
      expect(files()).toEqual(["ativas/2026-10 vermelho - Aula de Python.md"]);
    });

    it("keeps the provisional name while the title is empty", async () => {
      notebook.edit(RED, "\ncorpo sem título");
      await notebook.confirmTitle(RED);
      expect(files()).toEqual([`ativas/${UNTITLED_RED}`]);
    });

    it("cleans characters Windows rejects from the title", async () => {
      notebook.edit(RED, "# Aula: listas/tuplas?");
      await notebook.confirmTitle(RED);
      expect(files()).toEqual(["ativas/2026-10 vermelho - Aula listas tuplas.md"]);
    });

    it("uses -2 when another note already has that name", async () => {
      await store.save("archived", "2026-10 vermelho - Aula.md", "antiga");
      notebook.edit(RED, "# Aula");
      await notebook.confirmTitle(RED);
      expect(files()).toContain("ativas/2026-10 vermelho - Aula-2.md");
    });
  });

  describe("close", () => {
    it("archives the note under its current title and frees the color", async () => {
      notebook.edit(RED, "# Aula de Python");
      await notebook.confirmTitle(RED);
      notebook.edit(RED, "# Aula de Python: listas\nconteúdo");
      await notebook.close(RED);

      expect(files()).toEqual(["arquivadas/2026-10 vermelho - Aula de Python listas.md"]);
      expect(notebook.hasNote(RED)).toBe(false);
      expect(notebook.text(RED)).toBe("");
      expect(events.onChange).toHaveBeenCalledWith(RED);
    });

    it("saves a note closed before the autosave ran", async () => {
      notebook.edit(RED, "# Rápida");
      await notebook.close(RED);
      expect(files()).toEqual(["arquivadas/2026-10 vermelho - Rápida.md"]);
    });

    it("keeps the provisional name for a note without a title", async () => {
      notebook.edit(RED, "\nsó corpo");
      await notebook.close(RED);
      expect(files()).toEqual([`arquivadas/${UNTITLED_RED}`]);
    });

    it("writes nothing when an empty note is closed", async () => {
      notebook.edit(RED, "");
      await notebook.close(RED);
      expect(files()).toEqual([]);
    });

    it("starts a new note, with a new id, after closing", async () => {
      notebook.edit(RED, "# Primeira");
      await notebook.close(RED);
      notebook.edit(RED, "# Segunda");
      await notebook.close(RED);

      const archived = files();
      expect(archived).toEqual([
        "arquivadas/2026-10 vermelho - Primeira.md",
        "arquivadas/2026-10 vermelho - Segunda.md",
      ]);
      const ids = archived.map((path) => parseNote(fs.files.get(path) ?? "").id);
      expect(new Set(ids).size).toBe(2);
    });

    it("keeps the note active if archiving fails", async () => {
      notebook.edit(RED, "# Aula");
      await notebook.confirmTitle(RED);
      vi.spyOn(store, "archive").mockRejectedValueOnce(new FileBusyError("x.md"));

      await expect(notebook.close(RED)).rejects.toThrow(FileBusyError);

      expect(notebook.text(RED)).toBe("# Aula");
      expect(files()).toEqual(["ativas/2026-10 vermelho - Aula.md"]);
      await notebook.close(RED);
      expect(files()).toEqual(["arquivadas/2026-10 vermelho - Aula.md"]);
    });
  });

  describe("load: leftovers of interrupted saves", () => {
    const saveRed = async () => {
      notebook.edit(RED, "# Aula");
      await vi.advanceTimersByTimeAsync(DELAY);
    };

    it("moves them to sobras, says how many, and still loads the notes", async () => {
      await saveRed();
      fs.files.set(`ativas/${UNTITLED_RED}.tmp`, "texto mais novo");
      fs.files.set("arquivadas/Velha.md.tmp", "antigo");

      const reopened = make();
      await reopened.load();

      expect(files()).toContain(`sobras/${UNTITLED_RED}`);
      expect(files()).toContain("sobras/Velha.md");
      expect(events.onNotice).toHaveBeenCalledWith(leftoversMessage(2));
      expect(reopened.text(RED)).toBe("# Aula");
    });

    it("says nothing when there are no leftovers", async () => {
      await saveRed();
      await make().load();
      expect(events.onNotice).not.toHaveBeenCalled();
    });

    it("handles two loads at the same time (React does this while developing)", async () => {
      await fs.mkdir("ativas");
      fs.files.set("ativas/X.md.tmp", "x");
      const reopened = make();
      await Promise.all([reopened.load(), reopened.load()]);
      expect(events.onError).not.toHaveBeenCalled();
      expect(events.onNotice).toHaveBeenCalledTimes(1);
    });

    it("reports a leftover it cannot move, and the notes still load", async () => {
      await saveRed();
      const tmp = `ativas/${UNTITLED_RED}.tmp`;
      fs.files.set(tmp, "x");
      fs.holdBusy(tmp, 10);

      const reopened = make();
      const loading = reopened.load();
      await vi.runAllTimersAsync();
      await loading;

      expect(events.onError).toHaveBeenCalledWith(expect.any(FileBusyError));
      expect(reopened.text(RED)).toBe("# Aula");
    });
  });

  describe("leftoversMessage", () => {
    it("is empty with no leftovers and names the folder otherwise", () => {
      expect(leftoversMessage(0)).toBeNull();
      expect(leftoversMessage(1)).toContain("1 sobra");
      expect(leftoversMessage(3)).toContain("3 sobras");
      expect(leftoversMessage(3)).toContain("sobras\\");
    });
  });

  describe("load", () => {
    it("brings back the active notes saved on disk", async () => {
      notebook.edit(RED, "# Aula\n+Listas+");
      await notebook.confirmTitle(RED);

      const reopened = make();
      await reopened.load();

      expect(reopened.text(RED)).toBe("# Aula\n## Listas");
      expect(reopened.hasNote(RED)).toBe(true);
      expect(reopened.hasNote(BLUE)).toBe(false);
      expect(events.onChange).toHaveBeenCalledWith(RED);
    });

    it("does not duplicate notes when loaded twice, even at the same time", async () => {
      notebook.edit(RED, "# Aula");
      await notebook.confirmTitle(RED);

      const reopened = make();
      await Promise.all([reopened.load(), reopened.load()]);
      await reopened.load();

      expect(reopened.text(RED)).toBe("# Aula");
      expect(events.onError).not.toHaveBeenCalled();
      await reopened.close(RED);
      expect(reopened.hasNote(RED)).toBe(false);
    });

    it("continues the same file after reopening", async () => {
      notebook.edit(RED, "# Aula");
      await notebook.confirmTitle(RED);
      const reopened = make();
      await reopened.load();
      reopened.edit(RED, "# Aula\nmais");
      await vi.advanceTimersByTimeAsync(DELAY);

      expect(files()).toEqual(["ativas/2026-10 vermelho - Aula.md"]);
    });

    describe("when a color has more active notes on disk than allowed", () => {
      const saveRed = (fileName: string, text: string, day: number) => {
        const date = `2026-10-0${day}T00:00:00.000Z`;
        const note = {
          id: text,
          colorId: RED,
          subject: "",
          text,
          createdAt: date,
          updatedAt: date,
        };
        return store.save("active", fileName, serializeNote(note));
      };

      beforeEach(async () => {
        // File names out of date order, so the order comes from the dates.
        await saveRed("c.md", "Mais antiga", 1);
        await saveRed("a.md", "Nova", 3);
        await saveRed("b.md", "Antiga", 2);
      });

      it("keeps the most recent ones, up to the configured limit, and reports the rest", async () => {
        notebook = make(DELAY, 1);
        await notebook.load();

        expect(notebook.text(RED)).toBe("# Nova");
        expect(events.onError).toHaveBeenCalledTimes(2);
        expect(events.onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: expect.stringContaining('"c.md"') as unknown }),
        );
      });

      it("follows a higher limit: the newest is current, the next one shows after closing it", async () => {
        notebook = make(DELAY, 2);
        await notebook.load();

        expect(notebook.text(RED)).toBe("# Nova");
        expect(events.onError).toHaveBeenCalledTimes(1);
        await notebook.close(RED);
        expect(notebook.text(RED)).toBe("# Antiga");
      });
    });

    it("reports and skips a file it cannot read", async () => {
      await store.save("active", "estragada.md", "sem cabeçalho");
      await notebook.load();
      expect(events.onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it("flush (window closing) saves the last letters typed, without waiting for the autosave", async () => {
    notebook.edit(RED, "# Aula");
    await notebook.confirmTitle(RED);
    notebook.edit(RED, "# Aula\núltimas letras XYZ");

    await notebook.flush();

    const saved = parseNote(fs.files.get("ativas/2026-10 vermelho - Aula.md") ?? "");
    expect(saved.text).toBe("# Aula\núltimas letras XYZ");
    const saveSpy = vi.spyOn(store, "save");
    await vi.advanceTimersByTimeAsync(DELAY * 2);
    expect(saveSpy).not.toHaveBeenCalled(); // the cancelled autosave does not run later
  });

  it("flush saves pending changes at once", async () => {
    notebook.edit(RED, "# Aula");
    notebook.edit(BLUE, "# Termo");
    await notebook.flush();
    expect(files()).toHaveLength(2);
  });
  describe("subject", () => {
    let appFs: MemoryFileSystem;
    let appStore: AppDataStore;
    let colorsStore: ColorsDataStore;

    const remembered = async () => loadColorsData(appStore);
    const makeWithColors = () =>
      new Notebook({
        store,
        colorsStore,
        colors: INITIAL_COLORS,
        settings: { autosaveDelayMs: DELAY, maxActiveNotesPerColor: MAX_ACTIVE },
        events,
      });

    beforeEach(async () => {
      appFs = new MemoryFileSystem();
      appStore = createAppDataStore(appFs, { attempts: 1, delayMs: 0 });
      colorsStore = {
        load: () => loadColorsData(appStore),
        save: (data) => saveColorsData(data, appStore),
      };
      await saveColorsData(
        { red: { lastSubject: "Cálculo" }, blue: { lastSubject: "Física" } },
        appStore,
      );
      notebook = makeWithColors();
      await notebook.load();
    });

    it("offers each color its own last subject before the note exists", () => {
      expect(notebook.subject(RED)).toBe("Cálculo");
      expect(notebook.subject(BLUE)).toBe("Física");
      expect(notebook.subject("green")).toBe("");
    });

    it("starts a new note with the last subject of its color", async () => {
      notebook.edit(RED, "# Aula");
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").subject).toBe("Cálculo");
    });

    it("does not create a file when only the subject is changed", async () => {
      notebook.editSubject(RED, "Álgebra");
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(files()).toEqual([]);
      expect(notebook.hasNote(RED)).toBe(false);
      expect(notebook.subject(RED)).toBe("Álgebra");

      notebook.edit(RED, "# Aula");
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").subject).toBe("Álgebra");
    });

    it("saves a subject change by itself after the configured delay", async () => {
      notebook.edit(RED, "# Aula");
      await vi.advanceTimersByTimeAsync(DELAY);
      notebook.editSubject(RED, "Álgebra");
      await vi.advanceTimersByTimeAsync(DELAY - 1);
      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").subject).toBe("Cálculo");

      await vi.advanceTimersByTimeAsync(1);
      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").subject).toBe("Álgebra");
    });

    it("remembers the saved subject only for its color, and offers it to the next note", async () => {
      notebook.edit(RED, "# Aula");
      notebook.editSubject(RED, "Álgebra");
      await notebook.close(RED);

      expect(await remembered()).toEqual({
        red: { lastSubject: "Álgebra" },
        blue: { lastSubject: "Física" },
      });
      expect(notebook.subject(RED)).toBe("Álgebra");
      const reopened = makeWithColors();
      await reopened.load();
      expect(reopened.subject(RED)).toBe("Álgebra");
    });

    it("keeps the last subject when a note is saved with a blank subject", async () => {
      notebook.edit(RED, "# Aula");
      notebook.editSubject(RED, "");
      await notebook.close(RED);

      expect((await remembered()).red).toEqual({ lastSubject: "Cálculo" });
      expect(notebook.subject(RED)).toBe("Cálculo");
    });

    it("shows the subject of a note that already exists, not the last one", async () => {
      const date = new Date().toISOString();
      const old = {
        id: "x",
        colorId: RED,
        subject: "",
        text: "# Antiga",
        createdAt: date,
        updatedAt: date,
      };
      await store.create("antiga", serializeNote(old));
      const reopened = makeWithColors();
      await reopened.load();
      expect(reopened.subject(RED)).toBe("");
    });

    it("opens with no subjects, and the notes intact, if cores.json is broken", async () => {
      notebook.edit(RED, "# Aula");
      await notebook.confirmTitle(RED);
      await appStore.write(COLORS_FILE, "{ quebrado");

      const reopened = makeWithColors();
      await reopened.load();
      expect(reopened.subject(BLUE)).toBe("");
      expect(reopened.text(RED)).toBe("# Aula");
      expect(events.onError).not.toHaveBeenCalled();
    });

    it("still saves the note if cores.json cannot be written, and says so", async () => {
      colorsStore.save = () => Promise.reject(new Error("disco cheio"));
      notebook.edit(RED, "# Aula");
      notebook.editSubject(RED, "Álgebra");
      await vi.advanceTimersByTimeAsync(DELAY);

      expect(parseNote(fs.files.get(`ativas/${UNTITLED_RED}`) ?? "").subject).toBe("Álgebra");
      expect(events.onError).toHaveBeenCalledWith(new Error("disco cheio"));
    });

    it("without cores.json, remembers the subject while the app is open", async () => {
      notebook = make();
      notebook.edit(RED, "# Aula");
      notebook.editSubject(RED, "Álgebra");
      await notebook.close(RED);
      expect(notebook.subject(RED)).toBe("Álgebra");
    });
  });
});
