import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings, serializeSettings } from "./settings";

describe("parseSettings", () => {
  it("reads back exactly what was saved", () => {
    const custom = { ...DEFAULT_SETTINGS, drumHeightFraction: 0.25, focusMinutes: 50 };
    expect(parseSettings(serializeSettings(custom))).toEqual({ settings: custom, problems: [] });
  });

  it("uses the default for settings missing from the file", () => {
    const { settings, problems } = parseSettings('{ "focusMinutes": 40 }');
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, focusMinutes: 40 });
    expect(problems).toEqual([]);
  });

  it("uses the default for invalid values and explains each one", () => {
    const { settings, problems } = parseSettings(
      JSON.stringify({
        charLimit: -5,
        drumHeightFraction: "grande",
        maxActiveNotesPerColor: 1.5,
        breakMinutes: 0,
      }),
    );
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(problems).toHaveLength(4);
    expect(problems[0]).toContain('"charLimit"');
    expect(problems[0]).toContain(String(DEFAULT_SETTINGS.charLimit));
  });

  it("accepts each symbols mode and refuses others", () => {
    for (const mode of ["element", "line", "never"]) {
      expect(parseSettings(JSON.stringify({ symbolsMode: mode })).settings.symbolsMode).toBe(mode);
    }
    const { settings, problems } = parseSettings('{ "symbolsMode": "sempre" }');
    expect(settings.symbolsMode).toBe(DEFAULT_SETTINGS.symbolsMode);
    expect(problems[0]).toContain('"symbolsMode"');
  });

  it("ignores unknown settings", () => {
    expect(parseSettings('{ "tema": "escuro" }')).toEqual({
      settings: DEFAULT_SETTINGS,
      problems: [],
    });
  });

  it("falls back to the defaults when the file is not valid JSON", () => {
    for (const broken of ["{ focusMinutes: 40", "[]", "null", "42"]) {
      const { settings, problems } = parseSettings(broken);
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(problems).toHaveLength(1);
    }
  });
});

describe("serializeSettings", () => {
  it("writes one setting per line, easy to edit by hand", () => {
    const text = serializeSettings(DEFAULT_SETTINGS);
    expect(text).toContain(`\n  "charLimit": ${DEFAULT_SETTINGS.charLimit},\n`);
    expect(text.endsWith("\n")).toBe(true);
  });
});

describe("shortcuts setting", () => {
  it("reads custom shortcuts and keeps the defaults for the others", () => {
    const { settings, problems } = parseSettings(
      '{ "shortcuts": { "togglePomodoro": "ctrl+alt+f9" } }',
    );
    expect(settings.shortcuts).toEqual({
      ...DEFAULT_SETTINGS.shortcuts,
      togglePomodoro: "Ctrl+Alt+F9",
    });
    expect(problems).toEqual([]);
  });

  it("reports invalid shortcuts with the other settings", () => {
    const { problems } = parseSettings('{ "charLimit": 0, "shortcuts": { "openColor1": "1" } }');
    expect(problems).toHaveLength(2);
  });

  it("never changes the defaults when a read setting is changed", () => {
    const { settings } = parseSettings("{}");
    settings.shortcuts.openColor1 = "Ctrl+Alt+Q";
    expect(DEFAULT_SETTINGS.shortcuts.openColor1).not.toBe("Ctrl+Alt+Q");
  });
});
