import { describe, expect, it } from "vitest";
import { drumGeometry, type Rect } from "./drum";
import { canTakeKeyboard, drumKeyAction, isDrumSharp, windowLayout, type PanelSize } from "./panel";
import { placeDrum, type DrumPlacement } from "./placement";
import { DEFAULT_SETTINGS } from "./settings";

// A 1536x864 screen with the taskbar at the bottom, and a smaller one.
const workAreas: Rect[] = [
  { x: 0, y: 0, width: 1536, height: 816 },
  { x: 0, y: 0, width: 1280, height: 680 },
];
const fractions = [DEFAULT_SETTINGS.drumHeightFraction, 0.15, 0.6];
const sizes: (PanelSize | null)[] = [null, "normal", "expanded"];
// Both edges, at the middle and near the top and bottom of the screen.
const placements: DrumPlacement[] = (["right", "left"] as const).flatMap((edge) =>
  [0.5, 0.05, 0.95].map((centerY) => ({ edge, centerY })),
);
const cases = workAreas.flatMap((area) =>
  fractions.flatMap((fraction) =>
    sizes.flatMap((size) => placements.map((place) => [area, fraction, size, place] as const)),
  ),
);

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x - 1e-9 &&
  inner.y >= outer.y - 1e-9 &&
  inner.x + inner.width <= outer.x + outer.width + 1e-9 &&
  inner.y + inner.height <= outer.y + outer.height + 1e-9;

describe("windowLayout", () => {
  it.each(cases)(
    "keeps the drum in place on the screen (%o, %f, %s, %o)",
    (area, fraction, size, place) => {
      const drum = drumGeometry(area.height + 48, fraction, place.edge);
      const { window, drumOrigin } = windowLayout(drum, area, size, place);
      const spot = placeDrum(area, drum.width, drum.height, place);
      expect(window.x + drumOrigin.x).toBeCloseTo(spot.x);
      expect(window.y + drumOrigin.y).toBeCloseTo(spot.y);
      expect(
        inside(
          { ...drumOrigin, width: drum.width, height: drum.height },
          { ...window, x: 0, y: 0 },
        ),
      ).toBe(true);
      expect(inside(window, area)).toBe(true);
    },
  );

  it("is just the drum when the panel is not open", () => {
    const area = workAreas[0]!;
    const drum = drumGeometry(864, DEFAULT_SETTINGS.drumHeightFraction);
    const layout = windowLayout(drum, area, null);
    expect(layout.panel).toBeNull();
    expect(layout.window.width).toBe(drum.width);
    expect(layout.window.height).toBe(drum.height);
  });

  it.each(cases.filter(([, , size]) => size !== null))(
    "puts the panel beside the ring, away from the edge, inside the window and the work area (%o, %f, %s, %o)",
    (area, fraction, size, place) => {
      const drum = drumGeometry(area.height + 48, fraction, place.edge);
      const { window, drumOrigin, panel } = windowLayout(drum, area, size, place);
      if (!panel) throw new Error("panel expected");

      expect(inside(panel, { ...window, x: 0, y: 0 })).toBe(true);
      expect(inside({ ...panel, x: panel.x + window.x, y: panel.y + window.y }, area)).toBe(true);
      if (place.edge === "right") {
        const ringLeft = drumOrigin.x + drum.center.x - drum.outerRadius;
        expect(panel.x + panel.width).toBeLessThan(ringLeft);
      } else {
        const ringRight = drumOrigin.x + drum.center.x + drum.outerRadius;
        expect(panel.x).toBeGreaterThan(ringRight);
      }
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

describe("drumKeyAction", () => {
  const press = (
    key: string,
    panelOpen: boolean,
    mods: Partial<Record<"ctrl" | "shift" | "alt" | "meta", boolean>> = {},
  ) =>
    drumKeyAction(
      {
        key,
        ctrlKey: mods.ctrl ?? false,
        shiftKey: mods.shift ?? false,
        altKey: mods.alt ?? false,
        metaKey: mods.meta ?? false,
      },
      panelOpen,
    );

  it("collapses the panel and gives the keyboard back on Esc when the panel is open", () => {
    expect(press("Escape", true)).toBe("collapseAndLeave");
  });

  it("only gives the keyboard back on Esc when the panel is already collapsed", () => {
    expect(press("Escape", false)).toBe("leave");
  });

  it("closes the note on Ctrl+Enter, only with the panel open", () => {
    expect(press("Enter", true, { ctrl: true })).toBe("closeNote");
    expect(press("Enter", false, { ctrl: true })).toBeNull();
  });

  it("leaves other keys to the editor", () => {
    for (const open of [true, false]) {
      expect(press("Enter", open)).toBeNull();
      expect(press("a", open, { ctrl: true })).toBeNull();
      expect(press("Enter", open, { ctrl: true, shift: true })).toBeNull();
      expect(press("Enter", open, { ctrl: true, alt: true })).toBeNull();
      expect(press("Escape", open, { shift: true })).toBeNull();
      expect(press("Escape", open, { ctrl: true })).toBeNull();
    }
  });
});

describe("canTakeKeyboard", () => {
  it("lets the window take the keyboard only while a panel is open", () => {
    expect(canTakeKeyboard(true)).toBe(true);
  });

  it("keeps the keyboard with the video with no panel, or one shrinking back", () => {
    expect(canTakeKeyboard(false)).toBe(false);
  });
});

describe("isDrumSharp", () => {
  it("is sharp while a note is open and in use", () => {
    expect(isDrumSharp({ panelOpen: true, focused: true, alerting: false })).toBe(true);
  });

  it("goes translucent when the keyboard leaves an open note (a click on the video)", () => {
    expect(isDrumSharp({ panelOpen: true, focused: false, alerting: false })).toBe(false);
  });

  it("stays translucent without an open note, even if a click marked the page focused", () => {
    expect(isDrumSharp({ panelOpen: false, focused: true, alerting: false })).toBe(false);
    expect(isDrumSharp({ panelOpen: false, focused: false, alerting: false })).toBe(false);
  });

  it("is sharp during the end-of-cycle alert, whatever else is going on", () => {
    for (const panelOpen of [true, false])
      for (const focused of [true, false])
        expect(isDrumSharp({ panelOpen, focused, alerting: true })).toBe(true);
  });
});
