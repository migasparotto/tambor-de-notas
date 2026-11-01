import { INITIAL_COLORS, type NoteColor } from "./chambers";

/** What the app remembers about one color. Without a field, the initial color's value is used. */
export interface ColorData {
  /** The subject of the last note of this color, offered to the next one. */
  lastSubject?: string;
  name?: string;
  role?: string;
  hex?: string;
  /** The color chamber it occupies, from 0 at the top; null = off the drum. */
  chamber?: number | null;
}

/** What the app remembers about each color, by color id (the `cores.json` file). */
export type ColorsData = Readonly<Record<string, ColorData>>;

/** The colors the app has, and which color is in each chamber (null = empty). */
export interface ResolvedColors {
  colors: NoteColor[];
  chambers: (string | null)[];
}

/** Where a new color's notes go, until the destination can be chosen (Etapa 3). */
const NEW_COLOR_DESTINATION = "notion";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isChamber = (value: unknown): value is number | null =>
  value === null ||
  (typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < INITIAL_COLORS.length);

/** The valid fields of one entry of the file; the others are left out. */
function parseEntry(entry: Record<string, unknown>): ColorData {
  const { lastSubject, name, role, hex, chamber } = entry;
  return {
    ...(typeof lastSubject === "string" && { lastSubject }),
    ...(typeof name === "string" && name.trim() !== "" && { name }),
    ...(typeof role === "string" && { role }),
    ...(typeof hex === "string" && HEX_COLOR.test(hex) && { hex }),
    ...(isChamber(chamber) && { chamber }),
  };
}

/**
 * Reads the `cores.json` text. Never throws: a broken file gives null,
 * and broken entries or fields are left out.
 */
export function parseColorsData(text: string): ColorsData | null {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    const colors: Record<string, ColorData> = {};
    for (const [colorId, entry] of Object.entries(data as Record<string, unknown>)) {
      if (typeof entry !== "object" || entry === null) continue;
      colors[colorId] = parseEntry(entry as Record<string, unknown>);
    }
    return colors;
  } catch {
    return null;
  }
}

/**
 * The initial colors with what the file changed, plus the colors created by the user
 * (entries with a name and a tone), and who is in each chamber. A color with no chamber
 * in the file keeps its initial place, if free; when two colors claim a chamber, the
 * first one takes it and the other stays off the drum.
 */
export function resolveColors(
  data: ColorsData,
  initial: readonly NoteColor[] = INITIAL_COLORS,
): ResolvedColors {
  const edits = ({ name, role, hex }: ColorData) => ({
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role }),
    ...(hex !== undefined && { hex }),
  });
  const colors: NoteColor[] = initial.map((color) => ({
    ...color,
    ...edits(data[color.id] ?? {}),
  }));
  for (const [id, entry] of Object.entries(data)) {
    if (initial.some((color) => color.id === id)) continue;
    if (entry.name === undefined || entry.hex === undefined) continue;
    colors.push({
      id,
      name: entry.name,
      role: entry.role ?? "",
      hex: entry.hex,
      destination: NEW_COLOR_DESTINATION,
    });
  }

  const chambers: (string | null)[] = initial.map(() => null);
  for (const { id } of colors) {
    const chamber = data[id]?.chamber;
    if (typeof chamber === "number" && chambers[chamber] === null) chambers[chamber] = id;
  }
  initial.forEach(({ id }, place) => {
    if (data[id]?.chamber === undefined && chambers[place] === null) chambers[place] = id;
  });
  return { colors, chambers };
}

/** The colors data as file text, readable and editable by hand. */
export function serializeColorsData(data: ColorsData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** The last subject used in a color ("" if there is none yet). */
export function lastSubject(data: ColorsData, colorId: string): string {
  return data[colorId]?.lastSubject ?? "";
}

/**
 * Remembers a subject as the last one of a color. A blank subject does not erase
 * the memory: the same data is returned, so the next note still gets the last subject.
 */
export function rememberSubject(data: ColorsData, colorId: string, subject: string): ColorsData {
  const trimmed = subject.trim();
  if (trimmed === "" || trimmed === lastSubject(data, colorId)) return data;
  return { ...data, [colorId]: { ...data[colorId], lastSubject: trimmed } };
}
