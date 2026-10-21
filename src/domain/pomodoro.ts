import type { Settings } from "./settings";

/** Which part of the cycle the pomodoro is in. */
export type PomodoroPhase = "focus" | "break";

/** Whether the clock is counting down. */
export type PomodoroStatus = "idle" | "running" | "paused";

/** A snapshot of the pomodoro, enough to draw the clock. */
export interface PomodoroState {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  remainingMs: number;
  /** Focus periods completed so far. */
  cycles: number;
}

/** The pomodoro lengths, taken from the settings. */
export type PomodoroDurations = Pick<Settings, "focusMinutes" | "breakMinutes">;

/** Callbacks the pomodoro calls; the UI uses them to redraw and to show the alert. */
export interface PomodoroEvents {
  /** Called whenever the state changes, including every clock tick. */
  onChange?: (state: PomodoroState) => void;
  /** Called when a focus period or a break reaches zero. */
  onPhaseEnd?: (ended: PomodoroPhase, state: PomodoroState) => void;
}

const TICK_MS = 250;
const MS_PER_MINUTE = 60_000;

/**
 * Focus/break timer. When focus ends, the break starts by itself and a cycle is counted;
 * when the break ends, the clock goes back to focus and waits for play.
 */
export class Pomodoro {
  private readonly durations: PomodoroDurations;
  private readonly events: PomodoroEvents;
  private phase: PomodoroPhase = "focus";
  private status: PomodoroStatus = "idle";
  private remainingMs: number;
  private cycles: number;
  private endsAt = 0;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(durations: PomodoroDurations, events: PomodoroEvents = {}, initialCycles = 0) {
    this.durations = durations;
    this.events = events;
    this.cycles = initialCycles;
    this.remainingMs = this.lengthOf("focus");
  }

  /** Returns the current state. */
  getState(): PomodoroState {
    return {
      phase: this.phase,
      status: this.status,
      remainingMs: this.remainingMs,
      cycles: this.cycles,
    };
  }

  /** Play if stopped or paused; pause if running. */
  toggle(): void {
    if (this.status === "running") this.pause();
    else this.start();
  }

  /** Stops and resets the clock to a full focus period. Completed cycles are kept. */
  stop(): void {
    this.clearTimer();
    this.phase = "focus";
    this.status = "idle";
    this.remainingMs = this.lengthOf("focus");
    this.emitChange();
  }

  /** Stops the internal timer; call when the pomodoro is no longer used. */
  dispose(): void {
    this.clearTimer();
  }

  private start(): void {
    this.endsAt = Date.now() + this.remainingMs;
    this.status = "running";
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.emitChange();
  }

  private pause(): void {
    this.remainingMs = Math.max(0, this.endsAt - Date.now());
    this.clearTimer();
    this.status = "paused";
    this.emitChange();
  }

  private tick(): void {
    this.remainingMs = Math.max(0, this.endsAt - Date.now());
    if (this.remainingMs === 0) this.finishPhase();
    else this.emitChange();
  }

  private finishPhase(): void {
    const ended = this.phase;
    if (ended === "focus") {
      this.cycles += 1;
      this.phase = "break";
      this.endsAt += this.lengthOf("break");
      this.remainingMs = Math.max(0, this.endsAt - Date.now());
    } else {
      this.clearTimer();
      this.phase = "focus";
      this.status = "idle";
      this.remainingMs = this.lengthOf("focus");
    }
    this.emitChange();
    this.events.onPhaseEnd?.(ended, this.getState());
  }

  private lengthOf(phase: PomodoroPhase): number {
    const minutes = phase === "focus" ? this.durations.focusMinutes : this.durations.breakMinutes;
    return minutes * MS_PER_MINUTE;
  }

  private clearTimer(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private emitChange(): void {
    this.events.onChange?.(this.getState());
  }
}

/** Formats a time left as `mm:ss`, rounding partial seconds up (so 0:00 means done). */
export function formatClock(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
