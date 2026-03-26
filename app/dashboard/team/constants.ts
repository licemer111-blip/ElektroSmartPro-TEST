export type Team = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  max_members: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: "admin" | "kierownik" | "elektryk";
  status: "pending" | "active" | "suspended";
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
};

export type TeamRole = "admin" | "kierownik" | "elektryk";

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Administrator",
  kierownik: "Kierownik",
  elektryk: "Elektryk",
};

export const TEAM_ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin: "Pełny dostęp - zarządzanie zespołem, projektami i ustawieniami",
  kierownik: "Zarządzanie projektami i członkami zespołu",
  elektryk: "Praca nad przypisanymi projektami",
};
