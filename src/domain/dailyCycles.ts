/** Pomodoro cycles completed on one day (local date, like "2026-10-21"). */
export interface DailyCycles {
  date: string;
  cycles: number;
}

/** The local date of `now`, as "AAAA-MM-DD". */
export function localDay(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Today's count: the saved one if it is from today, otherwise zero (a new day starts at zero). */
export function cyclesForToday(saved: DailyCycles | null, now: Date): DailyCycles {
  const today = localDay(now);
  return saved?.date === today ? saved : { date: today, cycles: 0 };
}

/** Adds one completed cycle; if the day has changed, the count restarts at one. */
export function addCycle(current: DailyCycles, now: Date): DailyCycles {
  const today = cyclesForToday(current, now);
  return { date: today.date, cycles: today.cycles + 1 };
}

/** Reads the saved counter; anything unexpected counts as nothing saved. */
export function parseDailyCycles(json: string): DailyCycles | null {
  try {
    const saved = JSON.parse(json) as Partial<DailyCycles> | null;
    const valid =
      typeof saved?.date === "string" &&
      typeof saved.cycles === "number" &&
      Number.isInteger(saved.cycles) &&
      saved.cycles >= 0;
    return valid ? { date: saved.date!, cycles: saved.cycles! } : null;
  } catch {
    return null;
  }
}
