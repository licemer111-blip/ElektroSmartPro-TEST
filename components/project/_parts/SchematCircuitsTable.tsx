"use client";
import React from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RailModule } from "@/components/project/panel-configurator-types";
import { getModuleAbbr } from "../panel-configurator-helpers";

const CABLE_TYPES = ["YDY 3x1.5","YDY 3x2.5","YDY 3x4","YDY 3x6","YDY 5x1.5","YDY 5x2.5","YDY 5x4","YDY 5x6","YDY 5x10","YDY 5x16","YAKY 4x16","YAKY 4x25","YAKY 4x35","YAKY 4x50","YAKY 4x70","YAKY 4x95","YAKY 4x120"];

interface RcdGroup {
  rcd: RailModule & { secIdx: number; secName: string };
  children: (RailModule & { secIdx: number; secName: string })[];
}

interface SchematCircuitsTableProps {
  rcdGroups: RcdGroup[];
  unassigned: (RailModule & { secIdx: number; secName: string })[];
  rcbos: (RailModule & { secIdx: number; secName: string })[];
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
  setCircuitEditCell: (v: { uid: string; field: "cableType" | "label" } | null) => void;
  updateModule: (uid: string, updates: Partial<RailModule>) => void;
}

export function SchematCircuitsTable({
  rcdGroups,
  unassigned,
  rcbos,
  circuitEditCell,
  setCircuitEditCell,
  updateModule,
}: SchematCircuitsTableProps) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Tabela obwodów
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-600">Nr</th>
                <th className="border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-600">Zabezpieczenie</th>
                <th className="border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-600">Prąd</th>
                <th className="border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-600">RCD</th>
                <th className="border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-600">Przewód ⌨</th>
                <th className="border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-600">Opis obwodu ⌨</th>
              </tr>
            </thead>
            <tbody>
              {rcdGroups.flatMap((g) =>
                g.children.map((child) => {
                  const r = child.rating || child.module.defaultRating || 0;
                  const rcdR = g.rcd.rating || g.rcd.module.defaultRating || 0;
                  return (
                    <tr key={child.uid} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer">
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-bold text-blue-600">{child.circuitNumber || "—"}</td>
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">{getModuleAbbr(child.module.id, child.module.name)} {child.module.namePl}</td>
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-semibold">{r}A</td>
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-green-600">RCD {rcdR}A 30mA</td>
                      <CableCell uid={child.uid} value={child.cableType} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                      <LabelCell uid={child.uid} value={child.label} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                    </tr>
                  );
                })
              )}
              {unassigned.map((b) => {
                const r = b.rating || b.module.defaultRating || 0;
                return (
                  <tr key={b.uid} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer">
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-bold text-blue-600">{b.circuitNumber || "—"}</td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">{getModuleAbbr(b.module.id, b.module.name)} {b.module.namePl}</td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-semibold">{r}A</td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-slate-400">—</td>
                    <CableCell uid={b.uid} value={b.cableType} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                    <LabelCell uid={b.uid} value={b.label} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                  </tr>
                );
              })}
              {rcbos.map((rcbo) => {
                const r = rcbo.rating || rcbo.module.defaultRating || 0;
                return (
                  <tr key={rcbo.uid} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer">
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-bold text-blue-600">{rcbo.circuitNumber || "—"}</td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">{getModuleAbbr(rcbo.module.id, rcbo.module.name)} {rcbo.module.namePl}</td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 font-semibold">{r}A</td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-green-600">wbudowane 30mA</td>
                    <CableCell uid={rcbo.uid} value={rcbo.cableType} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                    <LabelCell uid={rcbo.uid} value={rcbo.label} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CableCell({ uid, value, circuitEditCell, setCircuitEditCell, updateModule }: {
  uid: string; value?: string; circuitEditCell: SchematCircuitsTableProps["circuitEditCell"];
  setCircuitEditCell: SchematCircuitsTableProps["setCircuitEditCell"];
  updateModule: SchematCircuitsTableProps["updateModule"];
}) {
  return (
    <td className="border border-slate-200 dark:border-slate-700 px-1 py-0.5" onClick={() => setCircuitEditCell({ uid, field: "cableType" })}>
      {circuitEditCell?.uid === uid && circuitEditCell.field === "cableType" ? (
        <select autoFocus className="text-[11px] border border-blue-400 rounded px-1 h-6 bg-white dark:bg-slate-800 w-full"
          value={value || ""}
          onChange={e => { updateModule(uid, { cableType: e.target.value }); setCircuitEditCell(null); }}
          onBlur={() => setCircuitEditCell(null)}
        >
          <option value="">—</option>
          {CABLE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <span className={`text-[11px] ${value ? "text-emerald-600 italic" : "text-slate-300"}`}>{value || "—"}</span>
      )}
    </td>
  );
}

function LabelCell({ uid, value, circuitEditCell, setCircuitEditCell, updateModule }: {
  uid: string; value?: string; circuitEditCell: SchematCircuitsTableProps["circuitEditCell"];
  setCircuitEditCell: SchematCircuitsTableProps["setCircuitEditCell"];
  updateModule: SchematCircuitsTableProps["updateModule"];
}) {
  return (
    <td className="border border-slate-200 dark:border-slate-700 px-1 py-0.5" onClick={() => setCircuitEditCell({ uid, field: "label" })}>
      {circuitEditCell?.uid === uid && circuitEditCell.field === "label" ? (
        <input autoFocus aria-label="Opis obwodu" className="text-[11px] border border-blue-400 rounded px-1 h-6 bg-white dark:bg-slate-800 w-full"
          defaultValue={value || ""}
          onBlur={e => { updateModule(uid, { label: e.target.value }); setCircuitEditCell(null); }}
          onKeyDown={e => { if (e.key === "Enter") { updateModule(uid, { label: e.currentTarget.value }); setCircuitEditCell(null); } }}
        />
      ) : (
        <span className={`text-[11px] ${value ? "" : "text-slate-400"}`}>{value || "brak opisu"}</span>
      )}
    </td>
  );
}
