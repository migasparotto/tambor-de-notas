import type { DrumGeometry, Point, Rect } from "./drum";
import { DEFAULT_PLACEMENT, placeDrum, type DrumPlacement } from "./placement";

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
 * Lays out the window: the drum always stays where it is on the screen (against its edge,
 * at its height), and the open panel sits beside it, on the side away from the edge,
 * centered on it and inside the work area. `drum` must be drawn for the same edge.
 */
export function windowLayout(
  drum: DrumGeometry,
  workArea: Rect,
  panel: PanelSize | null,
  placement: DrumPlacement = DEFAULT_PLACEMENT,
): WindowLayout {
  const spot = placeDrum(workArea, drum.width, drum.height, placement);
  const drumRect = { ...spot, width: drum.width, height: drum.height };
  if (panel === null) return { window: drumRect, drumOrigin: { x: 0, y: 0 }, panel: null };

  const wanted = panelSize(drum, panel);
  const workBottom = workArea.y + workArea.height;
  const workRight = workArea.x + workArea.width;
  let left: number;
  let right: number;
  if (placement.edge === "right") {
    right = spot.x + drum.center.x - drum.outerRadius - PANEL_GAP;
    left = Math.max(workArea.x + SCREEN_MARGIN, right - wanted.width);
  } else {
    left = spot.x + drum.center.x + drum.outerRadius + PANEL_GAP;
    right = Math.min(workRight - SCREEN_MARGIN, left + wanted.width);
  }
  const height = Math.min(wanted.height, workArea.height - 2 * SCREEN_MARGIN);
  const centerY = spot.y + drum.center.y;
  const top = Math.min(
    Math.max(centerY - height / 2, workArea.y + SCREEN_MARGIN),
    workBottom - SCREEN_MARGIN - height,
  );

  const winLeft = placement.edge === "right" ? Math.max(workArea.x, left - SHADOW_PAD) : drumRect.x;
  const winRight =
    placement.edge === "right"
      ? drumRect.x + drumRect.width
      : Math.min(workRight, right + SHADOW_PAD);
  const winTop = Math.max(workArea.y, Math.min(spot.y, top - SHADOW_PAD));
  const winBottom = Math.min(workBottom, Math.max(spot.y + drum.height, top + height + SHADOW_PAD));

  return {
    window: { x: winLeft, y: winTop, width: winRight - winLeft, height: winBottom - winTop },
    drumOrigin: { x: spot.x - winLeft, y: spot.y - winTop },
    panel: { x: left - winLeft, y: top - winTop, width: right - left, height },
  };
}

/**
 * Whether the drum window may take the keyboard. Only while a note panel is open: then
 * typing goes into the note. Otherwise (no panel, or one shrinking back into its chamber)
 * clicks on the clock, stop or "+" work but the keyboard stays with the video.
 */
export function canTakeKeyboard(panelOpen: boolean): boolean {
  return panelOpen;
}

/** What the drum's look depends on. */
export interface DrumLook {
  panelOpen: boolean;
  /** The page says it has focus. Without an open panel it can be wrong: a click on the
   * clock marks the page focused although the window never takes the keyboard. */
  focused: boolean;
  /** The end-of-cycle alert is showing. */
  alerting: boolean;
}

/**
 * Whether the drum is shown sharp (otherwise translucent): during the end-of-cycle alert,
 * or while a note is open and in use. Clicks on the clock, stop or "+" never make it sharp.
 */
export function isDrumSharp({ panelOpen, focused, alerting }: DrumLook): boolean {
  return alerting || (panelOpen && focused);
}

/** The keys the drum window listens to (the parts of a keyboard event it needs). */
export interface DrumKey {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/** What a key does in the drum window. */
export type DrumKeyAction = "collapseAndLeave" | "leave" | "closeNote";

/**
 * What a key does anywhere in the drum window. Esc gives the keyboard back to the window
 * that had it before (the video), collapsing the panel first if it is open; the note stays
 * active. Ctrl+Enter closes the open note. Other keys, or other modifiers, do nothing.
 */
export function drumKeyAction(press: DrumKey, panelOpen: boolean): DrumKeyAction | null {
  const { key, ctrlKey, shiftKey, altKey, metaKey } = press;
  if (shiftKey || altKey || metaKey) return null;
  if (key === "Escape" && !ctrlKey) return panelOpen ? "collapseAndLeave" : "leave";
  if (key === "Enter" && ctrlKey && panelOpen) return "closeNote";
  return null;
}
