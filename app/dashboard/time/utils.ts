export type TimeEntry = {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  is_running: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: {
    name: string;
  };
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
};

// Format minutes to human readable
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
