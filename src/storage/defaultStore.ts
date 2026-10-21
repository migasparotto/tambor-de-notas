import { isTauri } from "@tauri-apps/api/core";
import { createAppDataStore, type AppDataStore } from "./appDataStore";
import { MemoryFileSystem } from "./memoryFileSystem";
import { createNotesStore, type NotesStore } from "./notesStore";
import { appDataFileSystem, tauriFileSystem } from "./tauriFileSystem";

/** The notes store for this run: the real disk inside Tauri, memory in a plain browser. */
export function defaultNotesStore(): NotesStore {
  return createNotesStore(isTauri() ? tauriFileSystem : new MemoryFileSystem());
}

/** The app data store for this run: the app folder inside Tauri, memory in a plain browser. */
export function defaultAppDataStore(): AppDataStore {
  return createAppDataStore(isTauri() ? appDataFileSystem : new MemoryFileSystem());
}
