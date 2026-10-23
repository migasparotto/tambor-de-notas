import type { Point, Rect } from "./drum";

/** The screen edge the drum leans against; its open side faces that edge. */
export type DrumEdge = "right" | "left";

/** Where the drum sits: the edge, and how far down its center is (0 = top, 1 = bottom of the work area). */
export interface DrumPlacement {
  edge: DrumEdge;
  centerY: number;
}

/** Against the right edge, centered: where the drum starts the first time. */
export const DEFAULT_PLACEMENT: DrumPlacement = { edge: "right", centerY: 0.5 };

/** The pointer has to move this much (in pixels) before a press on the drum becomes a drag. */
export const DRAG_THRESHOLD = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Top of the drum on the screen, kept inside the work area. */
function drumTop(workArea: Rect, height: number, centerY: number): number {
  const top = workArea.y + centerY * workArea.height - height / 2;
  return clamp(top, workArea.y, Math.max(workArea.y, workArea.y + workArea.height - height));
}

/** Places a drum window of the given size against its edge, at its height, inside the work area. */
export function placeDrum(
  workArea: Rect,
  width: number,
  height: number,
  placement: DrumPlacement,
): Point {
  return {
    x: placement.edge === "right" ? workArea.x + workArea.width - width : workArea.x,
    y: drumTop(workArea, height, placement.centerY),
  };
}

/** Whether the pointer moved far enough from where it was pressed to start a drag. */
export function isDrag(start: Point, now: Point): boolean {
  return Math.hypot(now.x - start.x, now.y - start.y) > DRAG_THRESHOLD;
}

/**
 * Where the drum goes while it is dragged. It follows the pointer up and down (keeping the
 * spot where it was grabbed, `grabOffsetY` below its center) and sticks to the edge of the
 * half of the screen the pointer is on. The result is always a spot the drum really fits in.
 */
export function placementWhileDragging(
  workArea: Rect,
  drumHeight: number,
  pointer: Point,
  grabOffsetY: number,
): DrumPlacement {
  const edge = pointer.x < workArea.x + workArea.width / 2 ? "left" : "right";
  const top = drumTop(
    workArea,
    drumHeight,
    (pointer.y - grabOffsetY - workArea.y) / workArea.height,
  );
  return { edge, centerY: (top + drumHeight / 2 - workArea.y) / workArea.height };
}

/** Reads a saved placement; anything missing or invalid falls back to the default. */
export function parsePlacement(text: string): DrumPlacement {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== "object" || data === null) return DEFAULT_PLACEMENT;
    const { edge, centerY } = data as Record<string, unknown>;
    return {
      edge: edge === "left" || edge === "right" ? edge : DEFAULT_PLACEMENT.edge,
      centerY:
        typeof centerY === "number" && Number.isFinite(centerY)
          ? clamp(centerY, 0, 1)
          : DEFAULT_PLACEMENT.centerY,
    };
  } catch {
    return DEFAULT_PLACEMENT;
  }
}

/** The placement as file text, rounded so the file stays readable. */
export function serializePlacement(placement: DrumPlacement): string {
  const centerY = Math.round(placement.centerY * 1000) / 1000;
  return `${JSON.stringify({ edge: placement.edge, centerY }, null, 2)}\n`;
}
