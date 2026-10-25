import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { cursorPosition, getCurrentWindow } from "@tauri-apps/api/window";
import { isOverDrum, type DrumGeometry } from "../domain/drum";

/** How often (ms) the cursor is checked while clicks may pass through. */
const POLL_MS = 50;

/**
 * Lets clicks on the transparent corners of the drum window reach the window behind (the
 * video). While `active` (just the drum, no panel), the cursor is checked every POLL_MS and
 * the window ignores the mouse whenever the cursor is not over the drum. During a drag
 * (`isDragging`) and when not active, the whole window takes clicks.
 */
export function useClickThrough(
  geometry: DrumGeometry,
  active: boolean,
  isDragging: () => boolean,
): void {
  // Read by the poll, so new values do not restart it.
  const latest = useRef({ geometry, isDragging });
  useEffect(() => {
    latest.current = { geometry, isDragging };
  });

  useEffect(() => {
    if (!isTauri() || !active) return;
    const win = getCurrentWindow();
    let over = true; // the window starts out taking clicks
    let stopped = false;
    let busy = false;
    const check = async () => {
      const [cursor, origin, scale] = await Promise.all([
        cursorPosition(),
        win.outerPosition(),
        win.scaleFactor(),
      ]);
      const point = { x: (cursor.x - origin.x) / scale, y: (cursor.y - origin.y) / scale };
      const now = latest.current.isDragging() || isOverDrum(latest.current.geometry, point, over);
      if (now !== over && !stopped) {
        over = now;
        await win.setIgnoreCursorEvents(!now);
      }
    };
    const timer = setInterval(() => {
      if (busy) return;
      busy = true;
      check()
        .catch(() => undefined)
        .finally(() => (busy = false));
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
      void win.setIgnoreCursorEvents(false);
    };
  }, [active]);
}
