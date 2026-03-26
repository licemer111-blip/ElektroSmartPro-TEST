"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, RefreshCw, FileJson, CheckCircle2, XCircle,
  AlertTriangle, Database, ChevronDown, ChevronUp, Info,
  BarChart3, Layers, Clock, List, Trash2, X, Files,
} from "lucide-react";
import { uploadKnrNormsJson, getKnrDbStats, deleteKnrNormsByFile, deleteAllKnrNorms, type KnrImportResult, type KnrDbStats } from "../actions";
import { UNKNOWN_FILE_SENTINEL } from "../constants";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ImportStatus = "idle" | "uploading" | "success" | "error";

interface FileResult {
  fileName: string;
  result: KnrImportResult;
}

const KNOWN_CATALOGS = [
  { code: "KNR 5-08", label: "KNR 5-08", desc: "Instalacje elektryczne (standard)" },
  { code: "KNR 5-10", label: "KNR 5-10", desc: "Hale, magazyny, przemysł" },
  { code: "KNR 5-12", label: "KNR 5-12", desc: "Biurowce, sieci LAN" },
  { code: "KNR 4-03", label: "KNR 4-03", desc: "Remonty, stare budownictwo" },
  { code: "KNR 5-06", label: "KNR 5-06", desc: "Teletechnika, PPOŻ, światłowody" },
] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface ResultRowProps {
  label: string;
  value: number | string;
  color?: "green" | "blue" | "amber" | "red" | "slate";
}

function ResultRow({ label, value, color = "slate" }: ResultRowProps) {
  const colorMap = {
    green: "text-emerald-700 dark:text-emerald-400",
    blue:  "text-blue-700 dark:text-blue-400",
    amber: "text-amber-700 dark:text-amber-400",
    red:   "text-red-700 dark:text-red-400",
    slate: "text-slate-600 dark:text-slate-400",
  };
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono font-semibold ${colorMap[color]}`}>{value}</span>
    </div>
  );
}

const JSON_SCHEMA_EXAMPLE = `[
  {
    "catalog_code": "KNR 5-10",
    "table_number": "0301",
    "column_number": "01",
    "description": "Montaż gniazda CEE 5P 32A/400V",
    "unit": "szt",
    "labor_norm": 0.5,
    "is_industrial": true,
    "materials": [
      {
        "material_name": "Gniazdo CEE 32A",
        "material_unit": "szt",
        "quantity_factor": 1,
        "component_type": "device"
      }
    ]
  }
]`;

export function KbKnrImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus]               = useState<ImportStatus>("idle");
  const [results, setResults]             = useState<FileResult[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [dragOver, setDragOver]           = useState(false);
  const [showSchema, setShowSchema]       = useState(false);
  const [dbStats, setDbStats]           = useState<KnrDbStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [clearAllError, setClearAllError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setLoadingStats(true);
    const stats = await getKnrDbStats();
    setDbStats(stats);
    setLoadingStats(false);
  }, []);

  useEffect(() => { void refreshStats(); }, [refreshStats]);

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const jsonFiles = Array.from(fileList).filter(f => f.name.endsWith(".json"));
    if (jsonFiles.length === 0) return;
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const newFiles = jsonFiles.filter(f => !existing.has(f.name));
      return [...prev, ...newFiles];
    });
    setResults([]);
    setStatus("idle");
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    setConfirmClearAll(false);
    setClearAllError(null);
    const res = await deleteAllKnrNorms();
    if (res.success) {
      await refreshStats();
    } else {
      setClearAllError(res.error ?? "Błąd czyszczenia bazy");
    }
    setClearingAll(false);
  };

  const handleDeleteFile = async (fileName: string) => {
    setDeletingFile(fileName);
    setConfirmDeleteFile(null);
    const res = await deleteKnrNormsByFile(fileName);
    if (res.success) {
      await refreshStats();
    }
    setDeletingFile(null);
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;
    setStatus("uploading");
    setResults([]);
    const accumulated: FileResult[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setBatchProgress({ current: i + 1, total: selectedFiles.length, fileName: file.name });
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadKnrNormsJson(fd);
      accumulated.push({ fileName: file.name, result: res });
      setResults([...accumulated]);
    }

    setBatchProgress(null);
    const anyError = accumulated.some(r => !r.result.success);
    setStatus(anyError ? "error" : "success");
    setSelectedFiles([]);
    void refreshStats();
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setResults([]);
    setStatus("idle");
    setBatchProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isUploading = status === "uploading";
  const totalSelected = selectedFiles.length;

  const totalNorms = dbStats?.total ?? 0;
  const catalogMap = new Map((dbStats?.catalogs ?? []).map((c) => [c.catalog_code, c]));

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-4 h-4 text-indigo-600" />
          Import KNR do bazy danych
          <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700 border border-indigo-300">
            v1.4 Schema
          </Badge>
        </CardTitle>
        <CardDescription>
          Wgraj plik JSON z normami KNR — dane trafią bezpośrednio do tabel{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">knr_norms</code>
          {" "}+{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">knr_to_materials</code>.
          Powtórny upload aktualizuje istniejące rekordy (bez duplikatów).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── DB Stats Panel ────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Stan bazy KNR</span>
              {totalNorms > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border border-emerald-300">
                  {totalNorms} norm
                </Badge>
              )}
              {dbStats?.error && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border border-red-300">
                  Błąd
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {totalNorms > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => setConfirmClearAll(true)}
                  disabled={clearingAll || loadingStats}
                  title="Usuń WSZYSTKIE normy z bazy"
                >
                  {clearingAll
                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />}
                  Wyczyść bazę
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-slate-500 hover:text-indigo-600"
                onClick={() => void refreshStats()}
                disabled={loadingStats}
              >
                <RefreshCw className={`w-3 h-3 ${loadingStats ? "animate-spin" : ""}`} />
                Odśwież
              </Button>
            </div>
          </div>

          {/* Known catalogs grid */}
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {KNOWN_CATALOGS.map((cat) => {
              const stat = catalogMap.get(cat.code);
              const loaded = !!stat && stat.count > 0;
              return (
                <div
                  key={cat.code}
                  className={`flex flex-col gap-1 rounded-lg border px-3 py-2 transition-colors ${
                    loaded
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {loaded
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                      <span className={`text-xs font-bold font-mono ${
                        loaded ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"
                      }`}>{cat.code}</span>
                    </div>
                    {loaded && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                        {stat.count} norm
                      </Badge>
                    )}
                    {!loaded && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-slate-100 text-slate-400 border border-slate-200 shrink-0">
                        Brak danych
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">{cat.desc}</span>
                  {loaded && stat.lastUpdated && (
                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(stat.lastUpdated)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Extra catalogs from DB not in KNOWN_CATALOGS */}
            {(dbStats?.catalogs ?? []).filter(c =>
              !KNOWN_CATALOGS.some(k => k.code === c.catalog_code)
            ).map((c) => (
              <div
                key={c.catalog_code}
                className="flex flex-col gap-1 rounded-lg border px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400">{c.catalog_code}</span>
                  </div>
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                    {c.count} norm
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400">Niestandardowy katalog</span>
              </div>
            ))}

            {loadingStats && (
              <div className="col-span-full flex items-center justify-center py-3 text-xs text-slate-400 gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Ładowanie statystyk...
              </div>
            )}
            {!loadingStats && totalNorms === 0 && !dbStats?.error && (
              <div className="col-span-full text-center py-3 text-xs text-amber-600">
                Baza KNR jest pusta — wgraj pliki JSON używając importera poniżej
              </div>
            )}
            {dbStats?.error && (
              <div className="col-span-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 text-xs text-red-700">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                Błąd ładowania statystyk: {dbStats.error}
              </div>
            )}
            {clearAllError && (
              <div className="col-span-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 text-xs text-red-700">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  Błąd czyszczenia: {clearAllError}
                </div>
                <button onClick={() => setClearAllError(null)} className="text-red-400 hover:text-red-600">×</button>
              </div>
            )}
          </div>

          {/* Imported files list */}
          {(dbStats?.importedFiles ?? []).length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/40">
                <List className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Zaimportowane pliki ({(dbStats?.importedFiles ?? []).length})</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {(dbStats?.importedFiles ?? []).map((f) => {
                  const isUnknown = f.fileName === UNKNOWN_FILE_SENTINEL;
                  return (
                  <div key={f.fileName} className={`flex items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                    deletingFile === f.fileName ? "opacity-50" : ""
                  } ${isUnknown ? "bg-amber-50/60 dark:bg-amber-950/10" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileJson className={`w-3.5 h-3.5 shrink-0 ${isUnknown ? "text-amber-400" : "text-indigo-400"}`} />
                      <span className={`text-xs font-mono truncate ${isUnknown ? "text-amber-700 dark:text-amber-400 italic" : "text-slate-700 dark:text-slate-300"}`} title={f.fileName}>
                        {f.fileName}
                      </span>
                      {isUnknown && (
                        <span className="text-[9px] text-amber-500 hidden sm:inline">(stare rekordy bez nazwy pliku)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {f.count} norm
                      </Badge>
                      {f.lastUpdated && (
                        <span className="text-[9px] text-slate-400 hidden sm:block">
                          {formatDate(f.lastUpdated)}
                        </span>
                      )}
                      <button
                        onClick={() => setConfirmDeleteFile(f.fileName)}
                        disabled={deletingFile === f.fileName}
                        className="flex items-center justify-center w-6 h-6 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                        title={`Usuń normy z pliku ${f.fileName}`}
                      >
                        {deletingFile === f.fileName
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm clear ALL norms dialog */}
          <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Wyczyścić całą bazę KNR?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Zostanie trwale usuniętych <strong>{totalNorms} norm</strong> ze wszystkich katalogów.
                  Po wyczyszczeniu możesz wgrać pliki ponownie.
                  <br /><br />
                  <span className="text-red-600 font-medium">Ta operacja jest nieodwracalna.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => void handleClearAll()}
                >
                  Usuń wszystkie {totalNorms} norm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Confirm delete file norms dialog */}
          <AlertDialog open={!!confirmDeleteFile} onOpenChange={(open) => { if (!open) setConfirmDeleteFile(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Usuń normy z bazy?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Wszystkie normy z pliku{" "}
                  <strong className="font-mono text-xs">{confirmDeleteFile}</strong>{" "}
                  zostaną trwale usunięte z tabeli <code>knr_norms</code>.
                  Operacja jest nieodwracalna — będziesz mógł ponownie wgrać plik.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => confirmDeleteFile && void handleDeleteFile(confirmDeleteFile)}
                >
                  Usuń normy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
              : totalSelected > 0
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-indigo-600">
              <RefreshCw className="w-7 h-7 animate-spin" />
              {batchProgress ? (
                <>
                  <span className="text-sm font-medium">
                    Importowanie {batchProgress.current}/{batchProgress.total}: {batchProgress.fileName}
                  </span>
                  <div className="w-full max-w-xs bg-indigo-100 dark:bg-indigo-900/40 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <span className="text-sm font-medium">Importowanie norm do bazy danych...</span>
              )}
            </div>
          ) : totalSelected > 0 ? (
            <div className="flex flex-col items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <Files className="w-7 h-7 mb-1" />
              <span className="text-sm font-semibold">{totalSelected} plik{totalSelected === 1 ? "" : totalSelected < 5 ? "i" : "ów"} JSON wybranych</span>
              <span className="text-xs text-slate-400">Kliknij aby dodać więcej · pliki poniżej</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Upload className="w-7 h-7" />
              <span className="text-sm font-medium">
                Przeciągnij pliki JSON lub{" "}
                <span className="text-indigo-600 underline">kliknij tutaj</span>
              </span>
              <span className="text-xs text-slate-400">
                Obsługiwany format: JSON · Maks. 10 MB/plik · do 2000 norm/plik · wiele plików naraz
              </span>
            </div>
          )}
        </div>

        {/* Selected files list */}
        {totalSelected > 0 && !isUploading && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Kolejka importu ({totalSelected})</span>
              <button onClick={handleReset} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors">Wyczyść wszystko</button>
            </div>
            <div className="divide-y divide-emerald-100 dark:divide-emerald-900/30 max-h-40 overflow-y-auto">
              {selectedFiles.map((f) => (
                <div key={f.name} className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileJson className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-xs font-mono truncate text-slate-700 dark:text-slate-300" title={f.name}>{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(f.name); }}
                      className="w-4 h-4 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void handleImport()}
            disabled={totalSelected === 0 || isUploading}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isUploading
              ? <><RefreshCw className="w-4 h-4 animate-spin" />Importowanie...</>
              : <><Database className="w-4 h-4" />Importuj {totalSelected > 0 ? `${totalSelected} plik${totalSelected === 1 ? "" : totalSelected < 5 ? "i" : "ów"}` : "do BD"}</>}
          </Button>
          {(totalSelected > 0 || results.length > 0) && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isUploading}>
              Wyczyść
            </Button>
          )}
        </div>

        {/* Results panel — per file */}
        {results.length > 0 && (
          <div className="space-y-2">
            {/* Summary header */}
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${
              results.every(r => r.result.success)
                ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
                : results.some(r => r.result.success)
                ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
            }`}>
              {results.every(r => r.result.success)
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                : results.some(r => r.result.success)
                ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span className="text-sm font-semibold">
                {results.filter(r => r.result.success).length}/{results.length} plików zaimportowanych · {results.reduce((s, r) => s + r.result.inserted, 0)} norm łącznie
              </span>
            </div>

            {/* Per-file rows */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {results.map((fr) => (
                <div key={fr.fileName} className={`px-3 py-2 ${
                  fr.result.success
                    ? "bg-white dark:bg-slate-900"
                    : "bg-red-50 dark:bg-red-950/20"
                }`}>
                  <div className="flex items-center gap-2">
                    {fr.result.success
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    <span className="text-xs font-mono truncate flex-1 text-slate-700 dark:text-slate-300" title={fr.fileName}>{fr.fileName}</span>
                    {fr.result.success && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                        +{fr.result.inserted} norm
                      </Badge>
                    )}
                  </div>
                  {fr.result.errors.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {fr.result.errors.slice(0, 3).map((e, i) => (
                        <div key={i} className="text-[10px] font-mono text-red-700 bg-red-100 dark:bg-red-950/30 rounded px-2 py-0.5 truncate">{e}</div>
                      ))}
                      {fr.result.errors.length > 3 && (
                        <div className="text-[10px] text-red-500">...i {fr.result.errors.length - 3} więcej błędów</div>
                      )}
                    </div>
                  )}
                  {fr.result.warnings.length > 0 && (
                    <div className="mt-0.5">
                      <div className="text-[10px] text-amber-600">{fr.result.warnings.length} ostrzeżenie{fr.result.warnings.length > 1 ? "ń" : ""}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON Schema reference */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => setShowSchema((p) => !p)}
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Format JSON v1.4 — schemat wymaganych pól
            </span>
            {showSchema ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSchema && (
            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
              {/* Required fields */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { field: "catalog_code",  req: true,  desc: "KNR 5-08 / 5-10 / 5-12 / 4-03 / 5-06 / K-38 / ..." },
                  { field: "table_number",  req: true,  desc: "np. \"0301\"" },
                  { field: "column_number", req: true,  desc: "np. \"01\"" },
                  { field: "description",   req: true,  desc: "min. 3 znaki, po polsku" },
                  { field: "unit",          req: true,  desc: "szt / mb / m / kpl / m2 / godz / m-c" },
                  { field: "labor_norm",    req: true,  desc: "liczba > 0, max 50 rbh" },
                  { field: "is_industrial", req: false, desc: "boolean, default false (+15% nadkład)" },
                  { field: "section",       req: false, desc: "opis rozdziału" },
                  { field: "materials",     req: false, desc: "tablica składników Zestawu" },
                ].map(({ field, req, desc }) => (
                  <div key={field} className="flex items-start gap-1.5 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <code className="font-mono text-indigo-600 dark:text-indigo-400 shrink-0">{field}</code>
                    {req
                      ? <Badge className="text-[9px] px-1 py-0 h-3.5 bg-red-100 text-red-700 border-red-300 shrink-0">wymagane</Badge>
                      : <Badge className="text-[9px] px-1 py-0 h-3.5 bg-slate-100 text-slate-500 border-slate-300 shrink-0">opcjonalne</Badge>}
                    <span className="text-slate-400 text-[10px] leading-tight">{desc}</span>
                  </div>
                ))}
              </div>

              {/* materials sub-fields */}
              <div className="text-xs font-medium text-slate-500 mt-2">Pola w tablicy <code className="text-indigo-600">materials[]</code>:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { field: "material_name",    req: true,  desc: "nazwa materiału" },
                  { field: "quantity_factor",  req: true,  desc: "liczba > 0 (np. 3.5 mb/szt)" },
                  { field: "component_type",   req: false, desc: "material / robocizna / cable / box / device / chase" },
                  { field: "material_unit",    req: false, desc: "szt / mb itd." },
                  { field: "is_optional",      req: false, desc: "boolean — np. bruzdowanie" },
                  { field: "only_for_surface", req: false, desc: "[\"w_tynku\", \"pod_tynkiem\"]" },
                ].map(({ field, req, desc }) => (
                  <div key={field} className="flex items-start gap-1.5 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <code className="font-mono text-emerald-600 dark:text-emerald-400 shrink-0">{field}</code>
                    {req
                      ? <Badge className="text-[9px] px-1 py-0 h-3.5 bg-red-100 text-red-700 border-red-300 shrink-0">wymagane</Badge>
                      : <Badge className="text-[9px] px-1 py-0 h-3.5 bg-slate-100 text-slate-500 border-slate-300 shrink-0">opcjonalne</Badge>}
                    <span className="text-slate-400 text-[10px] leading-tight">{desc}</span>
                  </div>
                ))}
              </div>

              {/* Example */}
              <div className="text-xs font-medium text-slate-500">Przykład:</div>
              <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 rounded-lg p-3 overflow-x-auto leading-relaxed">
                {JSON_SCHEMA_EXAMPLE}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
