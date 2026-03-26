"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Wrench } from "lucide-react";
import { getModulePrice, getItemUnit, SECTION_FEED_LABELS, SECTION_TYPE_LABELS } from "../panel-configurator-helpers";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import type { PanelSection, DinModule } from "../panel-configurator-types";

export interface FullSpecCardProps {
  sections: PanelSection[];
  isPro: boolean;
  manufacturerCoeff: number;
  selectedManufacturer: { name: string };
  panelName: string;
}

export const FullSpecCard = React.memo(function FullSpecCard({
  sections,
  isPro,
  manufacturerCoeff,
  selectedManufacturer,
  panelName,
}: FullSpecCardProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          Specyfikacja: {panelName}
          {sections.length > 1 && (
            <Badge variant="secondary" className="text-[10px] font-normal">{sections.length} sekcji</Badge>
          )}
          <Badge className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
            🏭 {selectedManufacturer.name}{manufacturerCoeff !== 1.0 ? ` ×${manufacturerCoeff.toFixed(2)}` : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {sections.map((sec, secIdx) => {
            const secModules = sec.modules;
            const secGrouped = (() => {
              const map = new Map<string, { module: DinModule; rating?: number; count: number; totalMat: number; totalLab: number }>();
              for (const m of secModules) {
                if (m.isZugBlock) continue;
                const p = getModulePrice(m, manufacturerCoeff);
                const key = `${m.module.id}-${m.rating || ""}-${p.material}-${p.labor}`;
                const existing = map.get(key);
                if (existing) {
                  existing.count++;
                  existing.totalMat += p.material;
                  existing.totalLab += p.labor;
                } else {
                  map.set(key, { module: m.module, rating: m.rating, count: 1, totalMat: p.material, totalLab: p.labor });
                }
              }
              return Array.from(map.values());
            })();
            const secMatCost = secModules.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).material, 0) + sec.enclosure.price;
            const secLabCost = secModules.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).labor, 0) + sec.enclosure.laborPrice;

            return (
              <div key={sec.id}>
                {sections.length > 1 && (
                  <div className="flex items-center gap-2 py-1.5 px-1 mt-2 first:mt-0">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{sec.name}</span>
                    <span className="text-[9px] text-slate-400">{SECTION_FEED_LABELS[sec.feed]} • {SECTION_TYPE_LABELS[sec.type]}</span>
                    {isPro && <span className="ml-auto text-[10px] font-semibold text-blue-600">{(secMatCost + secLabCost).toFixed(0)} zł</span>}
                  </div>
                )}

                {/* Enclosure */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium">Obudowa — {sec.enclosure.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {sec.enclosure.modules} modułów, {sec.enclosure.rows} rzędów · <strong>{selectedManufacturer.name}</strong>
                        {manufacturerCoeff !== 1.0 ? ` ×${manufacturerCoeff.toFixed(2)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{isPro ? `${sec.enclosure.price} zł` : "***"}</p>
                    <p className="text-[10px] text-slate-500">{isPro ? `rob. ${sec.enclosure.laborPrice} zł` : ""}</p>
                  </div>
                </div>

                {/* Devices */}
                {secGrouped.map((item, idx) => {
                  const Icon = item.module.icon;
                  const knrMeta = getKnrMetadata(item.module.id, item.module.category, item.module.namePl, item.module.modules);
                  const knr = knrMeta.knrCode ?? null;
                  const knrDesc = knrMeta.description ?? null;
                  const knrLab = knrMeta.laborRate > 0 ? `${knrMeta.laborRate} r-g` : null;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xs font-medium">{item.module.namePl}{item.rating ? ` ${item.rating}A` : ""}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-slate-500">{item.module.modules} mod. × {item.count} szt.</p>
                            {knr && (
                              <span className="knr-badge" title={[knrDesc, knrLab ? `Norma: ${knrLab}` : null].filter(Boolean).join(" · ")}>{knr}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{isPro ? `${item.totalMat.toFixed(0)} zł` : "***"}</p>
                        <p className="text-[10px] text-slate-500">{isPro ? `rob. ${item.totalLab.toFixed(0)} zł` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Accessories & Labor across all sections */}
          {(() => {
            const allAccessories = sections.flatMap(s => s.accessories);
            const zugBlocks = sections.flatMap(s => s.modules.filter(m => m.isZugBlock));
            if (allAccessories.length === 0 && zugBlocks.length === 0) return null;

            const accMap = new Map<string, { module: DinModule; qty: number; totalMat: number; totalLab: number; unit: string }>();
            for (const zug of zugBlocks) {
              const p = getModulePrice(zug, manufacturerCoeff);
              const qty = zug.terminalCount || 15;
              const key = `zug-${zug.module.id}`;
              const existing = accMap.get(key);
              if (existing) {
                existing.qty += qty;
                existing.totalMat += p.material;
                existing.totalLab += p.labor;
              } else {
                accMap.set(key, { module: zug.module, qty, totalMat: p.material, totalLab: p.labor, unit: "szt." });
              }
            }
            for (const m of allAccessories) {
              const p = getModulePrice(m, manufacturerCoeff);
              const qty = m.quantity || 1;
              const unit = getItemUnit(m.module);
              const key = `${m.module.id}-${p.material}-${p.labor}`;
              const existing = accMap.get(key);
              if (existing) {
                existing.qty += qty;
                existing.totalMat += p.material;
                existing.totalLab += p.labor;
              } else {
                accMap.set(key, { module: m.module, qty, totalMat: p.material, totalLab: p.labor, unit });
              }
            }
            const groupedAcc = Array.from(accMap.values());

            return (
              <>
                <div className="flex items-center gap-2 py-1.5 px-1 mt-4">
                  <Wrench className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Materiały pomocnicze i Robocizna</span>
                  <Badge variant="secondary" className="text-[10px] font-normal">{groupedAcc.length} poz.</Badge>
                </div>
                {groupedAcc.map((item, idx) => {
                  const Icon = item.module.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-violet-500" />
                        <div>
                          <p className="text-xs font-medium">{item.module.namePl}</p>
                          <p className="text-[10px] text-slate-500">{item.qty} {item.unit}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{isPro ? `${item.totalMat.toFixed(0)} zł` : "***"}</p>
                        <p className="text-[10px] text-slate-500">{isPro ? `rob. ${item.totalLab.toFixed(0)} zł` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
});
