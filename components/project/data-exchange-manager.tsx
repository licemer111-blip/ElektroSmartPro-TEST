"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, Upload, X, AlertTriangle, CheckCircle2, Loader2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ParsedImportRow {
  rowIdx: number;
  rawName: string;
  rawRating: string;
  rawPhase: string;
  rawQty: string;
  resolvedModuleId?: string;
  resolvedModuleName?: string;
  resolvedRating?: number;
  resolvedPhase?: string;
  resolvedQty?: number;
  confidence: "ok" | "uncertain" | "failed";
  uncertainReason?: string;
}

interface DinModule {
  id: string;
  namePl: string;
  category: string;
  modules: number;
  defaultRating?: number;
}

interface RailModule {
  uid: string;
  module: DinModule;
  rating?: number;
  label?: string;
  phase?: string;
  knrCode?: string;
}

interface DataExchangeManagerProps {
  dinModules: DinModule[];
  railModules: RailModule[];
  panelName: string;
  onImport: (rows: ParsedImportRow[]) => void;
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function fuzzyMatchModule(rawName: string, rawRating: string, modules: DinModule[]): { module: DinModule | null; confidence: "ok" | "uncertain" | "failed"; reason?: string } {
  const norm = normalizeText(rawName);
  const ratingNum = parseFloat(rawRating.replace(",", ".")) || 0;

  const categoryHints: Record<string, string[]> = {
    breaker: ["mcb", "b6", "b10", "b16", "b20", "b25", "b32", "c6", "c10", "c16", "c20", "c25", "c32", "wyłącznik", "wylacznik", "automat", "s-ka", "ska"],
    rcd: ["rcd", "rccb", "fi", "różnicowo", "roznicowo"],
    rcbo: ["rcbo", "wyłącznik różnicowoprądowy"],
    spd: ["spd", "ochronnik", "przepięciowy"],
    contactor: ["stycznik", "contactor"],
    switch: ["rozłącznik", "rozlacznik", "odłącznik"],
  };

  const exactById = modules.find(m => normalizeText(m.id) === norm);
  if (exactById) return { module: exactById, confidence: "ok" };

  let detectedCategory: string | null = null;
  for (const [cat, keywords] of Object.entries(categoryHints)) {
    if (keywords.some(kw => norm.includes(kw))) { detectedCategory = cat; break; }
  }

  const categoryModules = detectedCategory ? modules.filter(m => m.category === detectedCategory) : modules;

  if (ratingNum > 0) {
    const ratingMatch = categoryModules.find(m => m.defaultRating === ratingNum);
    if (ratingMatch) return { module: ratingMatch, confidence: "ok" };
  }

  const nameMatches = categoryModules
    .map(m => {
      const mNorm = normalizeText(m.namePl);
      const words = norm.split(" ").filter(w => w.length > 2);
      const matchCount = words.filter(w => mNorm.includes(w)).length;
      return { module: m, score: matchCount / Math.max(words.length, 1) };
    })
    .filter(x => x.score > 0.3)
    .sort((a, b) => b.score - a.score);

  if (nameMatches.length > 0) {
    const best = nameMatches[0];
    return { module: best.module, confidence: best.score >= 0.6 ? "ok" : "uncertain", reason: best.score < 0.6 ? `Dopasowanie częściowe (${Math.round(best.score * 100)}%)` : undefined };
  }

  return { module: null, confidence: "failed", reason: "Nie rozpoznano modułu" };
}

function detectColumns(headers: string[]): { nameCol: number; ratingCol: number; phaseCol: number; qtyCol: number } {
  const find = (patterns: string[]) => {
    const idx = headers.findIndex(h => patterns.some(p => normalizeText(h).includes(p)));
    return idx >= 0 ? idx : 0;
  };
  return {
    nameCol: find(["nazwa", "name", "opis", "modul", "typ", "urzadzenie"]),
    ratingCol: find(["prad", "ampery", "rating", "i (a)", "i(a)", "nominal"]),
    phaseCol: find(["faza", "phase", "l1", "l2", "l3"]),
    qtyCol: find(["ilosc", "qty", "quantity", "szt", "count", "liczba"]),
  };
}

function parseCsvText(text: string): string[][] {
  return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if ((ch === "," || ch === ";" || ch === "\t") && !inQuotes) { cells.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    cells.push(current.trim());
    return cells;
  });
}

function buildExportCsv(railModules: RailModule[], panelName: string): string {
  // Wrap value as Excel text formula to prevent scientific notation / barcode formatting
  const asText = (s: string): string => `"="${s}""`;

  const csvEscape = (val: string | number): string => {
    const s = String(val);
    // Pure long numbers → force text
    if (/^\d+$/.test(s) && s.length > 6) return asText(s);
    // KNR codes (e.g. "KNR 5-08 0295") → always force text to prevent Excel reformatting
    if (/^KNR\s/i.test(s)) return asText(s);
    // Module IDs with hyphens that could be misread as dates (e.g. "mcb-b-1p") → force text
    if (/^[a-z][\w-]{4,}$/i.test(s) && s.includes("-")) return asText(s);
    if (s.includes(";") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const HEADERS = ["Lp", "Nazwa", "KNR", "ID modulu", "I (A)", "Faza", "Etykieta"];
  const rows: string[][] = [HEADERS];
  let lp = 1;
  for (const m of railModules) {
    const rating = m.rating ?? m.module.defaultRating ?? 0;
    rows.push([
      String(lp++),
      m.module.namePl + (m.label ? ` (${m.label})` : ""),
      m.knrCode ?? "KNR 5-08",
      m.module.id,
      rating > 0 ? String(rating) : "—",
      m.phase ?? "—",
      m.label ?? "—",
    ]);
  }
  return rows.map(row => row.map(csvEscape).join(";")).join("\r\n");
}

export function DataExchangeManager({ dinModules, railModules, panelName, onImport }: DataExchangeManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [step, setStep] = useState<"idle" | "preview" | "done">("idle");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => { setParsedRows([]); setStep("idle"); setFileName(""); setIsProcessing(false); }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    try {
      let rows: string[][] = [];
      if (file.name.match(/\.(csv|txt|tsv)$/i)) {
        rows = parseCsvText(await file.text());
      } else if (file.name.match(/\.xlsx?$/i)) {
        const XLSX = await import("xlsx-js-style");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
      } else {
        toast({ title: "Nieobsługiwany format", description: "Obsługiwane: .csv, .xlsx, .xls", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      if (rows.length < 2) { toast({ title: "Pusty plik", variant: "destructive" }); setIsProcessing(false); return; }

      const headers = rows[0].map(h => String(h));
      const mapping = detectColumns(headers);
      const parsed: ParsedImportRow[] = rows.slice(1).filter(r => r.some(c => String(c).trim())).map((row, idx) => {
        const rawName = String(row[mapping.nameCol] ?? "").trim();
        const rawRating = String(row[mapping.ratingCol] ?? "").trim();
        const rawPhase = String(row[mapping.phaseCol] ?? "").trim();
        const rawQty = String(row[mapping.qtyCol] ?? "1").trim();
        if (!rawName) return { rowIdx: idx + 2, rawName, rawRating, rawPhase, rawQty, confidence: "failed" as const, uncertainReason: "Brak nazwy" };
        const match = fuzzyMatchModule(rawName, rawRating, dinModules);
        const ratingNum = parseFloat(rawRating.replace(",", ".")) || match.module?.defaultRating;
        const phase = ["L1", "L2", "L3"].includes(rawPhase.toUpperCase()) ? rawPhase.toUpperCase() : undefined;
        return { rowIdx: idx + 2, rawName, rawRating, rawPhase, rawQty, resolvedModuleId: match.module?.id, resolvedModuleName: match.module?.namePl, resolvedRating: ratingNum, resolvedPhase: phase, resolvedQty: parseInt(rawQty) || 1, confidence: match.confidence, uncertainReason: match.reason };
      });
      setParsedRows(parsed);
      setStep("preview");
    } catch (err) {
      toast({ title: "Błąd parsowania", description: String(err), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [dinModules, toast]);

  const handleExport = useCallback(() => {
    if (railModules.length === 0) { toast({ title: "Brak modułów", variant: "destructive" }); return; }
    const bom = "\uFEFF";
    const blob = new Blob([bom + buildExportCsv(railModules, panelName)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(panelName || "rozdzielnica").replace(/\s+/g, "-").toLowerCase()}-lista.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Eksport gotowy", description: "CSV z nagłówkami Lp/Nazwa/KNR/I(A)/Faza/ZUG" });
  }, [railModules, panelName, toast]);

  const handleConfirmImport = useCallback(() => {
    const okRows = parsedRows.filter(r => r.confidence !== "failed" && r.resolvedModuleId);
    if (okRows.length === 0) { toast({ title: "Brak rozpoznanych modułów", variant: "destructive" }); return; }
    onImport(okRows);
    setStep("done");
    toast({ title: `Zaimportowano ${okRows.length} modułów` });
    setTimeout(() => { setOpen(false); resetState(); }, 1200);
  }, [parsedRows, onImport, toast, resetState]);

  const okCount = parsedRows.filter(r => r.confidence === "ok").length;
  const uncertainCount = parsedRows.filter(r => r.confidence === "uncertain").length;
  const failedCount = parsedRows.filter(r => r.confidence === "failed").length;

  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => { resetState(); setOpen(true); }}>
        <ArrowDownToLine className="w-3 h-3" />
        Wymiana danych
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); setOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Wymiana danych — Import / Eksport
            </DialogTitle>
            <DialogDescription className="sr-only">
              Import i eksport danych kosztorysu w formacie CSV lub Excel.
            </DialogDescription>
          </DialogHeader>

          {step === "idle" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                {isProcessing ? <Loader2 className="w-10 h-10 text-blue-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isProcessing ? "Analizuję plik..." : "Przeciągnij plik lub kliknij"}</p>
                  <p className="text-xs text-slate-500 mt-1">Obsługiwane: .csv, .xlsx, .xls</p>
                </div>
                <div className="flex gap-2"><Badge variant="outline" className="text-[10px]">CSV (;)</Badge><Badge variant="outline" className="text-[10px]">Excel .xlsx</Badge><Badge variant="outline" className="text-[10px]">TSV</Badge></div>
                <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Inteligentny import AI</p>
                  <p>System automatycznie wykrywa kolumny i dopasowuje wiersze do katalogu 120+ modułów. Kolumny mogą mieć dowolne nazwy — &quot;Ampery&quot;, &quot;Rating&quot;, &quot;I (A)&quot; — AI zrozumie kontekst.</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Eksport projektu</p>
                <Button variant="outline" size="sm" className="gap-2 w-full h-9 text-xs border-emerald-400 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={handleExport} disabled={railModules.length === 0}>
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  Pobierz listę modułów (CSV) — {railModules.length} pozycji
                </Button>
                <p className="text-[10px] text-slate-400 mt-1.5">Nagłówki: Lp · Nazwa · KNR · Producent · I (A) · Faza · ZUG. Liczby jako tekst — bez konwersji Excel.</p>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Plik: <strong>{fileName}</strong></span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> {okCount} OK</Badge>
                {uncertainCount > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] gap-1"><HelpCircle className="w-3 h-3" /> {uncertainCount} niepewnych</Badge>}
                {failedCount > 0 && <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] gap-1"><AlertTriangle className="w-3 h-3" /> {failedCount} nierozpoznanych</Badge>}
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        {["#", "Oryginał", "Dopasowany moduł", "I (A)", "Faza", "Szt.", ""].map((h, i) => (
                          <th key={i} className="px-2 py-2 text-left font-semibold text-slate-600 dark:text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.map((row) => (
                        <tr key={row.rowIdx} className={row.confidence === "failed" ? "bg-red-50/50 dark:bg-red-950/10" : row.confidence === "uncertain" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                          <td className="px-2 py-1.5 text-slate-400">{row.rowIdx}</td>
                          <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 max-w-[120px] truncate" title={row.rawName}>{row.rawName || "—"}</td>
                          <td className="px-2 py-1.5 font-medium text-slate-800 dark:text-slate-200 max-w-[150px]">
                            {row.resolvedModuleName ?? <span className="italic text-red-500">Nierozpoznany</span>}
                            {row.uncertainReason && <span className="block text-[10px] text-amber-600 font-normal">{row.uncertainReason}</span>}
                          </td>
                          <td className="px-2 py-1.5 text-center">{(row.resolvedRating ?? row.rawRating) || "—"}</td>
                          <td className="px-2 py-1.5 text-center">{row.resolvedPhase ? <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-blue-300">{row.resolvedPhase}</Badge> : "—"}</td>
                          <td className="px-2 py-1.5 text-center">{row.resolvedQty ?? 1}</td>
                          <td className="px-2 py-1.5 text-center">
                            {row.confidence === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />}
                            {row.confidence === "uncertain" && <HelpCircle className="w-3.5 h-3.5 text-amber-500 mx-auto" />}
                            {row.confidence === "failed" && <X className="w-3.5 h-3.5 text-red-500 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {uncertainCount > 0 && (
                <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>{uncertainCount} niepewnych dopasowań</strong> — zostaną zaimportowane z najlepszym dopasowaniem. Sprawdź je po imporcie w konstruktorze.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={resetState}><X className="w-3.5 h-3.5" />Anuluj</Button>
                <Button size="sm" className="gap-1 text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleConfirmImport} disabled={okCount + uncertainCount === 0}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Importuj {okCount + uncertainCount} modułów
                  {failedCount > 0 && <span className="opacity-70 ml-1">(pomiń {failedCount})</span>}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Import zakończony!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
