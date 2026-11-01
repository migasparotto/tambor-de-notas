/**
 * The notices waiting to be shown, one after the other, each for `durationMs`.
 * A notice already waiting is not added again (the same error can repeat while typing).
 */
export class NoticeQueue {
  private readonly waiting: string[] = [];

  constructor(
    private readonly durationMs: number,
    private readonly onChange: () => void,
  ) {}

  /** The notice to show now, or null when there is none. */
  get current(): string | null {
    return this.waiting[0] ?? null;
  }

  /** Adds a notice to the end of the queue. */
  add(notice: string): void {
    if (this.waiting.includes(notice)) return;
    this.waiting.push(notice);
    if (this.waiting.length === 1) {
      this.onChange();
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    setTimeout(() => {
      this.waiting.shift();
      this.onChange();
      if (this.waiting.length > 0) this.scheduleNext();
    }, this.durationMs);
  }
}
