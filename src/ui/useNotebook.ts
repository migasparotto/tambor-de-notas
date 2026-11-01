import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { NoteColor } from "../domain/chambers";
import { createAppNotebook, notesErrorMessage } from "../domain/notebook";
import type { Settings } from "../domain/settings";

/**
 * Connects the notebook (the notes rules) to React: loads the active notes,
 * redraws when they change, saves everything when the window closes and
 * sends a short message to `onNotice` when something fails.
 */
export function useNotebook(
  colors: readonly NoteColor[],
  settings: Pick<Settings, "autosaveDelayMs" | "maxActiveNotesPerColor">,
  onNotice: (notice: string) => void,
) {
  const [, setVersion] = useState(0);
  const redraw = () => setVersion((v) => v + 1);
  const report = (error: unknown) => onNotice(notesErrorMessage(error));

  const [notebook] = useState(() =>
    createAppNotebook({
      colors,
      settings,
      events: { onChange: redraw, onError: report, onNotice },
    }),
  );

  useEffect(() => {
    notebook.load().catch((error: unknown) => onNotice(notesErrorMessage(error)));
    if (!isTauri()) return;
    const closing = getCurrentWindow().onCloseRequested(() => notebook.flush());
    return () => void closing.then((stop) => stop());
  }, [notebook, onNotice]);

  return {
    text: (colorId: string) => notebook.text(colorId),
    /** The note subject, or the color's last subject when there is no note yet. */
    subject: (colorId: string) => notebook.subject(colorId),
    editSubject: (colorId: string, subject: string) => {
      notebook.editSubject(colorId, subject);
      redraw();
    },
    /** The note as written in its .md file (for "ver Markdown"). */
    markdown: (colorId: string) => notebook.markdown(colorId),
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
  };
}
