import { describe, expect, it } from "vitest";
import {
  COLOR_PALETTE,
  INITIAL_COLORS,
  NEUTRAL_TONE,
  PANEL_BASE,
  PANEL_TINT_PERCENT,
} from "./chambers";

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const RING: Rgb = rgb("#23262C");
/** WCAG AA for normal text. */
const READABLE_TEXT = 4.5;
/** The faintest text of the panel, the subject line (`text-white/55`). */
const FAINTEST_TEXT = 0.55;
/** WCAG target for shapes: a chamber must stand out on the ring. */
const VISIBLE_ON_RING = 3;
const ALL_TONES = [...COLOR_PALETTE, NEUTRAL_TONE];

function rgb(hex: string): Rgb {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb;
}

function mix(top: Rgb, bottom: Rgb, amount: number): Rgb {
  return top.map((value, i) => value * amount + bottom[i]! * (1 - amount)) as Rgb;
}

function luminance(color: Rgb): number {
  const [r, g, b] = color
    .map((value) => value / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe("COLOR_PALETTE", () => {
  it("has the initial colors, and a tone for a new color", () => {
    const initial = INITIAL_COLORS.map((color) => color.hex);
    expect(COLOR_PALETTE).toEqual(expect.arrayContaining(initial));
    expect(COLOR_PALETTE.length).toBeGreaterThan(initial.length);
  });

  it("leaves the neutral tone out", () => {
    expect(COLOR_PALETTE).not.toContain(NEUTRAL_TONE);
  });

  it("has no repeated tone", () => {
    expect(new Set(COLOR_PALETTE).size).toBe(COLOR_PALETTE.length);
  });

  it.each(ALL_TONES)("keeps the panel text readable on %s", (tone) => {
    const panel = mix(rgb(tone), rgb(PANEL_BASE), PANEL_TINT_PERCENT / 100);
    expect(contrast(WHITE, panel)).toBeGreaterThanOrEqual(READABLE_TEXT);
    expect(contrast(mix(WHITE, panel, FAINTEST_TEXT), panel)).toBeGreaterThanOrEqual(READABLE_TEXT);
  });

  it.each(ALL_TONES)("makes %s stand out on the drum ring", (tone) => {
    expect(contrast(rgb(tone), RING)).toBeGreaterThanOrEqual(VISIBLE_ON_RING);
  });
});
