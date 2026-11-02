import { useEffect, useRef, useState, type PointerEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { savePlacement } from "../domain/appData";
import { INITIAL_COLORS, INTEGRATION_CHAMBERS } from "../domain/chambers";
import { cycleEndEffects } from "../domain/cycleEnd";
import type { ColorFields } from "../domain/colorRules";
import { BACK_CHAMBER, flipEffects, otherSide, type DrumSide } from "../domain/drumSide";
import { fillLevel } from "../domain/noteText";
import { canTakeKeyboard, drumKeyAction, isDrumSharp, type PanelSize } from "../domain/panel";
import {
  placementWhileDragging,
  startPress,
  type DrumPlacement,
  type DrumPress,
} from "../domain/placement";
import type { Settings } from "../domain/settings";
import { colorIndexOf, colorShortcutEffect, type ShortcutAction } from "../domain/shortcuts";
import { BackPanel } from "./BackPanel";
import { playSound, wakeAudioOnFirstInput } from "./cycleEndSound";
import { Drum, type ChamberState, type DrumSpin } from "./Drum";
import { NotePanel } from "./NotePanel";
import { returnFocus } from "./returnFocus";
import { startTrayIcon } from "./trayIcon";
import { useAppWindow } from "./useAppWindow";
import { useClickThrough } from "./useClickThrough";
import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { useNotebook } from "./useNotebook";
import { useNotices } from "./useNotices";
import { usePomodoro } from "./usePomodoro";

/** The open panel: which color, how big, and whether it is open or shrinking back. */
interface PanelState {
  colorId: string;
  size: PanelSize;
  open: boolean;
  /** The keyboard starts in the subject: a color just created. */
  startInSubject?: boolean;
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
  press: DrumPress;
  /** How far below the drum center the drum was grabbed. */
  grabOffsetY: number;
}

/** Whether Windows asks to reduce motion. */
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Makes the window activatable and gives it the keyboard (does nothing outside Tauri). */
function takeKeyboard(): void {
  if (!isTauri()) return;
  const win = getCurrentWindow();
  void win.setFocusable(true).then(() => win.setFocus());
}

/** Root of the interface: a transparent window with the drum and, when open, the note panel. */
function App({ settings, startupProblems, initialPlacement }: AppProps) {
  const [panel, setPanel] = useState<PanelState | null>(null);
  /** What the empty chamber opens. It takes the place of the note panel. */
  const [backOpen, setBackOpen] = useState(false);
  const [placement, setPlacement] = useState(initialPlacement);
  const { notice, addNotice } = useNotices();
  useEffect(() => {
    if (startupProblems.length > 0) addNotice(startupProblems.join(" "));
  }, [startupProblems, addNotice]);
  const { geometry, layout, focused, workArea } = useAppWindow(
    settings.drumHeightFraction,
    panel?.size ?? (backOpen ? "normal" : null),
    placement,
  );

  // Dragging the drum by its ring or hub (not by a button), after holding it still for a
  // moment: it follows the pointer up and down, sticks to the nearer side edge, and is saved
  // where it is dropped. A press that moves too soon is just a click.
  const drag = useRef<DrumDrag | null>(null);
  const [grabbed, setGrabbed] = useState(false);
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
      press: startPress({ x: e.screenX, y: e.screenY }, settings.dragHoldMs, () =>
        setGrabbed(true),
      ),
      grabOffsetY: e.screenY - centerY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrumPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d?.press.move({ x: e.screenX, y: e.screenY })) setPlacement(dragPlacement(e, d));
  };
  const endPress = () => {
    drag.current?.press.cancel();
    drag.current = null;
    setGrabbed(false);
  };
  const onDrumPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const dragged = d?.press.release() ?? false;
    endPress();
    if (!d || !dragged) return;
    const dropped = dragPlacement(e, d);
    setPlacement(dropped);
    if (isTauri()) void savePlacement(dropped).catch(() => undefined);
  };
  // With just the drum showing, clicks on the transparent corners reach the video behind.
  useClickThrough(geometry, layout.panel === null, () => drag.current !== null);
  const [spin, setSpin] = useState<DrumSpin | null>(null);
  const [side, setSide] = useState<DrumSide>("front");
  useEffect(() => wakeAudioOnFirstInput(), []);
  useEffect(() => {
    if (isTauri())
      startTrayIcon().catch((error: unknown) => console.error("Ícone na bandeja:", error));
  }, []);
  /** End of a pomodoro phase: the ratchet sound and the drum spin, as set in the settings. */
  const onPhaseEnd = () => {
    const effects = cycleEndEffects(settings, prefersReducedMotion());
    playSound(effects.sound, effects.volume);
    const animation = effects.animation;
    if (animation) setSpin((previous) => ({ id: (previous?.id ?? 0) + 1, ...animation }));
  };
  const pomodoro = usePomodoro(settings, onPhaseEnd);
  const notes = useNotebook(INITIAL_COLORS, settings, addNotice);

  // Without an open panel the window cannot be activated, so clicks on the drum leave the
  // keyboard with the video; opening a note makes it activatable again and takes the keyboard.
  const panelOpen = (panel?.open ?? false) || backOpen;
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

  const { colors, chambers: chamberColors } = notes.colors();
  const colorIn = (colorId: string | null) => colors.find((c) => c.id === colorId) ?? null;
  const chambers: Record<string, ChamberState> = {};
  for (const color of colors) {
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

  /** Shows a side of the drum, with the ratchet of the half turn. */
  const flipTo = (next: DrumSide) => {
    if (next === side) return;
    const { sound, volume } = flipEffects(settings, prefersReducedMotion());
    playSound(sound, volume);
    setSide(next);
    if (next === "front") setBackOpen(false);
  };

  /** The empty chamber: an open note is saved and collapsed, and stays active. */
  const toggleBack = () => {
    if (!backOpen) notes.flush();
    setPanel(null);
    setBackOpen(!backOpen);
  };

  /** Continues a note of a color off the drum. */
  const openOffDrumColor = (colorId: string) => {
    setBackOpen(false);
    setPanel({ colorId, size: "normal", open: true });
  };

  /** Creates a color, and its note opens in one step. Returns why it was refused, or null. */
  const createColor = (fields: ColorFields, chamber: number): string | null => {
    const result = notes.createColor(fields, chamber);
    if (!result.ok) return result.error;
    setBackOpen(false);
    setPanel({ colorId: result.colorId, size: "normal", open: true, startInSubject: true });
    flipTo("front");
    return null;
  };

  /** A global shortcut: play or pause the pomodoro, or open (or put away) a color's note. */
  const onShortcut = (action: ShortcutAction) => {
    if (action === "togglePomodoro") {
      pomodoro.toggle();
      return;
    }
    // The shortcut opens the chamber (the place), whichever color is in it now.
    const colorId = chamberColors[colorIndexOf(action) ?? -1];
    if (!colorId) return;
    const openColorId = panel?.open ? panel.colorId : null;
    if (panel && colorShortcutEffect(colorId, { openColorId, focused }) === "collapse") {
      setPanel({ ...panel, open: false });
      return;
    }
    setPanel({ colorId, size: panel?.size ?? "normal", open: true });
    // The chamber it opens is on the front.
    flipTo("front");
    // The keyboard comes to the app, so typing goes straight into the note.
    takeKeyboard();
  };
  useGlobalShortcuts(settings.shortcuts, onShortcut, addNotice);

  /** Closes the open note (archives it) and shrinks the panel back into its chamber. */
  const closeNote = (colorId: string) => {
    void notes.close(colorId).then((closed) => {
      if (!closed) return;
      // A color that existed only because of this note has no panel left to shrink.
      const stays = notes.colors().colors.some((color) => color.id === colorId);
      setPanel((p) => (p && stays ? { ...p, open: false } : null));
    });
  };

  /** Esc and Ctrl+Enter, wherever the keyboard is in the drum window (not only in the panel). */
  const onKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const action = drumKeyAction(e, panelOpen);
    if (action === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (action === "closeNote") {
      if (panel) closeNote(panel.colorId);
      return;
    }
    if (action === "collapseAndLeave") {
      setBackOpen(false);
      if (panel) setPanel({ ...panel, open: false });
    }
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

  const panelColor = colorIn(panel?.colorId ?? null);
  // A color off the drum grows from the empty chamber.
  const place = panel ? chamberColors.indexOf(panel.colorId) : -1;
  const chamberCenter = geometry.chambers[place === -1 ? BACK_CHAMBER : place];

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
        onPointerCancel={endPress}
        className={`absolute ${grabbed ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          left: layout.drumOrigin.x,
          top: layout.drumOrigin.y,
          width: geometry.width,
          height: geometry.height,
        }}
      >
        <Drum
          geometry={geometry}
          colors={chamberColors.map(colorIn)}
          chambers={chambers}
          openColorId={panel?.open ? panel.colorId : null}
          onOpenColor={openColor}
          integrations={INTEGRATION_CHAMBERS}
          pomodoro={pomodoro.state}
          pomodoroAlert={pomodoro.alert}
          onTogglePomodoro={pomodoro.toggle}
          onStopPomodoro={pomodoro.stop}
          spin={spin}
          side={side}
          flipMs={flipEffects(settings, prefersReducedMotion()).durationMs}
          onFlip={() => flipTo(otherSide(side))}
          onOpenBack={toggleBack}
          backOpen={backOpen}
          // So it is clear which app is open: this one, or the installed one.
          badge={import.meta.env.DEV ? "DEV" : null}
          grabbed={grabbed}
        />
      </div>

      {panel && panelColor && chamberCenter && layout.panel && (
        <NotePanel
          key={panel.colorId}
          color={panelColor}
          subject={notes.subject(panel.colorId)}
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
          startInSubject={panel.startInSubject ?? false}
          open={panel.open}
          size={panel.size}
          message={notice}
          onChange={(text) => notes.edit(panel.colorId, text)}
          onSubjectChange={(subject) => notes.editSubject(panel.colorId, subject)}
          onConfirmTitle={() => void notes.confirmTitle(panel.colorId)}
          onToggleSize={() =>
            setPanel({ ...panel, size: panel.size === "normal" ? "expanded" : "normal" })
          }
          onCollapse={() => setPanel({ ...panel, open: false })}
          onCloseNote={() => closeNote(panel.colorId)}
          onHidden={() => setPanel((p) => (p && !p.open ? null : p))}
        />
      )}

      {backOpen && layout.panel && (
        <BackPanel
          rect={layout.panel}
          offDrumColors={notes.offDrumColors()}
          tones={notes.availableTones()}
          chambers={chamberColors.map(colorIn)}
          onOpenColor={openOffDrumColor}
          onCreateColor={createColor}
          onClose={() => setBackOpen(false)}
        />
      )}

      {!panel && notice && (
        <p
          role="status"
          className="pointer-events-none absolute inset-x-1 bottom-1 m-0 rounded-md bg-black/80 px-2 py-1 text-[11px] text-amber-200"
        >
          {notice}
        </p>
      )}
    </main>
  );
}

export default App;
