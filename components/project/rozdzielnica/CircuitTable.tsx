"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { getModuleAbbr } from "../panel-configurator-helpers";
import type { RailModule } from "../panel-configurator-types";

const CABLE_TYPES = [
  "YDY 3×1.5", "YDY 3×2.5", "YDY 3×4", "YDY 3×6", "YDY 3×10",
  "YDY 5×1.5", "YDY 5×2.5", "YDY 5×4", "YDY 5×6", "YDY 5×10",
  "YKY 3×1.5", "YKY 3×2.5", "YKY 3×4", "YKY 5×2.5", "YKY 5×4",
  "H07V-U 1.5", "H07V-U 2.5", "H07V-U 4", "H07V-U 6",
];

type CircuitRow = RailModule & { secIdx: number; secName: string };

export interface CircuitTableProps {
  rcdGroups: { rcd: CircuitRow; children: CircuitRow[] }[];
  unassigned: CircuitRow[];
  rcbos: CircuitRow[];
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
  setCircuitEditCell: (cell: { uid: string; field: "cableType" | "label" } | null) => void;
  updateModule: (uid: string, updates: Partial<RailModule>) => void;
}

function CableCell({ row, circuitEditCell, setCircuitEditCell, updateModule }: {
  row: CircuitRow;
  circuitEditCell: CircuitTableProps["circuitEditCell"];
  setCircuitEditCell: CircuitTableProps["setCircuitEditCell"];
  updateModule: CircuitTableProps["updateModule"];
}) {
  const isEditing = circuitEditCell?.uid === row.uid && circuitEditCell.field === "cableType";
  return (
    <td
      className="border border-slate-200 dark:border-slate-700 px-1 py-0.5"
      onClick={() => setCircuitEditCell({ uid: row.uid, field: "cableType" })}
    >
      {isEditing ? (
        <select
          autoFocus
          className="text-[11px] border border-blue-400 rounded px-1 h-6 bg-white dark:bg-slate-800 w-full"
          value={row.cableType || ""}
          onChange={e => { updateModule(row.uid, { cableType: e.target.value }); setCircuitEditCell(null); }}
          onBlur={() => setCircuitEditCell(null)}
        >
          <option value="">—</option>
          {CABLE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <span className={`text-[11px] ${row.cableType ? "text-emerald-600 italic" : "text-slate-300"}`}>
          {row.cableType || "—"}
        </span>
      )}
    </td>
  );
}

function LabelCell({ row, circuitEditCell, setCircuitEditCell, updateModule }: {
  row: CircuitRow;
  circuitEditCell: CircuitTableProps["circuitEditCell"];
  setCircuitEditCell: CircuitTableProps["setCircuitEditCell"];
  updateModule: CircuitTableProps["updateModule"];
}) {
  const isEditing = circuitEditCell?.uid === row.uid && circuitEditCell.field === "label";
  return (
    <td
      className="border border-slate-200 dark:border-slate-700 px-1 py-0.5"
      onClick={() => setCircuitEditCell({ uid: row.uid, field: "label" })}
    >
      {isEditing ? (
        <input
          autoFocus
          aria-label="Opis obwodu"
          className="text-[11px] border border-blue-400 rounded px-1 h-6 bg-white dark:bg-slate-800 w-full"
          defaultValue={row.label || ""}
          onBlur={e => { updateModule(row.uid, { label: e.target.value }); setCircuitEditCell(null); }}
          onKeyDown={e => {
            if (e.key === "Enter") { updateModule(row.uid, { label: e.currentTarget.value }); setCircuitEditCell(null); }
          }}
        />
      ) : (
        <span className={`text-[11px] ${row.label ? "" : "text-slate-400"}`}>
          {row.label || "brak opisu"}
        </span>
      )}
    </td>
  );
}

export const CircuitTable = React.memo(function CircuitTable({
  rcdGroups,
  unassigned,
  rcbos,
  circuitEditCell,
  setCircuitEditCell,
  updateModule,
}: CircuitTableProps) {
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
                      <CableCell row={child} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                      <LabelCell row={child} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
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
                    <CableCell row={b} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                    <LabelCell row={b} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
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
                    <CableCell row={rcbo} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                    <LabelCell row={rcbo} circuitEditCell={circuitEditCell} setCircuitEditCell={setCircuitEditCell} updateModule={updateModule} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
