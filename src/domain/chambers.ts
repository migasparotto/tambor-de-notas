/** A note color: its function and its look. Where its notes go comes with the Etapa 3. */
export interface NoteColor {
  id: string;
  name: string;
  role: string;
  hex: string;
}

/** A chamber reserved for an integration, enabled only in its stage. */
export interface IntegrationChamber {
  id: "notion" | "todoist" | "ai";
  name: string;
  label: string;
  stage: number;
}

/** Initial colors of chambers 2 to 5, top to bottom. */
export const INITIAL_COLORS: readonly NoteColor[] = [
  { id: "blue", name: "Azul", role: "Glossário pessoal", hex: "#2F6FD6" },
  { id: "red", name: "Vermelho", role: "Núcleo de estudo ativo", hex: "#D64545" },
  { id: "green", name: "Verde", role: "Exemplo de uso", hex: "#2E9E5B" },
  { id: "purple", name: "Roxo", role: "Tarefa", hex: "#8B50D1" },
];

/**
 * The tones a color can have: the panel text stays readable on all of them
 * (see the contrast tests).
 */
export const COLOR_PALETTE: readonly string[] = [
  "#2F6FD6",
  "#D64545",
  "#2E9E5B",
  "#8B50D1",
  "#C9832B",
  "#1E9AA8",
  "#D0529B",
  "#8C9A2F",
];

/** The tone of a note whose color is not in `cores.json`. Out of the palette, so never in use. */
export const NEUTRAL_TONE = "#7C8794";

/** The note panel is this dark base, tinted with this percentage of the note color. */
export const PANEL_BASE = "#15171B";
export const PANEL_TINT_PERCENT = 30;

/** Chambers 6 to 8, after the colors. */
export const INTEGRATION_CHAMBERS: readonly IntegrationChamber[] = [
  { id: "notion", name: "Notion", label: "N", stage: 3 },
  { id: "todoist", name: "Todoist", label: "T", stage: 3 },
  { id: "ai", name: "IA", label: "IA", stage: 4 },
];
