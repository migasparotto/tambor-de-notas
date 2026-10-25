import { describe, expect, it } from "vitest";
import { DRUM_HEIGHT_LIMITS, HOVER_MARGIN, drumGeometry, isOverDrum, type Point } from "./drum";
import { DEFAULT_SETTINGS } from "./settings";

// The drum size is a setting, so tests use the configured fraction and a few others.
const screens = [720, 1080, 1440];
const fractions = [DEFAULT_SETTINGS.drumHeightFraction, 0.25, 0.5];
const cases = screens.flatMap((h) => fractions.map((f) => [h, f] as const));

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

describe("drumGeometry", () => {
  it.each(cases)("on a %ipx screen, the drum is %f of the height", (screen, fraction) => {
    const g = drumGeometry(screen, fraction);
    expect(2 * g.outerRadius).toBeCloseTo(screen * fraction);
  });

  it("clamps fractions outside the allowed range", () => {
    const tooSmall = drumGeometry(1080, 0.01);
    const tooBig = drumGeometry(1080, 5);
    expect(2 * tooSmall.outerRadius).toBeCloseTo(1080 * DRUM_HEIGHT_LIMITS.min);
    expect(2 * tooBig.outerRadius).toBeCloseTo(1080 * DRUM_HEIGHT_LIMITS.max);
  });

  it.each(cases)("fits the half ring inside the window (%ipx, %f)", (screen, fraction) => {
    const g = drumGeometry(screen, fraction);
    expect(g.center.x - g.outerRadius).toBeGreaterThanOrEqual(0);
    expect(g.center.y - g.outerRadius).toBeGreaterThanOrEqual(0);
    expect(g.center.y + g.outerRadius).toBeLessThanOrEqual(g.height);
    expect(g.center.x).toBeLessThanOrEqual(g.width);
  });

  it.each(cases)("puts 7 chambers on the ring, top to bottom (%ipx, %f)", (screen, fraction) => {
    const g = drumGeometry(screen, fraction);
    expect(g.chambers).toHaveLength(7);
    g.chambers.forEach((c, i) => {
      const d = distance(c, g.center);
      expect(d - g.chamberSize / 2).toBeGreaterThanOrEqual(g.innerRadius);
      expect(d + g.chamberSize / 2).toBeLessThanOrEqual(g.outerRadius);
      expect(c.x).toBeLessThan(g.center.x);
      const next = g.chambers[i + 1];
      if (next) {
        expect(next.y).toBeGreaterThan(c.y);
        expect(distance(c, next)).toBeGreaterThan(g.chamberSize);
      }
    });
  });

  it.each(cases)("keeps the + apart, below the last chamber (%ipx, %f)", (screen, fraction) => {
    const g = drumGeometry(screen, fraction);
    const last = g.chambers[g.chambers.length - 1]!;
    expect(g.plus.center.y).toBeGreaterThan(last.y);
    expect(distance(g.plus.center, last)).toBeGreaterThan(g.chamberSize / 2 + g.plus.size / 2);
  });

  it.each(cases)("keeps the clock inside the hub (%ipx, %f)", (screen, fraction) => {
    const g = drumGeometry(screen, fraction);
    const { center, width, height } = g.clock;
    const corners = [
      { x: center.x - width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
    ];
    corners.forEach((p) => expect(distance(p, g.center)).toBeLessThanOrEqual(g.hubRadius));
  });

  const extremes = [DRUM_HEIGHT_LIMITS.min, DRUM_HEIGHT_LIMITS.max].map((f) => [720, f] as const);

  it.each([...cases, ...extremes])(
    "centers the clock on the visible part of the hub (%ipx, %f)",
    (screen, fraction) => {
      const g = drumGeometry(screen, fraction);
      const { center, width } = g.clock;
      expect(center.y).toBeCloseTo(g.center.y);
      const gapLeft = center.x - width / 2 - (g.center.x - g.hubRadius);
      const gapRight = g.width - (center.x + width / 2);
      expect(gapLeft).toBeCloseTo(gapRight);
    },
  );

  it.each(cases)("keeps stop and cycle counter inside the hub (%ipx, %f)", (screen, fraction) => {
    const { stop, cycles, center, hubRadius } = drumGeometry(screen, fraction);
    const corners = [
      { x: stop.center.x - stop.size / 2, y: stop.center.y + stop.size / 2 },
      { x: cycles.center.x + cycles.width / 2, y: cycles.center.y + cycles.height / 2 },
    ];
    corners.forEach((p) => expect(distance(p, center)).toBeLessThanOrEqual(hubRadius));
    expect(cycles.center.x - cycles.width / 2).toBeGreaterThan(stop.center.x + stop.size / 2);
  });
});

describe("drumGeometry against the left edge", () => {
  it.each(cases)("mirrors the drum on a %ipx screen at %f", (screen, fraction) => {
    const right = drumGeometry(screen, fraction);
    const left = drumGeometry(screen, fraction, "left");
    const flip = (p: Point) => ({ x: right.width - p.x, y: p.y });
    expect(left.width).toBe(right.width);
    expect(left.height).toBe(right.height);
    expect(left.center).toEqual(flip(right.center));
    expect(left.chambers).toEqual(right.chambers.map(flip));
    expect(left.clock.center).toEqual(flip(right.clock.center));
    expect(left.stop.center).toEqual(flip(right.stop.center));
    expect(left.cycles.center).toEqual(flip(right.cycles.center));
    expect(left.plus.center).toEqual(flip(right.plus.center));
  });

  it("keeps the open side facing the left edge", () => {
    const left = drumGeometry(1080, DEFAULT_SETTINGS.drumHeightFraction, "left");
    expect(left.center.x).toBeLessThan(left.width / 2);
    expect(left.chambers.every((c) => c.x > left.center.x)).toBe(true);
  });
});

describe("isOverDrum", () => {
  const edges = ["right", "left"] as const;
  const all = cases.flatMap(([h, f]) => edges.map((edge) => [h, f, edge] as const));
  /** A point `offset` pixels past the outline, straight away from the screen edge. */
  const pastOutline = (screen: number, fraction: number, offset: number) => {
    const g = drumGeometry(screen, fraction);
    return { g, point: { x: g.center.x - g.outerRadius - offset, y: g.center.y } };
  };

  it.each(all)("on %ipx, %f, %s edge: every control is over the drum", (h, f, edge) => {
    const g = drumGeometry(h, f, edge);
    const controls = [
      g.center,
      ...g.chambers,
      g.plus.center,
      g.clock.center,
      g.stop.center,
      g.cycles.center,
    ];
    for (const point of controls) expect(isOverDrum(g, point, false)).toBe(true);
  });

  it.each(all)("on %ipx, %f, %s edge: the window corners let clicks through", (h, f, edge) => {
    const g = drumGeometry(h, f, edge);
    const away = edge === "right" ? 0 : g.width; // the corners on the side away from the edge
    for (const y of [0, g.height]) expect(isOverDrum(g, { x: away, y }, true)).toBe(false);
  });

  it("only counts as over once the cursor reaches the outline", () => {
    const { g, point } = pastOutline(1080, DEFAULT_SETTINGS.drumHeightFraction, 1);
    expect(isOverDrum(g, point, false)).toBe(false);
  });

  it("stays over within the margin past the outline, so the window does not flicker", () => {
    const { g, point } = pastOutline(1080, DEFAULT_SETTINGS.drumHeightFraction, HOVER_MARGIN);
    expect(isOverDrum(g, point, true)).toBe(true);
  });

  it("lets go once the cursor is past the margin", () => {
    const { g, point } = pastOutline(1080, DEFAULT_SETTINGS.drumHeightFraction, HOVER_MARGIN + 1);
    expect(isOverDrum(g, point, true)).toBe(false);
  });
});
