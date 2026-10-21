import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { drumGeometry, placeAtRightEdge, type DrumGeometry } from "../domain/drum";

/**
 * Sizes the app window to the drum, docks it to the right edge of the screen and
 * reports whether the window has focus (used for the translucent look).
 */
export function useDrumWindow(heightFraction: number): {
  geometry: DrumGeometry;
  focused: boolean;
} {
  const [geometry, setGeometry] = useState(() =>
    drumGeometry(window.screen.height, heightFraction),
  );
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      const monitor = await currentMonitor();
      if (monitor) {
        const scale = monitor.scaleFactor;
        const { position, size } = monitor.workArea;
        const workArea = {
          x: position.x / scale,
          y: position.y / scale,
          width: size.width / scale,
          height: size.height / scale,
        };
        const g = drumGeometry(monitor.size.height / scale, heightFraction);
        const spot = placeAtRightEdge(workArea, g.width, g.height);
        await win.setSize(new LogicalSize(g.width, g.height));
        await win.setPosition(new LogicalPosition(spot.x, spot.y));
        if (!cancelled) setGeometry(g);
      }
      await win.show();
      const stop = await win.onFocusChanged(({ payload }) => setFocused(payload));
      if (cancelled) stop();
      else unlisten = stop;
      setFocused(await win.isFocused());
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [heightFraction]);

  return { geometry, focused };
}
