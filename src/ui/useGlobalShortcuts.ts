import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import {
  SHORTCUT_ACTIONS,
  shortcutsInUseMessage,
  type ShortcutAction,
  type Shortcuts,
} from "../domain/shortcuts";

const MESSAGE_MS = 10000;

// Registering and unregistering run one after the other, never mixed: when React
// restarts the effect, the old shortcuts are gone before the new ones are registered.
let queue: Promise<unknown> = Promise.resolve();
const inOrder = (task: () => Promise<void>) => {
  queue = queue.then(task, task);
  return queue;
};

/**
 * Registers the global shortcuts (they work with the app in the background) and calls
 * `onAction` when one is pressed. Returns a warning, for a few seconds, naming the
 * combinations other programs already use.
 */
export function useGlobalShortcuts(
  shortcuts: Shortcuts,
  onAction: (action: ShortcutAction) => void,
): string | null {
  const [message, setMessage] = useState<string | null>(null);
  // Registered once; this ref always points to the latest handler.
  const latest = useRef(onAction);
  useEffect(() => {
    latest.current = onAction;
  });

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;

    void inOrder(async () => {
      // After a page reload (while developing) the old registrations are still there.
      await unregisterAll();
      if (cancelled) return;
      const inUse: string[] = [];
      for (const action of SHORTCUT_ACTIONS) {
        const combination = shortcuts[action];
        if (combination === "") continue;
        try {
          await register(combination, (event) => {
            if (event.state === "Pressed") latest.current(action);
          });
        } catch {
          inUse.push(combination);
        }
      }
      if (!cancelled) setMessage(shortcutsInUseMessage(inUse));
    });

    return () => {
      cancelled = true;
      void inOrder(() => unregisterAll());
    };
  }, [shortcuts]);

  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return message;
}
