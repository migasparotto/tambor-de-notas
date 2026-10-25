/** What the app remembers about one color. */
export interface ColorData {
  /** The subject of the last note of this color, offered to the next one. */
  lastSubject?: string;
}

/** What the app remembers about each color, by color id (the `cores.json` file). */
export type ColorsData = Readonly<Record<string, ColorData>>;

/**
 * Reads the `cores.json` text. Never throws: a broken file gives no data,
 * and broken entries or fields are left out.
 */
export function parseColorsData(text: string): ColorsData {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    const colors: Record<string, ColorData> = {};
    for (const [colorId, entry] of Object.entries(data as Record<string, unknown>)) {
      if (typeof entry !== "object" || entry === null) continue;
      const { lastSubject } = entry as Record<string, unknown>;
      colors[colorId] = typeof lastSubject === "string" ? { lastSubject } : {};
    }
    return colors;
  } catch {
    return {};
  }
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
