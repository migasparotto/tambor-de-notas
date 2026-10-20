/** Settings the user can change. Every default lives here, in one place. */
export interface Settings {
  /** Character limit per note: fills the chamber (stage 1) and triggers auto-send (stage 3). */
  charLimit: number;
  /** Maximum drum height, as a fraction of the screen height. */
  drumHeightFraction: number;
}

/** Default settings used until the user changes them. */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  charLimit: 300,
  drumHeightFraction: 1 / 3,
};
