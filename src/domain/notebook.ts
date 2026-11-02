import { defaultNotesStore } from "../storage/defaultStore";
import type { NotesStore } from "../storage/notesStore";
import { FileBusyError } from "../storage/retry";
import { loadColorsData, saveColorsData, type LoadedColorsData } from "./appData";
import type { NoteColor } from "./chambers";
import { availableTones, createColor, offDrumColorsWithNote, type ColorFields } from "./colorRules";
import {
  lastSubject,
  rememberSubject,
  resolveColors,
  unknownColor,
  type ColorsData,
  type ResolvedColors,
} from "./colorData";
import { colorNameInFile, noteFileBase, parseNote, serializeNote, type Note } from "./noteFile";
import { titleOf } from "./noteText";
import type { Settings } from "./settings";

/** Callbacks the notebook calls; the UI uses them to redraw and to show messages. */
export interface NotebookEvents {
  /** A color's note was loaded, closed or replaced: redraw its chamber. */
  onChange?: (colorId: string) => void;
  /** Something failed in the background (e.g. an autosave while OneDrive holds the file). */
  onError?: (error: unknown) => void;
  /** Something the user should know that is not an error (e.g. leftovers were moved). */
  onNotice?: (message: string) => void;
}

/** The notice shown when leftover `.tmp` files were moved to `notas/sobras/`. */
export function leftoversMessage(count: number): string | null {
  if (count === 0) return null;
  const what =
    count === 1
      ? "1 sobra de um salvamento interrompido foi movida"
      : `${count} sobras de salvamentos interrompidos foram movidas`;
  return `${what} para notas\\sobras\\. Confira se falta algo nas notas e apague as sobras quando quiser.`;
}

/** The notice shown when `cores.json` cannot be used. */
export const COLORS_BLOCKED_MESSAGE =
  "Não consegui ler o arquivo cores.json. O app abriu com as cores padrão e não vai alterar o arquivo: corrija-o, ou apague-o, e reabra o app.";

/** The notice shown for a note whose color is not in `cores.json`. */
export function unknownColorMessage(colorId: string): string {
  return `Há uma nota da cor "${colorId}", que não está no cores.json. Ela abre com uma cor neutra, e nada foi alterado.`;
}

/** Where the colors data (`cores.json`) is read and saved. */
export interface ColorsDataStore {
  load: () => Promise<LoadedColorsData>;
  save: (data: ColorsData) => Promise<void>;
}

export interface NotebookOptions {
  store: NotesStore;
  /** Without it, the last subject of each color is remembered only while the app is open. */
  colorsStore?: ColorsDataStore;
  /** The initial colors; `cores.json` adds to them and changes them. */
  colors: readonly NoteColor[];
  settings: Pick<Settings, "autosaveDelayMs" | "maxActiveNotesPerColor">;
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
 * The active notes of each color, up to `maxActiveNotesPerColor` (1 for now: the color's
 * current note is the one shown and edited). Typing changes the note in memory and saves it
 * by itself a moment later. The file is named `AAAA-MM cor - sem título.md` at first,
 * renamed once when the title is confirmed (Enter on the first line), and adjusted
 * to the final title when the note is closed and archived.
 */
export class Notebook {
  /** Active notes by color, oldest first; the last one is the color's current note. */
  private readonly entries = new Map<string, Entry[]>();
  /** Disk operations run one at a time, in order, so two saves never overlap. */
  private queue: Promise<void> = Promise.resolve();
  /** What is remembered about each color (the last subject), read on load. */
  private colorsData: ColorsData = {};
  /** True when `cores.json` is broken: it is left as it is, and changes last only while open. */
  private colorsBlocked = false;

  constructor(private readonly options: NotebookOptions) {}

  /**
   * Moves leftover `.tmp` files to `sobras/` (and says so), then
   * reads the active notes from disk. If a color has more than allowed, the most recent
   * ones are kept and the others reported. Unreadable files are reported and skipped.
   */
  async load(): Promise<void> {
    const { store, events, settings, colorsStore } = this.options;
    if (colorsStore) {
      const { data, blocked } = await colorsStore.load();
      this.colorsData = data;
      this.colorsBlocked = blocked;
      if (blocked) events?.onNotice?.(COLORS_BLOCKED_MESSAGE);
    }
    // First, leftovers of interrupted saves go to `sobras/` (in the queue, so a second
    // load running at the same time finds nothing left to move).
    try {
      const message = leftoversMessage((await this.run(() => store.moveLeftovers())).length);
      if (message !== null) events?.onNotice?.(message);
    } catch (error) {
      events?.onError?.(error); // the notes still load
    }
    const loaded: Entry[] = [];
    for (const fileName of await store.list("active")) {
      try {
        loaded.push({
          note: parseNote(await store.read("active", fileName)),
          fileName,
          dirty: false,
        });
      } catch (error) {
        events?.onError?.(error);
      }
    }
    loaded.sort((a, b) => a.note.updatedAt.localeCompare(b.note.updatedAt));
    for (const entry of loaded) {
      const notes = this.notesOf(entry.note.colorId);
      // Loading twice (React runs start-up effects twice in development) must not duplicate notes.
      if (!notes.some((n) => n.note.id === entry.note.id)) notes.push(entry);
    }

    for (const [colorId, notes] of this.entries) {
      const extra = notes.splice(0, Math.max(notes.length - settings.maxActiveNotesPerColor, 0));
      for (const { fileName } of extra) {
        events?.onError?.(
          new Error(`"${fileName}" ficou de fora: a cor já tem o máximo de notas ativas.`),
        );
      }
      events?.onChange?.(colorId);
    }

    const known = resolveColors(this.colorsData, this.options.colors).colors;
    for (const { id } of this.resolvedColors().colors) {
      if (!known.some((color) => color.id === id)) events?.onNotice?.(unknownColorMessage(id));
    }
  }

  /**
   * The colors and who is in each chamber, from `cores.json`. An active note of a color that
   * is not there still counts: its color appears, off the drum, in a neutral tone.
   */
  resolvedColors(): ResolvedColors {
    const { colors, chambers } = resolveColors(this.colorsData, this.options.colors);
    const unknown = [...this.entries]
      .filter(([id, notes]) => notes.length > 0 && !colors.some((color) => color.id === id))
      .map(([id]) => unknownColor(id));
    return { colors: [...colors, ...unknown], chambers };
  }

  /** The colors off the drum that have an active note, listed on the drum's other side. */
  offDrumColors(): NoteColor[] {
    return offDrumColorsWithNote(this.resolvedColors(), (colorId) => this.hasNote(colorId));
  }

  /** The palette tones a new color can use. */
  availableTones(): string[] {
    return availableTones(this.colorsData);
  }

  /**
   * Creates a color in the chosen chamber and saves `cores.json`. The color that was there
   * leaves the drum, and its notes stay active. Returns the new color's id, or why it was refused.
   */
  createColor(
    fields: ColorFields,
    chamber: number,
  ): { ok: true; colorId: string } | { ok: false; error: string } {
    const created = createColor(this.colorsData, fields, chamber);
    if (!created.ok) return created;
    this.colorsData = created.data;
    void this.run(() => this.saveColors());
    return { ok: true, colorId: created.colorId };
  }

  /** The text of the color's current note, or "" when there is none. */
  text(colorId: string): string {
    return this.current(colorId)?.note.text ?? "";
  }

  /**
   * The color's current note as it is written in its `.md` file (header included,
   * `+texto+` as `## texto`), or "" when there is none. Used by "ver Markdown".
   */
  markdown(colorId: string): string {
    const entry = this.current(colorId);
    return entry ? serializeNote(entry.note) : "";
  }

  /** Whether the color has an active note (an opened but still empty one does not count). */
  hasNote(colorId: string): boolean {
    const entry = this.current(colorId);
    return entry !== undefined && (entry.fileName !== null || entry.note.text !== "");
  }

  /**
   * The subject of the color's current note. With no note yet, the last subject used
   * in the color, which the next note starts with ("" if there is none).
   */
  subject(colorId: string): string {
    return this.current(colorId)?.note.subject ?? lastSubject(this.colorsData, colorId);
  }

  /** Changes the color's current note, creating it if needed, and schedules the autosave. */
  edit(colorId: string, text: string): void {
    const entry = this.currentOrNew(colorId);
    entry.note.text = text;
    entry.dirty = true;
    this.scheduleAutosave(entry);
  }

  /**
   * Changes the subject of the color's current note, creating it if needed, and schedules
   * the autosave. The color remembers the subject when the note is saved.
   */
  editSubject(colorId: string, subject: string): void {
    const entry = this.currentOrNew(colorId);
    entry.note.subject = subject;
    entry.dirty = true;
    this.scheduleAutosave(entry);
  }

  /** Enter on the first line: saves, and gives the file its title if it still has the provisional name. */
  confirmTitle(colorId: string): Promise<void> {
    const entry = this.current(colorId);
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

  /** Closes the color's current note: saves it, names the file after its title and archives it. */
  close(colorId: string): Promise<void> {
    const notes = this.notesOf(colorId);
    const entry = notes.pop();
    if (!entry) return Promise.resolve();
    clearTimeout(entry.timer);
    // The note leaves the color at once, so typing again starts a new note.
    return this.run(async () => {
      try {
        await this.save(entry);
        if (entry.fileName === null) return; // opened and closed without writing anything
        const { store } = this.options;
        entry.fileName = await store.rename(entry.fileName, this.fileBase(entry));
        await store.archive(entry.fileName);
      } catch (error) {
        // Nothing is lost: the note goes back to the active ones, if the color still has room
        // (behind any note started meanwhile, which stays the current one).
        if (notes.length < this.options.settings.maxActiveNotesPerColor) notes.unshift(entry);
        throw error;
      } finally {
        this.options.events?.onChange?.(colorId);
      }
    });
  }

  /** Saves every pending change right away (e.g. before the app closes). */
  flush(): Promise<void> {
    const entries = [...this.entries.values()].flat();
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
        if (this.notesOf(entry.note.colorId).includes(entry)) this.scheduleAutosave(entry);
      });
    }, this.options.settings.autosaveDelayMs);
  }

  /** The color's active notes (the list is created on first use). */
  private notesOf(colorId: string): Entry[] {
    let notes = this.entries.get(colorId);
    if (!notes) {
      notes = [];
      this.entries.set(colorId, notes);
    }
    return notes;
  }

  private current(colorId: string): Entry | undefined {
    return this.entries.get(colorId)?.at(-1);
  }

  /** The color's current note, or a new empty one with the color's last subject. */
  private currentOrNew(colorId: string): Entry {
    const existing = this.current(colorId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const note = {
      id: crypto.randomUUID(),
      colorId,
      subject: lastSubject(this.colorsData, colorId),
      text: "",
      createdAt: now,
      updatedAt: now,
    };
    const entry: Entry = { note, fileName: null, dirty: true };
    this.notesOf(colorId).push(entry);
    return entry;
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
    await this.rememberSubject(entry.note);
  }

  /** The note's subject becomes its color's last subject; `cores.json` is saved if it changed. */
  private async rememberSubject(note: Note): Promise<void> {
    const next = rememberSubject(this.colorsData, note.colorId, note.subject);
    if (next === this.colorsData) return;
    this.colorsData = next;
    await this.saveColors();
  }

  /**
   * Saves `cores.json`, unless it is broken. A failure is reported and does not stop what
   * asked for the save: the change stays in memory, and goes with the next save.
   */
  private async saveColors(): Promise<void> {
    if (this.colorsBlocked) return;
    await this.options.colorsStore?.save(this.colorsData).catch((error: unknown) => {
      this.options.events?.onError?.(error);
    });
  }

  /**
   * `AAAA-MM cor - título`, from the note's creation date, color and (by default) current title.
   * A note already on disk keeps the color name of its file, even if the color was renamed.
   */
  private fileBase(entry: Entry, title = titleOf(entry.note.text)): string {
    const { colorId, createdAt } = entry.note;
    const current = this.resolvedColors().colors.find((c) => c.id === colorId)?.name ?? colorId;
    const colorName = entry.fileName ? colorNameInFile(entry.fileName, current) : current;
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

/**
 * The app's notebook, on the default notes store (the notes folder in Documents),
 * remembering the colors data in `cores.json` in the app folder.
 */
export function createAppNotebook(
  options: Omit<NotebookOptions, "store" | "colorsStore">,
): Notebook {
  return new Notebook({
    ...options,
    store: defaultNotesStore(),
    colorsStore: { load: () => loadColorsData(), save: (data) => saveColorsData(data) },
  });
}

/** A message the user can understand, for any error from the notes. */
export function notesErrorMessage(error: unknown): string {
  if (error instanceof FileBusyError) return error.message;
  const detail = error instanceof Error ? error.message : String(error);
  return `Não foi possível salvar ou ler uma nota agora. O texto continua no app. (${detail})`;
}
