"use client";

import { Badge } from "@/components/ui/badge";
import { Home, Building, Factory, Boxes, Store } from "lucide-react";
import type { UserAssemblyWithItems } from "@/lib/types/database";

interface AssemblyFiltersProps {
  assemblies: UserAssemblyWithItems[];
  activeBuildingType: string;
  activeCategory: string;
  onBuildingTypeChange: (type: string) => void;
  onCategoryChange: (category: string) => void;
}

// Building Type detection based on assembly name keywords
function detectBuildingType(assemblyName: string): string {
  const name = assemblyName.toLowerCase();

  if (
    name.includes("przemysł") ||
    name.includes("przemysl") ||
    name.includes("hala") ||
    name.includes("fabryka") ||
    name.includes("zakład") ||
    name.includes("zaklad") ||
    name.includes("magazyn") ||
    name.includes("produkcja") ||
    name.includes("industrial") ||
    name.includes("400v") ||
    name.includes("3-faz")
  ) {
    return "Przemysł";
  }

  if (
    name.includes("sklep") ||
    name.includes("lokal") ||
    name.includes("usług") ||
    name.includes("uslug") ||
    name.includes("galeria") ||
    name.includes("restauracja") ||
    name.includes("kawiarnia") ||
    name.includes("salon")
  ) {
    return "Sklep";
  }

  if (
    name.includes("biuro") ||
    name.includes("biura") ||
    name.includes("office") ||
    name.includes("komercja") ||
    name.includes("komercj") ||
    name.includes("recepcja") ||
    name.includes("sala konferencyjna") ||
    name.includes("open space")
  ) {
    return "Biuro";
  }

  return "Dom";
}

// Category detection based on assembly name keywords
function detectCategory(assemblyName: string): string {
  const name = assemblyName.toLowerCase();

  if (
    name.includes("oświetlen") ||
    name.includes("oswietlen") ||
    name.includes("lampa") ||
    name.includes("oprawa") ||
    name.includes("led") ||
    name.includes("kinkiet") ||
    name.includes("sufit") ||
    name.includes("lustra")
  ) {
    return "Oświetlenie";
  }

  if (
    name.includes("rozdziel") ||
    name.includes("obwód") ||
    name.includes("obwod") ||
    name.includes("rcd") ||
    name.includes("spd") ||
    name.includes("s301") ||
    name.includes("s303") ||
    name.includes("różnicówk") ||
    name.includes("roznicowk") ||
    name.includes("ogranicznik")
  ) {
    return "Rozdzielnice";
  }

  if (
    name.includes("rj45") ||
    name.includes("internet") ||
    name.includes("skrętk") ||
    name.includes("skretk") ||
    name.includes("tv") ||
    name.includes("sat") ||
    name.includes("multimedial") ||
    name.includes("kamera") ||
    name.includes("monitoring") ||
    name.includes("rejestrator") ||
    name.includes("alarm") ||
    name.includes("czujka") ||
    name.includes("audio") ||
    name.includes("koncentryk")
  ) {
    return "Teletechnika";
  }

  if (
    name.includes("smart") ||
    name.includes("roleta") ||
    name.includes("rolety") ||
    name.includes("wifi") ||
    name.includes("wi-fi") ||
    name.includes("zigbee") ||
    name.includes("sterownik") ||
    name.includes("automatyk")
  ) {
    return "Smart Home";
  }

  if (
    name.includes("zewnętrz") ||
    name.includes("zewnetrz") ||
    name.includes("ogrod") ||
    name.includes("brama") ||
    name.includes("furtka") ||
    name.includes("wideodomofon") ||
    name.includes("ziemn") ||
    name.includes("odgrom")
  ) {
    return "Zewnętrzne";
  }

  return "Instalacje";
}

export function AssemblyFilters({
  assemblies,
  activeBuildingType,
  activeCategory,
  onBuildingTypeChange,
  onCategoryChange,
}: AssemblyFiltersProps) {
  // Building types
  const buildingTypes = [
    { id: "all", label: "Wszystkie", icon: Boxes },
    { id: "Dom", label: "Dom", icon: Home },
    { id: "Biuro", label: "Biuro", icon: Building },
    { id: "Sklep", label: "Sklep / Lokal", icon: Store },
    { id: "Przemysł", label: "Przemysł", icon: Factory },
  ];

  // Helper: get building type from DB field, fallback to keyword detection
  const getBuildingType = (a: UserAssemblyWithItems) =>
    (a as UserAssemblyWithItems & { building_type?: string | null }).building_type || detectBuildingType(a.name);

  // Filter by building type first
  const buildingFilteredAssemblies = 
    activeBuildingType === "all"
      ? assemblies
      : assemblies.filter(a => getBuildingType(a) === activeBuildingType);

  // Categorize assemblies
  const categorizedAssemblies = buildingFilteredAssemblies.reduce((acc, assembly) => {
    const category = detectCategory(assembly.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(assembly);
    return acc;
  }, {} as Record<string, UserAssemblyWithItems[]>);

  // Count assemblies per building type
  const buildingCounts = {
    all: assemblies.length,
    Dom: assemblies.filter(a => getBuildingType(a) === "Dom").length,
    Biuro: assemblies.filter(a => getBuildingType(a) === "Biuro").length,
    Sklep: assemblies.filter(a => getBuildingType(a) === "Sklep").length,
    Przemysł: assemblies.filter(a => getBuildingType(a) === "Przemysł").length,
  };

  // Count assemblies per category
  const counts = {
    all: buildingFilteredAssemblies.length,
    Instalacje: categorizedAssemblies["Instalacje"]?.length || 0,
    Oświetlenie: categorizedAssemblies["Oświetlenie"]?.length || 0,
    Rozdzielnice: categorizedAssemblies["Rozdzielnice"]?.length || 0,
    Teletechnika: categorizedAssemblies["Teletechnika"]?.length || 0,
    "Smart Home": categorizedAssemblies["Smart Home"]?.length || 0,
    Zewnętrzne: categorizedAssemblies["Zewnętrzne"]?.length || 0,
  };

  return (
    <div className="space-y-2">
      {/* Building Type + Category — compact single row each */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth pb-0.5">
        {buildingTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => {
                onBuildingTypeChange(type.id);
                onCategoryChange("all");
              }}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-[11px] transition-all whitespace-nowrap flex-shrink-0
                ${activeBuildingType === type.id 
                  ? "bg-blue-600 text-white font-medium shadow-sm" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}
              `}
            >
              <Icon className="w-3 h-3" />
              {type.id === "all" ? "Wszystkie" : type.id}
              <span className="text-[9px] opacity-75">{buildingCounts[type.id as keyof typeof buildingCounts]}</span>
            </button>
          );
        })}
      </div>

      {/* Category chips removed — building type filter is sufficient */}
    </div>
  );
}

// Export helper functions for use in other components
export { detectBuildingType, detectCategory };
