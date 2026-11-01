import { COLOR_PALETTE, INITIAL_COLORS, type NoteColor } from "./chambers";
import { resolveColors, type ColorData, type ColorsData, type ResolvedColors } from "./colorData";

/** The new colors data, or why the change was refused (a message for the user). */
export type ColorChange = { ok: true; data: ColorsData } | { ok: false; error: string };

/** What the user fills in for a new color, or changes in an existing one. */
export interface ColorFields {
  name: string;
  role: string;
  hex: string;
}

const refused = (error: string): ColorChange => ({ ok: false, error });
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The reason a name cannot be used by this color, or null. Names go into the file names. */
function nameProblem(colors: readonly NoteColor[], name: string, colorId?: string): string | null {
  if (name.trim() === "") return "Dê um nome à cor.";
  const taken = colors.some((color) => color.id !== colorId && sameName(color.name, name));
  return taken ? `Já existe uma cor chamada "${name.trim()}".` : null;
}

/** The palette tones no other color is using, for this color to choose from. */
export function availableTones(data: ColorsData, colorId?: string): string[] {
  const inUse = resolveColors(data)
    .colors.filter((color) => color.id !== colorId)
    .map((color) => color.hex);
  return COLOR_PALETTE.filter((tone) => !inUse.includes(tone));
}

/** The reason a tone cannot be used by this color, or null. */
function toneProblem(data: ColorsData, hex: string, colorId?: string): string | null {
  if (!COLOR_PALETTE.includes(hex)) return "Escolha um tom da paleta.";
  return availableTones(data, colorId).includes(hex) ? null : "Esse tom já está em uso.";
}

/** A short, unique id from the name, kept in the notes of the color forever (`doubt`, `doubt-2`). */
function newColorId(data: ColorsData, name: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cor";
  const taken = (id: string) =>
    Object.hasOwn(data, id) || INITIAL_COLORS.some((color) => color.id === id);
  let id = base;
  for (let n = 2; taken(id); n++) id = `${base}-${n}`;
  return id;
}

/**
 * Puts a color in a chamber. The color that was there goes off the drum (or, if the new one
 * came from another chamber, takes its place). No color is removed: it only leaves the drum.
 */
export function occupyChamber(data: ColorsData, colorId: string, chamber: number): ColorsData {
  const { chambers } = resolveColors(data);
  const occupant = chambers[chamber];
  if (occupant === colorId) return data;
  const previous = chambers.indexOf(colorId);
  return {
    ...data,
    [colorId]: { ...data[colorId], chamber },
    ...(occupant && {
      [occupant]: { ...data[occupant], chamber: previous === -1 ? null : previous },
    }),
  };
}

/** Creates a color and puts it in the chosen chamber. Returns the new data and the color's id. */
export function createColor(
  data: ColorsData,
  { name, role, hex }: ColorFields,
  chamber: number,
): (ColorChange & { ok: false }) | { ok: true; data: ColorsData; colorId: string } {
  const problem = nameProblem(resolveColors(data).colors, name) ?? toneProblem(data, hex) ?? null;
  if (problem !== null) return { ok: false, error: problem };
  const colorId = newColorId(data, name);
  const color: ColorData = { name: name.trim(), role: role.trim(), hex };
  return {
    ok: true,
    data: occupyChamber({ ...data, [colorId]: color }, colorId, chamber),
    colorId,
  };
}

/** Changes the name, role or tone of a color; its notes follow, since they keep only its id. */
export function editColor(
  data: ColorsData,
  colorId: string,
  changes: Partial<ColorFields>,
): ColorChange {
  const { colors } = resolveColors(data);
  if (!colors.some((color) => color.id === colorId)) return refused("Essa cor não existe.");
  const { name, role, hex } = changes;
  const problem =
    (name !== undefined ? nameProblem(colors, name, colorId) : null) ??
    (hex !== undefined ? toneProblem(data, hex, colorId) : null);
  if (problem !== null) return refused(problem);
  return {
    ok: true,
    data: {
      ...data,
      [colorId]: {
        ...data[colorId],
        ...(name !== undefined && { name: name.trim() }),
        ...(role !== undefined && { role: role.trim() }),
        ...(hex !== undefined && { hex }),
      },
    },
  };
}

/** The colors off the drum that have an active note: the ones listed on the drum's other side. */
export function offDrumColorsWithNote(
  { colors, chambers }: ResolvedColors,
  hasNote: (colorId: string) => boolean,
): NoteColor[] {
  return colors.filter((color) => !chambers.includes(color.id) && hasNote(color.id));
}

/**
 * Whether changing this chamber takes away the color of the open note. If so, the note
 * must be saved and the panel collapsed; the note stays active, on the drum's other side.
 */
export function chamberChangeCollapsesPanel(
  data: ColorsData,
  chamber: number,
  openColorId: string | null,
): boolean {
  return openColorId !== null && resolveColors(data).chambers[chamber] === openColorId;
}
