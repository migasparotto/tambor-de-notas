import {
  ratchetEvents,
  type CycleEndAnimation,
  type CycleEndSound,
  type SoundEvent,
} from "./cycleEnd";

/** Which side of the drum is showing: the chambers, or the side with the empty chamber. */
export type DrumSide = "front" | "back";

/** The turn, in degrees, that shows each side. */
export const SIDE_ANGLE: Record<DrumSide, number> = { front: 0, back: 180 };

/** The place, in the arc of chambers, of the empty chamber on the other side. */
export const BACK_CHAMBER = 3;

/** The side the "+" button goes to. */
export function otherSide(side: DrumSide): DrumSide {
  return side === "front" ? "back" : "front";
}

/** What the half turn does: the animation time (null = none), the sound and its volume. */
export interface FlipEffects {
  durationMs: number | null;
  sound: SoundEvent[];
  volume: number;
}

/**
 * The half turn between the sides takes half of the full turn at the end of a cycle, with the
 * ratchet at the same pace. With "reduce motion" on in Windows, or with the drum animation off
 * in the settings, the side changes without moving, and the sound still plays. The ratchet is
 * silent with `cycleEndSound` off or a volume of 0.
 */
export function flipEffects(
  settings: {
    cycleEndSound: CycleEndSound;
    cycleEndAnimation: CycleEndAnimation;
    cycleEndDurationMs: number;
    soundVolume: number;
  },
  reduceMotion: boolean,
): FlipEffects {
  const { cycleEndSound, cycleEndAnimation, cycleEndDurationMs, soundVolume } = settings;
  const halfTurnMs = cycleEndDurationMs / 2;
  const silent = cycleEndSound === "off" || soundVolume <= 0;
  return {
    durationMs: reduceMotion || cycleEndAnimation === "off" ? null : halfTurnMs,
    sound: silent ? [] : ratchetEvents(halfTurnMs),
    volume: soundVolume,
  };
}
