import { describe, expect, it } from "vitest";
import { COLOR_PALETTE, INITIAL_COLORS, type NoteColor } from "./chambers";
import { resolveColors, type ColorsData } from "./colorData";
import {
  availableTones,
  chamberChangeCollapsesPanel,
  createColor,
  editColor,
  occupyChamber,
  offDrumColorsWithNote,
  type ColorFields,
} from "./colorRules";

const [first, second] = INITIAL_COLORS as [NoteColor, NoteColor];
const initialIds = INITIAL_COLORS.map((color) => color.id);
const initialTones = INITIAL_COLORS.map((color) => color.hex);
const freeTone = COLOR_PALETTE.find((tone) => !initialTones.includes(tone))!;
const fields: ColorFields = { name: "Dúvida", role: "Perguntas", hex: freeTone };

/** Creates a color that must be accepted, in the given chamber. */
function created(data: ColorsData, color = fields, chamber = 0) {
  const result = createColor(data, color, chamber);
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("availableTones", () => {
  it("leaves out the tones in use, even by a color off the drum", () => {
    const { data } = created({}, fields);
    const tones = availableTones(data);
    expect(tones).not.toContain(freeTone);
    expect(tones).not.toContain(first.hex);
  });

  it("offers a color its own tone", () => {
    expect(availableTones({}, first.id)).toContain(first.hex);
    expect(availableTones({}, first.id)).not.toContain(second.hex);
  });
});

describe("createColor", () => {
  it("creates the color in the chosen chamber, and the one there leaves the drum", () => {
    const { data, colorId } = created({}, fields, 1);
    const { colors, chambers } = resolveColors(data);
    expect(chambers[1]).toBe(colorId);
    expect(chambers).not.toContain(second.id);
    expect(colors.find((color) => color.id === colorId)).toMatchObject(fields);
  });

  it("does not remove the color that left the drum, keeping what it remembers", () => {
    const { data } = created({ [first.id]: { lastSubject: "Física" } }, fields, 0);
    expect(resolveColors(data).colors.map((color) => color.id)).toContain(first.id);
    expect(data[first.id]?.lastSubject).toBe("Física");
  });

  it("makes a simple id from the name", () => {
    expect(created({}).colorId).toBe("duvida");
  });

  it("gives a new id when the name would repeat an id in the file", () => {
    const data = { duvida: { lastSubject: "De uma nota antiga" } };
    expect(created(data).colorId).toBe("duvida-2");
  });

  it("makes an id even from a name with no letters", () => {
    expect(created({}, { ...fields, name: "???" }).colorId).toBe("cor");
  });

  it("trims the name and the role", () => {
    const { data, colorId } = created({}, { ...fields, name: "  Dúvida ", role: " Perguntas " });
    expect(data[colorId]).toMatchObject({ name: "Dúvida", role: "Perguntas" });
  });

  it("refuses an empty name", () => {
    expect(createColor({}, { ...fields, name: "   " }, 0).ok).toBe(false);
  });

  it("refuses a name already in use, whatever the case, even off the drum", () => {
    const upper = first.name.toUpperCase();
    expect(createColor({}, { ...fields, name: upper }, 0).ok).toBe(false);
    const { data } = created({}, fields, 0);
    const other = availableTones(data)[0]!;
    expect(createColor(data, { ...fields, name: "dúvida ", hex: other }, 1).ok).toBe(false);
  });

  it("refuses a tone out of the palette", () => {
    expect(createColor({}, { ...fields, hex: "#112233" }, 0)).toEqual({
      ok: false,
      error: "Escolha um tom da paleta.",
    });
  });

  it("refuses a palette tone already in use", () => {
    expect(createColor({}, { ...fields, hex: first.hex }, 0)).toEqual({
      ok: false,
      error: "Esse tom já está em uso.",
    });
  });
});

describe("occupyChamber", () => {
  it("brings a color back to a chamber, and its notes reappear because the id is the same", () => {
    const { data, colorId } = created({}, fields, 0);
    const back = resolveColors(occupyChamber(data, first.id, 0)).chambers;
    expect(back[0]).toBe(first.id);
    expect(back).not.toContain(colorId);
  });

  it("swaps two colors that are both on the drum", () => {
    const { chambers } = resolveColors(occupyChamber({}, first.id, 1));
    expect(chambers).toEqual([second.id, first.id, ...initialIds.slice(2)]);
  });

  it("changes nothing when the color is already there", () => {
    const data = { [first.id]: { lastSubject: "Física" } };
    expect(occupyChamber(data, first.id, 0)).toBe(data);
  });
});

describe("editColor", () => {
  it("changes the name, role and tone, keeping what the color remembers", () => {
    const result = editColor({ [first.id]: { lastSubject: "Física" } }, first.id, {
      name: "Termos",
      role: "Definições",
      hex: freeTone,
    });
    if (!result.ok) throw new Error(result.error);
    expect(result.data[first.id]).toEqual({
      lastSubject: "Física",
      name: "Termos",
      role: "Definições",
      hex: freeTone,
    });
  });

  it("changes only what was given", () => {
    const result = editColor({}, first.id, { role: "Definições" });
    expect(result).toEqual({ ok: true, data: { [first.id]: { role: "Definições" } } });
  });

  it("accepts the color's own name in another case, and its own tone", () => {
    const result = editColor({}, first.id, { name: first.name.toUpperCase(), hex: first.hex });
    expect(result.ok).toBe(true);
  });

  it("refuses the name or the tone of another color", () => {
    expect(editColor({}, first.id, { name: second.name }).ok).toBe(false);
    expect(editColor({}, first.id, { hex: second.hex }).ok).toBe(false);
    expect(editColor({}, first.id, { name: " " }).ok).toBe(false);
  });

  it("refuses a color that does not exist", () => {
    expect(editColor({}, "gone", { role: "x" }).ok).toBe(false);
  });
});

describe("offDrumColorsWithNote", () => {
  it("lists only colors off the drum that have an active note", () => {
    const { data, colorId } = created({}, fields, 0);
    const third = INITIAL_COLORS[2]!;
    const withNote = new Set([first.id, third.id, colorId]);
    const offDrum = offDrumColorsWithNote(resolveColors(data), (id) => withNote.has(id));
    expect(offDrum.map((color) => color.id)).toEqual([first.id]);
  });

  it("leaves out a color off the drum without an active note", () => {
    const { data } = created({}, fields, 0);
    expect(offDrumColorsWithNote(resolveColors(data), () => false)).toEqual([]);
  });
});

describe("chamberChangeCollapsesPanel", () => {
  it("collapses when the open note's color is the one leaving", () => {
    expect(chamberChangeCollapsesPanel({}, 0, first.id)).toBe(true);
  });

  it("does not collapse for another chamber, or with no note open", () => {
    expect(chamberChangeCollapsesPanel({}, 1, first.id)).toBe(false);
    expect(chamberChangeCollapsesPanel({}, 0, null)).toBe(false);
  });
});
