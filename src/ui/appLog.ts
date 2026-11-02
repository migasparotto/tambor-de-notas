import { isTauri } from "@tauri-apps/api/core";
import { error as logError } from "@tauri-apps/plugin-log";
import { describeError } from "../domain/errorReport";

/**
 * Writes an unexpected error to the app's log file. Never throws: if the log is not available,
 * the app goes on as before. The Rust side removes note content before writing.
 */
export function logUnexpectedError(where: string, error: unknown): void {
  if (!isTauri()) return;
  logError(describeError(where, error)).catch(() => undefined);
}

/** Sends to the log the JavaScript errors nobody handled. */
export function watchUnexpectedErrors(): void {
  window.addEventListener("error", (event) =>
    logUnexpectedError("erro não tratado", event.error ?? event.message),
  );
  window.addEventListener("unhandledrejection", (event) =>
    logUnexpectedError("promessa rejeitada", event.reason),
  );
}
