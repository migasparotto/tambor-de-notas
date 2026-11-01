import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { $, $$, browser, expect } from "@wdio/globals";
import {
  NOTES_DIR,
  pressGlobalShortcut,
  resetTestFolders,
  writeActiveFile,
  writeColorsFile,
} from "./system.mjs";

const RED = 'button[aria-label^="Vermelho"]';
const RED_PANEL = '[aria-label="Nota Vermelho"]';
const SUBJECT = 'input[aria-label="Assunto da nota"]';
const NOTICE = 'p[role="status"]';
const EDITOR = ".cm-content";
/** How long until the shortcuts are registered, after the drum appears. */
const SHORTCUTS_READY_MS = 1500;
/** Longer than a notice stays on the screen. */
const NOTICE_TIMEOUT_MS = 25000;

const month = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
const notesIn = (folder) => {
  const path = join(NOTES_DIR, folder);
  return existsSync(path) ? readdirSync(path).filter((name) => name.endsWith(".md")) : [];
};
const waitForNoteFile = (folder, name) =>
  browser.waitUntil(() => notesIn(folder).includes(name), {
    timeoutMsg: `${name} não apareceu em ${folder}; há: ${notesIn(folder).join(", ")}`,
  });

/** Opens the app again with test folders holding only what `prepare` writes. */
async function startApp(prepare = () => {}) {
  resetTestFolders();
  prepare();
  await browser.reloadSession();
  await $('button[aria-label^="Notion"]').waitForExist();
}

/** Writes the subject and the title of the open note. */
async function writeNote(subject, title) {
  await $(SUBJECT).setValue(subject);
  await $(EDITOR).click();
  await browser.keys([...title, "Enter", ..."texto"]);
}

describe("Tambor de Notas, o app de verdade", () => {
  it("shows the drum with the colors of cores.json", async () => {
    await startApp(() =>
      writeColorsFile(
        JSON.stringify({
          duvida: { name: "Dúvida", role: "Perguntas", hex: "#C9832B", chamber: 0 },
          blue: { chamber: null },
        }),
      ),
    );
    const chamber = $('button[aria-label^="Dúvida"]');
    await chamber.waitForExist();
    const border = await chamber.getCSSProperty("border-top-color");
    expect(border.parsed.hex).toBe("#c9832b");
    await expect($('button[aria-label^="Azul"]')).not.toExist();
    await expect($(RED)).toExist();
  });

  it("opens a chamber by clicking, and saves the title and the subject in the .md", async () => {
    await startApp();
    await $(RED).click();
    await $(RED_PANEL).waitForExist();
    await writeNote("Cálculo", "Aula E2E");

    const name = `${month()} vermelho - Aula E2E.md`;
    await waitForNoteFile("ativas", name);
    await browser.waitUntil(() => {
      const text = readFileSync(join(NOTES_DIR, "ativas", name), "utf8");
      return text.includes("texto");
    });
    const text = readFileSync(join(NOTES_DIR, "ativas", name), "utf8");
    expect(text).toContain('title: "Aula E2E"');
    expect(text).toContain('subject: "Cálculo"');
    expect(text).toContain('color: "red"');
    expect(text).toContain("# Aula E2E\ntexto");
  });

  it("opens the chamber of a global shortcut, whichever color is in it", async () => {
    await startApp(() =>
      writeColorsFile(
        JSON.stringify({
          duvida: { name: "Dúvida", role: "Perguntas", hex: "#C9832B", chamber: 1 },
          red: { chamber: null },
        }),
      ),
    );
    await $('button[aria-label^="Dúvida"]').waitForExist();
    await browser.pause(SHORTCUTS_READY_MS);
    pressGlobalShortcut(2);
    await $('[aria-label="Nota Dúvida"]').waitForExist();
  });

  it("collapses the note with Esc, and it stays active", async () => {
    await startApp();
    await $(RED).click();
    await $(RED_PANEL).waitForExist();
    await writeNote("Física", "Nota do Esc");
    await waitForNoteFile("ativas", `${month()} vermelho - Nota do Esc.md`);

    await browser.keys("Escape");
    await $(RED_PANEL).waitForExist({ reverse: true });
    expect(notesIn("ativas")).toEqual([`${month()} vermelho - Nota do Esc.md`]);
    expect(notesIn("arquivadas")).toEqual([]);
  });

  it("closes the note with Ctrl+Enter, and it goes to the archive", async () => {
    await startApp();
    await $(RED).click();
    await $(RED_PANEL).waitForExist();
    await writeNote("Química", "Nota fechada");
    const name = `${month()} vermelho - Nota fechada.md`;
    await waitForNoteFile("ativas", name);

    await browser.keys(["Control", "Enter"]);
    await waitForNoteFile("arquivadas", name);
    expect(notesIn("ativas")).toEqual([]);
  });

  it("draws a chamber with no color as a dashed circle", async () => {
    await startApp(() => writeColorsFile(JSON.stringify({ blue: { chamber: null } })));
    await $("[data-empty-chamber]").waitForExist();
    expect(await $$("[data-empty-chamber]").length).toBe(1);
    const border = await $("[data-empty-chamber]").getCSSProperty("border-top-style");
    expect(border.value).toBe("dashed");
  });

  it("warns about a note of an unknown color, without changing the file", async () => {
    const name = "2026-10 sumiu - Antiga.md";
    const content = `---\nid: "e2e-1"\ntitle: "Antiga"\ncolor: "sumiu"\nsubject: ""\ncreatedAt: "2026-10-01T10:00:00.000Z"\nupdatedAt: "2026-10-01T10:00:00.000Z"\n---\n# Antiga\ntexto`;
    await startApp(() => writeActiveFile(name, content));
    await $(NOTICE).waitForExist();
    await expect($(NOTICE)).toHaveText(expect.stringContaining('"sumiu"'));
    expect(readFileSync(join(NOTES_DIR, "ativas", name), "utf8")).toBe(content);
  });

  it("shows two notices of the same opening one after the other", async () => {
    await startApp(() => {
      writeColorsFile("{ quebrado");
      writeActiveFile("Sobra.md.tmp", "texto de uma sobra");
    });
    await $(NOTICE).waitForExist();
    await expect($(NOTICE)).toHaveText(expect.stringContaining("cores.json"));
    await browser.waitUntil(async () => (await $(NOTICE).getText()).includes("sobras"), {
      timeout: NOTICE_TIMEOUT_MS,
      timeoutMsg: "o segundo aviso não apareceu depois do primeiro",
    });
  });
});
