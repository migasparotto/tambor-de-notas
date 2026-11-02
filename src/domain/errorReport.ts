/** Most stack lines kept in a log line: enough to find the spot, without flooding the log. */
export const MAX_STACK_LINES = 6;

/**
 * Describes anything that was thrown as one log line: the error's name and message and the
 * start of its stack. Note content is removed later, when the line is written to the file.
 */
export function describeError(where: string, error: unknown): string {
  if (error instanceof Error) {
    const stack = (error.stack ?? "")
      .split("\n")
      .slice(1, MAX_STACK_LINES + 1)
      .map((line) => line.trim())
      .filter(Boolean);
    const head = `${where}: ${error.name}: ${error.message}`;
    return stack.length > 0 ? `${head} | ${stack.join(" | ")}` : head;
  }
  return `${where}: ${typeof error === "string" ? error : (JSON.stringify(error) ?? String(error))}`;
}
