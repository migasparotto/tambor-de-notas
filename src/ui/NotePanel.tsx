import { useEffect, useState, type CSSProperties } from "react";
import type { NoteColor } from "../domain/chambers";
import type { Point, Rect } from "../domain/drum";
import { charCount } from "../domain/noteText";
import type { PanelSize } from "../domain/panel";
import { NoteEditor } from "./NoteEditor";

interface NotePanelProps {
  color: NoteColor;
  text: string;
  charLimit: number;
  /** Where the panel ends up, inside the window. */
  rect: Rect;
  /** The chamber it grows from and shrinks back into. */
  chamber: { center: Point; size: number };
  /** False: shrink back into the chamber, then call `onHidden`. */
  open: boolean;
  size: PanelSize;
  message: string | null;
  onChange: (text: string) => void;
  onConfirmTitle: () => void;
  onToggleSize: () => void;
  onCollapse: () => void;
  onCloseNote: () => void;
  onHidden: () => void;
}

const GROW_MS = 220;

const iconButton =
  "flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-white/10 p-0 text-[15px] text-white/85 hover:bg-white/20";

/** The editor "bubble": born round in the chamber, it grows beside the drum in the note color. */
export function NotePanel(props: NotePanelProps) {
  const { color, text, charLimit, rect, chamber, open, size, message } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait one frame so the browser draws the small bubble before growing it.
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const grown = mounted && open;
  const shape: CSSProperties = grown
    ? { left: rect.x, top: rect.y, width: rect.width, height: rect.height, borderRadius: 14 }
    : {
        left: chamber.center.x - chamber.size / 2,
        top: chamber.center.y - chamber.size / 2,
        width: chamber.size,
        height: chamber.size,
        borderRadius: chamber.size / 2,
      };
  const count = charCount(text);

  return (
    <section
      aria-label={`Nota ${color.name}`}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "width" && !open) props.onHidden();
      }}
      className="absolute flex flex-col overflow-hidden"
      style={{
        ...shape,
        background: `color-mix(in srgb, ${color.hex} 30%, #15171B)`,
        border: `2px solid ${color.hex}`,
        boxShadow: "0 6px 18px rgba(0,0,0,.45)",
        transition: `left ${GROW_MS}ms ease, top ${GROW_MS}ms ease, width ${GROW_MS}ms ease, height ${GROW_MS}ms ease, border-radius ${GROW_MS}ms ease`,
      }}
    >
      {grown && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          <header className="flex items-center gap-1.5">
            <span className="flex-1 truncate text-[11px] tracking-wide text-white/60 uppercase">
              {color.name} · {color.role}
            </span>
            <button
              type="button"
              title={size === "normal" ? "Expandir" : "Reduzir"}
              aria-label={size === "normal" ? "Expandir o painel" : "Reduzir o painel"}
              onClick={props.onToggleSize}
              className={iconButton}
            >
              {size === "normal" ? "⤢" : "⤡"}
            </button>
            <button
              type="button"
              title="Recolher (a nota continua ativa)"
              aria-label="Recolher o painel"
              onClick={props.onCollapse}
              className={iconButton}
            >
              –
            </button>
          </header>

          <NoteEditor text={text} onChange={props.onChange} onConfirmTitle={props.onConfirmTitle} />

          {message && (
            <p
              role="status"
              className="m-0 rounded-md bg-black/35 px-2 py-1 text-[12px] text-amber-200"
            >
              {message}
            </p>
          )}

          <footer className="flex items-center justify-between gap-2">
            <span
              title="Caracteres usados / limite da nota"
              className={`text-[12px] tabular-nums ${count > charLimit ? "text-amber-300" : "text-white/60"}`}
            >
              {count}/{charLimit}
            </span>
            <button
              type="button"
              title="Fechar a nota e arquivá-la"
              onClick={props.onCloseNote}
              className="cursor-pointer rounded-md border-0 bg-white/15 px-3 py-1 text-[13px] font-semibold text-white hover:bg-white/25"
            >
              ✓ Fechar nota
            </button>
          </footer>
        </div>
      )}
    </section>
  );
}
