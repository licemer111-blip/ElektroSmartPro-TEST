export type ProjectTag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

// Predefined color options
export const PROJECT_COLORS = [
  { name: "Czerwony", value: "#ef4444", emoji: "🔴" },
  { name: "Pomarańczowy", value: "#f97316", emoji: "🟠" },
  { name: "Żółty", value: "#eab308", emoji: "🟡" },
  { name: "Zielony", value: "#22c55e", emoji: "🟢" },
  { name: "Niebieski", value: "#3b82f6", emoji: "🔵" },
  { name: "Fioletowy", value: "#a855f7", emoji: "🟣" },
  { name: "Szary", value: "#6b7280", emoji: "⚪" },
];
