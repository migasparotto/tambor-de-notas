/** A point in window pixels (logical, before display scaling). */
export interface Point {
  x: number;
  y: number;
}

/** A rectangle in screen pixels. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Everything needed to draw the drum, in window pixels. */
export interface DrumGeometry {
  /** Window size that fits the visible half of the drum. */
  width: number;
  height: number;
  center: Point;
  outerRadius: number;
  innerRadius: number;
  hubRadius: number;
  /** Diameter of each chamber. */
  chamberSize: number;
  /** Centers of the 7 chambers, top to bottom (chambers 2 to 8). */
  chambers: Point[];
  plus: { center: Point; size: number };
  clock: { center: Point; width: number; height: number; fontSize: number };
  stop: { center: Point; size: number };
  /** Small completed-cycles counter, to the right of the stop button. */
  cycles: { center: Point; width: number; height: number; fontSize: number };
}

/** Allowed range for the drum height fraction; values outside are clamped. */
export const DRUM_HEIGHT_LIMITS = { min: 0.15, max: 0.6 } as const;

const CHAMBER_COUNT = 7;
const FIRST_CHAMBER_ANGLE = 246; // degrees, y grows downward: 270 is straight up
const CHAMBER_STEP = 22;
const PLUS_ANGLE = 94; // bottom tip of the arc
const EDGE_GAP = 4; // the center sits this close to the screen edge
const SHADOW_PAD = 12; // room for the drum shadow inside the window

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function onCircle(center: Point, radius: number, degrees: number): Point {
  const rad = (degrees * Math.PI) / 180;
  return { x: center.x + radius * Math.cos(rad), y: center.y + radius * Math.sin(rad) };
}

/**
 * Computes the drum layout: a half ring against the right edge whose full height is
 * `heightFraction` of `screenHeight`. All sizes derive from that one radius.
 */
export function drumGeometry(screenHeight: number, heightFraction: number): DrumGeometry {
  const fraction = clamp(heightFraction, DRUM_HEIGHT_LIMITS.min, DRUM_HEIGHT_LIMITS.max);
  const R = (screenHeight * fraction) / 2;
  const width = R + EDGE_GAP + SHADOW_PAD;
  const height = 2 * R + 2 * SHADOW_PAD;
  const center = { x: width - EDGE_GAP, y: height / 2 };
  const orbit = 0.82 * R;

  const chambers = Array.from({ length: CHAMBER_COUNT }, (_, i) =>
    onCircle(center, orbit, FIRST_CHAMBER_ANGLE - i * CHAMBER_STEP),
  );

  const hubRadius = 0.6 * R;
  const clockHeight = 0.26 * R;
  const clockWidth = 0.52 * R;
  // Only the left half of the hub shows: center the clock between its left edge and the window edge.
  const clockCenter = { x: (center.x - hubRadius + width) / 2, y: center.y };
  const stopSize = Math.max(16, 0.14 * R);
  const stopCenter = { x: clockCenter.x, y: center.y + clockHeight / 2 + 2 + stopSize / 2 };
  const cyclesWidth = 0.22 * R;

  return {
    width,
    height,
    center,
    outerRadius: R,
    innerRadius: 0.64 * R,
    hubRadius,
    chamberSize: 0.25 * R,
    chambers,
    plus: { center: onCircle(center, orbit, PLUS_ANGLE), size: Math.max(20, 0.2 * R) },
    clock: { center: clockCenter, width: clockWidth, height: clockHeight, fontSize: 0.18 * R },
    stop: { center: stopCenter, size: stopSize },
    cycles: {
      center: { x: stopCenter.x + stopSize / 2 + 4 + cyclesWidth / 2, y: stopCenter.y },
      width: cyclesWidth,
      height: stopSize,
      fontSize: Math.max(12, 0.11 * R),
    },
  };
}

/** Places a window of the given size against the right edge of the work area, centered vertically. */
export function placeAtRightEdge(workArea: Rect, width: number, height: number): Point {
  return {
    x: workArea.x + workArea.width - width,
    y: workArea.y + (workArea.height - height) / 2,
  };
}
