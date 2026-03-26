"use client";
import React from "react";
import { Zap, Pencil, Loader2, X, Wrench, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PanelSection, RailModule, DinModule } from "@/components/project/panel-configurator-types";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";
import { getModulePrice, getItemUnit, SECTION_FEED_LABELS, SECTION_TYPE_LABELS } from "../panel-configurator-helpers";
import { getKnrMetadata } from "@/lib/ai-master-brain";

export interface SummaryFinancialCardsProps {
  sections: PanelSection[];
  allModules: RailModule[];
  panelName: string;
  selectedManufacturerName: string;
  manufacturerCoeff: number;
  isPro: boolean;
  grandTotalMaterial: number;
  grandTotalLabor: number;
  manualPrices: Record<string, { mat: number; lab: number }>;
  setManualPrices: React.Dispatch<React.SetStateAction<Record<string, { mat: number; lab: number }>>>;
  pricingMode: "none" | "ai" | "manual";
  setPricingMode: React.Dispatch<React.SetStateAction<"none" | "ai" | "manual">>;
  pricingResult: PricingResult | null;
  setPricingResult: React.Dispatch<React.SetStateAction<PricingResult | null>>;
  isWycenLoading: boolean;
  isExporting: boolean;
  handleAIPricing: () => void;
  setActiveTab: (tab: string) => void;
  handleDownloadPdf: () => void;
}

function PriceInput({ value, onChange, ariaLabel, fieldId }: { value: number | undefined; onChange: (v: number) => void; ariaLabel?: string; fieldId?: string }) {
  return (
    <input id={fieldId} name={fieldId} type="number" min={0} placeholder="— zł" value={value ?? ""}
      aria-label={ariaLabel}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
  );
}

function AccessoriesSection({ sections, manufacturerCoeff, isPro }: { sections: PanelSection[]; manufacturerCoeff: number; isPro: boolean }) {
  const allAcc = sections.flatMap(s => s.accessories);
  const zugs = sections.flatMap(s => s.modules.filter(m => m.isZugBlock));
  if (allAcc.length === 0 && zugs.length === 0) return null;
  const map = new Map<string, { module: DinModule; qty: number; totalMat: number; totalLab: number; unit: string }>();
  for (const zug of zugs) {
    const p = getModulePrice(zug, manufacturerCoeff); const qty = zug.terminalCount || 15; const key = "zug-" + zug.module.id;
    const ex = map.get(key);
    if (ex) { ex.qty += qty; ex.totalMat += p.material; ex.totalLab += p.labor; }
    else map.set(key, { module: zug.module, qty, totalMat: p.material, totalLab: p.labor, unit: "szt." });
  }
  for (const m of allAcc) {
    const p = getModulePrice(m, manufacturerCoeff); const qty = m.quantity || 1; const unit = getItemUnit(m.module);
    const key = m.module.id + "-" + p.material + "-" + p.labor; const ex = map.get(key);
    if (ex) { ex.qty += qty; ex.totalMat += p.material; ex.totalLab += p.labor; }
    else map.set(key, { module: m.module, qty, totalMat: p.material, totalLab: p.labor, unit });
  }
  const grouped = Array.from(map.values());
  return (
    <>
      <div className="flex items-center gap-2 py-1.5 px-1 mt-4">
        <Wrench className="w-3.5 h-3.5 text-violet-600" />
        <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Materiały pomocnicze i Robocizna</span>
        <Badge variant="secondary" className="text-[10px] font-normal">{grouped.length} poz.</Badge>
      </div>
      {grouped.map((item, idx) => {
        const Icon = item.module.icon;
        return (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-violet-500" />
              <div><p className="text-xs font-medium">{item.module.namePl}</p><p className="text-[10px] text-slate-500">{item.qty} {item.unit}</p></div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">{isPro ? item.totalMat.toFixed(0) + " zł" : "***"}</p>
              <p className="text-[10px] text-slate-500">{isPro ? "rob. " + item.totalLab.toFixed(0) + " zł" : ""}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function SummaryFinancialCards({
  sections, allModules, panelName, selectedManufacturerName, manufacturerCoeff,
  isPro, grandTotalMaterial, grandTotalLabor, manualPrices, setManualPrices,
  pricingMode, setPricingMode, pricingResult, setPricingResult, isWycenLoading,
  isExporting, handleAIPricing, setActiveTab, handleDownloadPdf,
}: SummaryFinancialCardsProps) {
  const isDownloading = isExporting;
  const manualTotal = Object.values(manualPrices).reduce((s, p) => s + p.mat + p.lab, 0);
  const hasManualPrices = Object.keys(manualPrices).length > 0;
  const isPriced = pricingMode === "ai" && pricingResult !== null;
  const isManual = pricingMode === "manual";
  return (
    <>
      {pricingMode === "none" && (
        <div className="flex flex-col items-center py-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/30 border-2 border-slate-200 dark:border-slate-700 text-center max-w-sm w-full">
            <Zap className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Rozdzielnica gotowa do wyceny</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{allModules.length} urządzeń w {sections.length} {sections.length === 1 ? "sekcji" : "sekcjach"} — wybierz metodę:</p>
            <div className="flex flex-col gap-2">
              <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-900 font-bold gap-1.5 h-9" onClick={handleAIPricing} disabled={isWycenLoading}>
                {isWycenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Wyceń ES-Engine (KNR 2026)
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 border-slate-300 text-slate-600 dark:text-slate-400" onClick={() => setPricingMode("manual")}>
                <Pencil className="w-3.5 h-3.5" /> Wpisz ceny ręcznie
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-slate-400 text-xs" onClick={() => setActiveTab("build")}>
                <Wrench className="w-3.5 h-3.5" /> Wróć do Konstruktora
              </Button>
            </div>
          </div>
        </div>
      )}
      {isPriced && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 border-2 border-emerald-300 dark:border-emerald-700">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-emerald-600" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Wycena Ekspercka Gotowa — {isPro ? `${pricingResult.grandTotal.toFixed(0)} zł netto` : "*** zł netto"}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">ES-KNR 2026 · Pewność: {pricingResult.confidence === "high" ? "wysoka" : pricingResult.confidence === "medium" ? "średnia" : "niska"} · {allModules.length} urządzeń</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7 border-emerald-400 text-emerald-700 dark:text-emerald-400 flex-shrink-0"
            onClick={() => { setPricingResult(null); setPricingMode("none"); setManualPrices({}); }}>
            <X className="w-3 h-3" /> Wyczyść
          </Button>
        </div>
      )}
      {isManual && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-700">
          <Pencil className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Wycena ręczna</p>
            <p className="text-[11px] text-slate-500">Wpisz ceny materiałów i robocizny poniżej.</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button size="sm" className="gap-1 text-xs h-7 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold" onClick={handleAIPricing} disabled={isWycenLoading}>
              {isWycenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Wyceń ES-Engine
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7 text-slate-500" onClick={() => { setManualPrices({}); setPricingMode("none"); }}>
              <X className="w-3 h-3" /> Anuluj
            </Button>
          </div>
        </div>
      )}
      {isManual && (
        <Card id="free-spec-table">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
              Specyfikacja: {panelName || "Rozdzielnica"}
              {sections.length > 1 && <Badge variant="secondary" className="text-[10px] font-normal">{sections.length} sekcji</Badge>}
              {hasManualPrices
                ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300 ml-auto">Wycena ręczna · {manualTotal.toFixed(0)} zł</Badge>
                : <Badge variant="outline" className="text-[10px] text-slate-500 ml-auto">Wpisz ceny ręcznie lub uruchom ES-Engine</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-0.5 max-h-[45vh] overflow-y-auto pr-1">
              {sections.map((sec, secIdx) => {
                const encKey = "enc-" + secIdx; const encCur = manualPrices[encKey];
                return (
                  <div key={secIdx}>
                    {sections.length > 1 && <div className="flex items-center gap-2 py-1.5 px-1 mt-2 border-b border-slate-100 dark:border-slate-800"><span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">{sec.name}</span></div>}
                    <div className="grid grid-cols-[1fr_80px_80px] gap-1 items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border mt-1">
                      <div className="flex items-center gap-2 min-w-0"><Zap className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /><p className="text-xs font-medium truncate">Obudowa: {sec.enclosure.name}</p></div>
                      <PriceInput fieldId={`${encKey}-mat`} ariaLabel={`Materiał: obudowa sekcji ${secIdx + 1}`} value={encCur?.mat} onChange={v => { setManualPrices(prev => ({ ...prev, [encKey]: { mat: v, lab: prev[encKey]?.lab ?? 0 } })); setPricingMode("manual"); }} />
                      <PriceInput fieldId={`${encKey}-lab`} ariaLabel={`Robocizna: obudowa sekcji ${secIdx + 1}`} value={encCur?.lab} onChange={v => { setManualPrices(prev => ({ ...prev, [encKey]: { mat: prev[encKey]?.mat ?? 0, lab: v } })); setPricingMode("manual"); }} />
                    </div>
                    {sec.modules.map((m) => {
                      const mKey = "mod-" + secIdx + "-" + m.uid; const mCur = manualPrices[mKey];
                      const km = getKnrMetadata(m.module.id, m.module.category, m.module.namePl, m.module.modules);
                      const knr = m.knrCode ?? km.knrCode ?? null;
                      return (
                        <div key={m.uid} className="grid grid-cols-[1fr_80px_80px] gap-1 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{m.module.namePl}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-slate-500">{m.quantity ?? 1} szt. · {m.rating ?? m.module.defaultRating ?? "—"} A</p>
                              {knr && <span className="knr-badge" title={km.description ?? ""}>{knr}</span>}
                            </div>
                          </div>
                          <PriceInput fieldId={`${mKey}-mat`} ariaLabel={`Materiał: ${m.module.namePl}`} value={mCur?.mat} onChange={v => { setManualPrices(prev => ({ ...prev, [mKey]: { mat: v, lab: prev[mKey]?.lab ?? 0 } })); setPricingMode("manual"); }} />
                          <PriceInput fieldId={`${mKey}-lab`} ariaLabel={`Robocizna: ${m.module.namePl}`} value={mCur?.lab} onChange={v => { setManualPrices(prev => ({ ...prev, [mKey]: { mat: prev[mKey]?.mat ?? 0, lab: v } })); setPricingMode("manual"); }} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {hasManualPrices && (
              <div className="mt-3 grid grid-cols-3 gap-3 text-center px-2 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div><p className="text-[10px] text-slate-500 uppercase">Materiał</p><p className="text-sm font-bold">{Object.values(manualPrices).reduce((s, p) => s + p.mat, 0).toFixed(0)} zł</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Robocizna</p><p className="text-sm font-bold">{Object.values(manualPrices).reduce((s, p) => s + p.lab, 0).toFixed(0)} zł</p></div>
                <div><p className="text-[10px] text-emerald-600 uppercase font-bold">Razem netto</p><p className="text-lg font-bold text-emerald-600">{manualTotal.toFixed(0)} zł</p></div>
              </div>
            )}
            {hasManualPrices && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" className="gap-1 flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleDownloadPdf} disabled={isDownloading || !panelName.trim()}>
                  {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} Eksport PDF
                </Button>
                <Button size="sm" variant="outline" className="gap-1 h-8 text-xs text-slate-500" onClick={() => { setManualPrices({}); setPricingMode("none"); }}>
                  <X className="w-3.5 h-3.5" /> Wyczyść
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {pricingMode !== "none" && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              Specyfikacja: {panelName}
              {sections.length > 1 && <Badge variant="secondary" className="text-[10px] font-normal">{sections.length} sekcji</Badge>}
              <Badge className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                {selectedManufacturerName}{manufacturerCoeff !== 1.0 ? ` ×${manufacturerCoeff.toFixed(2)}` : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {sections.map((sec, secIdx) => {
                const sg = (() => {
                  const m2 = new Map<string, { module: DinModule; rating?: number; count: number; totalMat: number; totalLab: number }>();
                  for (const m of sec.modules) {
                    if (m.isZugBlock) continue;
                    const p = getModulePrice(m, manufacturerCoeff); const k = m.module.id + "-" + (m.rating||"") + "-" + p.material + "-" + p.labor;
                    const ex = m2.get(k);
                    if (ex) { ex.count++; ex.totalMat += p.material; ex.totalLab += p.labor; }
                    else m2.set(k, { module: m.module, rating: m.rating, count: 1, totalMat: p.material, totalLab: p.labor });
                  }
                  return Array.from(m2.values());
                })();
                const sMat = sec.modules.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).material, 0) + sec.enclosure.price;
                const sLab = sec.modules.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).labor, 0) + sec.enclosure.laborPrice;
                return (
                  <div key={sec.id}>
                    {sections.length > 1 && (
                      <div className="flex items-center gap-2 py-1.5 px-1 mt-2 first:mt-0">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">{sec.name}</span>
                        <span className="text-[9px] text-slate-400">{SECTION_FEED_LABELS[sec.feed]} • {SECTION_TYPE_LABELS[sec.type]}</span>
                        {isPro && <span className="ml-auto text-[10px] font-semibold text-blue-600">{(sMat + sLab).toFixed(0)} zł</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                      <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs font-medium">Obudowa — {sec.enclosure.name}</p>
                          <p className="text-[10px] text-slate-500">{sec.enclosure.modules} modułów, {sec.enclosure.rows} rzędów · <strong>{selectedManufacturerName}</strong></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{isPro ? sec.enclosure.price + " zł" : "***"}</p>
                        <p className="text-[10px] text-slate-500">{isPro ? "rob. " + sec.enclosure.laborPrice + " zł" : ""}</p>
                      </div>
                    </div>
                    {sg.map((item, idx) => {
                      const Icon = item.module.icon;
                      const km = getKnrMetadata(item.module.id, item.module.category, item.module.namePl, item.module.modules);
                      const knr = km.knrCode ?? null;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-xs font-medium">{item.module.namePl}{item.rating ? " " + item.rating + "A" : ""}</p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[10px] text-slate-500">{item.module.modules} mod. × {item.count} szt.</p>
                                {knr && <span className="knr-badge" title={km.description ?? ""}>{knr}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold">{isPro ? item.totalMat.toFixed(0) + " zł" : "***"}</p>
                            <p className="text-[10px] text-slate-500">{isPro ? "rob. " + item.totalLab.toFixed(0) + " zł" : ""}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <AccessoriesSection sections={sections} manufacturerCoeff={manufacturerCoeff} isPro={isPro} />
            </div>
          </CardContent>
        </Card>
      )}
      {pricingMode !== "none" && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4 space-y-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-[10px] text-slate-500 uppercase">Materiał</p><p className="text-sm font-bold">{isPro ? grandTotalMaterial.toFixed(0) + " zł" : "***"}</p></div>
              <div><p className="text-[10px] text-slate-500 uppercase">Robocizna</p><p className="text-sm font-bold">{isPro ? grandTotalLabor.toFixed(0) + " zł" : "***"}</p></div>
              <div><p className="text-[10px] text-blue-600 uppercase font-bold">Razem netto</p><p className="text-lg font-bold text-blue-600">{isPro ? (grandTotalMaterial + grandTotalLabor).toFixed(0) + " zł" : "*** zł"}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
