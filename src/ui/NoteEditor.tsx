import { useEffect, useRef } from "react";
import { joinTitle, splitTitle } from "../domain/noteText";

interface NoteEditorProps {
  /** The whole note text; its first line is the title. */
  text: string;
  /** Called with the new whole text on every change. */
  onChange: (text: string) => void;
  /** Called when Enter is pressed in the title. */
  onConfirmTitle: () => void;
}

/**
 * Simple note editor: a title field (the first line) and a plain text field (the rest).
 * Its contract is just `text` in and `onChange` out, so the stage 1 S4 editor can
 * replace it without touching the notes rules or the saving.
 */
export function NoteEditor({ text, onChange, onConfirmTitle }: NoteEditorProps) {
  const { title, body } = splitTitle(text);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Start in the title for a new note, or at the end of the text for an existing one.
  useEffect(() => {
    if (title === "") {
      titleRef.current?.focus();
    } else {
      const field = bodyRef.current;
      field?.focus();
      field?.setSelectionRange(field.value.length, field.value.length);
    }
    // Only when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <input
        ref={titleRef}
        value={title}
        placeholder="Título…"
        aria-label="Título"
        spellCheck
        onChange={(e) => onChange(joinTitle(e.target.value, body))}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          onConfirmTitle();
          bodyRef.current?.focus();
        }}
        className="w-full border-0 bg-transparent px-0 text-[19px] font-semibold text-white outline-none placeholder:text-white/40"
      />
      <textarea
        ref={bodyRef}
        value={body}
        placeholder={"Anote aqui…\n+texto+ numa linha vira subtítulo"}
        aria-label="Texto da nota"
        spellCheck
        onChange={(e) => onChange(joinTitle(title, e.target.value))}
        className="min-h-0 w-full flex-1 resize-none border-0 bg-transparent p-0 text-[14px] leading-relaxed text-white/90 outline-none placeholder:text-white/35"
      />
    </div>
  );
}
