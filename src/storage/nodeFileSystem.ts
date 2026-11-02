/// <reference types="node" />
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import type { FileSystem } from "./fileSystem";

/**
 * A FileSystem on the real disk through Node.js, only for tests (the app runs in Tauri).
 * Every path stays inside `root`: anything that would leave it is refused.
 */
export function nodeFileSystem(root: string): FileSystem {
  const base = resolve(root);
  const inside = (path: string): string => {
    const full = resolve(base, path);
    if (full !== base && !full.startsWith(base + sep)) {
      throw new Error(`Caminho fora da pasta de teste: "${path}"`);
    }
    return full;
  };

  return {
    async mkdir(path) {
      await mkdir(inside(path), { recursive: true });
    },
    async readDir(path) {
      const entries = await readdir(inside(path), { withFileTypes: true });
      return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    },
    async readText(path) {
      return readFile(inside(path), "utf8").catch((error: NodeJS.ErrnoException) => {
        // The same error the app gets from Tauri on Windows for a missing file.
        throw error.code === "ENOENT" ? new Error(`${path}: os error 2`) : error;
      });
    },
    async writeText(path, content) {
      await writeFile(inside(path), content, "utf8");
    },
    async rename(from, to) {
      await rename(inside(from), inside(to));
    },
  };
}
