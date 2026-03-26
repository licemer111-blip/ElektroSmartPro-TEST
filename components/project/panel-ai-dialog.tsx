"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface PanelAiDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  aiDescription: string;
  setAiDescription: (v: string) => void;
  aiGenerating: boolean;
  handleAiGenerate: () => void;
}

const AI_EXAMPLES = [
  { label: "Kawalerka 35m² (Indukcja)", value: "Kawalerka 35m², zasilanie 1-fazowe 32A. Pomieszczenia: przedpokój, łazienka, salon z aneksem kuchennym. Sprzęt AGD: płyta indukcyjna (podłączenie 1-fazowe 3.7kW), piekarnik 2.5kW, pralka, lodówka, mikrofala. Oświetlenie i gniazda ogólne osobno. Proszę o optymalne zgrupowanie pod jedno RCD." },
  { label: "Mieszkanie 65m² (3 pokoje)", value: "Mieszkanie 65m², zasilanie 3-fazowe 16A. Pomieszczenia: salon, 2 sypialnie, kuchnia, łazienka, korytarz. Sprzęt duży: płyta indukcyjna 7.4kW (2 fazy), piekarnik, zmywarka, pralka, suszarka do ubrań bębnowa. Wymagane osobne obwody dla AGD oraz podział na co najmniej 2 RCD (osobne na łazienkę i kuchnię)." },
  { label: "Dom 150m² (Pompa Ciepła + PV)", value: "Dom jednorodzinny 150m², zasilanie 3-fazowe 40A. 12 pomieszczeń (parter + poddasze). Odbiorniki trójfazowe: pompa ciepła 9kW, płyta indukcyjna 7.4kW, falownik fotowoltaiki 6kW. Odbiorniki jednofazowe: pralka, suszarka, 2x klimatyzacja (po 2.5kW), rekuperacja, brama wjazdowa, rolety zewnętrzne. Wymagane zabezpieczenie przepięciowe T1+T2 oraz minimum 4 wyłączniki RCD." },
  { label: "Rezydencja 250m² (EV + KNX)", value: "Rezydencja 250m², zasilanie 3-fazowe 63A. Przygotowanie pod system Smart Home (rezerwa miejsca). Odbiorniki 3-fazowe: pompa ciepła 12kW, ładowarka EV 11kW w garażu, sauna elektryczna 9kW. Dużo obwodów 1-fazowych: 6x klimatyzacja, rolety, oświetlenie ogrodowe, basen z pompą filtracyjną. Pełna selektywność, RCD typu A, wymóg ogranicznika przepięć T1+T2." },
  { label: "Biuro 200m² (Serwerownia)", value: "Lokal biurowy 200m², zasilanie 3-fazowe 63A. Przestrzenie: open space dla 15 osób (wydzielone obwody gniazd komputerowych), salka konferencyjna, aneks kuchenny (zmywarka, 2x mikrofala, duży ekspres do kawy), 2 toalety, serwerownia. W serwerowni klimatyzator 3kW i szafa RACK. Wymagane oddzielne RCD typu A dla sprzętu IT." },
  { label: "Warsztat 500m² (Maszyny)", value: "Warsztat samochodowy 500m², zasilanie 3-fazowe 80A. Odbiorniki siłowe (3-fazowe): 3x podnośnik (silniki 4kW), kompresor 7kW, 4x gniazda siłowe 32A i 16A na hali. Odbiorniki 1-fazowe: oświetlenie LED hali, elektronarzędzia, nagrzewnice, biuro z zapleczem socjalnym. Wymagany główny rozłącznik izolacyjny PPOŻ na wejściu." },
];

export function PanelAiDialog({ open, onOpenChange, aiDescription, setAiDescription, aiGenerating, handleAiGenerate }: PanelAiDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
            ElektroSmart AI Engine v2.0 Pro
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 text-[9px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ES Engine v2.0
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Ekspercki System Projektowania Rozdzielnic (Zgodność z PN-HD 60364)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-200 dark:border-orange-800 p-4 animate-pulse-glow-orange">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">Możliwości silnika ES v2.0:</p>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">✓</span><span><strong>Standardy PN-HD 60364</strong> — Projektowanie zgodnie z wymogami bezpieczeństwa.</span></div>
              <div className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">✓</span><span><strong>Inteligentny Balans Faz</strong> — Automatyczna optymalizacja obciążeń L1/L2/L3.</span></div>
              <div className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">✓</span><span><strong>Wycena KNR 2026</strong> — Precyzyjne stawki materiałowe i robocizna dla 16 województw.</span></div>
              <div className="flex items-start gap-2"><span className="text-orange-500 font-bold mt-0.5">✓</span><span><strong>Tryb Współpracy (Viewer)</strong> — Konsultuj projekt z klientem w czasie rzeczywistym.</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="ai-panel-description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Opis projektu <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Podaj: <strong>typ obiektu</strong>, <strong>metraż</strong>, <strong>pomieszczenia</strong>, <strong>zasilanie</strong>, <strong>urządzenia specjalne</strong>
            </p>
            <Textarea
              id="ai-panel-description"
              name="ai-panel-description"
              aria-label="Opis projektu"
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="np. Mieszkanie 75m², 3 pokoje, kuchnia. Zasilanie 3-fazowe 25A. Urządzenia: indukcja 7.4kW, pompa ciepła 5kW, 2x klimatyzacja. Wymagana wycena dla woj. Mazowieckiego."
              className="min-h-[120px] text-sm resize-none ai-field"
              disabled={aiGenerating}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Przykłady:</p>
            <div className="flex flex-wrap gap-2">
              {AI_EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => setAiDescription(ex.value)}
                  className="ai-pill text-xs px-3 py-1.5 rounded-full border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-medium">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAiGenerate} disabled={aiGenerating || !aiDescription.trim()}
            className="w-full h-12 gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-base font-bold shadow-lg">
            {aiGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" />AI projektuje rozdzielnicę...</>
            ) : (
              <><Sparkles className="w-5 h-5" />Generuj konfigurację i kosztorys</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
