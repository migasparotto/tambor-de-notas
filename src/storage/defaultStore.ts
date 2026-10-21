import { isTauri } from "@tauri-apps/api/core";
import { MemoryFileSystem } from "./memoryFileSystem";
import { createNotesStore, type NotesStore } from "./notesStore";
import { tauriFileSystem } from "./tauriFileSystem";

/** The notes store for this run: the real disk inside Tauri, memory in a plain browser. */
export function defaultNotesStore(): NotesStore {
  return createNotesStore(isTauri() ? tauriFileSystem : new MemoryFileSystem());
}
