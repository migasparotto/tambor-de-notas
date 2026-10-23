import { useEffect, useMemo, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { drumGeometry, type DrumGeometry, type Rect } from "../domain/drum";
import { windowLayout, type PanelSize, type WindowLayout } from "../domain/panel";
import type { DrumPlacement } from "../domain/placement";

interface Screen {
  workArea: Rect;
  height: number;
}

/** Outside Tauri (plain browser), use the browser's idea of the screen. */
const browserScreen = (): Screen => ({
  workArea: { x: 0, y: 0, width: window.screen.availWidth, height: window.screen.availHeight },
  height: window.screen.height,
});

/**
 * Sizes and places the app window: just the drum, or the drum plus the editor panel,
 * against the edge and at the height of `placement`.
 * The new layout is shown only after the window has its new size, so the drum does not jump.
 * Also reports whether the app has focus (used for the translucent look) and the work area.
 */
export function useAppWindow(
  heightFraction: number,
  panel: PanelSize | null,
  placement: DrumPlacement,
): { geometry: DrumGeometry; layout: WindowLayout; focused: boolean; workArea: Rect } {
  const [screen, setScreen] = useState<Screen>(browserScreen);
  const [focused, setFocused] = useState(() => document.hasFocus());
  const geometry = useMemo(
    () => drumGeometry(screen.height, heightFraction, placement.edge),
    [screen.height, heightFraction, placement.edge],
  );
  const wanted = useMemo(
    () => windowLayout(geometry, screen.workArea, panel, placement),
    [geometry, screen.workArea, panel, placement],
  );
  // Inside Tauri, the layout in use is the one the window has already been resized for.
  const [applied, setApplied] = useState(wanted);
  const layout = isTauri() ? applied : wanted;

  // The page's own focus events: they arrive in order and follow exactly where the keyboard is.
  useEffect(() => {
    const update = () => setFocused(document.hasFocus());
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;

    void (async () => {
      const monitor = await currentMonitor();
      if (monitor && !cancelled) {
        const scale = monitor.scaleFactor;
        const { position, size } = monitor.workArea;
        setScreen({
          workArea: {
            x: position.x / scale,
            y: position.y / scale,
            width: size.width / scale,
            height: size.height / scale,
          },
          height: monitor.size.height / scale,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    const win = getCurrentWindow();
    const { x, y, width, height } = wanted.window;
    void (async () => {
      await Promise.all([
        win.setSize(new LogicalSize(width, height)),
        win.setPosition(new LogicalPosition(x, y)),
      ]);
      if (cancelled) return;
      setApplied(wanted);
      await win.show();
    })();
    return () => {
      cancelled = true;
    };
  }, [wanted]);

  return { geometry, layout, focused, workArea: screen.workArea };
}
