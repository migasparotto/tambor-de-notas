import { describe, expect, it } from "vitest";
import { DRUM_HEIGHT_LIMITS, drumGeometry, placeAtRightEdge, type Point } from "./drum";
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

describe("placeAtRightEdge", () => {
  it("touches the right edge and centers vertically, including offset work areas", () => {
    const workArea = { x: 1920, y: 40, width: 1920, height: 1000 };
    expect(placeAtRightEdge(workArea, 200, 400)).toEqual({ x: 3640, y: 340 });
  });
});
