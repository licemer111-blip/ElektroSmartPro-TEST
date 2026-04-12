"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, Building2, Percent, PiggyBank, Package, TrendingUp, ShieldAlert, Cpu } from "lucide-react";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { updateProjectNarzuty } from "@/app/dashboard/projects/[id]/actions";
import { updateProjectSafetyFactors, updateProjectV3Settings } from "@/app/dashboard/projects/[id]/_actions/project-meta";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedCallback } from "use-debounce";
import { notifyDataChanged } from "@/hooks/use-synced-action";

interface NarzutyPanelProps {
  projectId: string;
  laborTotal: number;
  materialTotal: number;
  initialKp: number;
  initialZ: number;
  initialKz: number;
  initialAuxPct?: number;
  initialCableWastePct?: number;
  // v3.0 Finance Core
  initialMatMarkup?: number;
  initialLabMarkup?: number;
  initialContingency?: number;
  initialComplexity?: number;
  isPro?: boolean;
  disabled?: boolean;
  hideHeader?: boolean;
  onSavingChange?: (saving: boolean) => void;
}

const PRESETS = [
  { label: "Brak", kp: 0, z: 0, kz: 0 },
  { label: "Minimum", kp: 60, z: 8, kz: 5 },
  { label: "Standard", kp: 70, z: 10, kz: 8 },
  { label: "Premium", kp: 75, z: 14, kz: 12 },
];

export function NarzutyPanel({
  projectId,
  laborTotal,
  materialTotal,
  initialKp,
  initialZ,
  initialKz,
  initialAuxPct = 3,
  initialCableWastePct = 5,
  initialMatMarkup = 0,
  initialLabMarkup = 0,
  initialContingency = 0,
  initialComplexity = 1.0,
  isPro = false,
  disabled = false,
  hideHeader = false,
  onSavingChange,
}: NarzutyPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [kp, setKp] = useState(initialKp);
  const [z, setZ] = useState(initialZ);
  const [kz, setKz] = useState(initialKz);
  const [auxPct, setAuxPct] = useState(initialAuxPct);
  const [cableWastePct, setCableWastePct] = useState(initialCableWastePct);
  const [matMarkup, setMatMarkup] = useState(initialMatMarkup);
  const [labMarkup, setLabMarkup] = useState(initialLabMarkup);
  const [contingency, setContingency] = useState(initialContingency);
  const [complexity, setComplexity] = useState(initialComplexity);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setKp(initialKp);
    setZ(initialZ);
    setKz(initialKz);
  }, [initialKp, initialZ, initialKz]);

  useEffect(() => {
    setAuxPct(initialAuxPct);
    setCableWastePct(initialCableWastePct);
  }, [initialAuxPct, initialCableWastePct]);

  useEffect(() => {
    setMatMarkup(initialMatMarkup);
    setLabMarkup(initialLabMarkup);
    setContingency(initialContingency);
    setComplexity(initialComplexity);
  }, [initialMatMarkup, initialLabMarkup, initialContingency, initialComplexity]);

  // Calculations per Polish narzuty system:
  // Kp = kp% × R (labor)
  // Z = z% × (R + Kp)
  // Kz = kz% × M (materials)
  const kpAmount = laborTotal * (kp / 100);
  const zAmount = (laborTotal + kpAmount) * (z / 100);
  const kzAmount = materialTotal * (kz / 100);
  const totalNarzuty = kpAmount + zAmount + kzAmount;
  const hasNarzuty = kp > 0 || z > 0 || kz > 0;

  const saveNarzuty = async (kpVal: number, zVal: number, kzVal: number) => {
    setIsSaving(true);
    onSavingChange?.(true);
    const result = await updateProjectNarzuty(projectId, {
      kp_percent: kpVal,
      z_percent: zVal,
      kz_percent: kzVal,
    });
    setIsSaving(false);
    onSavingChange?.(false);

    if (result.error) {
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    } else {
      notifyDataChanged("narzuty-update");
    }
  };

  const debouncedSave = useDebouncedCallback(saveNarzuty, 600);

  const saveFactors = async (auxVal: number, cableVal: number) => {
    setIsSaving(true);
    onSavingChange?.(true);
    const result = await updateProjectSafetyFactors(projectId, {
      aux_material_pct: auxVal,
      cable_waste_pct: cableVal,
    });
    setIsSaving(false);
    onSavingChange?.(false);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      notifyDataChanged("safety-factors-update");
    }
  };
  const debouncedSaveFactors = useDebouncedCallback(saveFactors, 600);

  const saveV3 = async (mat: number, lab: number, cont: number, comp: number) => {
    setIsSaving(true);
    onSavingChange?.(true);
    const result = await updateProjectV3Settings(projectId, {
      mat_markup_pct: mat,
      lab_markup_pct: lab,
      contingency_pct: cont,
      complexity_factor: comp,
    });
    setIsSaving(false);
    onSavingChange?.(false);
    if (result.error) {
      toast({ title: "B\u0142\u0105d", description: result.error, variant: "destructive" });
    } else {
      notifyDataChanged("v3-settings-update");
    }
  };
  const debouncedSaveV3 = useDebouncedCallback(saveV3, 600);

  const handleV3Change = (field: "mat" | "lab" | "cont" | "comp", value: string) => {
    if (disabled) return;
    const isComp = field === "comp";
    const num = isComp
      ? Math.max(0.5, Math.min(3.0, parseFloat(value) || 1.0))
      : Math.max(0, Math.min(field === "cont" ? 20 : 100, parseFloat(value) || 0));
    const newMat  = field === "mat"  ? num : matMarkup;
    const newLab  = field === "lab"  ? num : labMarkup;
    const newCont = field === "cont" ? num : contingency;
    const newComp = field === "comp" ? num : complexity;
    if (field === "mat")  setMatMarkup(num);
    if (field === "lab")  setLabMarkup(num);
    if (field === "cont") setContingency(num);
    if (field === "comp") setComplexity(num);
    debouncedSaveV3(newMat, newLab, newCont, newComp);
  };

  const COMPLEXITY_PRESETS = [
    { label: "Standard", value: 1.0, icon: "\uD83C\uDFE0" },
    { label: "Smart/KNX", value: 1.3, icon: "\uD83E\uDD16" },
    { label: "Przemys\u0142", value: 1.2, icon: "\u26A1" },
  ] as const;

  const handleFactorChange = (field: "aux" | "cable", value: string) => {
    if (disabled) return;
    const num = Math.max(0, Math.min(20, parseFloat(value) || 0));
    const newAux = field === "aux" ? num : auxPct;
    const newCable = field === "cable" ? num : cableWastePct;
    if (field === "aux") setAuxPct(num);
    if (field === "cable") setCableWastePct(num);
    debouncedSaveFactors(newAux, newCable);
  };

  const handleChange = (field: "kp" | "z" | "kz", value: string) => {
    if (disabled) {
      toast({
        title: "🔒 Projekt zablokowany",
        description: "Odblokuj projekt, aby edytować narzuty",
        variant: "destructive",
      });
      return;
    }

    const num = Math.max(0, Math.min(100, parseFloat(value) || 0));
    const newKp = field === "kp" ? num : kp;
    const newZ = field === "z" ? num : z;
    const newKz = field === "kz" ? num : kz;

    if (field === "kp") setKp(num);
    if (field === "z") setZ(num);
    if (field === "kz") setKz(num);

    debouncedSave(newKp, newZ, newKz); // debounced — waits for user to stop typing
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    if (disabled) return;
    setKp(preset.kp);
    setZ(preset.z);
    setKz(preset.kz);
    debouncedSave.cancel(); // cancel any pending debounced save
    void saveNarzuty(preset.kp, preset.z, preset.kz); // save immediately
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-2">
      {/* Toggle Header — hidden when embedded in a Card */}
      {!hideHeader && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Narzuty (Kp + Z + Kz)
            </span>
            {isSaving && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
          </div>
          <div className="flex items-center gap-2">
            {hasNarzuty && !expanded && (
              <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-300 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-700">
                <BlurredPrice value={totalNarzuty} isPro={isPro} className="text-xs" />
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            )}
          </div>
        </button>
      )}
      {/* saving indicator when header hidden */}
      {hideHeader && isSaving && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          zapisuję...
        </div>
      )}

      {(expanded || hideHeader) && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Presets — unified segmented control */}
          <div className="grid grid-cols-4 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {PRESETS.map((preset) => {
              const isActive = kp === preset.kp && z === preset.z && kz === preset.kz;
              return (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  disabled={disabled}
                  className={`py-1.5 text-[10px] font-medium transition-all text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Presets row + 3 fields in grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Kp */}
            <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/50 space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="narzut-kp" className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                  <Percent className="w-2.5 h-2.5" />
                  Kp
                </Label>
                <span className="text-[9px] text-blue-500">%R</span>
              </div>
              <Input
                id="narzut-kp"
                name="narzut-kp"
                type="number"
                aria-label="Koszty pośrednie (Kp) %"
                value={kp}
                onChange={(e) => handleChange("kp", e.target.value)}
                className="w-full h-6 text-xs text-right bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 px-1"
                min={0} max={100} step={1}
                disabled={disabled}
              />
              <div className="min-w-0 text-right">
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 block truncate">
                  <BlurredPrice value={kpAmount} isPro={isPro} className="text-[10px]" />
                </span>
              </div>
            </div>

            {/* Z */}
            <div className="p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/50 space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="narzut-z" className="text-[10px] font-semibold text-green-800 dark:text-green-300 flex items-center gap-1">
                  <PiggyBank className="w-2.5 h-2.5" />
                  Z
                </Label>
                <span className="text-[9px] text-green-500">%(R+Kp)</span>
              </div>
              <Input
                id="narzut-z"
                name="narzut-z"
                type="number"
                aria-label="Zysk (Z) %"
                value={z}
                onChange={(e) => handleChange("z", e.target.value)}
                className="w-full h-6 text-xs text-right bg-white dark:bg-slate-900 border-green-200 dark:border-green-800 px-1"
                min={0} max={100} step={1}
                disabled={disabled}
              />
              <div className="min-w-0 text-right">
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 block truncate">
                  <BlurredPrice value={zAmount} isPro={isPro} className="text-[10px]" />
                </span>
              </div>
            </div>

            {/* Kz */}
            <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="narzut-kz" className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Package className="w-2.5 h-2.5" />
                  Kz
                </Label>
                <span className="text-[9px] text-amber-500">%M</span>
              </div>
              <Input
                id="narzut-kz"
                name="narzut-kz"
                type="number"
                aria-label="Koszty zakupu (Kz) %"
                value={kz}
                onChange={(e) => handleChange("kz", e.target.value)}
                className="w-full h-6 text-xs text-right bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 px-1"
                min={0} max={100} step={1}
                disabled={disabled}
              />
              <div className="min-w-0 text-right">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 block truncate">
                  <BlurredPrice value={kzAmount} isPro={isPro} className="text-[10px]" />
                </span>
              </div>
            </div>
          </div>

          {/* Total Narzuty */}
          {hasNarzuty && (
            <div className="flex justify-between items-center pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40">
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                Suma narzutów
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                <BlurredPrice value={totalNarzuty} isPro={isPro} />
              </span>
            </div>
          )}

          {/* separator v3 */}
          <div className="border-t border-slate-200/60 dark:border-slate-700/40" />

          {/* ── v3.0: Marże + Rezerwa + Typ obiektu ── */}
          <div className="rounded-lg border border-violet-200/70 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-950/15 p-2 space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              <span className="text-[10px] font-semibold text-violet-800 dark:text-violet-300">Marże i Rezerwa (v3)</span>
            </div>

            {/* Split markups */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <Package className="w-2.5 h-2.5 text-amber-500" />
                  <Label htmlFor="mat-markup" className="text-[9px] font-medium text-violet-700 dark:text-violet-400">Narzut M</Label>
                </div>
                <div className="relative">
                  <Input
                    id="mat-markup"
                    type="number"
                    aria-label="Narzut na materia\u0142y %"
                    value={matMarkup}
                    onChange={(e) => handleV3Change("mat", e.target.value)}
                    className="h-6 text-xs text-right pr-5 bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
                    min={0} max={100} step={1}
                    disabled={disabled}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-violet-500 pointer-events-none">%</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <PiggyBank className="w-2.5 h-2.5 text-green-500" />
                  <Label htmlFor="lab-markup" className="text-[9px] font-medium text-violet-700 dark:text-violet-400">Narzut R</Label>
                </div>
                <div className="relative">
                  <Input
                    id="lab-markup"
                    type="number"
                    aria-label="Narzut na robocizn\u0119 %"
                    value={labMarkup}
                    onChange={(e) => handleV3Change("lab", e.target.value)}
                    className="h-6 text-xs text-right pr-5 bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
                    min={0} max={100} step={1}
                    disabled={disabled}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-violet-500 pointer-events-none">%</span>
                </div>
              </div>
            </div>

            {/* Rezerwa */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5 text-orange-500" />
                <Label htmlFor="contingency" className="text-[9px] font-medium text-violet-700 dark:text-violet-400">Rezerwa budżetowa</Label>
              </div>
              <div className="relative">
                <Input
                  id="contingency"
                  type="number"
                  aria-label="Rezerwa budżetowa %"
                  value={contingency}
                  onChange={(e) => handleV3Change("cont", e.target.value)}
                  className="h-6 text-xs text-right pr-5 bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
                  min={0} max={20} step={0.5}
                  disabled={disabled}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-orange-500 pointer-events-none">%</span>
              </div>
            </div>

            {/* Typ obiektu — complexity */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-violet-500" />
                <span className="text-[9px] font-medium text-violet-700 dark:text-violet-400">Typ obiektu (robocizna)</span>
              </div>
              <div className="flex gap-1">
                {COMPLEXITY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { if (!disabled) { setComplexity(preset.value); debouncedSaveV3(matMarkup, labMarkup, contingency, preset.value); } }}
                    disabled={disabled}
                    className={`flex-1 px-1 py-1 rounded text-[9px] font-medium border transition-all ${
                      Math.abs(complexity - preset.value) < 0.01
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-300"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {preset.icon} {preset.label}
                  </button>
                ))}
              </div>
              {Math.abs(complexity - 1.0) > 0.01 && (
                <div className="flex items-center justify-between mt-0.5 px-1.5 py-0.5 rounded bg-violet-100/60 dark:bg-violet-900/20">
                  <span className="text-[9px] text-violet-700 dark:text-violet-400 font-medium">
                    Robocizna &times;{complexity.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-violet-700 dark:text-violet-300">
                    +{Math.round(laborTotal * (complexity - 1.0)).toLocaleString("pl-PL")} zł
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
