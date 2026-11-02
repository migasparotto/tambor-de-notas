import { useState, type FormEvent } from "react";
import { PANEL_BASE, type NoteColor } from "../domain/chambers";
import type { ColorFields } from "../domain/colorRules";
import type { Rect } from "../domain/drum";

interface BackPanelProps {
  /** Where the panel appears, inside the window. */
  rect: Rect;
  /** The colors off the drum that have an active note. */
  offDrumColors: NoteColor[];
  /** The palette tones a new color can use. */
  tones: string[];
  /** The color in each chamber of the front (null = empty). */
  chambers: (NoteColor | null)[];
  onOpenColor: (colorId: string) => void;
  /** Creates the color; returns why it was refused, or null. */
  onCreateColor: (fields: ColorFields, chamber: number) => string | null;
  onClose: () => void;
}

const field =
  "m-0 w-full rounded border border-white/20 bg-black/30 px-2 py-1 text-[13px] text-white outline-none focus:border-white/60";
const button =
  "cursor-pointer rounded-md border-0 bg-white/15 px-3 py-1 text-[13px] font-semibold text-white hover:bg-white/25 disabled:cursor-default disabled:opacity-40";

/** What the empty chamber opens: the notes of the colors off the drum, and adding a new color. */
export function BackPanel(props: BackPanelProps) {
  const { rect, offDrumColors, tones, chambers } = props;
  const [creating, setCreating] = useState(false);
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
          {creating ? "Cor nova" : "Outro lado do tambor"}
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

      {!creating && (
        <>
          {offDrumColors.length === 0 ? (
            <p className="m-0 text-[13px] text-white/60">Nenhuma nota ativa fora do tambor.</p>
          ) : (
            <ul aria-label="Notas fora do tambor" className="m-0 flex list-none flex-col gap-1 p-0">
              {offDrumColors.map((color) => (
                <li key={color.id}>
                  <button
                    type="button"
                    onClick={() => props.onOpenColor(color.id)}
                    className={`${button} flex w-full items-center gap-2 text-left font-normal`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: color.hex }}
                    />
                    <span className="truncate">
                      {color.name} · {color.role}
                    </span>
                  </button>
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
          <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
            <legend className="mb-1 p-0 text-[12px] text-white/60">Toma o lugar de</legend>
            {chambers.map((color, place) => (
              <button
                key={color?.id ?? `empty-${place}`}
                type="button"
                aria-pressed={chamber === place}
                onClick={() => setChamber(place)}
                className={`${button} flex items-center gap-2 text-left font-normal ${chamber === place ? "bg-white/35" : ""}`}
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
