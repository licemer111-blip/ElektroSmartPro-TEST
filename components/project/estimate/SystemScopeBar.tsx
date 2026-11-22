"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateProjectItem } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import type { SystemDevice, WholeSystem } from "@/lib/estimate/system-scope";

interface SystemScopeBarProps {
  projectId: string;
  itemId: string;
  system: WholeSystem;
  hourlyRate: number;
}

export function SystemScopeBar({ projectId, itemId, system, hourlyRate }: SystemScopeBarProps) {
  const [mode, setMode] = useState<"ask" | "device" | "lump">(system.devices.length > 0 ? "ask" : "lump");
  const [labor, setLabor] = useState("");
  const [material, setMaterial] = useState("");
  const [pending, startTransition] = useTransition();

  const save = (updates: Parameters<typeof updateProjectItem>[2], done: string) => {
    startTransition(async () => {
      const result = await updateProjectItem(projectId, itemId, updates);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      notifyDataChanged("item-updated");
      toast.success(done);
    });
  };

  const pickDevice = (device: SystemDevice) => {
    if (hourlyRate < 1) {
      toast.error("Najpierw ustaw stawkę rbh. Bez niej nie policzę tej godziny.");
      return;
    }
    save({
      name: device.label,
      unit: device.unit,
      labor_norm: device.hours,
      final_labor_price: Math.round(device.hours * hourlyRate * 100) / 100,
      final_material_price: 0,
      knr_code: device.code,
      confidence_level: null,
    }, `${device.label}: ${device.hours.toLocaleString("pl-PL")} rbh`);
  };

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
    save({
      quantity: 1,
      final_labor_price: laborZl,
      final_material_price: materialZl,
      labor_norm: null,
      knr_code: null,
      confidence_level: "manual",
    }, "Zapisano kwotę umowną");
  };

  return (
    <div
      className="mt-1.5 max-w-md rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 space-y-2 dark:border-amber-700 dark:bg-amber-950/40"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-[11px] leading-snug text-amber-950 dark:text-amber-100">
        <span className="font-semibold">{system.title}. </span>
        {system.hint}
      </p>

      {mode === "ask" && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("device")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium leading-tight text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            Jedno urządzenie
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("lump")}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-left text-white"
          >
            <span className="block text-xs font-semibold leading-tight">Cały układ</span>
            <span className="mt-0.5 block text-[11px] font-normal leading-tight text-blue-100">kwota umowna</span>
          </button>
        </div>
      )}

      {mode === "device" && (
        <div className="flex flex-col gap-1.5">
          {system.devices.map((device) => (
            <button
              key={device.id}
              type="button"
              disabled={pending}
              onClick={() => pickDevice(device)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium leading-tight text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {device.label}
              <span className="mt-0.5 block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {device.hours.toLocaleString("pl-PL")} rbh
              </span>
            </button>
          ))}
          <button type="button" onClick={() => setMode("lump")} className="px-3 py-1.5 text-left text-[11px] text-slate-500 underline">
            To jednak cały układ
          </button>
        </div>
      )}

      {mode === "lump" && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[10px] text-slate-600 dark:text-slate-300">
            Robocizna zł
            <Input
              value={labor}
              onChange={(event) => setLabor(event.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="mt-0.5 h-7 w-24 text-xs"
            />
          </label>
          <label className="text-[10px] text-slate-600 dark:text-slate-300">
            Materiał zł
            <Input
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              inputMode="decimal"
              placeholder="0 albo puste"
              className="mt-0.5 h-7 w-28 text-xs"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={saveLump}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white"
          >
            Zapisz
          </button>
          {system.devices.length > 0 && (
            <button type="button" onClick={() => setMode("ask")} className="h-7 px-2 text-[11px] text-slate-500 underline">
              Wróć
            </button>
          )}
          <p className="basis-full text-[10px] text-slate-500 dark:text-slate-400">
            Puste pole materiału znaczy, że cała kwota jest robocizną. Województwo tej kwoty nie zmienia. Ilość schodzi do 1.
          </p>
        </div>
      )}
    </div>
  );
}
