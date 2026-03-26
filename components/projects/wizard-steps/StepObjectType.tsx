"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Building2, Home, Briefcase, Factory, ShoppingCart, Car, Hotel, School } from "lucide-react";
import { OBJECT_TYPE_OPTIONS, type ObjectTypeKey } from "@/lib/quick-estimate-config";
import { OBJECT_TYPE_DEFAULTS } from "./useEstimateWizard";

const ICON_MAP: Record<string, React.ReactNode> = {
  building:     <Building2 className="w-6 h-6" />,
  home:         <Home className="w-6 h-6" />,
  briefcase:    <Briefcase className="w-6 h-6" />,
  factory:      <Factory className="w-6 h-6" />,
  shoppingCart: <ShoppingCart className="w-6 h-6" />,
  car:          <Car className="w-6 h-6" />,
  hotel:        <Hotel className="w-6 h-6" />,
  school:       <School className="w-6 h-6" />,
};

interface StepObjectTypeProps {
  selectedType: ObjectTypeKey | null;
  setSelectedType: (t: ObjectTypeKey | null) => void;
  setArea: (n: number) => void;
  setAreaInput: (s: string) => void;
  setRooms: (n: number) => void;
  setRoomsInput: (s: string) => void;
  setDefaultsApplied: (t: ObjectTypeKey | null) => void;
  defaultsApplied: ObjectTypeKey | null;
  setStep: (s: number) => void;
}

export function StepObjectType({
  selectedType,
  setSelectedType,
  setArea,
  setAreaInput,
  setRooms,
  setRoomsInput,
  setDefaultsApplied,
  defaultsApplied,
  setStep,
}: StepObjectTypeProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Wybierz typ obiektu</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OBJECT_TYPE_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setSelectedType(option.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedType === option.key
                ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-md shadow-orange-500/10"
                : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedType === option.key
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {ICON_MAP[option.icon]}
              </div>
              <div>
                <p className="font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (selectedType && defaultsApplied !== selectedType) {
              const d = OBJECT_TYPE_DEFAULTS[selectedType];
              setArea(d.area);
              setAreaInput(String(d.area));
              setRooms(d.rooms);
              setRoomsInput(String(d.rooms));
              setDefaultsApplied(selectedType);
            }
            setStep(2);
          }}
          disabled={!selectedType}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Dalej
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
