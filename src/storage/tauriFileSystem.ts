import {
  BaseDirectory,
  mkdir,
  readDir,
  readTextFile,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import type { FileSystem } from "./fileSystem";

/**
 * The notes folder, inside the user's Documents. Tauri asks Windows where Documents is,
 * so it also works when Documents lives in OneDrive. Must match the scope in
 * `src-tauri/capabilities/default.json`.
 */
export const NOTES_ROOT = "Tambor de Notas/notas";

const inDocuments = { baseDir: BaseDirectory.Document };
const at = (path: string): string => `${NOTES_ROOT}/${path}`;

/** The real disk, through the Tauri fs plugin, limited to the notes folder. */
export const tauriFileSystem: FileSystem = {
  mkdir: (path) => mkdir(at(path), { ...inDocuments, recursive: true }),
  readDir: async (path) =>
    (await readDir(at(path), inDocuments)).filter((e) => e.isFile).map((e) => e.name),
  readText: (path) => readTextFile(at(path), inDocuments),
  writeText: (path, content) => writeTextFile(at(path), content, inDocuments),
  rename: (from, to) =>
    rename(at(from), at(to), {
      oldPathBaseDir: BaseDirectory.Document,
      newPathBaseDir: BaseDirectory.Document,
    }),
};
