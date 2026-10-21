/**
 * The few disk operations the notes store needs, with paths relative to the notes folder.
 * Implemented by the Tauri plugin (real disk) and by an in-memory version (tests).
 * There is no "delete" on purpose: archiving is a rename.
 */
export interface FileSystem {
  /** Creates the folder and any missing parents; does nothing if it exists. */
  mkdir(path: string): Promise<void>;
  /** Names of the files (not folders) directly inside the folder. */
  readDir(path: string): Promise<string[]>;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
  /** Moves a file, replacing the destination if it exists. */
  rename(from: string, to: string): Promise<void>;
}
