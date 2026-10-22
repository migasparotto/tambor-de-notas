import { describe, expect, it } from "vitest";
import { drumGeometry, placeAtRightEdge, type Rect } from "./drum";
import { panelKeyAction, windowLayout, type PanelSize } from "./panel";
import { DEFAULT_SETTINGS } from "./settings";

// A 1536x864 screen with the taskbar at the bottom, and a smaller one.
const workAreas: Rect[] = [
  { x: 0, y: 0, width: 1536, height: 816 },
  { x: 0, y: 0, width: 1280, height: 680 },
];
const fractions = [DEFAULT_SETTINGS.drumHeightFraction, 0.15, 0.6];
const sizes: (PanelSize | null)[] = [null, "normal", "expanded"];
const cases = workAreas.flatMap((area) =>
  fractions.flatMap((fraction) => sizes.map((size) => [area, fraction, size] as const)),
);

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x - 1e-9 &&
  inner.y >= outer.y - 1e-9 &&
  inner.x + inner.width <= outer.x + outer.width + 1e-9 &&
  inner.y + inner.height <= outer.y + outer.height + 1e-9;

describe("windowLayout", () => {
  it.each(cases)("keeps the drum in place on the screen (%o, %f, %s)", (area, fraction, size) => {
    const drum = drumGeometry(area.height + 48, fraction);
    const { window, drumOrigin } = windowLayout(drum, area, size);
    const spot = placeAtRightEdge(area, drum.width, drum.height);
    expect(window.x + drumOrigin.x).toBeCloseTo(spot.x);
    expect(window.y + drumOrigin.y).toBeCloseTo(spot.y);
    expect(
      inside({ ...drumOrigin, width: drum.width, height: drum.height }, { ...window, x: 0, y: 0 }),
    ).toBe(true);
  });

  it("is just the drum when the panel is not open", () => {
    const area = workAreas[0]!;
    const drum = drumGeometry(864, DEFAULT_SETTINGS.drumHeightFraction);
    const layout = windowLayout(drum, area, null);
    expect(layout.panel).toBeNull();
    expect(layout.window.width).toBe(drum.width);
    expect(layout.window.height).toBe(drum.height);
  });

  it.each(cases.filter(([, , size]) => size !== null))(
    "puts the panel left of the ring, inside the window and the work area (%o, %f, %s)",
    (area, fraction, size) => {
      const drum = drumGeometry(area.height + 48, fraction);
      const { window, drumOrigin, panel } = windowLayout(drum, area, size);
      if (!panel) throw new Error("panel expected");

      expect(inside(panel, { ...window, x: 0, y: 0 })).toBe(true);
      expect(inside({ ...panel, x: panel.x + window.x, y: panel.y + window.y }, area)).toBe(true);
      const ringLeft = drumOrigin.x + drum.center.x - drum.outerRadius;
      expect(panel.x + panel.width).toBeLessThan(ringLeft);
    },
  );

  it.each(workAreas)("centers the panel on the drum when there is room (%o)", (area) => {
    const drum = drumGeometry(area.height + 48, DEFAULT_SETTINGS.drumHeightFraction);
    const { drumOrigin, panel } = windowLayout(drum, area, "normal");
    expect(panel!.y + panel!.height / 2).toBeCloseTo(drumOrigin.y + drum.center.y);
  });

  it.each(workAreas)("makes the expanded panel bigger than the normal one (%o)", (area) => {
    const drum = drumGeometry(area.height + 48, DEFAULT_SETTINGS.drumHeightFraction);
    const normal = windowLayout(drum, area, "normal").panel!;
    const expanded = windowLayout(drum, area, "expanded").panel!;
    expect(expanded.width).toBeGreaterThan(normal.width);
    expect(expanded.height).toBeGreaterThan(normal.height);
  });

  it("makes the panel larger than the drum", () => {
    const area = workAreas[0]!;
    const drum = drumGeometry(864, DEFAULT_SETTINGS.drumHeightFraction);
    const panel = windowLayout(drum, area, "normal").panel!;
    expect(panel.width).toBeGreaterThan(drum.width);
    expect(panel.height).toBeGreaterThanOrEqual(2 * drum.outerRadius);
  });
});

describe("panelKeyAction", () => {
  const press = (
    key: string,
    mods: Partial<Record<"ctrl" | "shift" | "alt" | "meta", boolean>> = {},
  ) =>
    panelKeyAction({
      key,
      ctrlKey: mods.ctrl ?? false,
      shiftKey: mods.shift ?? false,
      altKey: mods.alt ?? false,
      metaKey: mods.meta ?? false,
    });

  it("collapses the panel on Esc", () => {
    expect(press("Escape")).toBe("collapse");
  });

  it("closes the note on Ctrl+Enter", () => {
    expect(press("Enter", { ctrl: true })).toBe("closeNote");
  });

  it("leaves other keys to the editor", () => {
    expect(press("Enter")).toBeNull();
    expect(press("a", { ctrl: true })).toBeNull();
    expect(press("Enter", { ctrl: true, shift: true })).toBeNull();
    expect(press("Enter", { ctrl: true, alt: true })).toBeNull();
    expect(press("Escape", { shift: true })).toBeNull();
    expect(press("Escape", { ctrl: true })).toBeNull();
  });
});
