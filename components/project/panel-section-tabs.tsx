"use client";
import React from "react";
import { X, Plus } from "lucide-react";
import type { PanelSection } from "./panel-configurator-types";

interface PanelSectionTabsProps {
  sections: PanelSection[];
  activeSectionIdx: number;
  setActiveSectionIdx: (idx: number) => void;
  setSelectedUid: (uid: string | null) => void;
  removeSection: (idx: number) => void;
  addSection: () => void;
}

export function PanelSectionTabs({
  sections, activeSectionIdx, setActiveSectionIdx, setSelectedUid, removeSection, addSection,
}: PanelSectionTabsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sections.map((sec, idx) => (
        <button key={sec.id}
          onClick={() => { setActiveSectionIdx(idx); setSelectedUid(null); }}
          className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            idx === activeSectionIdx
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-800"
          }`}
        >
          <span className="truncate max-w-[120px]">{sec.name}</span>
          <span className="text-[9px] text-slate-400">{sec.modules.length > 0 ? `${sec.modules.reduce((s, m) => s + m.module.modules, 0)}m` : ""}</span>
          {sections.length > 1 && (
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeSection(idx); } }}
              className="opacity-0 group-hover:opacity-100 ml-0.5 w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 flex items-center justify-center hover:bg-red-200 transition-all cursor-pointer"
            >
              <X className="w-2 h-2" />
            </span>
          )}
        </button>
      ))}
      <button onClick={() => addSection()}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-[11px] text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Sekcja
      </button>
    </div>
  );
}
