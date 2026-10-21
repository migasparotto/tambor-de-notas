import { useEffect, useState } from "react";
import { INITIAL_COLORS, INTEGRATION_CHAMBERS } from "../domain/chambers";
import { fillLevel } from "../domain/noteText";
import type { PanelSize } from "../domain/panel";
import type { Settings } from "../domain/settings";
import { Drum, type ChamberState } from "./Drum";
import { NotePanel } from "./NotePanel";
import { useAppWindow } from "./useAppWindow";
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
}

const STARTUP_MESSAGE_MS = 10000;

/** Root of the interface: a transparent window with the drum and, when open, the note panel. */
function App({ settings, startupProblems }: AppProps) {
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [startupMessage, setStartupMessage] = useState(
    startupProblems.length > 0 ? startupProblems.join(" ") : null,
  );
  useEffect(() => {
    const timer = setTimeout(() => setStartupMessage(null), STARTUP_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, []);
  const { geometry, layout, focused } = useAppWindow(
    settings.drumHeightFraction,
    panel?.size ?? null,
  );
  const pomodoro = usePomodoro(settings);
  const notes = useNotebook(INITIAL_COLORS, settings);
  // The end-of-cycle alert shows the drum fully, even when the window is not focused.
  const visible = focused || pomodoro.alert !== null;

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
        className="absolute"
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
        />
      </div>

      {panel && panelColor && chamberCenter && layout.panel && (
        <NotePanel
          key={panel.colorId}
          color={panelColor}
          text={notes.text(panel.colorId)}
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
          onCloseNote={() => {
            void notes.close(panel.colorId).then((closed) => {
              if (closed) setPanel((p) => (p ? { ...p, open: false } : p));
            });
          }}
          onHidden={() => setPanel((p) => (p && !p.open ? null : p))}
        />
      )}

      {(startupMessage ?? (panel ? null : notes.message)) && (
        <p
          role="status"
          className="absolute inset-x-1 bottom-1 m-0 rounded-md bg-black/80 px-2 py-1 text-[11px] text-amber-200"
        >
          {startupMessage ?? notes.message}
        </p>
      )}
    </main>
  );
}

export default App;
