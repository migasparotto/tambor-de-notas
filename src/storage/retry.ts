/** How many times to try a disk operation, and how long to wait between tries. */
export interface RetryOptions {
  attempts: number;
  delayMs: number;
}

/** Defaults: about one second in total, enough for a OneDrive sync to let go of a file. */
export const DEFAULT_RETRY: Readonly<RetryOptions> = { attempts: 5, delayMs: 250 };

/** Windows errors for a file held by another program: access denied, sharing and lock violation. */
const BUSY_ERROR = /os error (5|32|33)\b/;

/** Thrown when a file stays busy (usually OneDrive syncing) after every retry. */
export class FileBusyError extends Error {
  constructor(readonly fileName: string) {
    super(
      `O arquivo "${fileName}" está em uso agora, provavelmente pelo OneDrive sincronizando. ` +
        "Tente de novo em instantes.",
    );
    this.name = "FileBusyError";
  }
}

/** Tells whether an error means the file is held by another program for a moment. */
export function isFileBusy(error: unknown): boolean {
  return BUSY_ERROR.test(String(error));
}

/**
 * Runs `operation`, trying again while the file is busy.
 * Other errors are thrown at once; if it is still busy at the end, throws `FileBusyError`.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  fileName: string,
  options: RetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isFileBusy(error)) throw error;
      if (attempt >= options.attempts) throw new FileBusyError(fileName);
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }
}
