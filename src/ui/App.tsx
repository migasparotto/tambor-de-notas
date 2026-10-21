import { INITIAL_COLORS, INTEGRATION_CHAMBERS } from "../domain/chambers";
import { DEFAULT_SETTINGS } from "../domain/settings";
import { Drum } from "./Drum";
import { useDrumWindow } from "./useDrumWindow";
import { usePomodoro } from "./usePomodoro";

/** Root of the interface: a transparent window that shows only the drum. */
function App() {
  const { geometry, focused } = useDrumWindow(DEFAULT_SETTINGS.drumHeightFraction);
  const pomodoro = usePomodoro(DEFAULT_SETTINGS);
  // The end-of-cycle alert shows the drum fully, even when the window is not focused.
  const visible = focused || pomodoro.alert !== null;

  return (
    <main
      className="relative overflow-hidden transition-opacity duration-300"
      style={{ width: geometry.width, height: geometry.height, opacity: visible ? 1 : 0.35 }}
    >
      <Drum
        geometry={geometry}
        colors={INITIAL_COLORS}
        integrations={INTEGRATION_CHAMBERS}
        pomodoro={pomodoro.state}
        pomodoroAlert={pomodoro.alert}
        onTogglePomodoro={pomodoro.toggle}
        onStopPomodoro={pomodoro.stop}
      />
    </main>
  );
}

export default App;
