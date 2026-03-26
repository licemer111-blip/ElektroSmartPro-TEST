"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Manufacturer } from "./panel-configurator-types";
import { MANUFACTURERS, ENCLOSURE_OPTIONS } from "./rozdzielnica/din-modules-catalog";

interface PanelConfigBarProps {
  panelName: string;
  setPanelName: (v: string) => void;
  selectedManufacturer: Manufacturer;
  setSelectedManufacturer: (m: Manufacturer) => void;
  customCoefficient: number;
  setCustomCoefficient: (v: number) => void;
  selectedEnclosure: (typeof ENCLOSURE_OPTIONS)[number];
  setSelectedEnclosure: (enc: (typeof ENCLOSURE_OPTIONS)[number]) => void;
  isPro: boolean;
}

export function PanelConfigBar({
  panelName, setPanelName,
  selectedManufacturer, setSelectedManufacturer,
  customCoefficient, setCustomCoefficient,
  selectedEnclosure, setSelectedEnclosure,
  isPro,
}: PanelConfigBarProps) {
  return (
    <div className="flex-shrink-0 mb-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-start">
        <div className="space-y-1">
          <label htmlFor="panel-name" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nazwa rozdzielnicy</label>
          <Input
            id="panel-name"
            name="panel-name"
            value={panelName}
            onChange={(e) => setPanelName(e.target.value)}
            className={`h-10 text-sm font-semibold ${!panelName.trim() ? "border-red-400 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-800" : "border-slate-300 dark:border-slate-600"}`}
            placeholder="np. Rozdzielnica główna RG *"
          />
          <p className={`text-[10px] font-medium h-4 ${!panelName.trim() ? "text-red-500" : "text-transparent"}`}>
            {!panelName.trim() ? "Nazwa wymagana do wygenerowania dokumentów" : "\u00A0"}
          </p>
        </div>
        <div className="space-y-1 w-full md:w-auto md:min-w-[200px]">
          <label htmlFor="board-producer" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Producent</label>
          <div className="flex items-center gap-1.5">
            <Select name="board-producer" value={selectedManufacturer.id} onValueChange={(v) => {
              const mfr = MANUFACTURERS.find((m) => m.id === v);
              if (mfr) { setSelectedManufacturer(mfr); if (mfr.id !== "custom") setCustomCoefficient(mfr.coefficient); }
            }}>
              <SelectTrigger id="board-producer" className="h-10 text-xs font-semibold border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
                <SelectValue placeholder="Producent" />
              </SelectTrigger>
              <SelectContent>
                {MANUFACTURERS.map((mfr) => (
                  <SelectItem key={mfr.id} value={mfr.id} className="text-xs">
                    <span className="font-medium">{mfr.name}</span>
                    {mfr.country && <span className="text-slate-400 ml-1">({mfr.country})</span>}
                    <span className="text-blue-500 ml-1">×{mfr.coefficient.toFixed(2)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedManufacturer.id === "custom" && (
              <>
                <label htmlFor="panel-custom-coeff" className="sr-only">Własny współczynnik</label>
                <Input id="panel-custom-coeff" name="panel-custom-coeff" aria-label="Własny współczynnik" type="number" min={0.1} max={5} step={0.05} value={customCoefficient}
                  onChange={(e) => setCustomCoefficient(parseFloat(e.target.value) || 1)}
                  className="h-10 text-xs w-20" placeholder="×1.00" />
              </>
            )}
          </div>
          <p className="h-4">&nbsp;</p>
        </div>
        <div className="space-y-1 w-full md:w-auto md:min-w-[200px]">
          <TooltipProvider delayDuration={800}>
            <Tooltip>
              <TooltipTrigger asChild>
                <label htmlFor="board-housing" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-help">Obudowa</label>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>Rozmiar obudowy rozdzielnicy (liczba modułów DIN). Określa pojemność szyny TH35 i liczbę rzędów.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Select name="board-housing" value={String(selectedEnclosure.modules)} onValueChange={(v) => {
            const enc = ENCLOSURE_OPTIONS.find((e) => e.modules === parseInt(v));
            if (enc) setSelectedEnclosure(enc);
          }}>
            <SelectTrigger id="board-housing" className="h-10 text-xs font-semibold"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENCLOSURE_OPTIONS.map((enc) => (
                <SelectItem key={enc.modules} value={String(enc.modules)} className="text-xs">
                  {enc.name}{isPro ? ` — ${enc.price} zł` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="h-4">&nbsp;</p>
        </div>
      </div>
    </div>
  );
}
