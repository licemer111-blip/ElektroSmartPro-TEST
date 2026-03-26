"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Sparkles, CheckCircle2, ChevronDown, ChevronUp,
  Zap, Network, ShieldAlert, Cpu, Flame,
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { QUALITY_OPTIONS, ZAKRES_OPTIONS, type ObjectTypeKey, type QualityStandard, type ZakresPrac, type ConditionalFields } from "@/lib/quick-estimate-config";
import { OBJECT_TYPE_DEFAULTS } from "./useEstimateWizard";

interface StepDetailsProps {
  selectedType: ObjectTypeKey | null;
  area: number;
  areaInput: string;
  rooms: number;
  roomsInput: string;
  projectName: string;
  regionId: string;
  standard: QualityStandard;
  zakres: ZakresPrac[];
  conditionalFields: ConditionalFields;
  openAccordion: string | null;
  generating: boolean;
  regions: { id: string; name: string }[];
  setArea: (n: number) => void;
  setAreaInput: (s: string) => void;
  setRooms: (n: number) => void;
  setRoomsInput: (s: string) => void;
  setProjectName: (s: string) => void;
  setRegionId: (s: string) => void;
  setStandard: (s: QualityStandard) => void;
  setZakres: React.Dispatch<React.SetStateAction<ZakresPrac[]>>;
  setConditionalFields: React.Dispatch<React.SetStateAction<ConditionalFields>>;
  setOpenAccordion: (id: string | null) => void;
  setStep: (s: number) => void;
  handleGenerateItems: () => Promise<void>;
}

export function StepDetails({
  selectedType, area, areaInput, rooms, roomsInput, projectName, regionId,
  standard, zakres, conditionalFields, openAccordion, generating, regions,
  setArea, setAreaInput, setRooms, setRoomsInput, setProjectName, setRegionId,
  setStandard, setZakres, setConditionalFields, setOpenAccordion,
  setStep, handleGenerateItems,
}: StepDetailsProps) {

  type AccordionSection = {
    id: string;
    title: string;
    subtitle: string;
    content: React.ReactNode;
  };

  const sections: AccordionSection[] = [
    {
      id: "podstawowe",
      title: "Podstawowe parametry",
      subtitle: `${area} m² · ${rooms} pom. · ${regions.find(r => r.id === regionId)?.name ?? "region"}`,
      content: (
        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <div className="space-y-2">
            <Label htmlFor="wizard-area">Powierzchnia (m²)</Label>
            <Input id="wizard-area" name="wizard-area" type="number" min={1} max={5000} value={areaInput}
              onChange={(e) => { setAreaInput(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setArea(n); }}
              onBlur={() => { const n = parseInt(areaInput); const v = isNaN(n) || n < 1 ? 10 : Math.min(n, 5000); setArea(v); setAreaInput(String(v)); }}
              onFocus={(e) => e.target.select()} className="text-lg font-semibold" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-rooms">Liczba pomieszczeń</Label>
            <Input id="wizard-rooms" name="wizard-rooms" type="number" min={1} max={200} value={roomsInput}
              onChange={(e) => { setRoomsInput(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setRooms(n); }}
              onBlur={() => { const n = parseInt(roomsInput); const v = isNaN(n) || n < 1 ? 1 : Math.min(n, 200); setRooms(v); setRoomsInput(String(v)); }}
              onFocus={(e) => e.target.select()} className="text-lg font-semibold" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-region">Region (województwo)</Label>
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger id="wizard-region"><SelectValue placeholder="Wybierz region" /></SelectTrigger>
              <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-project-name">Nazwa projektu (opcjonalnie)</Label>
            <div className="relative">
              <Input id="wizard-project-name" name="wizard-project-name" aria-label="Nazwa projektu" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                placeholder={selectedType ? OBJECT_TYPE_DEFAULTS[selectedType].placeholder : "np. Mieszkanie ul. Kwiatowa"}
                className="pr-10" />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <VoiceInputButton onTranscript={(text) => setProjectName(projectName ? `${projectName} ${text}` : text)} title="Podaj nazwę głosem" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "zakres",
      title: "Zakres prac",
      subtitle: zakres.map(z => ZAKRES_OPTIONS.find(o => o.key === z)?.label).filter(Boolean).join(", ") || "Wybierz zakres",
      content: (
        <div className="pt-1 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Wybierz systemy do wyceny. Każdy zakres doda odpowiednie pozycje do kosztorysu.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ZAKRES_OPTIONS.map((opt) => {
              const ZIcon = { Zap, Network, ShieldAlert, Cpu, Flame }[opt.icon] as React.ElementType ?? Zap;
              const active = zakres.includes(opt.key);
              const colorMap: Record<string, string> = {
                orange: active ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300" : "border-slate-200 dark:border-slate-700",
                blue:   active ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700",
                red:    active ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300" : "border-slate-200 dark:border-slate-700",
                purple: active ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300" : "border-slate-200 dark:border-slate-700",
                rose:   active ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300" : "border-slate-200 dark:border-slate-700",
              };
              return (
                <button key={opt.key} type="button"
                  onClick={() => setZakres(prev => prev.includes(opt.key) ? (prev.length > 1 ? prev.filter(k => k !== opt.key) : prev) : [...prev, opt.key])}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${colorMap[opt.color]}`}>
                  <ZIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  {active && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: "standard",
      title: "Standard wykonania",
      subtitle: { ekonomiczny: "Ekonomiczny", standard: "Standard", premium: "Premium" }[standard],
      content: (
        <div className="pt-1">
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {QUALITY_OPTIONS.map((opt, i) => (
              <button key={opt.key} type="button"
                onClick={() => setStandard(opt.key)}
                className={`flex-1 py-3 px-2 text-center transition-all ${
                  standard === opt.key
                    ? "bg-orange-500 text-white font-bold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                } ${i > 0 ? "border-l border-slate-200 dark:border-slate-700" : ""}`}>
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{opt.priceNote}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{QUALITY_OPTIONS.find(o => o.key === standard)?.description}</p>
        </div>
      ),
    },
    ...(selectedType ? [{
      id: "szczegoly",
      title: "Szczegóły obiektu",
      subtitle: "Opcjonalne parametry dodatkowe",
      content: (
        <div className="pt-1 space-y-4">
          {(selectedType === "mieszkanie" || selectedType === "dom") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wizard-floors">Liczba kondygnacji</Label>
                <Input id="wizard-floors" name="wizard-floors" type="number" min={1} max={10} value={conditionalFields.floors ?? 1}
                  onChange={(e) => setConditionalFields(p => ({ ...p, floors: parseInt(e.target.value) || 1 }))}
                  onFocus={(e) => e.target.select()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-finish-standard">Standard wykończenia</Label>
                <Select value={conditionalFields.finishStandard ?? "standard"}
                  onValueChange={(v) => setConditionalFields(p => ({ ...p, finishStandard: v as ConditionalFields["finishStandard"] }))}>
                  <SelectTrigger id="wizard-finish-standard"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Podstawowy (Eco)</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="luxury">Premium / Luksusowy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label id="wizard-installation-type-label">Typ instalacji</Label>
                <div role="group" aria-labelledby="wizard-installation-type-label" className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {([
                    { key: "flush" as const,   label: "Podtynkowa", hint: "W tynku / ścianie" },
                    { key: "surface" as const, label: "Natynkowa",  hint: "Na powierzchni" },
                  ]).map((opt, i) => (
                    <button key={opt.key} type="button"
                      onClick={() => setConditionalFields(p => ({ ...p, installationType: opt.key }))}
                      className={`flex-1 py-2 px-2 text-center text-xs transition-all ${
                        (conditionalFields.installationType ?? "flush") === opt.key
                          ? "bg-orange-500 text-white font-bold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      } ${i > 0 ? "border-l border-slate-200 dark:border-slate-700" : ""}`}>
                      <p className="font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(selectedType === "biuro" || selectedType === "sklep") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wizard-floorboxes">Liczba floorboxów (gniazda podłogowe)</Label>
                <Input id="wizard-floorboxes" name="wizard-floorboxes" type="number" min={0} max={500} value={conditionalFields.floorboxCount ?? 0}
                  onChange={(e) => setConditionalFields(p => ({ ...p, floorboxCount: parseInt(e.target.value) || 0 }))}
                  onFocus={(e) => e.target.select()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-lan-category">Kategoria kabla LAN</Label>
                <Select value={conditionalFields.lanCategory ?? "cat6"}
                  onValueChange={(v) => setConditionalFields(p => ({ ...p, lanCategory: v as ConditionalFields["lanCategory"] }))}>
                  <SelectTrigger id="wizard-lan-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat5e">Kat. 5e (100 Mb/s)</SelectItem>
                    <SelectItem value="cat6">Kat. 6 (1 Gb/s)</SelectItem>
                    <SelectItem value="cat6a">Kat. 6A (10 Gb/s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={conditionalFields.accessControl ?? false}
                    onChange={(e) => setConditionalFields(p => ({ ...p, accessControl: e.target.checked }))}
                    className="rounded" />
                  Kontrola dostępu (RACS) — czytniki RFID, elektrozaczepy
                </Label>
              </div>
            </div>
          )}

          {selectedType === "przemysl" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label id="wizard-ceiling-height-label">Wysokość hali / sufitu</Label>
                <div role="group" aria-labelledby="wizard-ceiling-height-label" className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {([
                    { key: "low" as const,    label: "< 3m",  hint: "KNR ×1.0" },
                    { key: "medium" as const, label: "3–6m",  hint: "KNR ×1.25" },
                    { key: "high" as const,   label: "> 6m",  hint: "KNR ×1.50" },
                  ]).map((opt, i) => (
                    <button key={opt.key} type="button"
                      onClick={() => setConditionalFields(p => ({ ...p, ceilingHeight: opt.key }))}
                      className={`flex-1 py-2 px-1 text-center text-xs transition-all ${
                        (conditionalFields.ceilingHeight ?? "low") === opt.key
                          ? "bg-orange-500 text-white font-bold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      } ${i > 0 ? "border-l border-slate-200 dark:border-slate-700" : ""}`}>
                      <p className="font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-power-kw">Moc przyłączeniowa (kW)</Label>
                <Input id="wizard-power-kw" name="wizard-power-kw" type="number" min={10} max={5000} value={conditionalFields.connectedPowerKw ?? 50}
                  onChange={(e) => setConditionalFields(p => ({ ...p, connectedPowerKw: parseFloat(e.target.value) || 50 }))}
                  onFocus={(e) => e.target.select()} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label id="wizard-cable-tray-label">Typ trasy kablowej</Label>
                <div role="group" aria-labelledby="wizard-cable-tray-label" className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {([
                    { key: "ladder" as const,     label: "Drabinka",    hint: "Ciężkie kable" },
                    { key: "mesh" as const,        label: "Siatka",      hint: "Lekkie / IT" },
                    { key: "perforated" as const,  label: "Perforowana", hint: "Uniwersalna" },
                  ]).map((opt, i) => (
                    <button key={opt.key} type="button"
                      onClick={() => setConditionalFields(p => ({ ...p, cableTrayType: opt.key }))}
                      className={`flex-1 py-2 px-1 text-center text-xs transition-all ${
                        (conditionalFields.cableTrayType ?? "perforated") === opt.key
                          ? "bg-orange-500 text-white font-bold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      } ${i > 0 ? "border-l border-slate-200 dark:border-slate-700" : ""}`}>
                      <p className="font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === "parking" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wizard-ev-chargers">Liczba ładowarek EV</Label>
                <Input id="wizard-ev-chargers" name="wizard-ev-chargers" type="number" min={0} max={200} value={conditionalFields.evChargers ?? 0}
                  onChange={(e) => setConditionalFields(p => ({ ...p, evChargers: parseInt(e.target.value) || 0 }))}
                  onFocus={(e) => e.target.select()} />
              </div>
              <div className="space-y-2 flex flex-col justify-end gap-2">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={conditionalFields.coDetection ?? true}
                    onChange={(e) => setConditionalFields(p => ({ ...p, coDetection: e.target.checked }))}
                    className="rounded" />
                  Detekcja CO/LPG (czujniki gazu)
                </Label>
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={conditionalFields.emergencyLighting ?? true}
                    onChange={(e) => setConditionalFields(p => ({ ...p, emergencyLighting: e.target.checked }))}
                    className="rounded" />
                  Oświetlenie awaryjne IP65
                </Label>
              </div>
            </div>
          )}

          {(selectedType === "hotel" || selectedType === "szkola") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wizard-ssp-complexity">Złożoność SSP (sygnalizacja pożaru)</Label>
                <Select value={conditionalFields.sspComplexity ?? "addressable"}
                  onValueChange={(v) => setConditionalFields(p => ({ ...p, sspComplexity: v as ConditionalFields["sspComplexity"] }))}>
                  <SelectTrigger id="wizard-ssp-complexity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Konwencjonalny (podstawowy)</SelectItem>
                    <SelectItem value="addressable">Adresowalny (zaawansowany)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col justify-end gap-2">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={conditionalFields.roomManagement ?? false}
                    onChange={(e) => setConditionalFields(p => ({ ...p, roomManagement: e.target.checked }))}
                    className="rounded" />
                  {selectedType === "hotel" ? "System zarządzania pokojami (RCU/KNX)" : "System zarządzania salami"}
                </Label>
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={conditionalFields.paSystem ?? false}
                    onChange={(e) => setConditionalFields(p => ({ ...p, paSystem: e.target.checked }))}
                    className="rounded" />
                  Radiowęzeł / Nagłośnienie (PA system)
                </Label>
              </div>
            </div>
          )}

          {selectedType === "biuro" && (
            <div className="space-y-2">
              <Label htmlFor="wizard-ev-chargers-office">Liczba ładowarek EV (parking biurowy)</Label>
              <Input id="wizard-ev-chargers-office" name="wizard-ev-chargers-office" type="number" min={0} max={100} value={conditionalFields.evChargers ?? 0}
                onChange={(e) => setConditionalFields(p => ({ ...p, evChargers: parseInt(e.target.value) || 0 }))}
                onFocus={(e) => e.target.select()} />
            </div>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-center">Parametry obiektu</h2>

      {sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button type="button"
            onClick={() => setOpenAccordion(openAccordion === section.id ? null : section.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="text-left">
              <p className="text-sm font-semibold">{section.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{section.subtitle}</p>
            </div>
            {openAccordion === section.id
              ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          </button>
          {openAccordion === section.id && (
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
              {section.content}
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between pt-1">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wstecz
        </Button>
        <Button onClick={handleGenerateItems} disabled={generating} className="bg-orange-500 hover:bg-orange-600 text-white">
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />ES-Engine generuje kosztorys...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generuj kosztorys</>
          )}
        </Button>
      </div>
    </div>
  );
}
