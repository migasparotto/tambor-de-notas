import { describe, expect, it } from "vitest";
import { showsSymbols } from "./livePreview";
import { DEFAULT_SETTINGS } from "./settings";

// "texto **negrito** fim" — the bold element is 6..17, on a line 0..21.
const bold = { from: 6, to: 17 };
const line = { from: 0, to: 21 };

describe("showsSymbols", () => {
  it("uses 'only inside the element' by default", () => {
    expect(DEFAULT_SETTINGS.symbolsMode).toBe("element");
  });

  it("element: shows only while a cursor is inside the element, edges included", () => {
    expect(showsSymbols("element", bold, line, [10])).toBe(true);
    expect(showsSymbols("element", bold, line, [6])).toBe(true);
    expect(showsSymbols("element", bold, line, [17])).toBe(true);
    expect(showsSymbols("element", bold, line, [2])).toBe(false);
    expect(showsSymbols("element", bold, line, [20])).toBe(false);
  });

  it("line: shows while a cursor is anywhere on the line", () => {
    expect(showsSymbols("line", bold, line, [2])).toBe(true);
    expect(showsSymbols("line", bold, line, [30])).toBe(false);
  });

  it("never: always hides", () => {
    expect(showsSymbols("never", bold, line, [10])).toBe(false);
  });

  it("considers every cursor", () => {
    expect(showsSymbols("element", bold, line, [30, 8])).toBe(true);
    expect(showsSymbols("element", bold, line, [])).toBe(false);
  });
});
