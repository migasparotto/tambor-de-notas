import { describe, expect, it } from "vitest";
import { INITIAL_COLORS, type NoteColor } from "./chambers";
import {
  lastSubject,
  parseColorsData,
  rememberSubject,
  resolveColors,
  serializeColorsData,
  type ColorsData,
} from "./colorData";

const data: ColorsData = { red: { lastSubject: "Cálculo" }, blue: { lastSubject: "Física" } };

describe("parseColorsData", () => {
  it("reads back exactly what was saved", () => {
    expect(parseColorsData(serializeColorsData(data))).toEqual(data);
  });

  it("tells a broken file apart from an empty one", () => {
    expect(parseColorsData("{ quebrado")).toBeNull();
    expect(parseColorsData("")).toBeNull();
    expect(parseColorsData("[1, 2]")).toBeNull();
    expect(parseColorsData("null")).toBeNull();
    expect(parseColorsData("{}")).toEqual({});
  });

  it("reads the name, role, tone and chamber of a color", () => {
    const color = { name: "Dúvida", role: "Perguntas", hex: "#112233", chamber: 2 };
    expect(parseColorsData(JSON.stringify({ doubt: color }))).toEqual({ doubt: color });
    expect(parseColorsData(JSON.stringify({ red: { chamber: null } }))).toEqual({
      red: { chamber: null },
    });
  });

  it("leaves out invalid names, tones and chambers", () => {
    const lastChamber = INITIAL_COLORS.length - 1;
    const text = JSON.stringify({
      a: { name: "  ", hex: "vermelho", chamber: lastChamber + 1 },
      b: { name: 1, role: 2, hex: "#12345", chamber: -1 },
      c: { hex: "#1234567", chamber: 0.5 },
      d: { chamber: lastChamber },
    });
    expect(parseColorsData(text)).toEqual({ a: {}, b: {}, c: {}, d: { chamber: lastChamber } });
  });

  it("leaves out broken entries and fields, keeping the good ones", () => {
    const text = JSON.stringify({
      red: { lastSubject: "Cálculo" },
      blue: "azul",
      green: { lastSubject: 42 },
      purple: null,
    });
    expect(parseColorsData(text)).toEqual({ red: { lastSubject: "Cálculo" }, green: {} });
  });
});

describe("resolveColors", () => {
  const initialIds = INITIAL_COLORS.map((color) => color.id);
  const [first, second] = INITIAL_COLORS as [NoteColor, NoteColor];
  const newColor = { name: "Dúvida", role: "Perguntas", hex: "#112233" };

  it("gives the initial colors, in their places, to whoever has only subjects saved", () => {
    const { colors, chambers } = resolveColors({ [first.id]: { lastSubject: "Física" } });
    expect(colors).toEqual(INITIAL_COLORS);
    expect(chambers).toEqual(initialIds);
  });

  it("applies the name, role and tone edited in the file, keeping the rest", () => {
    const { colors } = resolveColors({ [first.id]: { name: "Termos", hex: "#010203" } });
    expect(colors[0]).toEqual({ ...first, name: "Termos", hex: "#010203" });
    expect(colors[1]).toEqual(second);
  });

  it("adds a created color, off the drum and with the default destination", () => {
    const { colors, chambers } = resolveColors({ doubt: newColor });
    expect(colors.at(-1)).toEqual({ id: "doubt", ...newColor, destination: "notion" });
    expect(chambers).toEqual(initialIds);
  });

  it("puts a color in the chamber it took, and the color that left stays in the list", () => {
    const { colors, chambers } = resolveColors({
      doubt: { ...newColor, chamber: 0 },
      [first.id]: { chamber: null },
    });
    expect(chambers).toEqual(["doubt", ...initialIds.slice(1)]);
    expect(colors.map((color) => color.id)).toContain(first.id);
  });

  it("does not move an initial color out of its place just because another took it", () => {
    const { chambers } = resolveColors({ doubt: { ...newColor, chamber: 1 } });
    expect(chambers).toEqual([first.id, "doubt", ...initialIds.slice(2)]);
  });

  it("gives a disputed chamber to the first color, and the other stays off the drum", () => {
    const { chambers } = resolveColors({
      [first.id]: { chamber: 1 },
      [second.id]: { chamber: 1 },
    });
    expect(chambers).toEqual([null, first.id, ...initialIds.slice(2)]);
  });

  it("ignores an entry of an unknown color with no name or no tone", () => {
    const { colors } = resolveColors({
      gone: { lastSubject: "Antigo" },
      partial: { name: "Sem tom" },
    });
    expect(colors).toEqual(INITIAL_COLORS);
  });
});

describe("lastSubject", () => {
  it("gives the last subject of each color", () => {
    expect(lastSubject(data, "red")).toBe("Cálculo");
    expect(lastSubject(data, "blue")).toBe("Física");
  });

  it("is empty for a color without a subject yet", () => {
    expect(lastSubject(data, "green")).toBe("");
    expect(lastSubject({ green: {} }, "green")).toBe("");
  });
});

describe("rememberSubject", () => {
  it("remembers the subject only for its color", () => {
    const next = rememberSubject(data, "red", "Álgebra");
    expect(lastSubject(next, "red")).toBe("Álgebra");
    expect(lastSubject(next, "blue")).toBe("Física");
    expect(lastSubject(data, "red")).toBe("Cálculo");
  });

  it("starts the memory of a new color", () => {
    expect(lastSubject(rememberSubject({}, "green", "Química"), "green")).toBe("Química");
  });

  it("trims the spaces around the subject", () => {
    expect(lastSubject(rememberSubject(data, "red", "  Álgebra "), "red")).toBe("Álgebra");
  });

  it("does not erase the memory with a blank subject", () => {
    expect(rememberSubject(data, "red", "")).toBe(data);
    expect(rememberSubject(data, "red", "   ")).toBe(data);
  });

  it("returns the same data when nothing changes, so there is nothing to save", () => {
    expect(rememberSubject(data, "red", "Cálculo")).toBe(data);
  });
});
