import type { FileSystem } from "./fileSystem";
import { NOTE_EXTENSION, toSafeFileName, uniqueFileName } from "./fileName";
import { DEFAULT_RETRY, withRetry, type RetryOptions } from "./retry";

/** The two folders notes live in. */
export type NoteFolder = "active" | "archived";

const FOLDER_PATHS: Record<NoteFolder, string> = { active: "ativas", archived: "arquivadas" };
const TEMP_EXTENSION = ".tmp";

/**
 * The single door to the notes on disk. The rest of the app only uses this,
 * never the Tauri plugin directly. File names are like `Derivadas.md`.
 */
export interface NotesStore {
  /** Names of the notes in a folder (half-written `.tmp` files are left out). */
  list(folder: NoteFolder): Promise<string[]>;
  /** The full text of a note file. */
  read(folder: NoteFolder, fileName: string): Promise<string>;
  /** Writes a note safely: first to a `.tmp` file, then renamed over the real one. */
  save(folder: NoteFolder, fileName: string, content: string): Promise<void>;
  /** Saves a new active note, naming it after the title; returns the file name chosen. */
  create(title: string, content: string): Promise<string>;
  /** Moves a note from active to archived; returns its name in the archive. */
  archive(fileName: string): Promise<string>;
}

/** Throws if the name could reach outside its folder (e.g. `../x.md`). */
function assertPlainName(fileName: string): void {
  if (/[/\\]/.test(fileName) || !fileName.endsWith(NOTE_EXTENSION)) {
    throw new Error(`Nome de nota inválido: "${fileName}"`);
  }
}

/** Builds the notes store on top of a FileSystem (the real disk or the in-memory one). */
export function createNotesStore(fs: FileSystem, retry: RetryOptions = DEFAULT_RETRY): NotesStore {
  const pathOf = (folder: NoteFolder, fileName: string) => `${FOLDER_PATHS[folder]}/${fileName}`;

  async function list(folder: NoteFolder): Promise<string[]> {
    await fs.mkdir(FOLDER_PATHS[folder]);
    const names = await fs.readDir(FOLDER_PATHS[folder]);
    return names.filter((name) => name.endsWith(NOTE_EXTENSION));
  }

  async function save(folder: NoteFolder, fileName: string, content: string): Promise<void> {
    assertPlainName(fileName);
    const path = pathOf(folder, fileName);
    await withRetry(
      async () => {
        await fs.mkdir(FOLDER_PATHS[folder]);
        await fs.writeText(path + TEMP_EXTENSION, content);
        await fs.rename(path + TEMP_EXTENSION, path);
      },
      fileName,
      retry,
    );
  }

  return {
    list,
    save,

    async read(folder, fileName) {
      assertPlainName(fileName);
      return withRetry(() => fs.readText(pathOf(folder, fileName)), fileName, retry);
    },

    async create(title, content) {
      const taken = [...(await list("active")), ...(await list("archived"))];
      const fileName = uniqueFileName(toSafeFileName(title), taken);
      await save("active", fileName, content);
      return fileName;
    },

    async archive(fileName) {
      assertPlainName(fileName);
      const name = fileName.slice(0, -NOTE_EXTENSION.length);
      const archivedName = uniqueFileName(name, await list("archived"));
      await withRetry(
        () => fs.rename(pathOf("active", fileName), pathOf("archived", archivedName)),
        fileName,
        retry,
      );
      return archivedName;
    },
  };
}
