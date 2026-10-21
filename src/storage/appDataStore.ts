import type { FileSystem } from "./fileSystem";
import { DEFAULT_RETRY, withRetry, type RetryOptions } from "./retry";

/** Small text files in the app's own folder (settings, counters), by name. */
export interface AppDataStore {
  /** The file content, or null if the file does not exist yet. */
  read(name: string): Promise<string | null>;
  /** Writes the file safely: first to a `.tmp` file, then renamed over the real one. */
  write(name: string, content: string): Promise<void>;
}

/** Windows errors for a missing file (2) or a missing folder (3, e.g. the app folder on first run). */
const NOT_FOUND = /os error (2|3)\b/;

/** Builds the app data store on top of a FileSystem (the real disk or the in-memory one). */
export function createAppDataStore(
  fs: FileSystem,
  retry: RetryOptions = DEFAULT_RETRY,
): AppDataStore {
  return {
    async read(name) {
      try {
        return await withRetry(() => fs.readText(name), name, retry);
      } catch (error) {
        if (NOT_FOUND.test(String(error))) return null;
        throw error;
      }
    },

    async write(name, content) {
      await withRetry(
        async () => {
          await fs.mkdir("");
          await fs.writeText(`${name}.tmp`, content);
          await fs.rename(`${name}.tmp`, name);
        },
        name,
        retry,
      );
    },
  };
}
