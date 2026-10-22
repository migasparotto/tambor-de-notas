/** The sound played when a pomodoro phase ends. */
export type CycleEndSound = "ratchet" | "cock" | "chime" | "off";
/** How the drum moves when a pomodoro phase ends. */
export type CycleEndAnimation = "spin" | "jolt" | "off";

export const CYCLE_END_SOUNDS: readonly CycleEndSound[] = ["ratchet", "cock", "chime", "off"];
export const CYCLE_END_ANIMATIONS: readonly CycleEndAnimation[] = ["spin", "jolt", "off"];

/**
 * One piece of a sound, at `atMs` from its start. A "click" is a short metallic tick,
 * a "clack" the heavier final hit, and a "tone" a soft bell note. `gain` goes from 0 to 1.
 */
export type SoundEvent =
  | { kind: "click"; atMs: number; freq: number; gain: number }
  | { kind: "clack"; atMs: number; gain: number }
  | { kind: "tone"; atMs: number; freq: number; lengthMs: number; gain: number };

/** Ticks of the ratchet before the final clack. */
const RATCHET_CLICKS = 16;
/** How fast the drum slows down: the higher, the more the ticks spread out at the end. */
const RATCHET_SLOWDOWN = 1.8;
/** How long the short "jolt" animation takes. */
export const JOLT_MS = 650;

/**
 * The ratchet of a spinning drum: ticks that get further apart as it slows down,
 * then the clack exactly at `durationMs`, when the spin animation stops.
 */
export function ratchetEvents(durationMs: number): SoundEvent[] {
  const events: SoundEvent[] = [];
  for (let i = 0; i < RATCHET_CLICKS; i++) {
    const p = i / RATCHET_CLICKS;
    events.push({
      kind: "click",
      atMs: durationMs * Math.pow(p, RATCHET_SLOWDOWN),
      freq: i % 2 === 0 ? 3000 : 3300, // two pitches, so it does not sound like a machine gun
      gain: 0.35 + 0.15 * p,
    });
  }
  events.push({ kind: "clack", atMs: durationMs, gain: 0.9 });
  return events;
}

/** The pieces of each sound. Only the ratchet follows the configured duration. */
export function soundEvents(sound: CycleEndSound, durationMs: number): SoundEvent[] {
  switch (sound) {
    case "ratchet":
      return ratchetEvents(durationMs);
    case "cock":
      return [
        { kind: "click", atMs: 0, freq: 2600, gain: 0.5 },
        { kind: "clack", atMs: 140, gain: 0.9 },
      ];
    case "chime":
      return [
        { kind: "tone", atMs: 0, freq: 880, lengthMs: 1200, gain: 0.25 },
        { kind: "tone", atMs: 180, freq: 1318.5, lengthMs: 1400, gain: 0.2 },
      ];
    case "off":
      return [];
  }
}

/** What the end of a cycle does: the sound (empty = silent), its volume and the animation. */
export interface CycleEndEffects {
  sound: SoundEvent[];
  volume: number;
  animation: { kind: "spin" | "jolt"; durationMs: number } | null;
}

/**
 * Decides the end-of-cycle effects from the settings. With "reduce motion" on in Windows
 * there is no animation (the sound stays), and a volume of 0 means no sound at all.
 */
export function cycleEndEffects(
  settings: {
    cycleEndSound: CycleEndSound;
    cycleEndAnimation: CycleEndAnimation;
    cycleEndDurationMs: number;
    soundVolume: number;
  },
  reduceMotion: boolean,
): CycleEndEffects {
  const { cycleEndSound, cycleEndAnimation, cycleEndDurationMs, soundVolume } = settings;
  const animation =
    reduceMotion || cycleEndAnimation === "off"
      ? null
      : {
          kind: cycleEndAnimation,
          durationMs: cycleEndAnimation === "spin" ? cycleEndDurationMs : JOLT_MS,
        };
  return {
    sound: soundVolume > 0 ? soundEvents(cycleEndSound, cycleEndDurationMs) : [],
    volume: soundVolume,
    animation,
  };
}
