import type { CSSProperties } from "react";
import type { DrumGeometry, Point } from "../domain/drum";
import type { IntegrationChamber, NoteColor } from "../domain/chambers";
import { formatClock, type PomodoroPhase, type PomodoroState } from "../domain/pomodoro";

/** How a color chamber looks: with an active note it is tinted and fills up to `fill` (0 to 1). */
export interface ChamberState {
  active: boolean;
  fill: number;
}

interface DrumProps {
  geometry: DrumGeometry;
  colors: readonly NoteColor[];
  chambers: Record<string, ChamberState>;
  /** Color whose panel is open, highlighted on the drum. */
  openColorId: string | null;
  onOpenColor: (colorId: string) => void;
  integrations: readonly IntegrationChamber[];
  pomodoro: PomodoroState;
  /** Phase that just ended, while its alert is showing. */
  pomodoroAlert: PomodoroPhase | null;
  onTogglePomodoro: () => void;
  onStopPomodoro: () => void;
}

const RING = "#23262C";
const EDGE = "#3A3E46";
const CLOCK_IDLE = "#8A919C";
const CLOCK_FOCUS = "#E6E9EE";
const CLOCK_BREAK = "#E0A84F";
const CLOCK_PAUSED = "#CDB2A8";
const STOP_MARK = "#B8696A";

/** Clock color: amber during the break, pale beige-pink when paused, bright while focusing, grey when stopped. */
function clockColor({ phase, status }: PomodoroState): string {
  if (phase === "break") return CLOCK_BREAK;
  if (status === "paused") return CLOCK_PAUSED;
  return status === "running" ? CLOCK_FOCUS : CLOCK_IDLE;
}

const ALERT_TEXT: Record<PomodoroPhase, string> = {
  focus: "Fim do foco — hora da pausa",
  break: "Fim da pausa — dê play para focar",
};

/** Absolute box of the given size centered on a point. */
function around(center: Point, width: number, height = width): CSSProperties {
  return {
    position: "absolute",
    left: center.x - width / 2,
    top: center.y - height / 2,
    width,
    height,
  };
}

/** The half ring against the screen edge: color chambers, integration chambers, clock and "+". */
export function Drum({
  geometry: g,
  colors,
  chambers,
  openColorId,
  onOpenColor,
  integrations,
  pomodoro,
  pomodoroAlert,
  onTogglePomodoro,
  onStopPomodoro,
}: DrumProps) {
  const integrationStart = colors.length;
  const clockText = formatClock(pomodoro.remainingMs);
  const running = pomodoro.status === "running";
  const clockTitle = pomodoroAlert
    ? ALERT_TEXT[pomodoroAlert]
    : `${pomodoro.phase === "break" ? "Pausa" : "Foco"} · ${running ? "pausar" : "play"}`;
  const clockFont: CSSProperties = {
    fontFamily: "Consolas, ui-monospace, monospace",
    fontSize: g.clock.fontSize,
    lineHeight: `${g.clock.height}px`,
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="rounded-full"
        style={{
          ...around(g.center, 2 * g.outerRadius),
          boxSizing: "border-box",
          border: `${g.outerRadius - g.innerRadius}px solid ${RING}`,
          boxShadow: `0 0 0 1px ${EDGE}, inset 0 0 0 1px ${EDGE}, 0 4px 12px rgba(0,0,0,.35)`,
        }}
      />

      {colors.map((color, i) => {
        const chamber = chambers[color.id] ?? { active: false, fill: 0 };
        const label = `${color.name} · ${color.role}${chamber.active ? " · nota ativa" : ""}`;
        return (
          <button
            key={color.id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={openColorId === color.id}
            onClick={() => onOpenColor(color.id)}
            className="cursor-pointer overflow-hidden rounded-full p-0"
            style={{
              ...around(g.chambers[i]!, g.chamberSize),
              boxSizing: "border-box",
              border: `2px solid ${color.hex}`,
              // With an active note the chamber is tinted, and fills from the bottom up.
              background: chamber.active ? `${color.hex}40` : "transparent",
              boxShadow: openColorId === color.id ? "0 0 0 2px rgba(255,255,255,.55)" : undefined,
            }}
          >
            {chamber.active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 block transition-[height] duration-300"
                style={{ height: `${chamber.fill * 100}%`, background: color.hex }}
              />
            )}
          </button>
        );
      })}

      {integrations.map((chamber, i) => (
        <button
          key={chamber.id}
          type="button"
          disabled
          title={`${chamber.name} — chega na Etapa ${chamber.stage}`}
          aria-label={`${chamber.name} — chega na Etapa ${chamber.stage}`}
          className="flex cursor-not-allowed items-center justify-center rounded-full bg-transparent p-0 font-bold text-[#8D94A0]"
          style={{
            ...around(g.chambers[integrationStart + i]!, g.chamberSize),
            boxSizing: "border-box",
            border: "1.5px dashed #5A606B",
            fontSize: Math.max(9, g.chamberSize * 0.36),
          }}
        >
          {chamber.label}
        </button>
      ))}

      <div
        aria-hidden="true"
        className="rounded-full bg-[#1B1D22]"
        style={{ ...around(g.center, 2 * g.hubRadius), boxShadow: "0 0 0 1px #343840" }}
      />

      <button
        type="button"
        title={clockTitle}
        aria-label={`Pomodoro ${clockText} · ${clockTitle}`}
        onClick={onTogglePomodoro}
        className={`cursor-pointer bg-transparent p-0 text-center ${pomodoroAlert ? "clock-alert" : ""}`}
        style={around(g.clock.center, g.clock.width, g.clock.height)}
      >
        <span aria-hidden="true" className="absolute inset-0 text-white/10" style={clockFont}>
          88:88
        </span>
        <span
          className="absolute inset-0 transition-colors"
          style={{ ...clockFont, color: clockColor(pomodoro) }}
        >
          {clockText}
        </span>
      </button>

      <button
        type="button"
        disabled={pomodoro.status === "idle"}
        title="Parar pomodoro"
        aria-label="Parar pomodoro"
        onClick={onStopPomodoro}
        className="flex cursor-pointer items-center justify-center rounded-[5px] border border-[#3A3E46] bg-[#23262C] p-0 disabled:cursor-default disabled:opacity-40"
        style={around(g.stop.center, g.stop.size)}
      >
        <span className="block size-[7px] rounded-[1px]" style={{ background: STOP_MARK }} />
      </button>

      <span
        title={`${pomodoro.cycles} ciclos concluídos`}
        aria-label={`${pomodoro.cycles} ciclos concluídos`}
        className="text-left font-semibold text-[#C9CED6]"
        style={{
          ...around(g.cycles.center, g.cycles.width, g.cycles.height),
          fontSize: g.cycles.fontSize,
          lineHeight: `${g.cycles.height}px`,
        }}
      >
        ×{pomodoro.cycles}
      </span>

      <button
        type="button"
        disabled
        title="Girar o tambor — chega numa versão futura"
        aria-label="Girar o tambor (versão futura)"
        className="rounded-full bg-transparent p-0 text-[#CFD3DA]"
        style={{
          ...around(g.plus.center, g.plus.size),
          fontSize: g.plus.size * 0.8,
          lineHeight: `${g.plus.size}px`,
        }}
      >
        +
      </button>
    </>
  );
}
