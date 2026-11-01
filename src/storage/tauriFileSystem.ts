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
 * The notes folder, inside the user's Documents: the real notes for the installed app,
 * test notes for the one opened with `npm run app:dev`. Tauri asks Windows where Documents
 * is, so it also works when Documents lives in OneDrive. Must match the scope in
 * `src-tauri/capabilities/default.json`. The app of the e2e tests uses a subfolder of the
 * test notes, so it needs no permission of its own.
 */
export function notesRootFor(dev: boolean, e2e = false): string {
  if (e2e) return "Tambor de Notas (Dev)/notas/e2e";
  return dev ? "Tambor de Notas (Dev)/notas" : "Tambor de Notas/notas";
}

/** The notes folder of the app that is running. */
export const NOTES_ROOT = notesRootFor(import.meta.env.DEV, import.meta.env.VITE_E2E === "1");

/** The real disk, through the Tauri fs plugin, limited to `root` inside `baseDir`. */
function tauriFileSystemIn(baseDir: BaseDirectory, root: string): FileSystem {
  const options = { baseDir };
  const at = (path: string): string =>
    root === "" ? path : path === "" ? root : `${root}/${path}`;
  return {
    mkdir: (path) => mkdir(at(path), { ...options, recursive: true }),
    readDir: async (path) =>
      (await readDir(at(path), options)).filter((e) => e.isFile).map((e) => e.name),
    readText: (path) => readTextFile(at(path), options),
    writeText: (path, content) => writeTextFile(at(path), content, options),
    rename: (from, to) =>
      rename(at(from), at(to), { oldPathBaseDir: baseDir, newPathBaseDir: baseDir }),
  };
}

/** The notes folder in Documents. */
export const tauriFileSystem = tauriFileSystemIn(BaseDirectory.Document, NOTES_ROOT);

/** The app's own folder (AppData), for settings and counters. */
export const appDataFileSystem = tauriFileSystemIn(BaseDirectory.AppData, "");
