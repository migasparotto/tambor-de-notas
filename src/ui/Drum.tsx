import type { CSSProperties } from "react";
import type { DrumGeometry, Point } from "../domain/drum";
import type { IntegrationChamber, NoteColor } from "../domain/chambers";

interface DrumProps {
  geometry: DrumGeometry;
  colors: readonly NoteColor[];
  integrations: readonly IntegrationChamber[];
  /** Text shown on the clock, in the 88:88 format. */
  clockText: string;
}

const RING = "#23262C";
const EDGE = "#3A3E46";

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
export function Drum({ geometry: g, colors, integrations, clockText }: DrumProps) {
  const integrationStart = colors.length;
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

      {colors.map((color, i) => (
        <button
          key={color.id}
          type="button"
          title={`${color.name} · ${color.role}`}
          aria-label={`${color.name} · ${color.role}`}
          className="cursor-pointer rounded-full bg-transparent p-0"
          style={{
            ...around(g.chambers[i]!, g.chamberSize),
            boxSizing: "border-box",
            border: `2px solid ${color.hex}`,
          }}
        />
      ))}

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

      <div
        role="timer"
        aria-label={`Pomodoro ${clockText}`}
        className="text-center"
        style={around(g.clock.center, g.clock.width, g.clock.height)}
      >
        <span aria-hidden="true" className="absolute inset-0 text-white/10" style={clockFont}>
          88:88
        </span>
        <span className="absolute inset-0 text-[#8A919C]" style={clockFont}>
          {clockText}
        </span>
      </div>

      <button
        type="button"
        disabled
        title="Parar pomodoro"
        aria-label="Parar pomodoro"
        className="flex items-center justify-center rounded-[5px] border border-[#3A3E46] bg-[#23262C] p-0"
        style={around(g.stop.center, g.stop.size)}
      >
        <span className="block size-[7px] rounded-[1px] bg-[#C9CED6]" />
      </button>

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
