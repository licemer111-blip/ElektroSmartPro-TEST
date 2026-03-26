"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  OBJECT_TYPE_OPTIONS,
  type ObjectTypeKey,
  type QualityStandard,
  type EstimateItem,
  type ZakresPrac,
  type ConditionalFields,
} from "@/lib/quick-estimate-config";
import {
  createQuickEstimateProject,
  generateQuickEstimateWithAI,
  getQuickEstimateUsage,
} from "@/app/dashboard/projects/quick-estimate/actions";
import { toast } from "sonner";

const OBJECT_TYPE_DEFAULTS: Record<ObjectTypeKey, { area: number; rooms: number; placeholder: string }> = {
  mieszkanie: { area: 50, rooms: 3, placeholder: "np. Mieszkanie ul. Kwiatowa" },
  dom:        { area: 130, rooms: 7, placeholder: "np. Dom Kowalskich" },
  biuro:      { area: 80, rooms: 4, placeholder: "np. Biuro ul. Marszałkowska" },
  przemysl:   { area: 500, rooms: 2, placeholder: "np. Hala magazynowa Logistex" },
  sklep:      { area: 120, rooms: 3, placeholder: "np. Sklep odzieżowy ul. Główna" },
  parking:    { area: 800, rooms: 1, placeholder: "np. Parking podziemny Centrum" },
  hotel:      { area: 600, rooms: 20, placeholder: "np. Hotel Złoty Klucz" },
  szkola:     { area: 1200, rooms: 25, placeholder: "np. Szkoła Podstawowa nr 5" },
};

export { OBJECT_TYPE_DEFAULTS };

interface UseEstimateWizardProps {
  regions: { id: string; name: string }[];
  objectTypes: { id: string; name: string; default_vat_rate: number }[];
  isPro?: boolean;
}

export function useEstimateWizard({ regions, objectTypes, isPro = false }: UseEstimateWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ObjectTypeKey | null>(null);
  const [area, setArea] = useState(50);
  const [areaInput, setAreaInput] = useState("50");
  const [rooms, setRooms] = useState(3);
  const [roomsInput, setRoomsInput] = useState("3");
  const [defaultsApplied, setDefaultsApplied] = useState<ObjectTypeKey | null>(null);
  const [projectName, setProjectName] = useState("");
  const [regionId, setRegionId] = useState(regions[0]?.id || "");
  const [standard, setStandard] = useState<QualityStandard>("standard");
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiUsed, setAiUsed] = useState<number | null>(null);
  const [aiLimit, setAiLimit] = useState<number | null>(null);
  const [wasFallback, setWasFallback] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "material" | "labor">("all");
  const [zakres, setZakres] = useState<ZakresPrac[]>(["electrical"]);
  const [conditionalFields, setConditionalFields] = useState<ConditionalFields>({});
  const [openAccordion, setOpenAccordion] = useState<string | null>("podstawowe");
  const [manualVatRate, setManualVatRate] = useState<number | null>(null);

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedType(null);
    setArea(50); setAreaInput("50");
    setRooms(3); setRoomsInput("3");
    setDefaultsApplied(null);
    setProjectName("");
    setStandard("standard");
    setItems([]);
    setWasFallback(false);
    setManualVatRate(null);
    setViewMode("all");
    setZakres(["electrical"]);
    setConditionalFields({});
    setOpenAccordion("podstawowe");
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      handleReset();
      router.replace("/dashboard/projects/quick-estimate");
    }
  }, [searchParams, handleReset, router]);

  useEffect(() => {
    getQuickEstimateUsage().then((usage) => {
      if (usage) {
        setAiUsed(usage.used);
        setAiLimit(usage.limit);
      }
    }).catch(() => {});
  }, []);

  const objectTypeMap: Record<ObjectTypeKey, string> = useMemo(() => {
    const map: Record<ObjectTypeKey, string> = {
      mieszkanie: "", dom: "", biuro: "", przemysl: "",
      sklep: "", parking: "", hotel: "", szkola: "",
    };
    for (const ot of objectTypes) {
      const lower = ot.name.toLowerCase();
      if (lower.includes("mieszkanie") || lower.includes("dom")) {
        map.mieszkanie = ot.id;
        map.dom = ot.id;
      } else if (lower.includes("biuro") || lower.includes("lokal")) {
        map.biuro = ot.id;
        map.sklep = ot.id;
      } else if (lower.includes("przemysł") || lower.includes("hala")) {
        map.przemysl = ot.id;
        map.parking = ot.id;
      }
    }
    const fallbackId = objectTypes[0]?.id || "";
    for (const key of Object.keys(map) as ObjectTypeKey[]) {
      if (!map[key]) map[key] = fallbackId;
    }
    return map;
  }, [objectTypes]);

  const vatRate = useMemo(() => {
    if (manualVatRate !== null) return manualVatRate;
    if (!selectedType) return 8;
    const dbId = objectTypeMap[selectedType];
    return objectTypes.find(ot => ot.id === dbId)?.default_vat_rate || 8;
  }, [manualVatRate, selectedType, objectTypeMap, objectTypes]);

  const totals = useMemo(() => {
    let material = 0, labor = 0;
    for (const item of items) {
      material += item.base_material_price * item.quantity;
      labor += item.base_labor_price * item.quantity;
    }
    const net = material + labor;
    const vatAmount = net * (vatRate / 100);
    return { material, labor, net, vatAmount, gross: net + vatAmount };
  }, [items, vatRate]);

  const handleGenerateItems = async () => {
    if (!selectedType) return;
    setGenerating(true);
    setWasFallback(false);
    try {
      const result = await generateQuickEstimateWithAI({
        objectType: selectedType,
        areaM2: area,
        roomCount: rooms,
        standard,
        zakres,
        conditionalFields,
      });
      if (!result.success) {
        toast.error(result.error || "Błąd generowania kosztorysu");
        return;
      }
      if (result.items) setItems(result.items);
      if (typeof result.remaining === "number" && aiLimit !== null) {
        setAiUsed(aiLimit - result.remaining);
      }
      if (result.fallback) {
        setWasFallback(true);
        toast.info("Użyto kalkulatora lokalnego (AI niedostępne)");
      } else {
        toast.success(`AI wygenerowało ${result.items?.length || 0} pozycji kosztorysu`);
      }
      setStep(3);
    } catch {
      toast.error("Błąd połączenia z AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedType) return;
    const activeItems = items.filter(i => i.quantity > 0);
    if (activeItems.length === 0) {
      toast.error("Dodaj co najmniej jedną pozycję");
      return;
    }
    setCreating(true);
    try {
      const result = await createQuickEstimateProject({
        name: projectName || `Szybka wycena - ${OBJECT_TYPE_OPTIONS.find(o => o.key === selectedType)?.label} ${area}m²`,
        regionId,
        objectTypeId: objectTypeMap[selectedType],
        vatRate,
        items: activeItems,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.projectId) {
        toast.success("Projekt utworzony! Możesz teraz dostosować pozycje.");
        router.push(`/dashboard/projects/${result.projectId}`);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setCreating(false);
    }
  };

  const updateItemQuantity = (index: number, newQty: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(0, newQty) } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);

  return {
    state: {
      step, selectedType, area, areaInput, rooms, roomsInput,
      defaultsApplied, projectName, regionId, standard, items,
      creating, generating, aiUsed, aiLimit, wasFallback,
      viewMode, zakres, conditionalFields, openAccordion, manualVatRate,
      vatRate, totals,
    },
    actions: {
      setStep, setSelectedType, setArea, setAreaInput, setRooms, setRoomsInput,
      setDefaultsApplied, setProjectName, setRegionId, setStandard, setItems,
      setCreating, setGenerating, setAiUsed, setAiLimit, setWasFallback,
      setViewMode, setZakres, setConditionalFields, setOpenAccordion, setManualVatRate,
      handleReset, handleGenerateItems, handleCreate, updateItemQuantity, removeItem,
      formatCurrency,
    },
    meta: { isPro, regions, objectTypes, OBJECT_TYPE_DEFAULTS },
  };
}
