"use client";

// ═══════════════════════════════════════════════════════════════════
// KnrDictionaryImport.tsx
// Import pliku Excel/CSV z normami KNR → es_dictionary (L1 matching)
// 3 kroki: upload → column mapping preview → commit
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  Loader2, Trash2, RefreshCw, Database, ArrowRight, X,
} from "lucide-react";
import {
  previewKnrImport,
  commitKnrImport,
  getUserKnrDictionaryStats,
  clearUserKnrImport,
  type KnrImportPreview,
} from "@/app/actions/knr-import-to-dictionary";

// ─── Column mapping labels ────────────────────────────────────────────────────

const COL_LABELS: Record<string, string> = {
  nameCol: "Nazwa pozycji",
  knrCol:  "Kod KNR",
  normCol: "Nakład r-g (rbh)",
  unitCol: "Jednostka",
};

// ─── Stats card ───────────────────────────────────────────────────────────────

interface DictStats {
  total: number;
  learned: number;
  imported: number;
}

function StatsBar({ stats, onClear, isClearing }: {
  stats: DictStats;
  onClear: () => void;
  isClearing: boolean;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Twój słownik ES
        </span>
      </div>
      <div className="flex flex-wrap gap-2 flex-1">
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
          {stats.total} wpisów łącznie
        </Badge>
        {stats.imported > 0 && (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
            {stats.imported} z importu KNR
          </Badge>
        )}
        {stats.learned > 0 && (
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-xs">
            {stats.learned} nauczonych
          </Badge>
        )}
      </div>
      {stats.imported > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isClearing}
          className="h-7 px-2 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
        >
          {isClearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          <span className="ml-1">Usuń import</span>
        </Button>
      )}
    </div>
  );
}

// ─── Preview table ────────────────────────────────────────────────────────────

function PreviewTable({ preview }: { preview: KnrImportPreview }) {
  const { headers, sampleData, columnMapping, totalRows, skippedRows } = preview;
  const { nameCol, knrCol, normCol, unitCol } = columnMapping;

  const colRole = (idx: number): string | null => {
    if (idx === nameCol) return COL_LABELS.nameCol;
    if (idx === knrCol)  return COL_LABELS.knrCol;
    if (idx === normCol) return COL_LABELS.normCol;
    if (idx === unitCol) return COL_LABELS.unitCol;
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
          {totalRows} pozycji do importu
        </Badge>
        {skippedRows > 0 && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs">
            {skippedRows} pominięto (brak danych)
          </Badge>
        )}
      </div>

      {/* Column mapping legend */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {headers.map((h, i) => {
          const role = colRole(i);
          return (
            <span
              key={i}
              className={`px-1.5 py-0.5 rounded border font-medium ${
                role
                  ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              }`}
            >
              {h || `Kol.${i + 1}`}
              {role && <span className="ml-1 opacity-70">→ {role}</span>}
            </span>
          );
        })}
      </div>

      {/* Sample rows */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800">
              {headers.map((h, i) => (
                <th key={i} className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap ${
                  colRole(i) ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                }`}>
                  {h || `Kol.${i + 1}`}
                  {colRole(i) && <span className="block text-[9px] font-normal opacity-70">{colRole(i)}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, ri) => (
              <tr key={ri} className="border-t border-slate-100 dark:border-slate-800">
                {headers.map((_, ci) => (
                  <td key={ci} className={`px-2 py-1 max-w-[180px] truncate ${
                    colRole(ci) ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400">Podgląd pierwszych 5 wierszy · łącznie {totalRows} pozycji</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KnrDictionaryImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, startPreview] = useTransition();
  const [isCommitting, startCommit] = useTransition();
  const [isClearing, startClear] = useTransition();

  const [stats, setStats] = useState<DictStats | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Step state: "idle" | "preview" | "done"
  const [step, setStep] = useState<"idle" | "preview" | "done">("idle");
  const [preview, setPreview] = useState<KnrImportPreview | null>(null);
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const loadStats = useCallback(() => {
    getUserKnrDictionaryStats().then((res) => {
      if (res.success) setStats({ total: res.total, learned: res.learned, imported: res.imported });
    });
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    setSavedFormData(fd);

    startPreview(async () => {
      const result = await previewKnrImport(fd);
      if (!result.success) {
        toast({ title: "Błąd parsowania", description: result.error, variant: "destructive" });
        return;
      }
      setPreview(result.preview);
      setStep("preview");
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleCommit = () => {
    if (!savedFormData || !preview) return;
    startCommit(async () => {
      const result = await commitKnrImport(savedFormData, preview.columnMapping);
      if (!result.success) {
        toast({ title: "Błąd importu", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: "✅ Import zakończony",
        description: `Dodano ${result.inserted} pozycji do słownika ES-Engine (L1)`,
      });
      setStep("done");
      loadStats();
    });
  };

  const handleReset = () => {
    setStep("idle");
    setPreview(null);
    setSavedFormData(null);
    setFileName("");
  };

  const handleClearImport = () => {
    startClear(async () => {
      const result = await clearUserKnrImport();
      if (result.success) {
        toast({ title: "Usunięto", description: `Usunięto ${result.deleted} wpisów z importu KNR` });
        loadStats();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <Card className="border-2 border-blue-100 dark:border-blue-900/40 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">Import KNR → Słownik ES-Engine</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Załaduj własne normy KNR z Excel/CSV — każda pozycja staje się wpisem <strong>L1 (Exact)</strong> dla Twojego konta
            </CardDescription>
          </div>
          {stats && (
            <Button variant="ghost" size="sm" onClick={loadStats} className="h-7 w-7 p-0 flex-shrink-0">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Info banner */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <Database className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Wymagane kolumny: <strong>Nazwa pozycji</strong> (obowiązkowa) + <strong>Kod KNR</strong> i/lub <strong>Nakład r-g</strong>.
            System automatycznie wykrywa kolumny. Obsługuje: XLSX, XLS, CSV, TXT.
          </p>
        </div>

        {/* Stats bar */}
        {stats && stats.total > 0 && (
          <StatsBar stats={stats} onClear={handleClearImport} isClearing={isClearing} />
        )}

        {/* ── Step: idle / uploading ── */}
        {step === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            {isPreviewing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Analizuję plik...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Przeciągnij plik lub <span className="text-blue-600 dark:text-blue-400">kliknij, aby wybrać</span>
                </p>
                <p className="text-xs text-slate-400">XLSX, XLS, CSV, TXT · maks. 10 MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {/* ── Step: preview ── */}
        {step === "preview" && preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                  {fileName}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0 flex-shrink-0">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>

            <PreviewTable preview={preview} />

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                <X className="w-3.5 h-3.5" />
                Anuluj
              </Button>
              <Button
                size="sm"
                onClick={handleCommit}
                disabled={isCommitting || preview.totalRows === 0}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {isCommitting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Importuję...</>
                ) : (
                  <><ArrowRight className="w-3.5 h-3.5" />Importuj {preview.totalRows} pozycji do ES-Engine</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === "done" && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Import zakończony
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Pozycje są dostępne jako <strong>L1 Exact</strong> przy kolejnej wycenie
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs flex-shrink-0">
              <Upload className="w-3.5 h-3.5" />
              Importuj kolejny plik
            </Button>
          </div>
        )}

        {/* Format guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
          {[
            { title: "Minimalne wymagania", lines: ["Kolumna: Nazwa pozycji", "Kolumna: Kod KNR lub Nakład"] },
            { title: "Przykładowe nagłówki", lines: ["Nazwa / Opis / Pozycja", "KNR / Kod / Nr kat.", "Nakład / r-g / rbh"] },
            { title: "Obsługiwane formaty", lines: ["Excel (.xlsx, .xls)", "CSV / TXT z separatorem"] },
          ].map((block) => (
            <div key={block.title} className="rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 p-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{block.title}</p>
              {block.lines.map((l) => (
                <p key={l} className="text-slate-500 dark:text-slate-400 leading-snug">{l}</p>
              ))}
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}
