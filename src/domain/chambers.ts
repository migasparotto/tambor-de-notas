/** Where notes of a color are sent when closed. */
export type Destination = "notion" | "todoist";

/** A note color: its function, its look and where its notes go. */
export interface NoteColor {
  id: string;
  name: string;
  role: string;
  hex: string;
  destination: Destination;
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
  { id: "blue", name: "Azul", role: "Glossário pessoal", hex: "#2F6FD6", destination: "notion" },
  {
    id: "red",
    name: "Vermelho",
    role: "Núcleo de estudo ativo",
    hex: "#D64545",
    destination: "notion",
  },
  { id: "green", name: "Verde", role: "Exemplo de uso", hex: "#2E9E5B", destination: "notion" },
  { id: "purple", name: "Roxo", role: "Tarefa", hex: "#8A4FD1", destination: "todoist" },
];

/** Chambers 6 to 8, after the colors. */
export const INTEGRATION_CHAMBERS: readonly IntegrationChamber[] = [
  { id: "notion", name: "Notion", label: "N", stage: 3 },
  { id: "todoist", name: "Todoist", label: "T", stage: 3 },
  { id: "ai", name: "IA", label: "IA", stage: 4 },
];
