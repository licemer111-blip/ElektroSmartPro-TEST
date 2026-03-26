"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type PDFTemplateName = "klasyczny" | "elegancki" | "nowoczesny" | "korporacyjny" | "premium";

interface PDFTemplate {
  id: PDFTemplateName;
  name: string;
  subtitle: string;
  // Inline style colors for the realistic A4 preview (hex values)
  primary: string;
  primaryLight: string;
  tableHeaderBg: string;
  divider: string;
  summaryBg: string;
  summaryBorder: string;
  // 4 distinct accent colors for left-border swatches
  accentSet: string;
  accentSingle: string;
  accentMat: string;
  accentLab: string;
}

const PDF_TEMPLATES: PDFTemplate[] = [
  {
    id: "klasyczny",
    name: "Klasyczny",
    subtitle: "Niebieski biznesowy",
    primary: "#2563eb",
    primaryLight: "#dbeafe",
    tableHeaderBg: "#dbeafe",
    divider: "#2563eb",
    summaryBg: "#f0f9ff",
    summaryBorder: "#bae6fd",
    accentSet: "#ea580c",
    accentSingle: "#2563eb",
    accentMat: "#ca8a04",
    accentLab: "#059669",
  },
  {
    id: "elegancki",
    name: "Elegancki",
    subtitle: "Granat ze złotem",
    primary: "#1e293b",
    primaryLight: "#f1f5f9",
    tableHeaderBg: "#f1f5f9",
    divider: "#1e293b",
    summaryBg: "#fffbeb",
    summaryBorder: "#c4aa69",
    accentSet: "#bf9b30",
    accentSingle: "#3364a4",
    accentMat: "#900c3f",
    accentLab: "#167846",
  },
  {
    id: "nowoczesny",
    name: "Nowoczesny",
    subtitle: "Morski minimalizm",
    primary: "#0d9488",
    primaryLight: "#ccfbf1",
    tableHeaderBg: "#ccfbf1",
    divider: "#0d9488",
    summaryBg: "#f0fdfa",
    summaryBorder: "#99f6e4",
    accentSet: "#ef4444",
    accentSingle: "#0d9488",
    accentMat: "#4f46e5",
    accentLab: "#65a30d",
  },
  {
    id: "korporacyjny",
    name: "Korporacyjny",
    subtitle: "Antracyt z czerwienią",
    primary: "#374151",
    primaryLight: "#f3f4f6",
    tableHeaderBg: "#f3f4f6",
    divider: "#374151",
    summaryBg: "#fef2f2",
    summaryBorder: "#fca5a5",
    accentSet: "#dc2626",
    accentSingle: "#64748b",
    accentMat: "#b45309",
    accentLab: "#115e59",
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "Fiolet luksusowy",
    primary: "#6d28d9",
    primaryLight: "#ede9fe",
    tableHeaderBg: "#ede9fe",
    divider: "#6d28d9",
    summaryBg: "#f5f3ff",
    summaryBorder: "#c4b5fd",
    accentSet: "#db2777",
    accentSingle: "#7c3aed",
    accentMat: "#059669",
    accentLab: "#4338ca",
  },
];

const STORAGE_KEY = "elektrosmart-pdf-template";

// Shared mini table rows for all previews
const PREVIEW_ROWS = [
  { type: "section" },
  { type: "set" },
  { type: "mat" },
  { type: "lab" },
  { type: "single" },
  { type: "single" },
  { type: "single" },
];

function MiniTableRows({ accentSet, accentMat, accentLab, accentSingle, primary, sectionBg }: {
  accentSet: string; accentMat: string; accentLab: string; accentSingle: string;
  primary: string; sectionBg: string;
}) {
  const accent = (type: string) =>
    type === "set" ? accentSet : type === "mat" ? accentMat : type === "lab" ? accentLab : accentSingle;
  return (
    <div className="flex flex-col gap-[1.5px]">
      {PREVIEW_ROWS.map((row, i) => (
        <div key={i} className="flex items-center h-[5.5px]">
          {row.type === "section" ? (
            <div className="flex-1 rounded-[1px]" style={{ background: sectionBg, height: "5.5px" }}>
              <div className="h-full w-[40%] ml-[3px] opacity-60" style={{ background: "rgba(255,255,255,0.4)", borderRadius: 1 }} />
            </div>
          ) : (
            <>
              <div className="w-[2px] h-full flex-shrink-0 mr-[1.5px]" style={{ background: accent(row.type) }} />
              <div className="flex-1 flex gap-[2px] items-center">
                <div className="flex-1 h-[2px] rounded-[0.5px]" style={{ background: row.type === "set" ? "#e2e8f0" : "#f1f5f9" }} />
                <div className="w-[8px] h-[2px] rounded-[0.5px] bg-slate-200" />
                <div className="w-[9px] h-[2px] rounded-[0.5px]" style={{ background: primary + "30" }} />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewKlasyczny({ t }: { t: PDFTemplate }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Blue banner */}
      <div className="flex items-center px-[5%] gap-[4px]" style={{ background: t.primary, height: "13%" }}>
        <div className="w-[10px] h-[10px] rounded-[1px] bg-white/20 flex-shrink-0" />
        <div className="flex-1 h-[3px] rounded bg-white/50" />
        <div className="w-[18px] h-[3px] rounded bg-white/70" />
      </div>
      {/* accent strip */}
      <div className="h-[2px]" style={{ background: t.accentMat }} />
      {/* Two-column info */}
      <div className="flex gap-[3px] px-[5%] py-[3%]" style={{ height: "18%" }}>
        <div className="flex-1 flex flex-col gap-[2px]">
          <div className="h-[2.5px] w-[70%] rounded bg-slate-300" />
          <div className="h-[2px] w-[50%] rounded bg-slate-200" />
          <div className="h-[2px] w-[55%] rounded bg-slate-200" />
        </div>
        <div className="w-[1px]" style={{ background: "#e2e8f0" }} />
        <div className="flex-1 flex flex-col gap-[2px]">
          <div className="h-[2px] w-[60%] rounded bg-slate-200" />
          <div className="h-[2.5px] w-[75%] rounded bg-slate-300" />
          <div className="h-[2px] w-[45%] rounded bg-slate-200" />
        </div>
      </div>
      {/* Project strip */}
      <div className="mx-[5%] mb-[2%] flex items-center rounded-[1px] px-[3%]" style={{ background: t.primaryLight, height: "8%", borderLeft: `2px solid ${t.primary}` }}>
        <div className="h-[2.5px] flex-1 rounded bg-slate-300/70" />
      </div>
      {/* Table head */}
      <div className="mx-[5%] flex items-center px-[2%] gap-[2px]" style={{ background: t.primary, height: "7%" }}>
        {[6, 1, 8, 10].map((w, i) => <div key={i} className="h-[2.5px] rounded-[0.5px] bg-white/60" style={{ width: `${w * 2}px` }} />)}
      </div>
      {/* Rows */}
      <div className="mx-[5%] flex-1 pt-[2px]">
        <MiniTableRows accentSet={t.accentSet} accentMat={t.accentMat} accentLab={t.accentLab} accentSingle={t.accentSingle} primary={t.primary} sectionBg={t.primary} />
      </div>
      {/* BRUTTO box */}
      <div className="mx-[5%] mb-[4%] mt-auto flex items-center justify-between px-[4%] rounded-[1px]" style={{ background: t.primary, height: "8%" }}>
        <div className="h-[2.5px] w-[25%] rounded bg-white/70" />
        <div className="h-[3px] w-[28%] rounded bg-white" />
      </div>
    </div>
  );
}

function PreviewElegancki({ t }: { t: PDFTemplate }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Gold top line */}
      <div className="h-[2.5px]" style={{ background: t.accentSet }} />
      {/* Header — large company + KOSZTORYS right */}
      <div className="flex items-end justify-between px-[5%] pt-[3%] pb-[2%]" style={{ height: "14%" }}>
        <div>
          <div className="h-[4px] w-[45px] rounded mb-[2px]" style={{ background: t.primary }} />
          <div className="h-[2px] w-[30px] rounded bg-slate-200" />
        </div>
        <div className="h-[4px] w-[35px] rounded" style={{ background: t.primary, opacity: 0.5 }} />
      </div>
      {/* Two-column info with gold divider */}
      <div className="flex gap-[3px] px-[5%] pb-[2%]" style={{ height: "17%" }}>
        <div className="flex-1 flex flex-col gap-[2px]">
          {[45, 55, 40].map((w, i) => <div key={i} className="h-[2px] rounded bg-slate-200" style={{ width: `${w}%` }} />)}
        </div>
        <div className="w-[0.5px] self-stretch" style={{ background: t.accentSet + "80" }} />
        <div className="flex-1 flex flex-col gap-[2px]">
          {[50, 60, 35].map((w, i) => <div key={i} className="h-[2px] rounded bg-slate-200" style={{ width: `${w}%` }} />)}
        </div>
      </div>
      {/* Double rule */}
      <div className="mx-[5%] mb-[1.5px]" style={{ height: "1.5px", background: t.primary }} />
      <div className="mx-[5%] mb-[3%]" style={{ height: "0.5px", background: t.accentSet + "80" }} />
      {/* Cream project strip */}
      <div className="mx-[5%] mb-[2%] flex items-center rounded-[1px] px-[3%]" style={{ background: "#faf9f4", height: "8%", borderLeft: `2px solid ${t.accentSet}` }}>
        <div className="h-[2.5px] flex-1 rounded" style={{ background: t.primary + "60" }} />
      </div>
      {/* Table head — very dark */}
      <div className="mx-[5%] flex items-center px-[2%] gap-[2px]" style={{ background: "#0f172a", height: "7%" }}>
        {[6, 1, 8, 10].map((w, i) => <div key={i} className="h-[2.5px] rounded-[0.5px] bg-white/60" style={{ width: `${w * 2}px` }} />)}
      </div>
      {/* Rows */}
      <div className="mx-[5%] flex-1 pt-[2px]">
        <MiniTableRows accentSet={t.accentSet} accentMat={t.accentMat} accentLab={t.accentLab} accentSingle={t.accentSingle} primary={t.primary} sectionBg="#0f172a" />
      </div>
      {/* BRUTTO — text only + gold line */}
      <div className="mx-[5%] mb-[4%] mt-auto flex items-center justify-between px-[2%]" style={{ height: "8%" }}>
        <div className="h-[2.5px] w-[25%] rounded" style={{ background: t.primary + "80" }} />
        <div className="h-[3.5px] w-[28%] rounded" style={{ background: t.primary }} />
      </div>
      <div className="mx-[5%] mb-[3%] h-[1px]" style={{ background: t.accentSet }} />
    </div>
  );
}

function PreviewNowoczesny({ t }: { t: PDFTemplate }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Teal banner */}
      <div className="flex items-center px-[5%] gap-[4px]" style={{ background: t.primary, height: "13%" }}>
        <div className="flex-1 h-[3px] rounded bg-white/60" />
        <div className="w-[18px] h-[3px] rounded bg-white/70" />
      </div>
      {/* White + light teal stripe */}
      <div className="h-[1px] bg-white" />
      <div className="h-[2px]" style={{ background: t.primaryLight }} />
      {/* Info block */}
      <div className="flex gap-[3px] px-[5%] py-[3%]" style={{ height: "17%" }}>
        <div className="flex-1 flex flex-col gap-[2px]">
          {[65, 45, 50].map((w, i) => <div key={i} className="h-[2px] rounded bg-slate-200" style={{ width: `${w}%` }} />)}
        </div>
        <div className="w-[0.5px] self-stretch" style={{ background: "#e2e8f0" }} />
        <div className="flex-1 flex flex-col gap-[2px]">
          {[50, 60, 35].map((w, i) => <div key={i} className="h-[2px] rounded" style={{ background: i === 0 ? t.primary + "80" : "#e2e8f0", width: `${w}%` }} />)}
        </div>
      </div>
      {/* Teal rule */}
      <div className="mx-[5%] mb-[3%]" style={{ height: "1.5px", background: t.primary }} />
      {/* Mint project strip */}
      <div className="mx-[5%] mb-[2%] flex items-center rounded-[1px] px-[3%]" style={{ background: "#f0fdf4", height: "8%", borderLeft: `2px solid ${t.primary}` }}>
        <div className="h-[2.5px] flex-1 rounded bg-slate-300/70" />
      </div>
      {/* Table head — teal */}
      <div className="mx-[5%] flex items-center px-[2%] gap-[2px]" style={{ background: t.primary, height: "7%" }}>
        {[6, 1, 8, 10].map((w, i) => <div key={i} className="h-[2.5px] rounded-[0.5px] bg-white/60" style={{ width: `${w * 2}px` }} />)}
      </div>
      {/* Rows */}
      <div className="mx-[5%] flex-1 pt-[2px]">
        <MiniTableRows accentSet={t.accentSet} accentMat={t.accentMat} accentLab={t.accentLab} accentSingle={t.accentSingle} primary={t.primary} sectionBg={t.primary} />
      </div>
      {/* BRUTTO teal box */}
      <div className="mx-[5%] mb-[4%] mt-auto flex items-center justify-between px-[4%] rounded-[1px]" style={{ background: t.primary, height: "8%" }}>
        <div className="h-[2.5px] w-[25%] rounded bg-white/70" />
        <div className="h-[3px] w-[28%] rounded bg-white" />
      </div>
    </div>
  );
}

function PreviewKorporacyjny({ t }: { t: PDFTemplate }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Tall dark banner (22% height) */}
      <div className="flex items-center px-[5%] gap-[4px]" style={{ background: t.primary, height: "16%" }}>
        <div className="flex-1 flex flex-col gap-[2px]">
          <div className="h-[3.5px] w-[55%] rounded bg-white/70" />
          <div className="h-[2px] w-[40%] rounded bg-white/40" />
        </div>
        <div className="h-[3.5px] w-[25%] rounded bg-white/60" />
      </div>
      {/* Red accent bar */}
      <div className="h-[2.5px]" style={{ background: t.accentSet }} />
      {/* Gray info section */}
      <div className="flex gap-[3px] px-[5%] py-[3%]" style={{ background: "#f6f7f9", height: "17%" }}>
        <div className="flex-1 flex flex-col gap-[2px]">
          {[60, 45, 50].map((w, i) => <div key={i} className="h-[2px] rounded bg-slate-300" style={{ width: `${w}%` }} />)}
        </div>
        <div className="w-[0.5px] self-stretch bg-slate-300" />
        <div className="flex-1 flex flex-col gap-[2px]">
          {[50, 60, 35].map((w, i) => <div key={i} className="h-[2px] rounded" style={{ background: i === 0 ? t.accentSet + "90" : "#d1d5db", width: `${w}%` }} />)}
        </div>
      </div>
      {/* Red bottom rule */}
      <div className="h-[2px]" style={{ background: t.accentSet }} />
      {/* Project strip */}
      <div className="mx-[5%] mt-[2%] mb-[2%] flex items-center rounded-[1px] px-[3%]" style={{ background: "#f5f6f8", height: "8%", borderLeft: `2px solid ${t.accentSet}` }}>
        <div className="h-[2.5px] flex-1 rounded bg-slate-300/70" />
      </div>
      {/* Table head — dark */}
      <div className="mx-[5%] flex items-center px-[2%] gap-[2px]" style={{ background: t.primary, height: "7%" }}>
        {[6, 1, 8, 10].map((w, i) => <div key={i} className="h-[2.5px] rounded-[0.5px] bg-white/60" style={{ width: `${w * 2}px` }} />)}
      </div>
      {/* Rows */}
      <div className="mx-[5%] flex-1 pt-[2px]">
        <MiniTableRows accentSet={t.accentSet} accentMat={t.accentMat} accentLab={t.accentLab} accentSingle={t.accentSingle} primary={t.primary} sectionBg={t.primary} />
      </div>
      {/* BRUTTO dark + red left accent */}
      <div className="mx-[5%] mb-[4%] mt-auto flex items-center justify-between rounded-[1px] overflow-hidden" style={{ height: "8%" }}>
        <div className="h-full w-[3px]" style={{ background: t.accentSet }} />
        <div className="flex-1 flex items-center justify-between px-[4%]" style={{ background: t.primary }}>
          <div className="h-[2.5px] w-[25%] rounded bg-white/70" />
          <div className="h-[3px] w-[28%] rounded bg-white" />
        </div>
      </div>
    </div>
  );
}

function PreviewPremium({ t }: { t: PDFTemplate }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Tall purple banner (38% height) — contains all info */}
      <div className="flex flex-col px-[5%] pt-[3%] pb-[2%]" style={{ background: t.primary, height: "30%" }}>
        <div className="flex items-center justify-between mb-[3px]">
          <div className="h-[3.5px] w-[50%] rounded bg-white/80" />
          <div className="h-[3px] w-[25%] rounded bg-white/60" />
        </div>
        <div className="h-[0.5px] self-stretch mb-[3px]" style={{ background: t.accentSingle + "80" }} />
        <div className="flex gap-[3px]">
          <div className="flex-1 flex flex-col gap-[2px]">
            {[55, 70, 45].map((w, i) => <div key={i} className="h-[2px] rounded" style={{ background: "rgba(210,195,255,0.6)", width: `${w}%` }} />)}
          </div>
          <div className="flex flex-col gap-[2px] items-end">
            {[40, 35, 30].map((w, i) => <div key={i} className="h-[2px] rounded bg-white/50" style={{ width: `${w}px` }} />)}
          </div>
        </div>
      </div>
      {/* Lavender accent strip */}
      <div className="h-[2px]" style={{ background: t.accentSingle }} />
      {/* Lavender project strip */}
      <div className="mx-[5%] mt-[2%] mb-[2%] flex items-center rounded-[1px] px-[3%]" style={{ background: "#f8f5ff", height: "8%", borderLeft: `2px solid ${t.primary}` }}>
        <div className="h-[2.5px] flex-1 rounded" style={{ background: t.primary + "40" }} />
      </div>
      {/* Table head — deep purple */}
      <div className="mx-[5%] flex items-center px-[2%] gap-[2px]" style={{ background: t.primary, height: "7%" }}>
        {[6, 1, 8, 10].map((w, i) => <div key={i} className="h-[2.5px] rounded-[0.5px] bg-white/60" style={{ width: `${w * 2}px` }} />)}
      </div>
      {/* Rows */}
      <div className="mx-[5%] flex-1 pt-[2px]">
        <MiniTableRows accentSet={t.accentSet} accentMat={t.accentMat} accentLab={t.accentLab} accentSingle={t.accentSingle} primary={t.primary} sectionBg={t.primary} />
      </div>
      {/* BRUTTO purple + lavender left accent */}
      <div className="mx-[5%] mb-[4%] mt-auto flex items-center justify-between rounded-[1px] overflow-hidden" style={{ height: "9%" }}>
        <div className="h-full w-[3px]" style={{ background: t.accentSingle }} />
        <div className="flex-1 flex items-center justify-between px-[4%]" style={{ background: t.primary }}>
          <div className="h-[2.5px] w-[25%] rounded bg-white/70" />
          <div className="h-[3.5px] w-[28%] rounded bg-white" />
        </div>
      </div>
    </div>
  );
}

function A4Preview({ template, isSelected }: { template: PDFTemplate; isSelected: boolean }) {
  const PreviewComponent = {
    klasyczny: PreviewKlasyczny,
    elegancki: PreviewElegancki,
    nowoczesny: PreviewNowoczesny,
    korporacyjny: PreviewKorporacyjny,
    premium: PreviewPremium,
  }[template.id] ?? PreviewKlasyczny;

  return (
    <div className={cn(
      "group relative rounded-xl overflow-hidden transition-all duration-200",
      isSelected
        ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-500/10"
        : "ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600 hover:shadow-md"
    )}>
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 bg-blue-500 text-white rounded-full p-1 shadow-md">
          <Check className="w-3 h-3" strokeWidth={3} />
        </div>
      )}

      {/* A4-shaped preview — aspect ratio ~1:1.41 */}
      <div className="bg-white dark:bg-slate-950 p-2.5 pb-2">
        <div
          className="relative rounded shadow-sm overflow-hidden bg-white"
          style={{ aspectRatio: "1 / 1.35", border: "1px solid #e2e8f0" }}
        >
          <PreviewComponent t={template} />
        </div>
      </div>

      {/* Info section */}
      <div className={cn(
        "px-3 py-2.5 border-t transition-colors",
        isSelected
          ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
          : "bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
      )}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn(
            "text-[11px] font-bold tracking-wide uppercase",
            isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"
          )}>
            {template.name}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500">{template.subtitle}</span>
        </div>
        <div className="flex gap-1">
          {[template.primary, template.accentSet, template.accentMat, template.accentLab].map((c, i) => (
            <div key={i} className="flex-1 h-[5px] rounded-full" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PDFTemplateDialogProps {
  onTemplateChange?: (template: PDFTemplateName) => void;
  currentTemplate?: PDFTemplateName;
}

export function PDFTemplateInline() {
  const [selected, setSelected] = useState<PDFTemplateName>("klasyczny");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PDFTemplateName | null;
    if (stored && PDF_TEMPLATES.some(t => t.id === stored)) setSelected(stored);
  }, []);

  const handleSelect = (templateId: PDFTemplateName) => {
    setSelected(templateId);
    localStorage.setItem(STORAGE_KEY, templateId);
  };

  const current = PDF_TEMPLATES.find(t => t.id === selected);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1.5">
        {PDF_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            className={cn(
              "relative rounded-lg overflow-hidden transition-all duration-150 focus:outline-none",
              selected === template.id
                ? "ring-2 ring-blue-500 shadow-md shadow-blue-500/15"
                : "ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600"
            )}
            title={template.name}
          >
            {selected === template.id && (
              <div className="absolute top-1 right-1 z-10 bg-blue-500 text-white rounded-full p-0.5">
                <Check className="w-2 h-2" strokeWidth={3} />
              </div>
            )}
            <div className="bg-white p-1 pb-0.5">
              <div className="relative rounded-sm overflow-hidden bg-white" style={{ aspectRatio: "1 / 1.35", border: "1px solid #e2e8f0" }}>
                {(() => {
                  const PreviewComponent = {
                    klasyczny: PreviewKlasyczny, elegancki: PreviewElegancki,
                    nowoczesny: PreviewNowoczesny, korporacyjny: PreviewKorporacyjny, premium: PreviewPremium,
                  }[template.id] ?? PreviewKlasyczny;
                  return <PreviewComponent t={template} />;
                })()}
              </div>
            </div>
            <div className={cn(
              "px-1 py-0.5 border-t text-center",
              selected === template.id
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100"
                : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
            )}>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-wide",
                selected === template.id ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"
              )}>
                {template.name}
              </span>
            </div>
          </button>
        ))}
      </div>
      {current && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex gap-1">
            {[current.primary, current.accentSet, current.accentMat, current.accentLab].map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{current.name}</span>
            {" — "}{current.subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

export function PDFTemplateDialog({ onTemplateChange, currentTemplate }: PDFTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PDFTemplateName>(currentTemplate || "klasyczny");

  // Load from localStorage on mount
  useEffect(() => {
    if (!currentTemplate) {
      const stored = localStorage.getItem(STORAGE_KEY) as PDFTemplateName | null;
      if (stored && PDF_TEMPLATES.some(t => t.id === stored)) {
        setSelected(stored);
      }
    }
  }, [currentTemplate]);

  // Sync with external prop
  useEffect(() => {
    if (currentTemplate) setSelected(currentTemplate);
  }, [currentTemplate]);

  const handleSelect = (templateId: PDFTemplateName) => {
    setSelected(templateId);
    localStorage.setItem(STORAGE_KEY, templateId);
    onTemplateChange?.(templateId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Szablony PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden">
        {/* Premium header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="bg-white/15 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold">Szablony dokumentów PDF</span>
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1 pl-[34px]">
              Wybierz styl, który najlepiej pasuje do Twojej marki. Szablon zostanie zastosowany przy każdym generowaniu PDF.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Templates grid */}
        <div className="px-5 py-5">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {PDF_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelect(template.id)}
                className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
              >
                <A4Preview template={template} isSelected={selected === template.id} />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Wybrany: <span className="font-semibold text-slate-700 dark:text-slate-300">
              {PDF_TEMPLATES.find(t => t.id === selected)?.name}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setOpen(false)}>
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
