import type { CycleEndAnimation } from "./cycleEnd";

/** Which side of the drum is showing: the chambers, or the side with the empty chamber. */
export type DrumSide = "front" | "back";

/** The turn, in degrees, that shows each side. */
export const SIDE_ANGLE: Record<DrumSide, number> = { front: 0, back: 180 };

/** The side the "+" button goes to. */
export function otherSide(side: DrumSide): DrumSide {
  return side === "front" ? "back" : "front";
}

/**
 * How long the half turn between the sides takes: half of the full turn at the end of a cycle.
 * Null means no animation (the side still changes): with "reduce motion" on in Windows, or
 * with the drum animation turned off in the settings.
 */
export function flipDurationMs(
  settings: { cycleEndAnimation: CycleEndAnimation; cycleEndDurationMs: number },
  reduceMotion: boolean,
): number | null {
  if (reduceMotion || settings.cycleEndAnimation === "off") return null;
  return settings.cycleEndDurationMs / 2;
}
