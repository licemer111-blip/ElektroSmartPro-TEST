"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload, Trash2, RefreshCw, FileText, File, CheckCircle2,
  AlertCircle, Clock, Sparkles, Loader2, FileSpreadsheet,
  Zap, ZoomIn, FileType, Table2, NotebookText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getUserKBStatus,
  uploadUserKBFile,
  rebuildUserCache,
  clearUserKB,
  deleteUserKBFile,
} from "../../my-knowledge-base/actions";
import {
  previewKnrImport,
  commitKnrImport,
  getUserKnrDictionaryStats,
} from "@/app/actions/knr-import-to-dictionary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileInsightModal,
  isSpreadsheet,
  getFileRoutingLabel,
  formatBytes,
  formatDate,
  getFileBadgeLabel,
  type KBFile,
} from "./FileInsightModal";

const MAX_FILES = 20;
const MAX_SIZE_MB = 20;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
};

interface KBStatus {
  cacheExists: boolean;
  cacheName: string | null;
  cacheExpireTime: string | null;
  fileCount: number;
  files: KBFile[];
  modelName: string;
  directMode: boolean;
}

interface KBFilesSectionProps {
  onStatsChange?: (stats: { total: number; imported: number; learned: number } | null) => void;
}

export function KBFilesSection({ onStatsChange }: KBFilesSectionProps) {
  const [status, setStatus] = useState<KBStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadingRoute, setUploadingRoute] = useState<"normy" | "ai" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingUri, setDeletingUri] = useState<string | null>(null);
  const [insightFile, setInsightFile] = useState<KBFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    const [kbResult, dsResult] = await Promise.all([
      getUserKBStatus(),
      getUserKnrDictionaryStats(),
    ]);
    if (kbResult.data) setStatus(kbResult.data);
    if (dsResult.success) {
      onStatsChange?.({ total: dsResult.total, imported: dsResult.imported, learned: dsResult.learned });
    }
    setIsLoading(false);
  }, [onStatsChange]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      toast({ title: "Nieprawidłowy format", description: "Dozwolone: PDF, TXT, CSV, XLSX", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: "Plik za duży", description: `Maksymalny rozmiar: ${MAX_SIZE_MB} MB`, variant: "destructive" });
      return;
    }
    if ((status?.fileCount ?? 0) >= MAX_FILES) {
      toast({ title: "Limit plików", description: `Maksymalnie ${MAX_FILES} plików.`, variant: "destructive" });
      return;
    }

    const isSheet = isSpreadsheet(file.type);
    setUploadingFile(file.name);
    setUploadingRoute(isSheet ? "normy" : "ai");

    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const aiResult = await uploadUserKBFile(fd);

      if (isSheet) {
        const prevResult = await previewKnrImport(fd);
        if (prevResult.success && prevResult.preview.totalRows > 0) {
          await commitKnrImport(fd, prevResult.preview.columnMapping);
        }
      }

      setUploadingFile(null);
      setUploadingRoute(null);

      if (aiResult.success) {
        toast({
          title: "✅ Dane dodane",
          description: isSheet
            ? `${file.name} — zindeksowano jako Moje Normy (szybkie dopasowanie + ES-Engine)`
            : `${file.name} — dodano do bazy wiedzy ES-Engine`,
        });
        await loadAll();
      } else {
        toast({ title: "Błąd przesyłania", description: aiResult.error, variant: "destructive" });
      }
    });
  };

  const handleRebuild = () => {
    startTransition(async () => {
      const result = await rebuildUserCache();
      if (result.success) {
        toast({ title: "Dane zaktualizowane", description: "System przetwarza Twoje dane. Gotowe do użycia." });
        await loadAll();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleDeleteFile = (fileUri: string, fileName: string) => {
    setDeletingUri(fileUri);
    startTransition(async () => {
      const result = await deleteUserKBFile(fileUri);
      setDeletingUri(null);
      if (result.success) {
        toast({ title: "Plik usunięty", description: `${fileName} usunięty.` });
        await loadAll();
      } else {
        toast({ title: "Błąd usuwania", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const executeClear = () => {
    setShowClearConfirm(false);
    startTransition(async () => {
      const result = await clearUserKB();
      if (result.success) {
        toast({ title: "Dane wyczyszczone" });
        await loadAll();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  };

  const fileCount = status?.fileCount ?? 0;
  const cacheActive = status?.cacheExists ?? false;
  const isDirectMode = status?.directMode ?? false;
  const isReady = cacheActive || isDirectMode;
  const cacheNeeded = fileCount > 0 && !isReady;

  return (
    <div className="space-y-5">
      {/* P1 Priority banner */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Twoje dane mają najwyższy priorytet (P1)</p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
            System automatycznie używa Twoich danych przy każdej wycenie — przed globalnymi normami. Wgraj cenniki, normy własne lub katalogi materiałów.
          </p>
        </div>
      </div>

      {/* Upload zone card */}
      <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 dark:bg-slate-900 shadow-none">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Moje Cenniki i Dane</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Wgraj plik — system sam rozpozna typ i indeksuje dane
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadAll} disabled={isLoading} className="h-7 w-7 p-0">
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 space-y-3">
          {/* Stats row */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <FileSpreadsheet className="w-3 h-3 text-violet-500" />
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                {fileCount} / {MAX_FILES} dokumentów
              </span>
            </div>
            {isReady && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Aktywne</span>
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            } ${fileCount >= MAX_FILES ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploadingFile ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{uploadingFile}</p>
                <p className="text-[10px] text-slate-400">
                  {uploadingRoute === "normy" ? "Indeksuję normy + przesyłam do ES-Engine..." : "Przesyłam do bazy wiedzy..."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="h-7 w-7 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Przeciągnij plik lub <span className="text-blue-600 dark:text-blue-400">kliknij, aby wybrać</span>
                </p>
                <p className="text-[10px] text-slate-400">PDF, TXT, CSV, XLSX · maks. {MAX_SIZE_MB} MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Routing legend */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50">
              <FileSpreadsheet className="w-3.5 h-3.5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-violet-800 dark:text-violet-300">XLSX / CSV / TXT</p>
                <p className="text-[9px] text-violet-600 dark:text-violet-400 leading-tight">Indeksowane jako Moje Normy — błyskawiczne dopasowanie przy wycenie</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300">PDF</p>
                <p className="text-[9px] text-blue-600 dark:text-blue-400 leading-tight">Dodane do kontekstu ES-Engine — czytane przy wycenie na żądanie</p>
              </div>
            </div>
          </div>

          {fileCount >= MAX_FILES && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Osiągnięto limit {MAX_FILES} plików. Usuń plik, aby dodać nowy.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Empty state */}
      {!isLoading && fileCount === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Brak wgranych cenników</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Wgraj swoje cenniki w PDF lub Excel, aby ES Engine przestał zgadywać i zaczął używać Twoich realnych stawek.
            </p>
          </div>
          <div className="pt-2">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Zobacz przykłady poprawnych plików
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20">
                <FileType className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[11px] font-medium text-red-700 dark:text-red-400">Cennik PDF</span>
                <span className="text-[9px] text-red-500 dark:text-red-500">(hurtownia, oferta)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20">
                <Table2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Tabela Excel</span>
                <span className="text-[9px] text-emerald-500 dark:text-emerald-500">(normy, stawki)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20">
                <NotebookText className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">Notatnik TXT</span>
                <span className="text-[9px] text-blue-500 dark:text-blue-500">(tabela tekstowa)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File list */}
      {(status?.files?.length ?? 0) > 0 && (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Wgrane pliki ({fileCount})
              </CardTitle>
              <div className="flex gap-2">
                {cacheNeeded && (
                  <Button
                    onClick={handleRebuild}
                    disabled={isPending}
                    size="sm"
                    className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white gap-1 px-2.5"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Aktywuj
                  </Button>
                )}
                <Button
                  onClick={handleClear}
                  disabled={isPending}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1 px-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Usuń wszystko
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <FileInsightModal file={insightFile} onClose={() => setInsightFile(null)} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-full">Plik</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">Typ danych</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Rozmiar</th>
                    <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {status?.files.map((file) => {
                    const isDeleting = deletingUri === file.uri;
                    const isPdf = file.mimeType === "application/pdf";
                    const isSheet = isSpreadsheet(file.mimeType);
                    const routing = getFileRoutingLabel(file.mimeType);
                    return (
                      <tr key={file.uri} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            {isPdf
                              ? <FileText className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                              : isSheet
                                ? <FileSpreadsheet className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                                : <File className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            }
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-xs">{file.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${routing.color}`}>
                            {routing.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="text-[10px] text-slate-400 tabular-nums">{formatBytes(file.sizeBytes)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-center">
                            {isReady ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                <CheckCircle2 className="h-2.5 w-2.5" />Aktywny
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                <Clock className="h-2.5 w-2.5" />Oczekuje
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInsightFile(file)}
                              title="Pokaż co widzi system"
                              className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded"
                            >
                              <ZoomIn className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.uri, file.name)}
                              disabled={isDeleting || isPending}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                            >
                              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {cacheNeeded && (
              <div className="mx-4 mb-3 mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Kliknij <strong>Aktywuj</strong> aby system mógł używać Twoich danych przy następnej wycenie.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wyczyść bazę wiedzy</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć wszystkie Twoje dane? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeClear} className="bg-red-600 hover:bg-red-700 text-white">Usuń wszystko</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
