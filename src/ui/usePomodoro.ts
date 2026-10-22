import { useEffect, useRef, useState } from "react";
import { loadDailyCycles, saveDailyCycles } from "../domain/appData";
import { addCycle, cyclesForToday, type DailyCycles } from "../domain/dailyCycles";
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
 * The cycles shown are today's, saved between uses and back to zero each day.
 * `onPhaseEnd` is called when a phase ends (for the sound and the drum spin).
 */
export function usePomodoro(
  durations: PomodoroDurations,
  onPhaseEnd?: (ended: PomodoroPhase) => void,
): {
  state: PomodoroState;
  alert: PomodoroPhase | null;
  toggle: () => void;
  stop: () => void;
} {
  const { focusMinutes, breakMinutes } = durations;
  // The pomodoro is created once per durations; this ref always points to the latest callback.
  const phaseEndRef = useRef(onPhaseEnd);
  useEffect(() => {
    phaseEndRef.current = onPhaseEnd;
  });
  const pomodoro = useRef<Pomodoro | null>(null);
  const [state, setState] = useState(() => new Pomodoro(durations).getState());
  const [alert, setAlert] = useState<PomodoroPhase | null>(null);
  const [daily, setDaily] = useState<DailyCycles>(() => cyclesForToday(null, new Date()));
  const dailyRef = useRef(daily);
  const updateDaily = (next: DailyCycles) => {
    dailyRef.current = next;
    setDaily(next);
  };

  useEffect(() => {
    let cancelled = false;
    loadDailyCycles(new Date())
      .then((saved) => {
        // Keep any cycle finished while loading (only possible with very short settings).
        if (!cancelled && dailyRef.current.cycles === 0) updateDaily(saved);
      })
      .catch(() => undefined); // without the saved count, today simply starts at zero
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let alertTimer: ReturnType<typeof setTimeout> | undefined;
    const p = new Pomodoro(
      { focusMinutes, breakMinutes },
      {
        onChange: setState,
        onPhaseEnd: (ended) => {
          if (ended === "focus") {
            const next = addCycle(dailyRef.current, new Date());
            updateDaily(next);
            saveDailyCycles(next).catch(() => undefined); // a failed save only loses the count
          }
          setAlert(ended);
          phaseEndRef.current?.(ended);
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
    state: { ...state, cycles: daily.cycles },
    alert,
    toggle: () => pomodoro.current?.toggle(),
    stop: () => pomodoro.current?.stop(),
  };
}
