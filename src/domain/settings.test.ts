import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, completeSettings, parseSettings, serializeSettings } from "./settings";

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

describe("cycle end settings", () => {
  it("accepts valid values", () => {
    const { settings, problems } = parseSettings(
      JSON.stringify({
        cycleEndSound: "chime",
        cycleEndAnimation: "off",
        cycleEndDurationMs: 2500,
        soundVolume: 0,
      }),
    );
    expect(problems).toEqual([]);
    expect(settings).toMatchObject({
      cycleEndSound: "chime",
      cycleEndAnimation: "off",
      cycleEndDurationMs: 2500,
      soundVolume: 0,
    });
  });

  it("refuses invalid values and keeps the defaults", () => {
    const { settings, problems } = parseSettings(
      JSON.stringify({
        cycleEndSound: "trovão",
        cycleEndAnimation: "dança",
        cycleEndDurationMs: 50,
        soundVolume: 1.5,
      }),
    );
    expect(problems).toHaveLength(4);
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("completeSettings", () => {
  const full = () => JSON.parse(serializeSettings(DEFAULT_SETTINGS)) as Record<string, unknown>;

  it("adds the missing settings with their defaults, keeping the user's values", () => {
    const changed = DEFAULT_SETTINGS.focusMinutes + 10;
    const completed = completeSettings(JSON.stringify({ focusMinutes: changed }));
    expect(completed).not.toBeNull();
    expect(parseSettings(completed ?? "")).toEqual({
      settings: { ...DEFAULT_SETTINGS, focusMinutes: changed },
      problems: [],
    });
  });

  it("keeps the user's settings first, in their order, and adds the new ones after", () => {
    const completed = completeSettings('{ "soundVolume": 0.2, "charLimit": 500 }') ?? "";
    const keys = Object.keys(JSON.parse(completed) as object);
    expect(keys.slice(0, 2)).toEqual(["soundVolume", "charLimit"]);
    expect(new Set(keys)).toEqual(new Set(Object.keys(DEFAULT_SETTINGS)));
  });

  it("adds the missing shortcuts without changing the ones already there", () => {
    const mine = "Ctrl+Alt+Q";
    const completed = completeSettings(JSON.stringify({ shortcuts: { openColor1: mine } })) ?? "";
    expect(parseSettings(completed).settings.shortcuts).toEqual({
      ...DEFAULT_SETTINGS.shortcuts,
      openColor1: mine,
    });
  });

  it("leaves invalid and unknown values as they are, for the user to fix", () => {
    const saved: Record<string, unknown> = { ...full(), charLimit: -5, minhaNota: "oi" };
    delete saved.soundVolume;
    const completed = JSON.parse(completeSettings(JSON.stringify(saved)) ?? "{}") as Record<
      string,
      unknown
    >;
    expect(completed.charLimit).toBe(-5);
    expect(completed.minhaNota).toBe("oi");
    expect(completed.soundVolume).toBe(DEFAULT_SETTINGS.soundVolume);
  });

  it("returns null when nothing is missing, so the file is not rewritten", () => {
    expect(completeSettings(serializeSettings(DEFAULT_SETTINGS))).toBeNull();
  });

  it("returns null for a broken file or one in the wrong format", () => {
    expect(completeSettings("{ quebrado")).toBeNull();
    expect(completeSettings("[1, 2]")).toBeNull();
    expect(completeSettings("null")).toBeNull();
  });

  it("does not touch shortcuts written in the wrong format", () => {
    const completed = completeSettings(JSON.stringify({ shortcuts: "nenhum" })) ?? "";
    expect((JSON.parse(completed) as Record<string, unknown>).shortcuts).toBe("nenhum");
  });
});
