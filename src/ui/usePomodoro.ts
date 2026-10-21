import { useEffect, useRef, useState } from "react";
import {
  Pomodoro,
  type PomodoroDurations,
  type PomodoroPhase,
  type PomodoroState,
} from "../domain/pomodoro";

const ALERT_MS = 6000;

/**
 * Runs a pomodoro for the drum and exposes its state, the play/pause and stop actions,
 * and `alert`: the phase that just ended, set for a few seconds so the clock can flash.
 */
export function usePomodoro(durations: PomodoroDurations): {
  state: PomodoroState;
  alert: PomodoroPhase | null;
  toggle: () => void;
  stop: () => void;
} {
  const { focusMinutes, breakMinutes } = durations;
  const pomodoro = useRef<Pomodoro | null>(null);
  const [state, setState] = useState(() => new Pomodoro(durations).getState());
  const [alert, setAlert] = useState<PomodoroPhase | null>(null);

  useEffect(() => {
    let alertTimer: ReturnType<typeof setTimeout> | undefined;
    const p = new Pomodoro(
      { focusMinutes, breakMinutes },
      {
        onChange: setState,
        onPhaseEnd: (ended) => {
          setAlert(ended);
          clearTimeout(alertTimer);
          alertTimer = setTimeout(() => setAlert(null), ALERT_MS);
        },
      },
    );
    pomodoro.current = p;
    return () => {
      p.dispose();
      clearTimeout(alertTimer);
      pomodoro.current = null;
    };
  }, [focusMinutes, breakMinutes]);

  return {
    state,
    alert,
    toggle: () => pomodoro.current?.toggle(),
    stop: () => pomodoro.current?.stop(),
  };
}
