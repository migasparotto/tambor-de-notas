import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FileSystem } from "./fileSystem";
import { nodeFileSystem } from "./nodeFileSystem";

describe("nodeFileSystem", () => {
  let root: string;
  let fs: FileSystem;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "tambor-teste-"));
    fs = nodeFileSystem(root);
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  it("refuses every operation on a path outside its folder", async () => {
    await expect(fs.mkdir("../fora")).rejects.toThrow("fora da pasta");
    await expect(fs.readDir("..")).rejects.toThrow("fora da pasta");
    await expect(fs.readText("../fora.md")).rejects.toThrow("fora da pasta");
    await expect(fs.writeText("../fora.md", "x")).rejects.toThrow("fora da pasta");
    await expect(fs.writeText("a/../../fora.md", "x")).rejects.toThrow("fora da pasta");
    await expect(fs.rename("a.md", "../fora.md")).rejects.toThrow("fora da pasta");
    expect(existsSync(join(root, "..", "fora.md"))).toBe(false);
  });

  it("refuses a folder that only starts with the same name", async () => {
    await expect(fs.writeText(`${root}-vizinha/fora.md`, "x")).rejects.toThrow("fora da pasta");
  });

  it("lists only files, not folders", async () => {
    await fs.mkdir("ativas/dentro");
    await fs.writeText("ativas/Aula.md", "x");
    expect(await fs.readDir("ativas")).toEqual(["Aula.md"]);
  });

  it("replaces the destination when renaming, as the atomic save needs", async () => {
    await fs.writeText("Aula.md", "antigo");
    await fs.writeText("Aula.md.tmp", "novo");
    await fs.rename("Aula.md.tmp", "Aula.md");
    expect(await fs.readText("Aula.md")).toBe("novo");
    expect(await fs.readDir("")).toEqual(["Aula.md"]);
  });
});
