"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addLineToProject, listMyProjects } from "@/app/dashboard/tools/add-to-project-action";
import { toast } from "sonner";

interface Props {
  name: string;
  unit: string;
  quantity: number;
}

export function AddLineToProject({ name, unit, quantity }: Props) {
  const [projects, setProjects] = useState<{ id: string; name: string }[] | null>(null);
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listMyProjects().then((rows) => {
      if (cancelled) return;
      setProjects(rows);
      if (rows[0]) setProjectId(rows[0].id);
    }).catch(() => setProjects([]));
    return () => { cancelled = true; };
  }, []);

  async function add() {
    if (!projectId) return;
    setBusy(true);
    const result = await addLineToProject(projectId, { name, unit, quantity });
    setBusy(false);
    if (result.error) toast.error(result.error);
    else toast.success("Pozycja dodana do projektu. Materiał uzupełnisz w kosztorysie.");
  }

  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Wstaw do kosztorysu</p>
      <p className="text-[11px] text-slate-500">{name} · {quantity} {unit}. Robocizna z normy ES, materiał = 0.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="flex-1 h-9 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects === null && <option value="">Wybierz projekt…</option>}
          {projects?.length === 0 && <option value="">Brak projektów</option>}
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Button type="button" size="sm" disabled={busy || !projectId} onClick={add}>
          {busy ? "Dodaję…" : "Dodaj"}
        </Button>
      </div>
    </div>
  );
}
