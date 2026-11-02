import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { $, $$, browser, expect } from "@wdio/globals";
import {
  APP_DATA_DIR,
  NOTES_DIR,
  closeE2eApp,
  openE2eApp,
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
const PLUS = 'button[aria-label="Girar para o outro lado"]';
const CHAMBERS = "[data-drum-side]";
const BACK_CHAMBER = "[data-back-chamber]";
const BACK_PANEL = 'section[aria-label="Outro lado do tambor"]';
const OFF_DRUM_LIST = 'ul[aria-label="Notas fora do tambor"]';
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
  // The session ends before the app it is connected to.
  await browser.deleteSession({ shutdownDriver: false });
  closeE2eApp();
  resetTestFolders();
  prepare();
  await openE2eApp();
  await browser.reloadSession();
  await $('button[aria-label^="Notion"]').waitForExist();
}

/** Writes the subject and the title of the open note. */
async function writeNote(subject, title) {
  await $(SUBJECT).setValue(subject);
  await $(EDITOR).click();
  await browser.keys([...title, "Enter", ..."texto"]);
}

/** Turns to the other side and opens what the empty chamber shows. */
async function openBackPanel() {
  await $(PLUS).click();
  await browser.waitUntil(() =>
    browser.execute(() => {
      const chambers = document.querySelector("[data-drum-side]");
      return chambers.dataset.drumSide === "back" && chambers.getAnimations().length === 0;
    }),
  );
  await $(BACK_CHAMBER).click();
  await $(BACK_PANEL).waitForExist();
}

/** The button of a color in the list of notes off the drum. */
const offDrumButton = (name) =>
  $(`//ul[@aria-label="Notas fora do tambor"]//button[contains(., "${name}")]`);

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

  it("flips the drum with the + and back, without taking the keyboard from the note", async () => {
    await startApp();
    await $(RED).click();
    await $(RED_PANEL).waitForExist();
    await writeNote("Física", "Nota do giro");

    await $(PLUS).click();
    await browser.waitUntil(
      async () => (await $(CHAMBERS).getAttribute("data-drum-side")) === "back",
    );
    await browser.waitUntil(
      async () => {
        const [back, front] = await browser.execute(() => {
          const inWindow = (selector) => {
            const { left, top, width, height } = document
              .querySelector(selector)
              .getBoundingClientRect();
            const [x, y] = [left + width / 2, top + height / 2];
            return x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
          };
          const moving = document.querySelector("[data-drum-side]").getAnimations().length > 0;
          return [
            !moving && inWindow("[data-back-chamber]"),
            inWindow('button[aria-label^="Vermelho"]'),
          ];
        });
        return back && !front;
      },
      { timeoutMsg: "a câmara vazia não ficou à vista, ou as câmaras da frente não saíram" },
    );
    await browser.keys([..." segue"]);
    await browser.waitUntil(async () => (await $(EDITOR).getText()).includes("texto segue"));

    await $('button[aria-label="Voltar para as câmaras"]').click();
    await browser.waitUntil(
      async () => (await $(CHAMBERS).getAttribute("data-drum-side")) === "front",
    );
  });

  it("returns to the front when a global shortcut opens a chamber", async () => {
    await startApp();
    await $(PLUS).click();
    await browser.waitUntil(
      async () => (await $(CHAMBERS).getAttribute("data-drum-side")) === "back",
    );
    await browser.pause(SHORTCUTS_READY_MS);
    pressGlobalShortcut(2);
    await $(RED_PANEL).waitForExist();
    expect(await $(CHAMBERS).getAttribute("data-drum-side")).toBe("front");
  });

  it("creates a color in a chamber, and the note that was open stays on the other side", async () => {
    await startApp();
    await $(RED).click();
    await $(RED_PANEL).waitForExist();
    await writeNote("Física", "Nota antiga");

    await openBackPanel();
    await $(RED_PANEL).waitForExist({ reverse: true });
    await waitForNoteFile("ativas", `${month()} vermelho - Nota antiga.md`);
    expect(await $(OFF_DRUM_LIST).isExisting()).toBe(false);

    await $("button=+ Cor nova").click();
    await $('input[aria-label="Nome da cor"]').setValue("Dúvida");
    await $('input[aria-label="Função da cor"]').setValue("Perguntas");
    await $('button[aria-label="Tom #C9832B"]').click();
    await $(
      `//section[@aria-label="Outro lado do tambor"]//button[contains(., "Vermelho")]`,
    ).click();
    await $("button=Criar e abrir a nota").click();

    await $('[aria-label="Nota Dúvida"]').waitForExist();
    await browser.waitUntil(
      () => browser.execute(() => document.activeElement?.getAttribute("aria-label")),
      { timeoutMsg: "nada ficou com o teclado" },
    );
    expect(await browser.execute(() => document.activeElement?.getAttribute("aria-label"))).toBe(
      "Assunto da nota",
    );
    expect(await $(CHAMBERS).getAttribute("data-drum-side")).toBe("front");
    expect(await $('button[aria-label^="Dúvida"]').isExisting()).toBe(true);
    expect(await $(RED).isExisting()).toBe(false);
    await browser.waitUntil(() => {
      const path = join(APP_DATA_DIR, "cores.json");
      return existsSync(path) && JSON.parse(readFileSync(path, "utf8")).duvida?.chamber === 1;
    });

    await browser.keys("Escape");
    await $('[aria-label="Nota Dúvida"]').waitForExist({ reverse: true });
    await openBackPanel();
    await offDrumButton("Vermelho").click();
    await $(RED_PANEL).waitForExist();
    await browser.waitUntil(async () => (await $(EDITOR).getText()).includes("Nota antiga"));
  });

  it("closes the note of an unknown color from the other side, and it leaves the list", async () => {
    const content = `---\nid: "e2e-2"\ntitle: "Antiga"\ncolor: "sumiu"\nsubject: ""\ncreatedAt: "2026-10-01T10:00:00.000Z"\nupdatedAt: "2026-10-01T10:00:00.000Z"\n---\n# Antiga\ntexto`;
    await startApp(() => writeActiveFile("2026-10 sumiu - Antiga.md", content));
    const windowWidth = () => browser.execute(() => window.innerWidth);
    const drumOnly = await windowWidth();
    await openBackPanel();
    await offDrumButton("sumiu").click();
    await $('[aria-label="Nota sumiu"]').waitForExist();
    await $("button*=Fechar nota").click();
    await $('[aria-label="Nota sumiu"]').waitForExist({ reverse: true });
    await browser.waitUntil(() => notesIn("ativas").length === 0);
    await browser.waitUntil(async () => (await windowWidth()) === drumOnly, {
      timeoutMsg: "a janela continuou larga depois de fechar a nota",
    });

    await $(BACK_CHAMBER).click();
    await $(BACK_PANEL).waitForExist();
    expect(await $(OFF_DRUM_LIST).isExisting()).toBe(false);
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
