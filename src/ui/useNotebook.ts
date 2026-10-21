import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { NoteColor } from "../domain/chambers";
import { createAppNotebook, notesErrorMessage } from "../domain/notebook";
import type { Settings } from "../domain/settings";

const MESSAGE_MS = 8000;

/**
 * Connects the notebook (the notes rules) to React: loads the active notes,
 * redraws when they change, saves everything when the window closes and
 * shows a short message when something fails.
 */
export function useNotebook(
  colors: readonly NoteColor[],
  settings: Pick<Settings, "autosaveDelayMs" | "maxActiveNotesPerColor">,
) {
  const [, setVersion] = useState(0);
  const redraw = () => setVersion((v) => v + 1);
  const [message, setMessage] = useState<string | null>(null);
  const report = (error: unknown) => setMessage(notesErrorMessage(error));

  const [notebook] = useState(() =>
    createAppNotebook({ colors, settings, events: { onChange: redraw, onError: report } }),
  );

  useEffect(() => {
    notebook.load().catch(report);
    if (!isTauri()) return;
    const closing = getCurrentWindow().onCloseRequested(() => notebook.flush());
    return () => void closing.then((stop) => stop());
  }, [notebook]);

  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return {
    text: (colorId: string) => notebook.text(colorId),
    hasNote: (colorId: string) => notebook.hasNote(colorId),
    edit: (colorId: string, text: string) => {
      notebook.edit(colorId, text);
      redraw();
    },
    confirmTitle: (colorId: string) => notebook.confirmTitle(colorId).catch(report),
    /** Closes and archives the note; resolves to false (and shows why) if it failed. */
    close: async (colorId: string): Promise<boolean> => {
      try {
        await notebook.close(colorId);
        return true;
      } catch (error) {
        report(error);
        return false;
      } finally {
        redraw();
      }
    },
    message,
  };
}
