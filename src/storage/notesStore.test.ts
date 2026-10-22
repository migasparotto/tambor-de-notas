import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryFileSystem } from "./memoryFileSystem";
import { createNotesStore, type NotesStore } from "./notesStore";
import { FileBusyError, type RetryOptions } from "./retry";

const RETRY: RetryOptions = { attempts: 3, delayMs: 100 };
const UNICODE_TEXT = "Ação, coração, pão — ñ ü ç\nEmoji: 🚀🥁👩🏽‍💻 e 𝔽 fora do plano básico";

describe("NotesStore", () => {
  let fs: MemoryFileSystem;
  let store: NotesStore;

  beforeEach(() => {
    fs = new MemoryFileSystem();
    store = createNotesStore(fs, RETRY);
  });

  it("lists nothing at first, creating the folders", async () => {
    expect(await store.list("active")).toEqual([]);
    expect(await store.list("archived")).toEqual([]);
  });

  it("creates a note named after its title and reads it back", async () => {
    const fileName = await store.create("Derivadas", "conteúdo");
    expect(fileName).toBe("Derivadas.md");
    expect(await store.list("active")).toEqual(["Derivadas.md"]);
    expect(await store.read("active", fileName)).toBe("conteúdo");
  });

  it("saves and reads accents and emoji unchanged", async () => {
    const fileName = await store.create("Coração 🥁", UNICODE_TEXT);
    expect(fileName).toBe("Coração 🥁.md");
    expect(await store.read("active", fileName)).toBe(UNICODE_TEXT);
  });

  it("cleans invalid characters from the file name", async () => {
    expect(await store.create("Aula: 1/2?", "")).toBe("Aula 1 2.md");
  });

  it("does not reuse a name taken in either folder", async () => {
    await store.create("Aula", "primeira");
    await store.archive("Aula.md");
    expect(await store.create("Aula", "segunda")).toBe("Aula-2.md");
    expect(await store.create("aula", "terceira")).toBe("aula-3.md");
  });

  describe("rename", () => {
    it("renames an active note, cleaning the name", async () => {
      await store.create("sem título", "texto");
      expect(await store.rename("sem título.md", "Aula: Python")).toBe("Aula Python.md");
      expect(await store.list("active")).toEqual(["Aula Python.md"]);
      expect(await store.read("active", "Aula Python.md")).toBe("texto");
    });

    it("keeps the name when it would not change", async () => {
      await store.create("Aula", "texto");
      const renameSpy = vi.spyOn(fs, "rename");
      expect(await store.rename("Aula.md", "Aula")).toBe("Aula.md");
      expect(renameSpy).not.toHaveBeenCalled();
    });

    it("does not take a name used by another note, active or archived", async () => {
      await store.save("archived", "Aula.md", "antiga");
      await store.save("active", "Aula-2.md", "outra");
      await store.save("active", "sem título.md", "nova");

      expect(await store.rename("sem título.md", "Aula")).toBe("Aula-3.md");
      expect(await store.read("archived", "Aula.md")).toBe("antiga");
    });

    it("keeps a numbered name if the plain one is still taken", async () => {
      await store.save("archived", "Aula.md", "antiga");
      await store.save("active", "Aula-2.md", "nova");
      expect(await store.rename("Aula-2.md", "Aula")).toBe("Aula-2.md");
    });
  });

  describe("save", () => {
    it("overwrites the note through a .tmp file and leaves no .tmp behind", async () => {
      await store.save("active", "Aula.md", "v1");
      const writeSpy = vi.spyOn(fs, "writeText");

      await store.save("active", "Aula.md", "v2");

      expect(writeSpy).toHaveBeenCalledWith("ativas/Aula.md.tmp", "v2");
      expect(writeSpy).not.toHaveBeenCalledWith("ativas/Aula.md", expect.anything());
      expect(fs.files.get("ativas/Aula.md")).toBe("v2");
      expect([...fs.files.keys()]).toEqual(["ativas/Aula.md"]);
    });

    it("keeps the old note whole if the app stops before the rename", async () => {
      await store.save("active", "Aula.md", "v1");
      vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("app closed"));

      await expect(store.save("active", "Aula.md", "v2")).rejects.toThrow("app closed");

      expect(await store.read("active", "Aula.md")).toBe("v1");
    });

    it("refuses names that could leave the notes folder", async () => {
      await expect(store.save("active", "../fora.md", "x")).rejects.toThrow("inválido");
      await expect(store.save("active", "a\\b.md", "x")).rejects.toThrow("inválido");
      await expect(store.save("active", "nota.txt", "x")).rejects.toThrow("inválido");
    });
  });

  it("leaves leftover .tmp files out of the list", async () => {
    await store.save("active", "Aula.md", "v1");
    fs.files.set("ativas/Outra.md.tmp", "meio escrito");
    expect(await store.list("active")).toEqual(["Aula.md"]);
  });

  describe("archive", () => {
    it("moves the note from active to archived", async () => {
      await store.create("Aula", "texto");
      expect(await store.archive("Aula.md")).toBe("Aula.md");
      expect(await store.list("active")).toEqual([]);
      expect(await store.list("archived")).toEqual(["Aula.md"]);
      expect(await store.read("archived", "Aula.md")).toBe("texto");
    });

    it("never overwrites an archived note with the same name", async () => {
      await store.save("archived", "Aula.md", "antiga");
      await store.save("active", "Aula.md", "nova");

      expect(await store.archive("Aula.md")).toBe("Aula-2.md");
      expect(await store.read("archived", "Aula.md")).toBe("antiga");
      expect(await store.read("archived", "Aula-2.md")).toBe("nova");
    });
  });

  describe("when OneDrive holds a file", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("saves after the file is released", async () => {
      fs.holdBusy("ativas/Aula.md", RETRY.attempts - 1);
      const saving = store.save("active", "Aula.md", "texto");

      await vi.runAllTimersAsync();
      await saving;

      expect(fs.files.get("ativas/Aula.md")).toBe("texto");
    });

    it("gives a clear message if the file stays busy, keeping the old note", async () => {
      await store.save("active", "Aula.md", "v1");
      fs.holdBusy("ativas/Aula.md", RETRY.attempts);
      const saving = store.save("active", "Aula.md", "v2");
      const assertion = expect(saving).rejects.toThrow(FileBusyError);

      await vi.runAllTimersAsync();
      await assertion;

      expect(fs.files.get("ativas/Aula.md")).toBe("v1");
    });

    it("retries archiving too", async () => {
      await store.save("active", "Aula.md", "texto");
      fs.holdBusy("ativas/Aula.md", 1);
      const archiving = store.archive("Aula.md");

      await vi.runAllTimersAsync();

      await expect(archiving).resolves.toBe("Aula.md");
    });
  });
});

describe("NotesStore.moveLeftovers", () => {
  let fs: MemoryFileSystem;
  let store: NotesStore;

  beforeEach(async () => {
    fs = new MemoryFileSystem();
    store = createNotesStore(fs, RETRY);
    await fs.mkdir("ativas");
    await fs.mkdir("arquivadas");
  });

  const files = () => [...fs.files.keys()].sort();

  it("moves .tmp files from both folders to sobras, as .md, keeping their text", async () => {
    fs.files.set("ativas/Aula.md", "salvo");
    fs.files.set("ativas/Aula.md.tmp", "mais novo");
    fs.files.set("arquivadas/Velha.md.tmp", "antigo");

    expect(await store.moveLeftovers()).toEqual(["Aula.md.tmp", "Velha.md.tmp"]);
    expect(files()).toEqual(["ativas/Aula.md", "sobras/Aula.md", "sobras/Velha.md"]);
    expect(fs.files.get("sobras/Aula.md")).toBe("mais novo");
    expect(fs.files.get("ativas/Aula.md")).toBe("salvo");
  });

  it("never overwrites a leftover already in sobras", async () => {
    await fs.mkdir("sobras");
    fs.files.set("sobras/Aula.md", "de antes");
    fs.files.set("ativas/Aula.md.tmp", "ativa");
    fs.files.set("arquivadas/Aula.md.tmp", "arquivada");

    await store.moveLeftovers();
    expect(fs.files.get("sobras/Aula.md")).toBe("de antes");
    expect(fs.files.get("sobras/Aula-2.md")).toBe("ativa");
    expect(fs.files.get("sobras/Aula-3.md")).toBe("arquivada");
  });

  it("does nothing when there are no leftovers", async () => {
    fs.files.set("ativas/Aula.md", "salvo");
    expect(await store.moveLeftovers()).toEqual([]);
    expect(files()).toEqual(["ativas/Aula.md"]);
  });

  it("leaves the notes list without leftovers afterwards", async () => {
    fs.files.set("ativas/Aula.md.tmp", "x");
    await store.moveLeftovers();
    expect(await fs.readDir("ativas")).toEqual([]);
  });
});
