/** Settings the user can change. Every default lives here, in one place. */
export interface Settings {
  /** Character limit per note: fills the chamber (stage 1) and triggers auto-send (stage 3). */
  charLimit: number;
  /** Maximum drum height, as a fraction of the screen height. */
  drumHeightFraction: number;
  /** Length of a pomodoro focus period, in minutes. */
  focusMinutes: number;
  /** Length of a pomodoro break, in minutes. */
  breakMinutes: number;
  /** How long after the last change a note is saved by itself, in milliseconds. */
  autosaveDelayMs: number;
}

/** Default settings used until the user changes them. */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  charLimit: 300,
  drumHeightFraction: 1 / 3,
  focusMinutes: 25,
  breakMinutes: 5,
  autosaveDelayMs: 1000,
};
