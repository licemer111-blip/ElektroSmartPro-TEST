"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileDown, X, LayoutGrid } from "lucide-react";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import type { PanelSection, PricingMode } from "../panel-configurator-types";

export interface ManualPriceTableProps {
  sections: PanelSection[];
  panelName: string;
  manualPrices: Record<string, { mat: number; lab: number }>;
  setManualPrices: React.Dispatch<React.SetStateAction<Record<string, { mat: number; lab: number }>>>;
  setPricingMode: (mode: PricingMode) => void;
  isDownloading: boolean;
  handleDownloadPdf: () => void;
}

export const ManualPriceTable = React.memo(function ManualPriceTable({
  sections,
  panelName,
  manualPrices,
  setManualPrices,
  setPricingMode,
  isDownloading,
  handleDownloadPdf,
}: ManualPriceTableProps) {
  const manualTotal = Object.values(manualPrices).reduce((s, p) => s + p.mat + p.lab, 0);
  const hasManualPrices = Object.keys(manualPrices).length > 0;

  const setPrice = (key: string, field: "mat" | "lab", value: number) => {
    setManualPrices(prev => ({
      ...prev,
      [key]: {
        mat: field === "mat" ? value : (prev[key]?.mat ?? 0),
        lab: field === "lab" ? value : (prev[key]?.lab ?? 0),
      },
    }));
    setPricingMode("manual");
  };

  return (
    <Card id="free-spec-table">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Specyfikacja: {panelName || "Rozdzielnica"}
          {sections.length > 1 && (
            <Badge variant="secondary" className="text-[10px] font-normal">{sections.length} sekcji</Badge>
          )}
          {hasManualPrices
            ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300 ml-auto">Wycena ręczna · {manualTotal.toFixed(0)} zł</Badge>
            : <Badge variant="outline" className="text-[10px] text-slate-500 ml-auto">Wpisz ceny ręcznie lub uruchom AI</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-[1fr_80px_80px] gap-1 px-2 pb-1 border-b border-slate-100 dark:border-slate-800 mb-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Pozycja</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-right">Materiał</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-right">Robocizna</span>
        </div>

        <div className="space-y-0.5 max-h-[45vh] overflow-y-auto pr-1">
          {sections.map((sec, secIdx) => (
            <div key={secIdx}>
              {sections.length > 1 && (
                <div className="flex items-center gap-2 py-1.5 px-1 mt-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{sec.name}</span>
                </div>
              )}

              {/* Enclosure row */}
              <div className="grid grid-cols-[1fr_80px_80px] gap-1 items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border mt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <p className="text-xs font-medium truncate">Obudowa: {sec.enclosure.name}</p>
                </div>
                <input
                  id={`enc-${secIdx}-mat`} name={`enc-${secIdx}-mat`} aria-label="Cena materiału obudowy"
                  type="number" min={0} placeholder="— zł"
                  value={manualPrices[`enc-${secIdx}`]?.mat ?? ""}
                  onChange={(e) => setPrice(`enc-${secIdx}`, "mat", parseFloat(e.target.value) || 0)}
                  className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  id={`enc-${secIdx}-lab`} name={`enc-${secIdx}-lab`} aria-label="Cena robocizny obudowy"
                  type="number" min={0} placeholder="— zł"
                  value={manualPrices[`enc-${secIdx}`]?.lab ?? ""}
                  onChange={(e) => setPrice(`enc-${secIdx}`, "lab", parseFloat(e.target.value) || 0)}
                  className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* Module rows */}
              {sec.modules.map((m) => {
                const key = `mod-${secIdx}-${m.uid}`;
                const knrMeta = getKnrMetadata(m.module.id, m.module.category, m.module.namePl, m.module.modules);
                const knr: string | null = m.knrCode ?? knrMeta.knrCode ?? null;
                const knrDesc = knrMeta.description ?? null;
                const knrLab = knrMeta.laborRate > 0 ? `${knrMeta.laborRate} r-g` : null;
                return (
                  <div key={key} className="grid grid-cols-[1fr_80px_80px] gap-1 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.module.namePl}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500">{m.quantity ?? 1} szt. · {m.rating ?? m.module.defaultRating ?? "—"} A</p>
                        {knr && (
                          <span className="knr-badge" title={[knrDesc, knrLab ? `Norma: ${knrLab}` : null].filter(Boolean).join(" · ")}>{knr}</span>
                        )}
                      </div>
                    </div>
                    <input
                      id={`${key}-mat`} name={`${key}-mat`} aria-label={`Cena materiału: ${m.module.namePl}`}
                      type="number" min={0} placeholder="— zł"
                      value={manualPrices[key]?.mat ?? ""}
                      onChange={(e) => setPrice(key, "mat", parseFloat(e.target.value) || 0)}
                      className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      id={`${key}-lab`} name={`${key}-lab`} aria-label={`Cena robocizny: ${m.module.namePl}`}
                      type="number" min={0} placeholder="— zł"
                      value={manualPrices[key]?.lab ?? ""}
                      onChange={(e) => setPrice(key, "lab", parseFloat(e.target.value) || 0)}
                      className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                );
              })}

              {/* Accessories rows */}
              {sec.accessories.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-1 px-1 mt-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Materiały pomocnicze i robocizna</span>
                    <Badge variant="secondary" className="text-[9px]">{sec.accessories.length}</Badge>
                  </div>
                  {sec.accessories.map((a) => {
                    const key = `acc-${secIdx}-${a.uid}`;
                    const knrMeta = getKnrMetadata(a.module.id, a.module.category, a.module.namePl, a.module.modules);
                    const knr: string | null = a.knrCode ?? knrMeta.knrCode ?? null;
                    const knrDesc = knrMeta.description ?? null;
                    const knrLab = knrMeta.laborRate > 0 ? `${knrMeta.laborRate} r-g` : null;
                    return (
                      <div key={key} className="grid grid-cols-[1fr_80px_80px] gap-1 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-slate-600 dark:text-slate-400">{a.module.namePl}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500">{a.quantity ?? 1} {a.module.category === "labor" ? "usł." : "szt."}</p>
                            {knr && (
                              <span className="knr-badge" title={[knrDesc, knrLab ? `Norma: ${knrLab}` : null].filter(Boolean).join(" · ")}>{knr}</span>
                            )}
                          </div>
                        </div>
                        <input
                          id={`${key}-mat`} name={`${key}-mat`} aria-label={`Cena materiału: ${a.module.namePl}`}
                          type="number" min={0} placeholder="— zł"
                          value={manualPrices[key]?.mat ?? ""}
                          onChange={(e) => setPrice(key, "mat", parseFloat(e.target.value) || 0)}
                          className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <input
                          id={`${key}-lab`} name={`${key}-lab`} aria-label={`Cena robocizny: ${a.module.namePl}`}
                          type="number" min={0} placeholder="— zł"
                          value={manualPrices[key]?.lab ?? ""}
                          onChange={(e) => setPrice(key, "lab", parseFloat(e.target.value) || 0)}
                          className="w-full text-right text-xs h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ))}
        </div>

        {hasManualPrices && (
          <div className="mt-3 grid grid-cols-3 gap-3 text-center px-2 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Materiał</p>
              <p className="text-sm font-bold">{Object.values(manualPrices).reduce((s, p) => s + p.mat, 0).toFixed(0)} zł</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Robocizna</p>
              <p className="text-sm font-bold">{Object.values(manualPrices).reduce((s, p) => s + p.lab, 0).toFixed(0)} zł</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 uppercase font-bold">Razem netto</p>
              <p className="text-lg font-bold text-emerald-600">{manualTotal.toFixed(0)} zł</p>
            </div>
          </div>
        )}

        {hasManualPrices && (
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              className="gap-1 flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDownloadPdf}
              disabled={isDownloading || !panelName.trim()}
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Eksport PDF (wycena ręczna)
            </Button>
            <Button
              size="sm" variant="outline"
              className="gap-1 h-8 text-xs text-slate-500"
              onClick={() => { setManualPrices({}); setPricingMode("none"); }}
            >
              <X className="w-3.5 h-3.5" /> Wyczyść ceny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
