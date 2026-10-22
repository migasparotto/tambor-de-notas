import type { FileSystem } from "./fileSystem";
import { NOTE_EXTENSION, toSafeFileName, uniqueFileName } from "./fileName";
import { DEFAULT_RETRY, withRetry, type RetryOptions } from "./retry";

/** The two folders notes live in. */
export type NoteFolder = "active" | "archived";

const FOLDER_PATHS: Record<NoteFolder, string> = { active: "ativas", archived: "arquivadas" };
const TEMP_EXTENSION = ".tmp";
/** Where leftover `.tmp` files go (the app cannot delete files, and they may hold text). */
export const LEFTOVERS_FOLDER = "sobras";

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
  /** Saves a new active note with a safe, unused version of `name`; returns the file name chosen. */
  create(name: string, content: string): Promise<string>;
  /** Renames an active note to a safe, unused version of `name`; returns the new file name. */
  rename(fileName: string, name: string): Promise<string>;
  /** Moves a note from active to archived; returns its name in the archive. */
  archive(fileName: string): Promise<string>;
  /**
   * Moves the `.tmp` files left by an interrupted save to the `sobras` folder, as `.md`
   * so they open easily (`Aula.md.tmp` → `sobras/Aula.md`). Returns their original names.
   */
  moveLeftovers(): Promise<string[]>;
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

  /** Names in both folders, so a new name never collides with an archived note. */
  async function allNames(): Promise<string[]> {
    return [...(await list("active")), ...(await list("archived"))];
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

    async create(name, content) {
      const fileName = uniqueFileName(toSafeFileName(name), await allNames());
      await save("active", fileName, content);
      return fileName;
    },

    async rename(fileName, name) {
      assertPlainName(fileName);
      const others = (await allNames()).filter((n) => n !== fileName);
      const newName = uniqueFileName(toSafeFileName(name), others);
      if (newName === fileName) return fileName;
      await withRetry(
        () => fs.rename(pathOf("active", fileName), pathOf("active", newName)),
        fileName,
        retry,
      );
      return newName;
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

    async moveLeftovers() {
      const moved: string[] = [];
      let taken: string[] | null = null;
      for (const folder of ["active", "archived"] as const) {
        await fs.mkdir(FOLDER_PATHS[folder]);
        const leftovers = (await fs.readDir(FOLDER_PATHS[folder])).filter((name) =>
          name.endsWith(TEMP_EXTENSION),
        );
        for (const name of leftovers) {
          if (taken === null) {
            await fs.mkdir(LEFTOVERS_FOLDER);
            taken = await fs.readDir(LEFTOVERS_FOLDER);
          }
          const base = name.slice(0, -TEMP_EXTENSION.length).replace(/\.md$/i, "");
          const target = uniqueFileName(base, taken);
          await withRetry(
            () => fs.rename(pathOf(folder, name), `${LEFTOVERS_FOLDER}/${target}`),
            name,
            retry,
          );
          taken.push(target);
          moved.push(name);
        }
      }
      return moved;
    },
  };
}
