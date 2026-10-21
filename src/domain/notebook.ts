import type { NotesStore } from "../storage/notesStore";
import type { NoteColor } from "./chambers";
import { noteFileBase, parseNote, serializeNote, type Note } from "./noteFile";
import { titleOf } from "./noteText";
import type { Settings } from "./settings";

/** Callbacks the notebook calls; the UI uses them to redraw and to show messages. */
export interface NotebookEvents {
  /** A color's note was loaded, closed or replaced: redraw its chamber. */
  onChange?: (colorId: string) => void;
  /** Something failed in the background (e.g. an autosave while OneDrive holds the file). */
  onError?: (error: unknown) => void;
}

export interface NotebookOptions {
  store: NotesStore;
  colors: readonly NoteColor[];
  settings: Pick<Settings, "autosaveDelayMs">;
  events?: NotebookEvents;
}

/** The active note of one color, and where it is on disk (null until first saved). */
interface Entry {
  note: Note;
  fileName: string | null;
  dirty: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * The active notes, one per color. Typing changes the note in memory and saves it
 * by itself a moment later. The file is named `AAAA-MM cor - sem título.md` at first,
 * renamed once when the title is confirmed (Enter on the first line), and adjusted
 * to the final title when the note is closed and archived.
 */
export class Notebook {
  private readonly entries = new Map<string, Entry>();
  /** Disk operations run one at a time, in order, so two saves never overlap. */
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly options: NotebookOptions) {}

  /** Reads the active notes from disk. Unreadable files are reported and skipped. */
  async load(): Promise<void> {
    const { store, events } = this.options;
    for (const fileName of await store.list("active")) {
      try {
        const note = parseNote(await store.read("active", fileName));
        const current = this.entries.get(note.colorId);
        // Only one active note per color: if there are more, keep the most recent.
        if (current && current.note.updatedAt >= note.updatedAt) continue;
        this.entries.set(note.colorId, { note, fileName, dirty: false });
        events?.onChange?.(note.colorId);
      } catch (error) {
        events?.onError?.(error);
      }
    }
  }

  /** The text of the color's active note, or "" when there is none. */
  text(colorId: string): string {
    return this.entries.get(colorId)?.note.text ?? "";
  }

  /** Whether the color has an active note (an opened but still empty one does not count). */
  hasNote(colorId: string): boolean {
    const entry = this.entries.get(colorId);
    return entry !== undefined && (entry.fileName !== null || entry.note.text !== "");
  }

  /** Changes the color's active note, creating it if needed, and schedules the autosave. */
  edit(colorId: string, text: string): void {
    let entry = this.entries.get(colorId);
    if (!entry) {
      const now = new Date().toISOString();
      const note = { id: crypto.randomUUID(), colorId, text, createdAt: now, updatedAt: now };
      entry = { note, fileName: null, dirty: true };
      this.entries.set(colorId, entry);
    }
    entry.note.text = text;
    entry.dirty = true;
    this.scheduleAutosave(entry);
  }

  /** Enter on the first line: saves, and gives the file its title if it still has the provisional name. */
  confirmTitle(colorId: string): Promise<void> {
    const entry = this.entries.get(colorId);
    if (!entry) return Promise.resolve();
    clearTimeout(entry.timer);
    return this.run(async () => {
      await this.save(entry);
      const title = titleOf(entry.note.text);
      if (entry.fileName !== null && title !== "" && this.isProvisional(entry, entry.fileName)) {
        entry.fileName = await this.options.store.rename(entry.fileName, this.fileBase(entry));
      }
    });
  }

  /** Closes the color's note: saves it, names the file after its title and archives it. */
  close(colorId: string): Promise<void> {
    const entry = this.entries.get(colorId);
    if (!entry) return Promise.resolve();
    clearTimeout(entry.timer);
    // Leave the color free at once, so typing again starts a new note.
    this.entries.delete(colorId);
    return this.run(async () => {
      try {
        await this.save(entry);
        if (entry.fileName === null) return; // opened and closed without writing anything
        const { store } = this.options;
        entry.fileName = await store.rename(entry.fileName, this.fileBase(entry));
        await store.archive(entry.fileName);
      } catch (error) {
        // Nothing is lost: the note goes back to being the active one, if the color is still free.
        if (!this.entries.has(colorId)) this.entries.set(colorId, entry);
        throw error;
      } finally {
        this.options.events?.onChange?.(colorId);
      }
    });
  }

  /** Saves every pending change right away (e.g. before the app closes). */
  flush(): Promise<void> {
    const entries = [...this.entries.values()];
    for (const entry of entries) clearTimeout(entry.timer);
    return this.run(async () => {
      for (const entry of entries) await this.save(entry);
    });
  }

  private scheduleAutosave(entry: Entry): void {
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      this.run(() => this.save(entry)).catch((error: unknown) => {
        this.options.events?.onError?.(error);
        // Try again later; the text stays in memory meanwhile.
        if (this.entries.get(entry.note.colorId) === entry) this.scheduleAutosave(entry);
      });
    }, this.options.settings.autosaveDelayMs);
  }

  private async save(entry: Entry): Promise<void> {
    if (!entry.dirty) return;
    if (entry.fileName === null && entry.note.text === "") return;
    const savedText = entry.note.text;
    entry.note.updatedAt = new Date().toISOString();
    const content = serializeNote(entry.note);
    const { store } = this.options;
    if (entry.fileName === null) {
      entry.fileName = await store.create(this.fileBase(entry, ""), content);
    } else {
      await store.save("active", entry.fileName, content);
    }
    // If the user typed during the save, the next autosave picks it up.
    if (entry.note.text === savedText) entry.dirty = false;
  }

  /** `AAAA-MM cor - título`, from the note's creation date, color and (by default) current title. */
  private fileBase(entry: Entry, title = titleOf(entry.note.text)): string {
    const { colorId, createdAt } = entry.note;
    const colorName = this.options.colors.find((c) => c.id === colorId)?.name ?? colorId;
    return noteFileBase(new Date(createdAt), colorName, title);
  }

  /** Whether the file still has the "sem título" name (maybe with -2, -3...). */
  private isProvisional(entry: Entry, fileName: string): boolean {
    const base = this.fileBase(entry, "");
    return fileName.startsWith(base) && /^(-\d+)?\.md$/.test(fileName.slice(base.length));
  }

  private run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
