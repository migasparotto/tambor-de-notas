/* eslint-disable @typescript-eslint/require-await -- in-memory versions of disk operations: nothing to wait for */
import type { FileSystem } from "./fileSystem";

const parentOf = (path: string): string => path.slice(0, Math.max(path.lastIndexOf("/"), 0));

/**
 * A FileSystem kept in memory, for tests. Behaves like the disk where it matters:
 * writing needs the folder to exist, and `rename` replaces the destination.
 */
export class MemoryFileSystem implements FileSystem {
  /** File contents by path; tests may inspect it. */
  readonly files = new Map<string, string>();
  private readonly folders = new Set<string>([""]);
  private readonly busy = new Map<string, number>();

  /** Makes the next `times` operations on `path` fail as if OneDrive were holding the file. */
  holdBusy(path: string, times: number): void {
    this.busy.set(path, times);
  }

  async mkdir(path: string): Promise<void> {
    for (let p = path; p !== ""; p = parentOf(p)) this.folders.add(p);
  }

  async readDir(path: string): Promise<string[]> {
    if (!this.folders.has(path)) throw new Error(`folder not found: ${path} (os error 3)`);
    return [...this.files.keys()]
      .filter((file) => parentOf(file) === path)
      .map((file) => file.slice(path.length + 1));
  }

  async readText(path: string): Promise<string> {
    this.failIfBusy(path);
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`file not found: ${path} (os error 2)`);
    return content;
  }

  async writeText(path: string, content: string): Promise<void> {
    this.failIfBusy(path);
    if (!this.folders.has(parentOf(path)))
      throw new Error(`folder not found: ${path} (os error 3)`);
    this.files.set(path, content);
  }

  async rename(from: string, to: string): Promise<void> {
    this.failIfBusy(from);
    this.failIfBusy(to);
    const content = this.files.get(from);
    if (content === undefined) throw new Error(`file not found: ${from} (os error 2)`);
    if (!this.folders.has(parentOf(to))) throw new Error(`folder not found: ${to} (os error 3)`);
    this.files.delete(from);
    this.files.set(to, content);
  }

  private failIfBusy(path: string): void {
    const times = this.busy.get(path) ?? 0;
    if (times <= 0) return;
    this.busy.set(path, times - 1);
    throw new Error(`The process cannot access the file: ${path} (os error 32)`);
  }
}
