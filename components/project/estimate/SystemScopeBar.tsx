"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import type { WholeSystem } from "@/lib/estimate/system-scope";

interface SystemScopeBarProps {
  projectId: string;
  itemId: string;
  system: WholeSystem;
  hourlyRate: number;
}

export function SystemScopeBar({ projectId, itemId, system, hourlyRate }: SystemScopeBarProps) {
  void hourlyRate;
  const [labor, setLabor] = useState("");
  const [material, setMaterial] = useState("");
  const [pending, startTransition] = useTransition();

  const saveLump = () => {
    const laborZl = labor.trim() === "" ? 0 : Number(labor.replace(",", "."));
    const materialZl = material.trim() === "" ? 0 : Number(material.replace(",", "."));
    if (!Number.isFinite(laborZl) || !Number.isFinite(materialZl) || laborZl < 0 || materialZl < 0) {
      toast.error("Wpisz kwotę w złotych.");
      return;
    }
    if (laborZl + materialZl <= 0) {
      toast.error("Kwota umowna nie może być zerem.");
      return;
    }
    startTransition(async () => {
      const result = await updateProjectItem(projectId, itemId, {
        quantity: 1,
        final_labor_price: laborZl,
        final_material_price: materialZl,
        labor_norm: null,
        knr_code: null,
        confidence_level: "manual",
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      notifyDataChanged("item-updated");
      toast.success("Zapisano kwotę umowną");
    });
  };

  return (
    <div
      className="mt-1.5 max-w-md rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 space-y-2 dark:border-amber-700 dark:bg-amber-950/40"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-[11px] leading-snug text-amber-950 dark:text-amber-100">
        <span className="font-semibold">{system.title}. </span>
        To cały układ, nie jedna robota z normy. Wpisz kwotę, jaką dajesz klientowi. Jednego urządzenia z normy tu nie wybierzesz — zmień nazwę na konkret i kliknij Wyceń.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[10px] text-slate-600 dark:text-slate-300">
          Robocizna zł
          <Input
            value={labor}
            onChange={(event) => setLabor(event.target.value)}
            inputMode="decimal"
            placeholder="np. 12000"
            className="mt-0.5 h-8 w-28 text-xs"
          />
        </label>
        <label className="text-[10px] text-slate-600 dark:text-slate-300">
          Materiał zł
          <Input
            value={material}
            onChange={(event) => setMaterial(event.target.value)}
            inputMode="decimal"
            placeholder="0 albo puste"
            className="mt-0.5 h-8 w-28 text-xs"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={saveLump}
          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white"
        >
          Zapisz kwotę
        </button>
        <p className="basis-full text-[10px] leading-snug text-slate-500 dark:text-slate-400">
          Puste pole materiału znaczy, że cała kwota jest robocizną. Województwo jej nie zmienia.
        </p>
      </div>
    </div>
  );
}
