import { useEffect, useRef, useState, type PointerEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { savePlacement } from "../domain/appData";
import { INITIAL_COLORS, INTEGRATION_CHAMBERS } from "../domain/chambers";
import { cycleEndEffects } from "../domain/cycleEnd";
import { fillLevel } from "../domain/noteText";
import type { Point } from "../domain/drum";
import { canTakeKeyboard, drumKeyAction, isDrumSharp, type PanelSize } from "../domain/panel";
import { isDrag, placementWhileDragging, type DrumPlacement } from "../domain/placement";
import type { Settings } from "../domain/settings";
import { colorIndexOf, colorShortcutEffect, type ShortcutAction } from "../domain/shortcuts";
import { playSound, wakeAudioOnFirstInput } from "./cycleEndSound";
import { Drum, type ChamberState, type DrumSpin } from "./Drum";
import { NotePanel } from "./NotePanel";
import { returnFocus } from "./returnFocus";
import { startTrayIcon } from "./trayIcon";
import { useAppWindow } from "./useAppWindow";
import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { useNotebook } from "./useNotebook";
import { usePomodoro } from "./usePomodoro";

/** The open panel: which color, how big, and whether it is open or shrinking back. */
interface PanelState {
  colorId: string;
  size: PanelSize;
  open: boolean;
}

interface AppProps {
  settings: Settings;
  /** Problems found in the settings file, shown once at start-up. */
  startupProblems: string[];
  /** Where the drum was left last time. */
  initialPlacement: DrumPlacement;
}

/** A press on the drum that may turn into a drag. */
interface DrumDrag {
  start: Point;
  /** How far below the drum center the drum was grabbed. */
  grabOffsetY: number;
  moving: boolean;
}

const STARTUP_MESSAGE_MS = 10000;

/** Makes the window activatable and gives it the keyboard (does nothing outside Tauri). */
function takeKeyboard(): void {
  if (!isTauri()) return;
  const win = getCurrentWindow();
  void win.setFocusable(true).then(() => win.setFocus());
}

/** Root of the interface: a transparent window with the drum and, when open, the note panel. */
function App({ settings, startupProblems, initialPlacement }: AppProps) {
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [placement, setPlacement] = useState(initialPlacement);
  const [startupMessage, setStartupMessage] = useState(
    startupProblems.length > 0 ? startupProblems.join(" ") : null,
  );
  useEffect(() => {
    const timer = setTimeout(() => setStartupMessage(null), STARTUP_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, []);
  const { geometry, layout, focused, workArea } = useAppWindow(
    settings.drumHeightFraction,
    panel?.size ?? null,
    placement,
  );

  // Dragging the drum by its ring or hub (not by a button): it follows the pointer up and
  // down, sticks to the nearer side edge, and is saved where it is dropped.
  const drag = useRef<DrumDrag | null>(null);
  const dragPlacement = (e: PointerEvent, d: DrumDrag) =>
    placementWhileDragging(
      workArea,
      geometry.height,
      { x: e.screenX, y: e.screenY },
      d.grabOffsetY,
    );
  const onDrumPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const centerY = layout.window.y + layout.drumOrigin.y + geometry.center.y;
    drag.current = {
      start: { x: e.screenX, y: e.screenY },
      grabOffsetY: e.screenY - centerY,
      moving: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrumPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || (!d.moving && !isDrag(d.start, { x: e.screenX, y: e.screenY }))) return;
    d.moving = true;
    setPlacement(dragPlacement(e, d));
  };
  const onDrumPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moving) return;
    const dropped = dragPlacement(e, d);
    setPlacement(dropped);
    if (isTauri()) void savePlacement(dropped).catch(() => undefined);
  };
  const [spin, setSpin] = useState<DrumSpin | null>(null);
  useEffect(() => wakeAudioOnFirstInput(), []);
  useEffect(() => {
    if (isTauri())
      startTrayIcon().catch((error: unknown) => console.error("Ícone na bandeja:", error));
  }, []);
  /** End of a pomodoro phase: the ratchet sound and the drum spin, as set in the settings. */
  const onPhaseEnd = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effects = cycleEndEffects(settings, reduceMotion);
    playSound(effects.sound, effects.volume);
    const animation = effects.animation;
    if (animation) setSpin((previous) => ({ id: (previous?.id ?? 0) + 1, ...animation }));
  };
  const pomodoro = usePomodoro(settings, onPhaseEnd);
  const notes = useNotebook(INITIAL_COLORS, settings);

  // Without an open panel the window cannot be activated, so clicks on the drum leave the
  // keyboard with the video; opening a note makes it activatable again and takes the keyboard.
  const panelOpen = panel?.open ?? false;
  useEffect(() => {
    if (!isTauri()) return;
    if (canTakeKeyboard(panelOpen)) takeKeyboard();
    else void getCurrentWindow().setFocusable(false);
  }, [panelOpen]);
  const visible = isDrumSharp({
    panelOpen,
    focused,
    alerting: pomodoro.alert !== null,
  });

  const chambers: Record<string, ChamberState> = {};
  for (const color of INITIAL_COLORS) {
    chambers[color.id] = {
      active: notes.hasNote(color.id),
      fill: fillLevel(notes.text(color.id), settings.charLimit),
    };
  }

  /** Clicking a chamber opens its note, collapses it if it is already open, or switches color. */
  const openColor = (colorId: string) => {
    if (panel?.open && panel.colorId === colorId) setPanel({ ...panel, open: false });
    else setPanel({ colorId, size: panel?.size ?? "normal", open: true });
  };

  /** A global shortcut: play or pause the pomodoro, or open (or put away) a color's note. */
  const onShortcut = (action: ShortcutAction) => {
    if (action === "togglePomodoro") {
      pomodoro.toggle();
      return;
    }
    const color = INITIAL_COLORS[colorIndexOf(action) ?? -1];
    if (!color) return;
    const openColorId = panel?.open ? panel.colorId : null;
    if (panel && colorShortcutEffect(color.id, { openColorId, focused }) === "collapse") {
      setPanel({ ...panel, open: false });
      return;
    }
    setPanel({ colorId: color.id, size: panel?.size ?? "normal", open: true });
    // The keyboard comes to the app, so typing goes straight into the note.
    takeKeyboard();
  };
  const shortcutMessage = useGlobalShortcuts(settings.shortcuts, onShortcut);

  /** Closes the open note (archives it) and shrinks the panel back into its chamber. */
  const closeNote = (colorId: string) => {
    void notes.close(colorId).then((closed) => {
      if (closed) setPanel((p) => (p ? { ...p, open: false } : p));
    });
  };

  /** Esc and Ctrl+Enter, wherever the keyboard is in the drum window (not only in the panel). */
  const onKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const action = drumKeyAction(e, panel?.open ?? false);
    if (action === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (action === "closeNote") {
      if (panel) closeNote(panel.colorId);
      return;
    }
    if (action === "collapseAndLeave" && panel) setPanel({ ...panel, open: false });
    returnFocus();
  };
  // Registered once; this ref always points to the latest handler.
  const latestOnKey = useRef(onKey);
  useEffect(() => {
    latestOnKey.current = onKey;
  });
  useEffect(() => {
    // Capture phase: the window sees these keys before the editor does.
    const listener = (e: KeyboardEvent) => latestOnKey.current(e);
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, []);

  const panelColor = INITIAL_COLORS.find((c) => c.id === panel?.colorId);
  const chamberIndex = INITIAL_COLORS.findIndex((c) => c.id === panel?.colorId);
  const chamberCenter = geometry.chambers[chamberIndex];

  return (
    <main
      className="relative overflow-hidden transition-opacity duration-300"
      style={{
        width: layout.window.width,
        height: layout.window.height,
        opacity: visible ? 1 : 0.35,
      }}
    >
      <div
        // Clicks on the drum (clock, stop, "+", the ring) work but never take the keyboard
        // away from the editor; opening a color focuses its own editor.
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={onDrumPointerDown}
        onPointerMove={onDrumPointerMove}
        onPointerUp={onDrumPointerUp}
        onPointerCancel={() => (drag.current = null)}
        className="absolute cursor-grab"
        style={{
          left: layout.drumOrigin.x,
          top: layout.drumOrigin.y,
          width: geometry.width,
          height: geometry.height,
        }}
      >
        <Drum
          geometry={geometry}
          colors={INITIAL_COLORS}
          chambers={chambers}
          openColorId={panel?.open ? panel.colorId : null}
          onOpenColor={openColor}
          integrations={INTEGRATION_CHAMBERS}
          pomodoro={pomodoro.state}
          pomodoroAlert={pomodoro.alert}
          onTogglePomodoro={pomodoro.toggle}
          onStopPomodoro={pomodoro.stop}
          spin={spin}
          // So it is clear which app is open: this one, or the installed one.
          badge={import.meta.env.DEV ? "DEV" : null}
        />
      </div>

      {panel && panelColor && chamberCenter && layout.panel && (
        <NotePanel
          key={panel.colorId}
          color={panelColor}
          text={notes.text(panel.colorId)}
          markdown={notes.markdown(panel.colorId)}
          charLimit={settings.charLimit}
          symbolsMode={settings.symbolsMode}
          rect={layout.panel}
          chamber={{
            center: {
              x: layout.drumOrigin.x + chamberCenter.x,
              y: layout.drumOrigin.y + chamberCenter.y,
            },
            size: geometry.chamberSize,
          }}
          open={panel.open}
          size={panel.size}
          message={notes.message}
          onChange={(text) => notes.edit(panel.colorId, text)}
          onConfirmTitle={() => void notes.confirmTitle(panel.colorId)}
          onToggleSize={() =>
            setPanel({ ...panel, size: panel.size === "normal" ? "expanded" : "normal" })
          }
          onCollapse={() => setPanel({ ...panel, open: false })}
          onCloseNote={() => closeNote(panel.colorId)}
          onHidden={() => setPanel((p) => (p && !p.open ? null : p))}
        />
      )}

      {(startupMessage ?? shortcutMessage ?? (panel ? null : notes.message)) && (
        <p
          role="status"
          className="absolute inset-x-1 bottom-1 m-0 rounded-md bg-black/80 px-2 py-1 text-[11px] text-amber-200"
        >
          {startupMessage ?? shortcutMessage ?? notes.message}
        </p>
      )}
    </main>
  );
}

export default App;
