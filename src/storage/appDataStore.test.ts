import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAppDataStore, type AppDataStore } from "./appDataStore";
import { MemoryFileSystem } from "./memoryFileSystem";
import { FileBusyError, type RetryOptions } from "./retry";

const RETRY: RetryOptions = { attempts: 3, delayMs: 100 };

describe("AppDataStore", () => {
  let fs: MemoryFileSystem;
  let store: AppDataStore;

  beforeEach(() => {
    fs = new MemoryFileSystem();
    store = createAppDataStore(fs, RETRY);
  });

  it("reads null for a file that does not exist yet", async () => {
    expect(await store.read("configuracoes.json")).toBeNull();
  });

  it("reads null when the app folder itself does not exist yet", async () => {
    vi.spyOn(fs, "readText").mockRejectedValueOnce(
      new Error(
        "failed to open file: O sistema não pode encontrar o caminho especificado. (os error 3)",
      ),
    );
    expect(await store.read("configuracoes.json")).toBeNull();
  });

  it("does not hide other errors", async () => {
    vi.spyOn(fs, "readText").mockRejectedValueOnce(new Error("forbidden path"));
    await expect(store.read("configuracoes.json")).rejects.toThrow("forbidden path");
  });

  it("writes and reads a file back, with accents", async () => {
    await store.write("pomodoro.json", '{"nota":"ação"}');
    expect(await store.read("pomodoro.json")).toBe('{"nota":"ação"}');
  });

  it("writes through a .tmp file and leaves none behind", async () => {
    const writeSpy = vi.spyOn(fs, "writeText");
    await store.write("pomodoro.json", "{}");
    expect(writeSpy).toHaveBeenCalledWith("pomodoro.json.tmp", "{}");
    expect([...fs.files.keys()]).toEqual(["pomodoro.json"]);
  });

  describe("when the file is busy", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("tries again and then gives a clear error", async () => {
      await store.write("pomodoro.json", "{}");
      fs.holdBusy("pomodoro.json", RETRY.attempts);
      const reading = store.read("pomodoro.json");
      const assertion = expect(reading).rejects.toThrow(FileBusyError);
      await vi.runAllTimersAsync();
      await assertion;
    });
  });
});
