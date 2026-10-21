import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NOTES_ROOT, tauriFileSystem } from "./tauriFileSystem";

// Goes through the real plugin code, with Tauri's IPC mock standing in for the Rust side.
describe("tauriFileSystem", () => {
  let calls: { cmd: string; args: unknown }[];
  let lastWritten: Uint8Array;

  beforeEach(() => {
    vi.stubGlobal("window", {});
    calls = [];
    mockIPC((cmd, args) => {
      calls.push({ cmd, args });
      if (cmd === "plugin:fs|write_text_file") lastWritten = args as Uint8Array;
      if (cmd === "plugin:fs|read_text_file") return lastWritten;
      if (cmd === "plugin:fs|read_dir") {
        return [
          { name: "Aula.md", isFile: true, isDirectory: false, isSymlink: false },
          { name: "pasta", isFile: false, isDirectory: true, isSymlink: false },
        ];
      }
      return null;
    });
  });

  afterEach(() => {
    clearMocks();
    vi.unstubAllGlobals();
  });

  it("writes accents and emoji as UTF-8 bytes", async () => {
    await tauriFileSystem.writeText("ativas/Aula.md", "Ação 🚀");

    // A, ç, ã, o, space, 🚀 in UTF-8.
    const utf8 = [0x41, 0xc3, 0xa7, 0xc3, 0xa3, 0x6f, 0x20, 0xf0, 0x9f, 0x9a, 0x80];
    expect(Array.from(lastWritten)).toEqual(utf8);
  });

  it("reads accents and emoji back unchanged", async () => {
    const text = "Ação, coração — ñ ü\n🚀🥁👩🏽‍💻 𝔽";
    await tauriFileSystem.writeText("ativas/Aula.md", text);
    expect(await tauriFileSystem.readText("ativas/Aula.md")).toBe(text);
  });

  it("keeps every path inside the notes folder in Documents", async () => {
    await tauriFileSystem.mkdir("ativas");
    await tauriFileSystem.rename("ativas/Aula.md", "arquivadas/Aula.md");

    expect(calls).toEqual([
      {
        cmd: "plugin:fs|mkdir",
        args: {
          path: `${NOTES_ROOT}/ativas`,
          options: { baseDir: BaseDirectory.Document, recursive: true },
        },
      },
      {
        cmd: "plugin:fs|rename",
        args: {
          oldPath: `${NOTES_ROOT}/ativas/Aula.md`,
          newPath: `${NOTES_ROOT}/arquivadas/Aula.md`,
          options: {
            oldPathBaseDir: BaseDirectory.Document,
            newPathBaseDir: BaseDirectory.Document,
          },
        },
      },
    ]);
  });

  it("lists only files, not folders", async () => {
    expect(await tauriFileSystem.readDir("ativas")).toEqual(["Aula.md"]);
  });
});
