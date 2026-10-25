import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Rect } from "./drum";
import { DEFAULT_SETTINGS } from "./settings";
import {
  DEFAULT_PLACEMENT,
  DRAG_THRESHOLD,
  isDrag,
  parsePlacement,
  placeDrum,
  placementWhileDragging,
  serializePlacement,
  startPress,
} from "./placement";

// A second monitor to the right, with the taskbar on top, so offsets are not zero.
const area: Rect = { x: 1920, y: 40, width: 1920, height: 1000 };
const W = 200;
const H = 400;

describe("placeDrum", () => {
  it("starts against the right edge, centered, like before the drum could move", () => {
    expect(placeDrum(area, W, H, DEFAULT_PLACEMENT)).toEqual({ x: 3640, y: 340 });
  });

  it("touches the left edge when placed there", () => {
    expect(placeDrum(area, W, H, { edge: "left", centerY: 0.5 }).x).toBe(1920);
  });

  it("puts the drum center at the chosen height", () => {
    const { y } = placeDrum(area, W, H, { edge: "right", centerY: 0.3 });
    expect(y + H / 2).toBeCloseTo(area.y + 0.3 * area.height);
  });

  it("never lets the drum leave the work area", () => {
    expect(placeDrum(area, W, H, { edge: "right", centerY: 0 }).y).toBe(area.y);
    expect(placeDrum(area, W, H, { edge: "right", centerY: 1 }).y).toBe(area.y + area.height - H);
  });
});

describe("isDrag", () => {
  const start = { x: 100, y: 100 };

  it("is still a click while the pointer barely moves", () => {
    expect(isDrag(start, { x: 100 + DRAG_THRESHOLD, y: 100 })).toBe(false);
  });

  it("becomes a drag once the pointer moves past the threshold", () => {
    expect(isDrag(start, { x: 100, y: 100 + DRAG_THRESHOLD + 1 })).toBe(true);
  });
});

describe("placementWhileDragging", () => {
  it("follows the pointer up and down, keeping where the drum was grabbed", () => {
    const grabOffsetY = 30; // grabbed 30 px below the drum center
    const pointerY = area.y + 600;
    const p = placementWhileDragging(area, H, { x: 3800, y: pointerY }, grabOffsetY);
    expect(p.edge).toBe("right");
    const { y } = placeDrum(area, W, H, p);
    expect(y + H / 2).toBeCloseTo(pointerY - grabOffsetY);
  });

  it("switches to the left edge when the pointer crosses the middle of the screen", () => {
    const middle = area.x + area.width / 2;
    expect(placementWhileDragging(area, H, { x: middle - 1, y: 500 }, 0).edge).toBe("left");
    expect(placementWhileDragging(area, H, { x: middle + 1, y: 500 }, 0).edge).toBe("right");
  });

  it("stops at the top and bottom of the work area, so the drum responds right away on the way back", () => {
    const up = placementWhileDragging(area, H, { x: 3800, y: -5000 }, 0);
    expect(placeDrum(area, W, H, up).y).toBe(area.y);
    expect(up.centerY).toBeCloseTo(H / 2 / area.height);
    const down = placementWhileDragging(area, H, { x: 3800, y: 9000 }, 0);
    expect(placeDrum(area, W, H, down).y).toBe(area.y + area.height - H);
  });
});

describe("parsePlacement and serializePlacement", () => {
  it("reads back what was saved", () => {
    const saved = { edge: "left", centerY: 0.25 } as const;
    expect(parsePlacement(serializePlacement(saved))).toEqual(saved);
  });

  it("falls back to the default for broken or strange files", () => {
    expect(parsePlacement("not json")).toEqual(DEFAULT_PLACEMENT);
    expect(parsePlacement("null")).toEqual(DEFAULT_PLACEMENT);
    expect(parsePlacement('{"edge":"top","centerY":"a"}')).toEqual(DEFAULT_PLACEMENT);
  });

  it("keeps a valid part and fixes the other", () => {
    expect(parsePlacement('{"edge":"left"}')).toEqual({ edge: "left", centerY: 0.5 });
    expect(parsePlacement('{"edge":"right","centerY":7}')).toEqual({ edge: "right", centerY: 1 });
  });

  it("writes a short, readable file", () => {
    expect(serializePlacement({ edge: "right", centerY: 0.123456 })).toBe(
      '{\n  "edge": "right",\n  "centerY": 0.123\n}\n',
    );
  });
});

describe("startPress", () => {
  // The hold time is a setting, so tests use the configured value.
  const hold = DEFAULT_SETTINGS.dragHoldMs;
  const start = { x: 100, y: 100 };
  const shaky = { x: 100 + DRAG_THRESHOLD + 1, y: 100 };
  const far = { x: 100, y: 300 };
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("grabs the drum once it is held still for the configured time", () => {
    const onGrab = vi.fn();
    const press = startPress(start, hold, onGrab);
    vi.advanceTimersByTime(hold - 1);
    expect(onGrab).not.toHaveBeenCalled();
    expect(press.state).toBe("waiting");
    vi.advanceTimersByTime(1);
    expect(onGrab).toHaveBeenCalledOnce();
    expect(press.state).toBe("grabbed");
  });

  it("allows a tiny tremble while waiting", () => {
    const onGrab = vi.fn();
    const press = startPress(start, hold, onGrab);
    expect(press.move({ x: 100 + DRAG_THRESHOLD, y: 100 })).toBe(false);
    vi.advanceTimersByTime(hold);
    expect(onGrab).toHaveBeenCalledOnce();
  });

  it("is just a click if it moves before the time, even when held longer", () => {
    const onGrab = vi.fn();
    const press = startPress(start, hold, onGrab);
    vi.advanceTimersByTime(hold / 2);
    expect(press.move(shaky)).toBe(false);
    vi.advanceTimersByTime(hold * 2);
    expect(onGrab).not.toHaveBeenCalled();
    expect(press.move(far)).toBe(false);
    expect(press.release()).toBe(false);
  });

  it("drags when it moves after being grabbed, and the drop is saved", () => {
    const press = startPress(start, hold, () => undefined);
    vi.advanceTimersByTime(hold);
    expect(press.move(far)).toBe(true);
    expect(press.state).toBe("dragging");
    expect(press.release()).toBe(true);
  });

  it("released before the time is just a click and never grabs later", () => {
    const onGrab = vi.fn();
    const press = startPress(start, hold, onGrab);
    expect(press.release()).toBe(false);
    vi.advanceTimersByTime(hold * 2);
    expect(onGrab).not.toHaveBeenCalled();
  });

  it("released right after the grab, without moving, does not move the drum", () => {
    const press = startPress(start, hold, () => undefined);
    vi.advanceTimersByTime(hold);
    expect(press.release()).toBe(false);
  });

  it("cancelled while waiting never grabs", () => {
    const onGrab = vi.fn();
    startPress(start, hold, onGrab).cancel();
    vi.advanceTimersByTime(hold * 2);
    expect(onGrab).not.toHaveBeenCalled();
  });
});
