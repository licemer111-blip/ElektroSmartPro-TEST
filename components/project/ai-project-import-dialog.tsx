"use client";

import { useCallback } from "react";
import { useProjectImport } from "@/hooks/useProjectImport";
import { AIPreviewPanel, ExcelPreviewTable } from "@/components/project/import/ImportDataPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuotaBadge } from "@/components/ui/quota-badge";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet, Upload, Loader2, CheckCircle2,
  AlertCircle, ArrowLeft, ClipboardPaste, FileText, Table2,
  ScanText, ImageIcon, Wand2, Check, Ban,
} from "lucide-react";
import type { AIProjectItem } from "@/components/project/ai-import-dialog-reducer";

interface AIProjectImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (items: { name: string; unit: string; quantity: number; material_price: number; labor_price: number; knr_code?: string | null; knr_source?: string | null; labor_norm?: number | null }[]) => Promise<{ success?: boolean; error?: string; count?: number }>;
  isPro?: boolean;
}

export function AIProjectImportDialog({
  open,
  onOpenChange,
  projectId,
  onImport,
  isPro = true,
}: AIProjectImportDialogProps) {
  const {
    state,
    dispatch,
    quotaInfo,
    visionQuotaInfo,
    cleanQuotaInfo,
    przedmiarFileRef,
    pdfFileRef,
    reset,
    handleFileSelect,
    handlePdfAnalyze,
    handleCleanPrzedmiar,
    handleParsePrzedmiar,
    handlePrzedmiarFile,
    handleExcelFileSelect,
    handleExcelImport,
    handleImport,
    handleImportWithoutPrices,
    toggleItem,
    toggleAll,
    removeItem,
    updateItem,
    selectedCount,
    excelValidCount,
    excelInvalidCount,
  } = useProjectImport({ projectId, onImport });

  const {
    step, importMode, error, importCount,
    fileName, rawRows,
    przedmiarText, przedmiarCleaning, przedmiarCleanupDone,
    pdfFile, pdfFileName, pdfPageNumber, pdfInstructions, pdfAnalyzing, pdfProgress,
    excelHeaders, excelParsedRows, excelImporting, excelAnalyzing,
    aiItems, selectedItems, editingIndex,
  } = state;

  const isBusy = pdfAnalyzing || step === "importing" || excelImporting || state.excelAnalyzing;

  const handleClose = useCallback(() => {
    if (isBusy) return;
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange, isBusy]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent
        className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => { if (isBusy) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isBusy) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              {importMode === "plik" ? <Table2 className="w-4 h-4 text-white" /> : importMode === "pdf" ? <ScanText className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-white" />}
            </div>
            ES-Engine Import
            {importMode === "pdf" && <QuotaBadge info={visionQuotaInfo} className="ml-auto" />}
          </DialogTitle>
          <DialogDescription>
            {importMode === "plik"
              ? "Wgraj Excel lub CSV — pozycje zostaną dodane do kosztorysu. Ceny wycenisz osobno przez ES-Engine."
              : importMode === "pdf"
              ? "Wgraj skan lub PDF — pozycje zostaną dodane do kosztorysu bez cen"
              : "Wklej listę pozycji z SMS, notatki lub dokumentu — bez automatycznej wyceny"}
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        {step === "upload" && (
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => dispatch({ type: "SET_IMPORT_MODE", payload: "plik" })}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${importMode === "plik" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm shadow-green-500/30" : "text-slate-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-green-400"}`}
            >
              <Table2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Plik (Excel/CSV)</span>
            </button>

            <button
              onClick={() => dispatch({ type: "SET_IMPORT_MODE", payload: "pdf" })}
              className={`relative flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${importMode === "pdf" ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"}`}
            >
              <ScanText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Zdjęcie / PDF</span>
              {visionQuotaInfo && !visionQuotaInfo.isPro && (
                <span className={`absolute -top-1 -right-1 text-[8px] font-bold leading-none px-1 py-0.5 rounded-full ${visionQuotaInfo.isExhausted ? "bg-red-500 text-white" : "bg-orange-500 text-white"}`}>
                  {visionQuotaInfo.remaining}
                </span>
              )}
            </button>

            <button
              onClick={() => dispatch({ type: "SET_IMPORT_MODE", payload: "przedmiar" })}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${importMode === "przedmiar" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
            >
              <ClipboardPaste className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Tekst (Przedmiar)</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Plik upload (Excel/CSV — unified) */}
          {step === "upload" && importMode === "plik" && (
            <div className="space-y-3">
              {error && <ErrorBanner message={error} />}
              {state.excelAnalyzing ? (
                <div className="rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20 p-8 text-center">
                  <Loader2 className="w-8 h-8 text-green-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">ES-Engine rozpoznaje strukturę pliku...</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{fileName}</p>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-green-200 dark:border-green-800/50 bg-green-50/30 dark:bg-green-950/10 p-6 text-center hover:border-green-400 transition-colors">
                  <FileSpreadsheet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">
                    Pozycje zostaną dodane do kosztorysu
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-3">Ceny wycenisz osobno przyciskiem <strong>Wyceń z ES-Engine</strong></p>
                  <label className="inline-block cursor-pointer">
                    <Input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" onChange={handleFileSelect} className="hidden" />
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium text-sm transition-all shadow-md shadow-green-500/30">
                      <Upload className="w-4 h-4" />
                      Wybierz plik Excel / CSV
                    </div>
                  </label>
                  <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-400">
                    <span>.xlsx</span><span>.xls</span><span>.csv</span><span>.tsv</span><span>.txt</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF/Vision upload */}
          {step === "upload" && importMode === "pdf" && (
            <div className="space-y-3">
              {error && <ErrorBanner message={error} />}
              {pdfAnalyzing ? (
                <div className="rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 p-6 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-red-500 mx-auto animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      {pdfProgress
                        ? `Skanowanie strony ${pdfProgress.current} z ${pdfProgress.total}...`
                        : "ES-Engine rozpoznaje dokument..."}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">{pdfFileName}</p>
                  </div>
                  {pdfProgress && pdfProgress.total > 1 && (
                    <div className="space-y-1">
                      <div className="w-full bg-red-100 dark:bg-red-900/40 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                          style={{ width: `${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-red-400">{Math.round((pdfProgress.current / pdfProgress.total) * 100)}% · Nie zamykaj okna</p>
                    </div>
                  )}
                </div>
              ) : pdfFile ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <ScanText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300 truncate flex-1">{pdfFileName}</span>
                    <button onClick={() => { dispatch({ type: "SET_PDF_FILE", payload: null }); dispatch({ type: "SET_PDF_FILE_NAME", payload: "" }); }} className="text-slate-400 hover:text-red-500 transition-colors">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/\.pdf$/i.test(pdfFileName) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Ilość stron:</span>
                        <input
                          id="pdf-page-count"
                          name="pdf-page-count"
                          aria-label="Ilość stron do skanowania"
                          type="number" min={1} value={pdfPageNumber}
                          onChange={e => dispatch({ type: "SET_PDF_PAGE_NUMBER", payload: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-16 h-7 text-xs border rounded px-2 bg-white dark:bg-slate-900"
                        />
                        <span className="text-[10px] text-slate-400">stron zostanie przeskanowanych (1→N)</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Instrukcja dla ES-Engine (opcjonalnie)</label>
                    <div className="relative">
                      <textarea
                        value={pdfInstructions}
                        onChange={e => dispatch({ type: "SET_PDF_INSTRUCTIONS", payload: e.target.value })}
                        placeholder="np. Wyodrębnij tylko materiały elektryczne z kosztorysu"
                        className="w-full h-16 text-xs border rounded px-2 py-1.5 resize-none bg-white dark:bg-slate-900 dark:border-slate-700 pr-10"
                      />
                      <div className="absolute bottom-1.5 right-1.5">
                        <VoiceInputButton
                          onTranscript={(text) => dispatch({ type: "SET_PDF_INSTRUCTIONS", payload: pdfInstructions ? `${pdfInstructions} ${text}` : text })}
                          title="Podaj instrukcję głosem"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handlePdfAnalyze} className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <ScanText className="w-4 h-4" />
                    Rozpoznaj pozycje
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-red-300 dark:border-red-700/50 bg-red-50/30 dark:bg-red-950/10 p-6 text-center hover:border-red-400 transition-colors">
                  <ImageIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Wgraj PDF z kosztorysem lub zdjęcie dokumentu</p>
                  <p className="text-[10px] text-muted-foreground mb-3">Pozycje zostaną dodane bez cen — wycenisz je osobno</p>
                  <input
                    ref={pdfFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      dispatch({ type: "SET_PDF_FILE", payload: f });
                      dispatch({ type: "SET_PDF_FILE_NAME", payload: f.name });
                      dispatch({ type: "SET_ERROR", payload: null });
                      if (/\.pdf$/i.test(f.name)) {
                        try {
                          const { getPdfPageCount } = await import("@/app/dashboard/ai-lab/pdfToImage");
                          const count = await getPdfPageCount(f);
                          dispatch({ type: "SET_PDF_PAGE_NUMBER", payload: count });
                        } catch { /* keep default */ }
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button onClick={() => pdfFileRef.current?.click()} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Upload className="w-4 h-4" />
                    Wybierz PDF lub zdjęcie
                  </Button>
                  <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-400">
                    <span>📄 PDF</span>
                    <span>🖼️ JPG / PNG</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Przedmiar paste mode */}
          {step === "upload" && importMode === "przedmiar" && (
            <div className="space-y-3">
              {error && <ErrorBanner message={error} />}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Wklej lub podyktuj listę pozycji</span>
                <div className="relative inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCleanPrzedmiar}
                    disabled={przedmiarCleaning || !przedmiarText.trim() || cleanQuotaInfo?.isExhausted}
                    title={cleanQuotaInfo?.isExhausted ? `Limit ES Cleanup wyczerpany (${cleanQuotaInfo.used}/${cleanQuotaInfo.limit})` : "Uporządkuj strukturę przez ES-Engine"}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      cleanQuotaInfo?.isExhausted
                        ? "border-red-200 text-red-400 bg-red-50 dark:bg-red-950/20 cursor-not-allowed opacity-60"
                        : przedmiarCleaning
                        ? "border-orange-300 text-orange-500 bg-orange-50 dark:bg-orange-950/20 cursor-wait"
                        : "border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400 shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
                    }`}
                  >
                    {przedmiarCleaning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>{przedmiarCleaning ? "Porządkuję..." : "Uporządkuj"}</span>
                  </button>
                  {cleanQuotaInfo && !cleanQuotaInfo.isPro && (
                    <span className={`text-[9px] font-bold leading-none px-1 py-0.5 rounded-full ${cleanQuotaInfo.isExhausted ? "bg-red-500 text-white" : cleanQuotaInfo.isLow ? "bg-orange-500 text-white" : "bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-200"}`}>
                      {cleanQuotaInfo.remaining}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <Textarea
                  value={przedmiarText}
                  onChange={(e) => dispatch({ type: "SET_PRZEDMIAR_TEXT", payload: e.target.value })}
                  placeholder={`Wklej listę materiałów, np.:\n\n12 szt Gniazdo podwójne z uziemieniem\n8 szt Łącznik schodowy\n50 mb Przewód YDYp 3x2,5\n3 szt Wyłącznik nadprądowy B16\n\nMożna też CSV: nazwa;jednostka;ilość`}
                  className="min-h-[180px] max-h-[260px] overflow-y-auto font-mono text-xs pr-10 resize-none"
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInputButton
                    onTranscript={(text) => dispatch({ type: "SET_PRZEDMIAR_TEXT", payload: przedmiarText ? `${przedmiarText}\n${text}` : text })}
                    title="Dyktuj pozycje głosem"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleParsePrzedmiar}
                  disabled={!przedmiarText.trim() || !przedmiarCleanupDone}
                  title={!przedmiarCleanupDone ? "Najpierw kliknij 'Uporządkuj' aby ES-Engine przetworzył tekst" : undefined}
                  className={`gap-2 text-white transition-all ${
                    !przedmiarCleanupDone
                      ? "bg-blue-300 dark:bg-blue-900/40 opacity-50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}>
                  <Check className="w-4 h-4" />
                  Rozpoznaj pozycje
                </Button>
                <span className="text-xs text-slate-400">lub</span>
                <input ref={przedmiarFileRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" onChange={handlePrzedmiarFile} className="hidden" />
                <Button variant="outline" onClick={() => przedmiarFileRef.current?.click()} className="gap-2 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Wczytaj plik
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SMS / notatka</h4>
                  <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
                    <p>12 szt Gniazdo podwójne</p>
                    <p>50 mb Kabel YDYp 3x2,5</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CSV / tabela</h4>
                  <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
                    <p>Gniazdo podwójne;szt;12</p>
                    <p>Kabel YDYp 3x2,5;mb;50</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Analyzing spinner */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium">ES-Engine analizuje plik...</p>
                <p className="text-xs text-muted-foreground mt-0.5">{fileName} · {rawRows.length} wierszy</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {(step === "preview" || step === "importing") && (
            <AIPreviewPanel
              items={aiItems}
              selectedItems={selectedItems}
              editingIndex={editingIndex}
              isPro={isPro}
              error={error}
              onToggle={toggleItem}
              onToggleAll={toggleAll}
              onEdit={(i: number | null) => dispatch({ type: "SET_EDITING_INDEX", payload: i })}
              onRemove={removeItem}
              onUpdate={updateItem}
            />
          )}

          {/* Done */}
          {step === "done" && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-medium">Import zakończony — dodano {importCount} pozycji do kosztorysu</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 gap-2">
          {step === "upload" && <Button variant="outline" onClick={handleClose}>Anuluj</Button>}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}><ArrowLeft className="w-4 h-4 mr-1" /> Inny plik</Button>
              <Button onClick={handleImport} disabled={selectedCount === 0} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importuj pozycje ({selectedCount})
              </Button>
            </>
          )}

          {step === "importing" && (
            <Button disabled className="bg-orange-500 text-white">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importowanie...
            </Button>
          )}
          {step === "done" && (
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700 text-white">Zamknij</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs">{message}</span>
    </div>
  );
}
