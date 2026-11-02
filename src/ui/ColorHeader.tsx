import { useState, type FormEvent } from "react";
import { NEUTRAL_TONE, type NoteColor } from "../domain/chambers";
import type { ColorFields } from "../domain/colorRules";

interface ColorHeaderProps {
  color: NoteColor;
  /** The palette tones this color can use, its own included. */
  tones: string[];
  /** Changes the color; returns why it was refused, or null. */
  onEdit: (changes: Partial<ColorFields>) => string | null;
  /** The edit ended: the keyboard goes back to the note. */
  onDone: () => void;
}

const field =
  "m-0 w-full rounded border border-white/20 bg-black/30 px-2 py-1 text-[12px] text-white outline-none focus:border-white/60";

/** The label of the note: the circle changes the color's tone, the text its name and role. */
export function ColorHeader({ color, tones, onEdit, onDone }: ColorHeaderProps) {
  const [mode, setMode] = useState<"text" | "tone" | null>(null);
  const [name, setName] = useState(color.name);
  const [role, setRole] = useState(color.role);
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    setMode(null);
    setError(null);
    onDone();
  };
  const apply = (changes: Partial<ColorFields>) => {
    const problem = onEdit(changes);
    if (problem === null) finish();
    else setError(problem);
  };
  const toggle = (next: "text" | "tone") => {
    setName(color.name);
    setRole(color.role);
    setError(null);
    setMode(mode === next ? null : next);
  };
  const saveText = (e?: FormEvent) => {
    e?.preventDefault();
    apply({ name, role });
  };
  const label = color.role || color.name;

  // A note's unknown color is not in `cores.json`, so there is nothing to edit.
  if (color.hex === NEUTRAL_TONE) {
    return (
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] tracking-wide text-white/60 uppercase">
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full"
          style={{ background: color.hex }}
        />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <div
      // Esc here cancels the edit, instead of collapsing the note.
      data-own-escape={mode !== null ? "" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && mode !== null) {
          e.stopPropagation();
          finish();
        }
      }}
      className="flex min-w-0 flex-1 flex-col gap-1.5"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          title="Trocar o tom da cor"
          aria-label="Trocar o tom da cor"
          aria-expanded={mode === "tone"}
          onClick={() => toggle("tone")}
          className="size-3.5 shrink-0 cursor-pointer rounded-full border border-white/40 p-0"
          style={{ background: color.hex }}
        />
        <button
          type="button"
          title={`${color.name} · ${color.role} (clique para editar o nome e a função)`}
          aria-label="Editar o nome e a função da cor"
          aria-expanded={mode === "text"}
          onClick={() => toggle("text")}
          className="min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-[11px] tracking-wide text-white/60 uppercase hover:text-white/90"
        >
          {label}
        </button>
      </div>

      {mode === "text" && (
        <form
          onSubmit={saveText}
          onBlur={(e) => {
            // Leaving the form saves; going from one field to the other does not.
            if (!e.currentTarget.contains(e.relatedTarget)) saveText();
          }}
          className="flex flex-col gap-1"
        >
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
          {/* Without a submit button, Enter in a form with two fields would do nothing. */}
          <button type="submit" hidden />
        </form>
      )}

      {mode === "tone" && (
        <div role="group" aria-label="Tons livres" className="flex flex-wrap gap-1.5">
          {tones.map((tone) => (
            <button
              key={tone}
              type="button"
              aria-label={`Tom ${tone}`}
              aria-pressed={tone === color.hex}
              onClick={() => apply({ hex: tone })}
              className="size-6 cursor-pointer rounded-full p-0"
              style={{
                background: tone,
                border: tone === color.hex ? "2px solid white" : "2px solid transparent",
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="m-0 rounded-md bg-black/35 px-2 py-1 text-[12px] text-amber-200">
          {error}
        </p>
      )}
    </div>
  );
}
