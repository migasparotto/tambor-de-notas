import { describe, expect, it } from "vitest";
import {
  lastSubject,
  parseColorsData,
  rememberSubject,
  serializeColorsData,
  type ColorsData,
} from "./colorData";

const data: ColorsData = { red: { lastSubject: "Cálculo" }, blue: { lastSubject: "Física" } };

describe("parseColorsData", () => {
  it("reads back exactly what was saved", () => {
    expect(parseColorsData(serializeColorsData(data))).toEqual(data);
  });

  it("gives no data for a broken file", () => {
    expect(parseColorsData("{ quebrado")).toEqual({});
    expect(parseColorsData("")).toEqual({});
    expect(parseColorsData("[1, 2]")).toEqual({});
    expect(parseColorsData("null")).toEqual({});
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
