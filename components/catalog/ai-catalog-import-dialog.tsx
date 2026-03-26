"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet, Upload, Sparkles, Loader2, CheckCircle2,
  AlertCircle, Trash2, ArrowRight, ArrowLeft, FileText,
  Users, Eye, X, Pencil,
} from "lucide-react";
import {
  aiAnalyzeImportData,
  batchImportCatalogItems,
} from "@/app/dashboard/catalog/ai-import-actions";
import { toast } from "sonner";
import type { Team } from "@/lib/types/database";
import { ConfidenceBadge } from "@/components/project/ai/ConfidenceBadge";

interface AICatalogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userTeam?: Team | null;
  isPro?: boolean;
}

interface ParsedRow {
  [key: string]: string;
}

interface AICatalogItem {
  name: string;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
  category: string;
  confidence?: number;
}

type ImportStep = "upload" | "analyzing" | "preview" | "importing" | "done";

export function AICatalogImportDialog({
  open,
  onOpenChange,
  onSuccess,
  userTeam,
  isPro = true,
}: AICatalogImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [aiItems, setAiItems] = useState<AICatalogItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep("upload");
    setFileName("");
    setRawRows([]);
    setColumnHeaders([]);
    setPreviewData([]);
    setAiItems([]);
    setSelectedItems(new Set());
    setEditingIndex(null);
    setShareWithTeam(false);
    setImportCount(0);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  // Parse Excel files using xlsx library
  const parseExcel = useCallback(async (file: File): Promise<{ headers: string[]; rows: ParsedRow[]; preview: string[][] }> => {
    const XLSX = await import("xlsx-js-style");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get raw data as array of arrays
    const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (rawData.length < 2) {
      throw new Error("Plik jest pusty lub zawiera tylko nagłówki");
    }

    // First row as headers
    const headers = rawData[0].map((h: string | number | boolean) => String(h || "").trim()).filter(Boolean);
    const dataRows = rawData.slice(1).filter(row => row.some((cell: string | number | boolean) => String(cell || "").trim()));

    // Convert to ParsedRow objects
    const rows: ParsedRow[] = dataRows.map(row => {
      const obj: ParsedRow = {};
      headers.forEach((h, i) => {
        obj[h] = String(row[i] ?? "").trim();
      });
      return obj;
    });

    // Preview: first 5 rows
    const preview = [headers, ...dataRows.slice(0, 5).map(row =>
      headers.map((_, i) => String(row[i] ?? ""))
    )];

    return { headers, rows, preview };
  }, []);

  // Parse CSV files
  const parseCSV = useCallback(async (file: File): Promise<{ headers: string[]; rows: ParsedRow[]; preview: string[][] }> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error("Plik jest pusty lub zawiera tylko nagłówki");
    }

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).filter(Boolean);
    const dataRows = lines.slice(1)
      .map(line => parseLine(line))
      .filter(row => row.some(cell => cell.trim()));

    const rows: ParsedRow[] = dataRows.map(row => {
      const obj: ParsedRow = {};
      headers.forEach((h, i) => {
        obj[h] = (row[i] ?? "").trim();
      });
      return obj;
    });

    const preview = [headers, ...dataRows.slice(0, 5).map(row =>
      headers.map((_, i) => row[i] ?? "")
    )];

    return { headers, rows, preview };
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    try {
      const isExcel = file.name.match(/\.xlsx?$/i);
      const result = isExcel ? await parseExcel(file) : await parseCSV(file);

      setColumnHeaders(result.headers);
      setRawRows(result.rows);
      setPreviewData(result.preview);

      // Auto-start AI analysis
      setStep("analyzing");
      const aiResult = await aiAnalyzeImportData(result.rows, result.headers, file.name);

      if (aiResult.success && aiResult.items && aiResult.items.length > 0) {
        setAiItems(aiResult.items);
        setSelectedItems(new Set(aiResult.items.map((_, i) => i)));
        setStep("preview");
      } else {
        setError(aiResult.error || "AI nie rozpoznało pozycji w pliku");
        setStep("upload");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd odczytu pliku");
      setStep("upload");
    }

    // Reset input
    e.target.value = "";
  }, [parseExcel, parseCSV]);

  const toggleItem = (index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === aiItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(aiItems.map((_, i) => i)));
    }
  };

  const removeItem = (index: number) => {
    setAiItems(prev => prev.filter((_, i) => i !== index));
    setSelectedItems(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    setEditingIndex(null);
  };

  const updateItem = (index: number, field: keyof AICatalogItem, value: string | number) => {
    setAiItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleImport = async () => {
    const itemsToImport = aiItems.filter((_, i) => selectedItems.has(i));
    if (itemsToImport.length === 0) {
      toast.error("Wybierz pozycje do zaimportowania");
      return;
    }

    setStep("importing");

    try {
      const result = await batchImportCatalogItems(
        itemsToImport,
        shareWithTeam && userTeam ? "team" : "personal",
        shareWithTeam && userTeam ? userTeam.id : undefined
      );

      if (result.success) {
        setImportCount(result.count || 0);
        setStep("done");
        onSuccess?.();
      } else {
        setError(result.error || "Błąd importu");
        setStep("preview");
      }
    } catch {
      setError("Wystąpił nieoczekiwany błąd");
      setStep("preview");
    }
  };

  const selectedCount = aiItems.filter((_, i) => selectedItems.has(i)).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            ES Import z Excel / CSV
          </DialogTitle>
          <DialogDescription>
            Wgraj plik — ES-Engine automatycznie rozpozna pozycje i sformatuje je pod katalog
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-1">
          {[
            { key: "upload", label: "Plik", icon: Upload },
            { key: "analyzing", label: "AI Analiza", icon: Sparkles },
            { key: "preview", label: "Podgląd", icon: Eye },
          ].map((s, i) => {
            const isActive = s.key === step || (step === "importing" && s.key === "preview") || (step === "done" && s.key === "preview");
            const isDone = (step === "preview" && i < 2) || (step === "importing" && i < 2) || (step === "done");
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                  isActive ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                  "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {isDone ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 2 && <div className={`w-4 h-0.5 ${isDone ? "bg-emerald-300" : "bg-slate-200 dark:bg-slate-700"}`} />}
              </div>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Upload step */}
          {step === "upload" && (
            <div className="space-y-3 py-2">
              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-xl border-2 border-dashed border-orange-200 dark:border-orange-800/50 bg-orange-50/30 dark:bg-orange-950/10 p-6 text-center hover:border-orange-400 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                <p className="text-sm font-semibold mb-1">Wybierz plik Excel lub CSV</p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  AI rozpozna kolumny i sformatuje pozycje pod katalog
                </p>
                <label className="inline-block cursor-pointer">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium text-sm shadow-md transition-all">
                    <Upload className="w-4 h-4" />
                    Wybierz plik
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Analyzing step */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold">ES-Engine analizuje plik...</p>
                <p className="text-xs text-muted-foreground mt-0.5">{fileName} · {rawRows.length} wierszy</p>
              </div>
            </div>
          )}

          {/* Preview step */}
          {(step === "preview" || step === "importing") && (
            <div className="space-y-3 py-2">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Summary bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI rozpoznało {aiItems.length} pozycji
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Zaznaczono: {selectedCount}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
                  {selectedItems.size === aiItems.length ? "Odznacz wszystko" : "Zaznacz wszystko"}
                </Button>
              </div>

              {/* Team sharing toggle */}
              {userTeam && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <Label htmlFor="ai-import-share-team" className="text-xs font-medium">Udostępnij zespółowi</Label>
                  </div>
                  <Switch
                    id="ai-import-share-team"
                    name="ai-import-share-team"
                    checked={shareWithTeam}
                    onCheckedChange={setShareWithTeam}
                  />
                </div>
              )}

              {/* Items list */}
              <ScrollArea className="max-h-[40vh]">
                <div className="space-y-1.5 pr-3">
                  {aiItems.map((item, index) => {
                    const isSelected = selectedItems.has(index);
                    const isEditing = editingIndex === index;

                    return (
                      <div
                        key={index}
                        className={`rounded-lg border p-2.5 transition-all ${
                          isSelected
                            ? "border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10"
                            : "border-slate-200 dark:border-slate-700 opacity-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleItem(index)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3" />}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  id={`cat-import-name-${index}`}
                                  name={`cat-import-name-${index}`}
                                  aria-label="Nazwa pozycji"
                                  value={item.name}
                                  onChange={(e) => updateItem(index, "name", e.target.value)}
                                  className="h-7 text-xs"
                                  placeholder="Nazwa pozycji"
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  <div>
                                    <label htmlFor={`cat-import-unit-${index}`} className="text-[10px] text-muted-foreground">Jednostka</label>
                                    <Input
                                      id={`cat-import-unit-${index}`}
                                      name={`cat-import-unit-${index}`}
                                      value={item.unit}
                                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`cat-import-mat-${index}`} className="text-[10px] text-muted-foreground">Materiał (zł)</label>
                                    <Input
                                      id={`cat-import-mat-${index}`}
                                      name={`cat-import-mat-${index}`}
                                      type="number"
                                      value={item.base_material_price}
                                      onChange={(e) => updateItem(index, "base_material_price", parseFloat(e.target.value) || 0)}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`cat-import-lab-${index}`} className="text-[10px] text-muted-foreground">Robocizna (zł)</label>
                                    <Input
                                      id={`cat-import-lab-${index}`}
                                      name={`cat-import-lab-${index}`}
                                      type="number"
                                      value={item.base_labor_price}
                                      onChange={(e) => updateItem(index, "base_labor_price", parseFloat(e.target.value) || 0)}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`cat-import-cat-${index}`} className="text-[10px] text-muted-foreground">Kategoria</label>
                                    <Input
                                      id={`cat-import-cat-${index}`}
                                      name={`cat-import-cat-${index}`}
                                      value={item.category}
                                      onChange={(e) => updateItem(index, "category", e.target.value)}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => setEditingIndex(null)} className="h-6 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Gotowe
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-medium leading-tight">{item.name}</p>
                                  {item.confidence !== undefined && (
                                    <ConfidenceBadge score={item.confidence} />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">{item.unit}</Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    Mat: {isPro ? `${item.base_material_price.toFixed(2)} zł` : '***'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/40">|</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Rob: {isPro ? `${item.base_labor_price.toFixed(2)} zł` : '***'}
                                  </span>
                                  <Badge className="text-[9px] h-4 px-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                    {item.category}
                                  </Badge>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          {!isEditing && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingIndex(index)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-orange-600"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Done step */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-sm font-semibold">Dodano {importCount} pozycji do katalogu</p>
              {shareWithTeam && userTeam && (
                <p className="text-xs text-blue-600">Udostępnione zespołowi</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 gap-2">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Anuluj</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => { resetState(); }}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Inny plik
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importuj {selectedCount} pozycji
              </Button>
            </>
          )}
          {step === "importing" && (
            <Button disabled className="bg-orange-500 text-white">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importowanie...
            </Button>
          )}
          {step === "done" && (
            <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600 text-white">
              Zamknij
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
