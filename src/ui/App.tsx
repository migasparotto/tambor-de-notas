import { INITIAL_COLORS, INTEGRATION_CHAMBERS } from "../domain/chambers";
import { DEFAULT_SETTINGS } from "../domain/settings";
import { Drum } from "./Drum";
import { useDrumWindow } from "./useDrumWindow";

/** Root of the interface: a transparent window that shows only the drum. */
function App() {
  const { geometry, focused } = useDrumWindow(DEFAULT_SETTINGS.drumHeightFraction);

  return (
    <main
      className="relative overflow-hidden transition-opacity duration-300"
      style={{ width: geometry.width, height: geometry.height, opacity: focused ? 1 : 0.35 }}
    >
      <Drum
        geometry={geometry}
        colors={INITIAL_COLORS}
        integrations={INTEGRATION_CHAMBERS}
        clockText="00:00"
      />
    </main>
  );
}

export default App;
