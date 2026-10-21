/** Characters Windows does not accept in file names, plus control characters. */
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
/** Names Windows reserves for devices, with or without an extension. */
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_NAME_LENGTH = 100;
const FALLBACK_NAME = "nota";
export const NOTE_EXTENSION = ".md";

/** Turns a note title into a name Windows accepts (without the extension). */
export function toSafeFileName(title: string): string {
  const cleaned = title.replace(INVALID_CHARS, " ").replace(/\s+/g, " ").trim();
  // Cut by code points so an emoji is never split in half.
  const cut = Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join("");
  // Windows drops trailing dots and spaces, which would make two names collide.
  const name = cut.replace(/[. ]+$/, "");
  if (name === "") return FALLBACK_NAME;
  const firstPart = name.split(".")[0] ?? name;
  return RESERVED_NAMES.test(firstPart) ? `${name}_` : name;
}

/**
 * Returns `<name>.md`, or `<name>-2.md`, `<name>-3.md`... if the name is already taken.
 * Compares ignoring case, as Windows does.
 */
export function uniqueFileName(name: string, taken: Iterable<string>): string {
  const takenLower = new Set(Array.from(taken, (n) => n.toLowerCase()));
  let candidate = `${name}${NOTE_EXTENSION}`;
  for (let n = 2; takenLower.has(candidate.toLowerCase()); n++) {
    candidate = `${name}-${n}${NOTE_EXTENSION}`;
  }
  return candidate;
}
