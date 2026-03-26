"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  Load, ConductorType, InstallMethod, LOAD_TEMPLATES,
} from "../_lib/engine";

interface Props {
  loads: Load[];
  voltage: string;
  conductor: ConductorType;
  installMethod: InstallMethod;
  temperature: string;
  grouping: string;
  powerFactor: string;
  onAddLoad: () => void;
  onRemoveLoad: (id: string) => void;
  onUpdateLoad: (id: string, field: keyof Load, value: string | number) => void;
  onAddPredefined: (type: string) => void;
  onVoltageChange: (v: string) => void;
  onConductorChange: (v: ConductorType) => void;
  onInstallMethodChange: (v: InstallMethod) => void;
  onTemperatureChange: (v: string) => void;
  onGroupingChange: (v: string) => void;
  onPowerFactorChange: (v: string) => void;
}

export function LoadCalculatorForm({
  loads, voltage, conductor, installMethod, temperature, grouping, powerFactor,
  onAddLoad, onRemoveLoad, onUpdateLoad, onAddPredefined,
  onVoltageChange, onConductorChange, onInstallMethodChange,
  onTemperatureChange, onGroupingChange, onPowerFactorChange,
}: Props) {
  return (
    <Card className="border-2 shadow-xl lg:col-span-2">
      <CardHeader className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/20 border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base md:text-xl">Lista obciążeń</CardTitle>
              <CardDescription className="text-xs md:text-sm">Dodaj wszystkie odbiorniki</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={onAddPredefined}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Szablony" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOAD_TEMPLATES).map(([key, t]) => (
                  <SelectItem key={key} value={key}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onAddLoad} size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8">
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Dodaj</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 md:p-6">
        {/* Installation Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Napięcie zasilania</Label>
            <div className="flex gap-2">
              {["230", "400"].map((v) => (
                <button
                  key={v}
                  onClick={() => onVoltageChange(v)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    voltage === v
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {v === "230" ? "230V (1-faza)" : "400V (3-fazy)"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="power-factor" className="text-xs font-semibold">Współczynnik mocy cos φ</Label>
            <Input id="power-factor" name="power-factor" type="number" step="0.05" min="0.5" max="1" value={powerFactor}
              onChange={(e) => onPowerFactorChange(e.target.value)} className="h-8 text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lc-conductor" className="text-xs font-semibold">Materiał przewodnika</Label>
            <Select name="lc-conductor" value={conductor} onValueChange={(v) => onConductorChange(v as ConductorType)}>
              <SelectTrigger id="lc-conductor" className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="copper">Miedź (Cu)</SelectItem>
                <SelectItem value="aluminum">Aluminium (Al)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lc-install-method" className="text-xs font-semibold">Metoda prokladki</Label>
            <Select name="lc-install-method" value={installMethod} onValueChange={(v) => onInstallMethodChange(v as InstallMethod)}>
              <SelectTrigger id="lc-install-method" className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="B1">B1 (w rurach w ścianach)</SelectItem>
                <SelectItem value="C">C (na powietrzu)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lc-temperature" className="text-xs font-semibold">Temperatura otoczenia (°C)</Label>
            <Select name="lc-temperature" value={temperature} onValueChange={onTemperatureChange}>
              <SelectTrigger id="lc-temperature" className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25°C (k=1.03)</SelectItem>
                <SelectItem value="30">30°C (k=1.00)</SelectItem>
                <SelectItem value="35">35°C (k=0.94)</SelectItem>
                <SelectItem value="40">40°C (k=0.87)</SelectItem>
                <SelectItem value="45">45°C (k=0.79)</SelectItem>
                <SelectItem value="50">50°C (k=0.71)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lc-grouping" className="text-xs font-semibold">Grupowanie kabli</Label>
            <Select name="lc-grouping" value={grouping} onValueChange={onGroupingChange}>
              <SelectTrigger id="lc-grouping" className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 obwód (k=1.00)</SelectItem>
                <SelectItem value="2">2 obwody (k=0.80)</SelectItem>
                <SelectItem value="3">3 obwody (k=0.70)</SelectItem>
                <SelectItem value="4">4 obwody (k=0.65)</SelectItem>
                <SelectItem value="5">5 obwodów (k=0.60)</SelectItem>
                <SelectItem value="6">6 obwodów (k=0.57)</SelectItem>
                <SelectItem value="9">9 obwodów (k=0.50)</SelectItem>
                <SelectItem value="12">12+ obwodów (k=0.45)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loads Table */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Odbiorniki ({loads.length})
          </Label>
          {loads.map((load) => (
            <div key={load.id} className="p-3 md:p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3">
                <div className="md:col-span-4">
                  <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1 block">Nazwa</Label>
                  <Input id={`load-name-${load.id}`} name={`load-name-${load.id}`} aria-label={`Nazwa odbiornika`} value={load.name} onChange={(e) => onUpdateLoad(load.id, "name", e.target.value)}
                    className="text-xs md:text-sm h-8 md:h-9" placeholder="np. Lodówka" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1 block">Moc (W)</Label>
                  <Input id={`load-power-${load.id}`} name={`load-power-${load.id}`} aria-label="Moc (W)" type="number" value={load.power}
                    onChange={(e) => onUpdateLoad(load.id, "power", parseFloat(e.target.value) || 0)}
                    className="text-xs md:text-sm h-8 md:h-9" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1 block">Ilość</Label>
                  <Input id={`load-qty-${load.id}`} name={`load-qty-${load.id}`} aria-label="Ilość" type="number" value={load.quantity}
                    onChange={(e) => onUpdateLoad(load.id, "quantity", parseInt(e.target.value) || 1)}
                    className="text-xs md:text-sm h-8 md:h-9" />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mb-1 block">Jednoczesność</Label>
                  <Input id={`load-sim-${load.id}`} name={`load-sim-${load.id}`} aria-label="Jednoczesność" type="number" step="0.1" min="0" max="1" value={load.simultaneity}
                    onChange={(e) => onUpdateLoad(load.id, "simultaneity", parseFloat(e.target.value) || 1)}
                    className="text-xs md:text-sm h-8 md:h-9" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button onClick={() => onRemoveLoad(load.id)} variant="ghost" size="sm"
                    className="h-8 md:h-9 w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
                Rzeczywiste obciążenie: <strong>{(load.power * load.quantity * load.simultaneity).toFixed(0)} W</strong>
              </div>
            </div>
          ))}
          {loads.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              Brak obciążeń. Dodaj odbiorniki używając przycisku &quot;Dodaj&quot; lub wybierz z szablonów.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
