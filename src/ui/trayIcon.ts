import { defaultWindowIcon, getName } from "@tauri-apps/api/app";
import { Menu } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Fixed id, so a reloaded page finds the icon it already created instead of adding another. */
const TRAY_ID = "tambor";

let started: Promise<void> | null = null;

/**
 * Puts the app icon in the Windows tray, with a "Sair" menu.
 * The name comes from the app itself, so the development app shows "Tambor de Notas (Dev)".
 * "Sair" closes the window the normal way, so the open notes are saved first (useNotebook).
 * Safe to call more than once: only the first call does the work.
 */
export function startTrayIcon(): Promise<void> {
  started ??= createTrayIcon();
  return started;
}

async function createTrayIcon(): Promise<void> {
  const menu = await Menu.new({
    items: [{ id: "sair", text: "Sair", action: () => void getCurrentWindow().close() }],
  });
  // After a reload (e.g. waking from sleep) the icon is still there, but its menu belonged
  // to the old page: reuse the icon and give it the new menu.
  const existing = await TrayIcon.getById(TRAY_ID);
  if (existing) {
    await existing.setMenu(menu);
    return;
  }
  const name = await getName();
  await TrayIcon.new({
    id: TRAY_ID,
    icon: (await defaultWindowIcon()) ?? undefined,
    tooltip: name,
    menu,
  });
}
