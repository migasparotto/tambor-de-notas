import { useState, type FormEvent } from "react";
import { NEUTRAL_TONE, PANEL_BASE, type NoteColor } from "../domain/chambers";
import type { ColorFields } from "../domain/colorRules";
import type { Rect } from "../domain/drum";
import type { OffDrumColor } from "../domain/notebook";

interface BackPanelProps {
  /** Where the panel appears, inside the window. */
  rect: Rect;
  /** The colors off the drum, with or without notes. */
  offDrumColors: OffDrumColor[];
  /** The palette tones a new color can use. */
  tones: string[];
  /** The color in each chamber of the front (null = empty). */
  chambers: (NoteColor | null)[];
  onOpenColor: (colorId: string) => void;
  /** Creates the color; returns why it was refused, or null. */
  onCreateColor: (fields: ColorFields, chamber: number) => string | null;
  /** Puts a color off the drum back in a chamber. */
  onPutInChamber: (colorId: string, chamber: number) => void;
  onClose: () => void;
}

const field =
  "m-0 w-full rounded border border-white/20 bg-black/30 px-2 py-1 text-[13px] text-white outline-none focus:border-white/60";
const button =
  "cursor-pointer rounded-md border-0 bg-white/15 px-3 py-1 text-[13px] font-semibold text-white hover:bg-white/25 disabled:cursor-default disabled:opacity-40";

/** The chambers of the front, to choose one; the color in it leaves the drum. */
function ChamberChoice(props: {
  chambers: (NoteColor | null)[];
  chosen: number | null;
  onChoose: (place: number) => void;
}) {
  const { chambers, chosen, onChoose } = props;
  return (
    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
      <legend className="mb-1 p-0 text-[12px] text-white/60">Toma o lugar de</legend>
      {chambers.map((color, place) => (
        <button
          key={color?.id ?? `empty-${place}`}
          type="button"
          aria-pressed={chosen === place}
          onClick={() => onChoose(place)}
          className={`${button} flex items-center gap-2 text-left font-normal ${chosen === place ? "bg-white/35" : ""}`}
        >
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full"
            style={{ background: color?.hex ?? "transparent" }}
          />
          <span className="truncate">{color?.name ?? "Câmara vazia"}</span>
        </button>
      ))}
    </fieldset>
  );
}

/** What the empty chamber opens: the colors off the drum with their notes, and a new color. */
export function BackPanel(props: BackPanelProps) {
  const { rect, offDrumColors, tones, chambers } = props;
  const [creating, setCreating] = useState(false);
  /** The color off the drum being put back in a chamber. */
  const [placing, setPlacing] = useState<NoteColor | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [hex, setHex] = useState(tones[0] ?? null);
  const [chamber, setChamber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (hex === null || chamber === null) return;
    setError(props.onCreateColor({ name, role, hex }, chamber));
  };

  return (
    <section
      aria-label="Outro lado do tambor"
      className="absolute flex flex-col gap-2 overflow-y-auto p-3"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        borderRadius: 14,
        background: PANEL_BASE,
        border: "2px solid #8D94A0",
        boxShadow: "0 6px 18px rgba(0,0,0,.45)",
      }}
    >
      <header className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] tracking-wide text-white/60 uppercase">
          {creating
            ? "Cor nova"
            : placing
              ? `Pôr ${placing.name} numa câmara`
              : "Outro lado do tambor"}
        </span>
        <button
          type="button"
          title="Fechar (Esc)"
          aria-label="Fechar o outro lado"
          onClick={props.onClose}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-white/10 p-0 text-[15px] text-white/85 hover:bg-white/20"
        >
          –
        </button>
      </header>

      {placing && (
        <ChamberChoice
          chambers={chambers}
          chosen={null}
          onChoose={(place) => props.onPutInChamber(placing.id, place)}
        />
      )}

      {!creating && !placing && (
        <>
          {offDrumColors.length === 0 ? (
            <p className="m-0 text-[13px] text-white/60">Nenhuma cor fora do tambor.</p>
          ) : (
            <ul aria-label="Cores fora do tambor" className="m-0 flex list-none flex-col gap-2 p-0">
              {offDrumColors.map(({ color, noteTitle }) => (
                <li key={color.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: color.hex }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white">
                      {color.name} · {color.role}
                    </span>
                    {/* A note's unknown color has no tone to go on the drum. */}
                    {color.hex !== NEUTRAL_TONE && (
                      <button
                        type="button"
                        title={`Pôr ${color.name} numa câmara`}
                        aria-label={`Pôr ${color.name} numa câmara`}
                        onClick={() => setPlacing(color)}
                        className={`${button} shrink-0 px-2 font-normal`}
                      >
                        ↩
                      </button>
                    )}
                  </div>
                  {noteTitle === null ? (
                    <p className="m-0 pl-5 text-[12px] text-white/60">sem notas ativas</p>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Abrir a nota de ${color.name}`}
                      onClick={() => props.onOpenColor(color.id)}
                      className={`${button} ml-5 truncate text-left font-normal`}
                    >
                      {noteTitle || "Sem título"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {tones.length === 0 ? (
            <p className="m-0 text-[13px] text-white/60">
              Todos os tons da paleta estão em uso, então não dá para criar outra cor.
            </p>
          ) : (
            <button type="button" onClick={() => setCreating(true)} className={button}>
              + Cor nova
            </button>
          )}
        </>
      )}

      {creating && (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            aria-label="Nome da cor"
            autoComplete="off"
            spellCheck={false}
            className={field}
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Função (para que serve)"
            aria-label="Função da cor"
            autoComplete="off"
            className={field}
          />
          <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
            <legend className="mb-1 p-0 text-[12px] text-white/60">Tom</legend>
            {tones.map((tone) => (
              <button
                key={tone}
                type="button"
                aria-label={`Tom ${tone}`}
                aria-pressed={hex === tone}
                onClick={() => setHex(tone)}
                className="size-6 cursor-pointer rounded-full p-0"
                style={{
                  background: tone,
                  border: hex === tone ? "2px solid white" : "2px solid transparent",
                }}
              />
            ))}
          </fieldset>
          <ChamberChoice chambers={chambers} chosen={chamber} onChoose={setChamber} />
          {error && (
            <p
              role="alert"
              className="m-0 rounded-md bg-black/35 px-2 py-1 text-[12px] text-amber-200"
            >
              {error}
            </p>
          )}
          <button type="submit" disabled={chamber === null} className={button}>
            Criar e abrir a nota
          </button>
        </form>
      )}
    </section>
  );
}
