import { placeAtRightEdge, type DrumGeometry, type Point, type Rect } from "./drum";

/** The editor panel size: normal, or expanded to read or edit a long note. */
export type PanelSize = "normal" | "expanded";

/** Where things go when the panel is open (or not). */
export interface WindowLayout {
  /** The app window, in screen pixels (logical). */
  window: Rect;
  /** Top-left corner of the drum drawing, inside the window. */
  drumOrigin: Point;
  /** The editor panel, inside the window; null when it is not open. */
  panel: Rect | null;
}

const PANEL_GAP = 8; // between the panel and the drum ring
const SCREEN_MARGIN = 8; // the panel never touches the work area edges
const SHADOW_PAD = 12; // room for the panel shadow inside the window

/** Panel size, from the drum radius, with minimums so it stays usable on small drums. */
function panelSize(drum: DrumGeometry, size: PanelSize): { width: number; height: number } {
  const R = drum.outerRadius;
  return size === "normal"
    ? { width: Math.max(320, 2.4 * R), height: Math.max(240, 2 * R) }
    : { width: Math.max(480, 3.6 * R), height: Math.max(480, 5 * R) };
}

/**
 * Lays out the window: the drum always stays where it is on the screen (against the
 * right edge), and the open panel sits to its left, centered on it, inside the work area.
 */
export function windowLayout(
  drum: DrumGeometry,
  workArea: Rect,
  panel: PanelSize | null,
): WindowLayout {
  const spot = placeAtRightEdge(workArea, drum.width, drum.height);
  const drumRect = { ...spot, width: drum.width, height: drum.height };
  if (panel === null) return { window: drumRect, drumOrigin: { x: 0, y: 0 }, panel: null };

  const wanted = panelSize(drum, panel);
  const workBottom = workArea.y + workArea.height;
  const right = spot.x + drum.center.x - drum.outerRadius - PANEL_GAP;
  const left = Math.max(workArea.x + SCREEN_MARGIN, right - wanted.width);
  const height = Math.min(wanted.height, workArea.height - 2 * SCREEN_MARGIN);
  const centerY = spot.y + drum.center.y;
  const top = Math.min(
    Math.max(centerY - height / 2, workArea.y + SCREEN_MARGIN),
    workBottom - SCREEN_MARGIN - height,
  );

  const winLeft = Math.max(workArea.x, left - SHADOW_PAD);
  const winTop = Math.max(workArea.y, Math.min(spot.y, top - SHADOW_PAD));
  const winRight = drumRect.x + drumRect.width;
  const winBottom = Math.min(workBottom, Math.max(spot.y + drum.height, top + height + SHADOW_PAD));

  return {
    window: { x: winLeft, y: winTop, width: winRight - winLeft, height: winBottom - winTop },
    drumOrigin: { x: spot.x - winLeft, y: spot.y - winTop },
    panel: { x: left - winLeft, y: top - winTop, width: right - left, height },
  };
}
