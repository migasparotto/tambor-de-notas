import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Gives the keyboard back to the window that had it before the drum (usually the video).
 * Done by the Rust side (`src-tauri/src/focus.rs`); does nothing outside Tauri.
 */
export function returnFocus(): void {
  if (isTauri()) void invoke<boolean>("return_focus").catch(() => undefined);
}
