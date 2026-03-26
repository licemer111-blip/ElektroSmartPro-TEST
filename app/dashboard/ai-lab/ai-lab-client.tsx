"use client";

import { useState, useEffect, useMemo } from "react";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Brain, FileText, Loader2, CheckCircle2, Eye, AlertCircle, Lock, Crown, Sparkles, ExternalLink, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useModalStore } from "@/hooks/use-modal-store";
import { useRouter } from "next/navigation";
import { parsePdfWithAi, getRegionsForQuickEstimate, getObjectTypesForQuickEstimate, createQuickEstimateFromMaterials, type ExtractedMaterial } from "./actions";
import { AnalysisResults } from "@/components/ai/AnalysisResults";
import { TEXT_MODE_TEMPLATES, VISION_MODE_TEMPLATES } from "@/lib/ai/prompts";

interface AiLabClientProps { isPro: boolean; }

const isPdf = (name: string) => /\.pdf$/i.test(name);
const isSpreadsheet = (name: string) => /\.(xlsx|xls|csv|txt)$/i.test(name);
function fileMatchesMode(f: File | null, mode: "text" | "vision"): boolean {
  if (!f) return true;
  if (mode === "vision") return isPdf(f.name) || /\.(jpg|jpeg|png)$/i.test(f.name);
  return isSpreadsheet(f.name);
}

export function AiLabClient({ isPro }: AiLabClientProps) {
  const [analysisMode, setAnalysisMode] = useState<"text" | "vision">("text");
  const [file, setFile] = useState<File | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [instructions, setInstructions] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [materials, setMaterials] = useState<ExtractedMaterial[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<number>>(new Set());
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRawOpen, setIsRawOpen] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quickEstimateOpen, setQuickEstimateOpen] = useState(false);
  const [qeProjectName, setQeProjectName] = useState("");
  const [qeRegionId, setQeRegionId] = useState("");
  const [qeObjectTypeId, setQeObjectTypeId] = useState("");
  const [qeVatRate, setQeVatRate] = useState(23);
  const [qeRegions, setQeRegions] = useState<{ id: string; name: string; price_modifier: number }[]>([]);
  const [qeObjectTypes, setQeObjectTypes] = useState<{ id: string; name: string; default_vat_rate: number }[]>([]);
  const [qeLoading, setQeLoading] = useState(false);
  const { toast } = useToast();
  const { onOpen } = useModalStore();
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aiLabResults");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      const hoursDiff = (Date.now() - new Date(parsed.timestamp).getTime()) / 3_600_000;
      if (hoursDiff < 24) {
        setMaterials(parsed.materials || []); setSelectedMaterials(new Set(parsed.selectedMaterials || []));
        setRawText(parsed.rawText || ""); setFileName(parsed.fileName || ""); setAnalysisMode(parsed.analysisMode || "text");
        toast({ title: "Przywrocono poprzednia analize", description: `Wyniki z ${new Date(parsed.timestamp).toLocaleString("pl-PL")}` });
      } else { localStorage.removeItem("aiLabResults"); }
    } catch (err) { console.error("Failed to load saved results:", err); }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const pending = localStorage.getItem("aiLabPendingDocument");
        if (!pending) return;
        const parsed = JSON.parse(pending);
        const minutesDiff = (Date.now() - new Date(parsed.timestamp).getTime()) / 60_000;
        localStorage.removeItem("aiLabPendingDocument");
        if (minutesDiff > 5) return;
        setAnalysisMode(parsed.analysisMode || "text");
        toast({ title: "Ladowanie dokumentu...", description: parsed.filename });
        const response = await fetch(parsed.url);
        const blob = await response.blob();
        const ext = parsed.filename.split(".").pop()?.toLowerCase() || "";
        const mimeMap: Record<string, string> = { pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel", csv: "text/csv", txt: "text/plain", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
        const f = new File([blob], parsed.filename, { type: mimeMap[ext] || "application/octet-stream" });
        setFile(f); setFileName(parsed.filename); setError(""); setMaterials([]); setRawText("");
        if (parsed.analysisMode === "vision") setPreviewUrl(URL.createObjectURL(f));
        toast({ title: "Dokument zaladowany", description: `${parsed.filename} gotowy do analizy ES-Engine` });
      } catch (err) { console.error("Failed to load pending document:", err); toast({ title: "Blad", description: "Nie udalo sie zaladowac dokumentu", variant: "destructive" }); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!materials.length) return;
    try { localStorage.setItem("aiLabResults", JSON.stringify({ materials, selectedMaterials: Array.from(selectedMaterials), rawText, fileName, analysisMode, timestamp: new Date().toISOString() })); } catch {}
  }, [materials, selectedMaterials, rawText, fileName, analysisMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const validExts = analysisMode === "text" ? [".xlsx", ".xls", ".csv", ".txt"] : [".pdf", ".jpg", ".jpeg", ".png"];
    if (!validExts.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      toast({ title: "Nieprawidlowy format pliku", description: analysisMode === "text" ? "Dozwolone: Excel lub CSV/TXT." : "Dozwolone: PDF lub Obrazy.", variant: "destructive" });
      e.target.value = ""; return;
    }
    const MAX_SIZE = analysisMode === "text" ? 4 * 1024 * 1024 : 20 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      toast({ title: "Plik za duzy", description: `Maks: ${analysisMode === "text" ? "4 MB" : "20 MB"}. Twoj: ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB.`, variant: "destructive" });
      e.target.value = ""; return;
    }
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setFile(selectedFile); setFileName(selectedFile.name); setError(""); setMaterials([]); setRawText("");
    toast({ title: `${analysisMode === "text" ? "Plik zaladowany" : "Obraz zaladowany"}`, description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` });
  };

  const handleModeChange = (newMode: "text" | "vision") => {
    if (newMode === analysisMode) return;
    if (file && !fileMatchesMode(file, newMode)) {
      setFile(null); setFileName(""); setPreviewUrl(null); setMaterials([]); setRawText(""); setError("");
      localStorage.removeItem("aiLabResults");
      toast({ title: "Zmieniono tryb", description: `Poprzedni plik nie pasuje do trybu ${newMode === "text" ? "Excel/CSV" : "PDF"}.` });
    }
    setAnalysisMode(newMode);
  };

  const toggleMaterialSelection = (index: number) => {
    setSelectedMaterials(prev => { const next = new Set(prev); next.has(index) ? next.delete(index) : next.add(index); return next; });
  };
  const toggleSelectAll = () => {
    setSelectedMaterials(prev => prev.size === materials.length ? new Set() : new Set(materials.map((_, i) => i)));
  };

  const selectedMaterialsList = useMemo(() => Array.from(selectedMaterials).map(i => materials[i]).filter(Boolean), [selectedMaterials, materials]);

  const handleExportToExcel = async () => {
    if (!materials.length) { toast({ title: "Brak danych", description: "Najpierw wykonaj analize pliku", variant: "destructive" }); return; }
    try {
      const XLSX = await import("xlsx-js-style");
      const ws = XLSX.utils.json_to_sheet(materials.map((item, i) => ({ "Nr": i + 1, "Nazwa materialu": item.name, "Ilosc": item.quantity, "Jednostka": item.unit })));
      ws["!cols"] = [{ wch: 5 }, { wch: 50 }, { wch: 10 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Wyniki AI");
      const outName = `${(fileName || "analiza_ai").replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, outName);
      toast({ title: "Wyeksportowano do Excel", description: `Plik ${outName} pobrany` });
    } catch (err) { console.error("Export error:", err); toast({ title: "Blad eksportu", description: "Nie udalo sie wyeksportowac danych", variant: "destructive" }); }
  };

  const handleClearResults = () => {
    setMaterials([]); setSelectedMaterials(new Set()); setRawText(""); setError(""); setFileName(""); setFile(null);
    localStorage.removeItem("aiLabResults");
    toast({ title: "Wyczyszczono wyniki", description: "Mozesz przeprowadzic nowa analize" });
  };

  const handleAddToProject = () => {
    if (!selectedMaterialsList.length) { toast({ title: "Nie wybrano materialow", description: "Zaznacz co najmniej jeden material", variant: "destructive" }); return; }
    onOpen("addToProject", { materials: selectedMaterialsList, onSuccess: () => setSelectedMaterials(new Set()) });
  };

  const handleOpenQuickEstimate = async () => {
    if (!materials.length) { toast({ title: "Brak danych", description: "Najpierw wykonaj analize pliku", variant: "destructive" }); return; }
    setQuickEstimateOpen(true);
    setQeProjectName(fileName ? fileName.replace(/\.[^/.]+$/, "") : "Wycena z ES Import");
    try {
      const [regions, objectTypes] = await Promise.all([getRegionsForQuickEstimate(), getObjectTypesForQuickEstimate()]);
      setQeRegions(regions); setQeObjectTypes(objectTypes);
      if (regions.length && !qeRegionId) setQeRegionId(regions[0].id);
      if (objectTypes.length && !qeObjectTypeId) { setQeObjectTypeId(objectTypes[0].id); setQeVatRate(objectTypes[0].default_vat_rate || 23); }
    } catch (err) { console.error("Failed to load regions/object types:", err); }
  };

  const handleCreateQuickEstimate = async () => {
    if (!qeProjectName.trim()) { toast({ title: "Podaj nazwe projektu", variant: "destructive" }); return; }
    if (!qeRegionId || !qeObjectTypeId) { toast({ title: "Wybierz region i typ obiektu", variant: "destructive" }); return; }
    setQeLoading(true);
    try {
      const result = await createQuickEstimateFromMaterials({ materials, projectName: qeProjectName.trim(), regionId: qeRegionId, objectTypeId: qeObjectTypeId, vatRate: qeVatRate });
      if (result.success && result.projectId) {
        toast({ title: "Projekt utworzony!", description: `Dodano ${materials.length} pozycji (${result.matchedCount || 0} dopasowanych)` });
        setQuickEstimateOpen(false); router.push(`/dashboard/projects/${result.projectId}`);
      } else { toast({ title: "Blad", description: result.error || "Nie udalo sie utworzyc projektu", variant: "destructive" }); }
    } catch (err) { console.error("Quick estimate error:", err); toast({ title: "Nieoczekiwany blad", variant: "destructive" }); }
    finally { setQeLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!file) { toast({ title: "Brak pliku", description: "Najpierw wybierz plik", variant: "destructive" }); return; }
    setIsProcessing(true); setError(""); setMaterials([]);
    try {
      if (analysisMode === "vision") {
        toast({ title: "Konwersja PDF do obrazu...", description: `Renderowanie strony ${pageNumber}...` });
        const { convertPdfPageToImage } = await import("./pdfToImage");
        const imageBase64 = await convertPdfPageToImage(file, pageNumber);
        const sizeMB = imageBase64.length / 1024 / 1024;
        if (sizeMB > 4) throw new Error(`Obraz po konwersji jest za duzy (${sizeMB.toFixed(1)} MB). Sprobuj mniejszy plik.`);
        toast({ title: "Odczyt dokumentu...", description: `Silnik analizuje dokument (${sizeMB.toFixed(1)} MB)...` });
        const res = await fetch("/api/ai/vision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, instructions: instructions || undefined }) });
        const visionResult = await res.json();
        if (visionResult.success && visionResult.materials) {
          setMaterials(visionResult.materials); setRawText("");
          toast({ title: "Analiza zakonczona!", description: `Znaleziono ${visionResult.materials.length} pozycji` });
        } else {
          setError(visionResult.error || "Nieznany blad"); setRawText("");
          toast({ title: "Blad analizy", description: visionResult.error || "Nie udalo sie przetworzyc pliku", variant: "destructive" });
        }
      } else {
        toast({ title: "Analiza danych...", description: "Przetwarzanie arkusza..." });
        const formData = new FormData();
        formData.append("pdf", file); formData.append("instructions", instructions || "");
        const textResult = await parsePdfWithAi(formData);
        if (textResult.success && textResult.materials) {
          setMaterials(textResult.materials); setRawText(textResult.rawText || "");
          toast({ title: "Analiza zakonczona!", description: `Znaleziono ${textResult.materials.length} pozycji` });
        } else {
          setError(textResult.error || "Nieznany blad"); setRawText(textResult.rawText || "");
          toast({ title: "Blad analizy", description: textResult.error || "Nie udalo sie przetworzyc pliku", variant: "destructive" });
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const digest = (err as Error & { digest?: string })?.digest || "";
      if (msg.includes("413") || msg.includes("too large") || msg.includes("payload")) {
        setError("Plik za duzy dla serwera (max ~4 MB). Sprobuj mniejszy plik.");
        toast({ title: "Plik za duzy", description: "Maks ~4.5 MB.", variant: "destructive" });
      } else if (msg.includes("timeout") || msg.includes("504") || msg.includes("FUNCTION_INVOCATION_TIMEOUT")) {
        setError("Analiza trwala za dlugo (timeout). Sprobuj mniejszy plik.");
        toast({ title: "Timeout", description: "Analiza przekroczyla limit czasu.", variant: "destructive" });
      } else {
        setError(`Blad${digest ? ` [${digest}]` : ""}: ${msg}`);
        toast({ title: "Blad", description: "Wystapil nieoczekiwany blad podczas analizy", variant: "destructive" });
      }
    } finally { setIsProcessing(false); }
  };

  const activeTemplates = analysisMode === "vision" ? VISION_MODE_TEMPLATES : TEXT_MODE_TEMPLATES;


  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`p-2 rounded-xl shadow-lg ${analysisMode === "text" ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-600"}`}>
              {analysisMode === "text" ? <FileText className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">ES Import — Analiza Dokumentów</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Inteligentna analiza dokumentacji technicznej.</p>
            </div>
            <Badge variant="outline" className={`gap-1 text-[10px] ${analysisMode === "text" ? "bg-green-50 text-green-700 border-green-300" : "bg-orange-50 text-orange-700 border-orange-300"}`}>
              <Sparkles className="w-3 h-3" />v4.0
            </Badge>
          </div>
        </div>
        {!isPro && (
          <Alert className="mb-6 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <Lock className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold text-sm">Tryb demonstracyjny</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
              Analiza ES-Engine dostepna tylko w planie PRO.{" "}
              <button onClick={() => onOpen("proModal")} className="underline font-semibold">Zaktualizuj do PRO</button>
            </AlertDescription>
          </Alert>
        )}
        <Tabs value={analysisMode} onValueChange={(v) => handleModeChange(v as "text" | "vision")} className="mb-6">
          <TabsList className="grid w-full max-w-lg grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="text" className="gap-2 text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <FileText className="w-4 h-4" />Excel / CSV / TXT
            </TabsTrigger>
            <TabsTrigger value="vision" className="gap-2 text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <Eye className="w-4 h-4" />PDF (Kosztorysy / Faktury)
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {analysisMode === "text" ? (
          <Alert className="mb-6 border-green-300 bg-green-50/50 dark:bg-green-950/20">
            <FileText className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100 text-sm">Tryb Tekstowy (Excel i Dane)</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300 text-xs">
              Automatyczne przetwarzanie przedmiarow, list materialowych i cennikow. Idealne do importu Excela od klienta.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
            <Eye className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900 dark:text-orange-100 text-sm">Odczyt PDF (Kosztorysy i Dokumenty)</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300 text-xs">
              ES-Engine czyta tekst z PDF (w tym skanów), wyodrębnia nazwy materiałów, ilości i jednostki.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className={`lg:col-span-1 hover:shadow-md transition-shadow border-t-4 ${analysisMode === "text" ? "border-t-green-500" : "border-t-orange-500"}`}>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className={`w-5 h-5 ${analysisMode === "text" ? "text-green-600" : "text-orange-600"}`} />
                {analysisMode === "vision" ? "Wgraj PDF / Obraz" : "Wgraj Arkusz Excel / CSV"}
              </CardTitle>
              <CardDescription className="text-xs">
                {analysisMode === "vision" ? "Kosztorysy, faktury, specyfikacje (PDF, JPG, PNG)" : "Listy materialowe, przedmiary w Excelu, CSV"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-2">
              {file ? (
                <div className="space-y-4">
                  <div className={`p-6 rounded-xl border-2 ${analysisMode === "text" ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-green-300 dark:border-green-700" : "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border-orange-300 dark:border-orange-700"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${analysisMode === "text" ? "bg-green-500 text-white" : "bg-orange-500 text-white"}`}><CheckCircle2 className="w-8 h-8" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold ${analysisMode === "text" ? "text-green-800 dark:text-green-200" : "text-orange-800 dark:text-orange-200"}`}>Dokument gotowy do analizy</h3>
                        <p className={`text-sm font-medium mt-1 truncate ${analysisMode === "text" ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`} title={file.name}>{file.name}</p>
                        <p className={`text-xs mt-0.5 ${analysisMode === "text" ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>Rozmiar: {(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {isPdf(file.name) && (
                        <Button type="button" size="sm" variant="outline" onClick={() => { setPreviewUrl(URL.createObjectURL(file)); setPreviewOpen(true); }} className="gap-1.5 text-xs border-orange-400 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300">
                          <Eye className="w-3.5 h-3.5" />Podglad
                        </Button>
                      )}
                      <Input id="pdf-file-change" type="file" accept={analysisMode === "vision" ? ".pdf,.jpg,.jpeg,.png" : ".xlsx,.xls,.csv,.txt"} onChange={handleFileChange} disabled={isProcessing} className="hidden" />
                      <Label htmlFor="pdf-file-change" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800 transition-colors">
                        <Upload className="w-3.5 h-3.5" />Zmien plik
                      </Label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input id="pdf-file" type="file" accept={analysisMode === "vision" ? ".pdf,.jpg,.jpeg,.png" : ".xlsx,.xls,.csv,.txt"} onChange={handleFileChange} disabled={isProcessing} className="hidden" />
                  <Label htmlFor="pdf-file" className={`flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 ${analysisMode === "text" ? "border-green-300 hover:border-green-400" : "border-orange-300 hover:border-orange-400"}`}>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className={`p-3 rounded-full ${analysisMode === "text" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}><Upload className="w-6 h-6" /></div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kliknij, aby wybrac plik</p>
                      <p className="text-xs text-slate-500">{analysisMode === "vision" ? "PDF, JPG, PNG (max 20MB)" : "XLSX, XLS, CSV, TXT (max 4MB)"}</p>
                    </div>
                  </Label>
                </div>
              )}
              {analysisMode === "vision" && file && isPdf(file.name) && (
                <div className="space-y-2">
                  <Label htmlFor="pageNumber" className="text-xs font-medium">Numer strony do analizy</Label>
                  <Input id="pageNumber" type="number" min={1} value={pageNumber} onChange={(e) => setPageNumber(Math.max(1, parseInt(e.target.value) || 1))} disabled={isProcessing} className="max-w-32 text-xs h-9" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-xs font-medium">Instrukcje (opcjonalnie)</Label>
                <div className="relative">
                  <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Wybierz szablon lub wpisz wlasne instrukcje..." disabled={isProcessing} className="min-h-[80px] resize-none text-xs pr-10" />
                  <div className="absolute bottom-2 right-2">
                    <VoiceInputButton onTranscript={(text) => setInstructions((prev) => prev ? `${prev} ${text}` : text)} disabled={isProcessing} title="Podaj instrukcje glosem" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {activeTemplates.map((template, index) => (
                    <button key={index} className={`text-left p-2 rounded-md border border-slate-200 dark:border-slate-700 transition-colors ${analysisMode === "vision" ? "hover:bg-orange-50 hover:border-orange-400" : "hover:bg-green-50 hover:border-green-400"}`} onClick={() => setInstructions(template.text)}>
                      <p className="text-[10px] font-semibold text-slate-900 dark:text-slate-100">{template.label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{template.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={isPro ? handleAnalyze : () => onOpen("proModal")} disabled={isPro && (!file || isProcessing)} variant={isPro ? "ai" : "default"} className={isPro ? "w-full gap-2 shadow-md" : "w-full gap-2 bg-slate-400 hover:bg-slate-500 text-white"}>
                {!isPro ? (<><Lock className="w-5 h-5" />Analiza ES-Engine (Tylko PRO)<Crown className="w-4 h-4 ml-1" /></>)
                  : isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" />Analiza w toku...</>)
                  : (<><Brain className="w-5 h-5" />Analizuj przez ES-Engine</>)}
              </Button>
              {isProcessing && (
                <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-md flex items-center gap-2">
                  <Brain className="w-5 h-5 text-orange-600 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">Silnik analizuje dokument...</p>
                    <p className="text-[10px] text-orange-700 dark:text-orange-300">ES-Intelligence v2.1</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-1 hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-4 h-4 text-orange-600" />Jak to dziala?</CardTitle></CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {[{ s: "1", t: "Wgraj plik", d: analysisMode === "vision" ? "PDF konwertowany do obrazu" : "Excel, CSV lub TXT" }, { s: "2", t: "ES-Engine analizuje i wydobywa dane", d: "ES-Engine wydobywa pozycje kosztorysowe" }, { s: "3", t: "Gotowa lista materialow", d: "Nazwa, Ilosc, Jednostka — gotowe do eksportu" }].map(({ s, t, d }) => (
                <div key={s} className="flex items-start gap-2">
                  <div className="bg-orange-100 dark:bg-orange-950 rounded-full p-1.5 flex-shrink-0"><span className="text-xs font-bold text-orange-700 dark:text-orange-300">{s}</span></div>
                  <div><p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{t}</p><p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{d}</p></div>
                </div>
              ))}
              <div className="border-t pt-3 text-[10px] text-slate-500 dark:text-slate-400">
                <strong>Dostep:</strong> {isPro ? "Plan PRO (159 PLN/mies.)" : "Demo (5 prob/mies.)"}
              </div>
            </CardContent>
          </Card>
        </div>
        <AnalysisResults materials={materials} selectedMaterials={selectedMaterials} rawText={rawText} error={error} isRawOpen={isRawOpen} onToggleRaw={setIsRawOpen} onToggleSelect={toggleMaterialSelection} onToggleSelectAll={toggleSelectAll} onExportToExcel={handleExportToExcel} onAddToProject={handleAddToProject} onOpenQuickEstimate={handleOpenQuickEstimate} onClear={handleClearResults} />
        <Card className="mt-4 border-green-300 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div><p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">Jak uzyskac lepsze wyniki?</p>
              <ul className="text-[10px] text-green-700 dark:text-green-300 space-y-1">
                <li><strong>Excel/CSV:</strong> Pliki z wyrazna struktura kolumn daja najlepsze wyniki</li>
                <li><strong>PDF:</strong> Dokumenty z tekstem dzialaja dobrze nawet jako skany</li>
                <li><strong>Instrukcje:</strong> Podaj ES-Engine konkretne zadanie</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-4 border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div><p className="text-xs font-semibold text-orange-900 dark:text-orange-100 mb-1">Zawsze weryfikuj wyniki</p>
              <p className="text-[10px] text-orange-700 dark:text-orange-300">ES-Engine może pomylić ilości lub pominąć niektóre elementy. Sprawdzaj wyniki przed dodaniem do kosztorysu.</p>
            </div>
          </CardContent>
        </Card>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-2"><DialogTitle className="truncate text-base">{fileName}</DialogTitle><DialogDescription className="sr-only">Podgląd przesłanego dokumentu.</DialogDescription></DialogHeader>
            <div className="flex-1 min-h-0 px-6 pb-4 overflow-hidden">
              {previewUrl && isPdf(fileName) && <iframe src={previewUrl} title={fileName} className="w-full h-[65vh] rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />}
            </div>
            <DialogFooter className="px-6 pb-6 pt-2 border-t gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Zamknij</Button>
              <Button onClick={() => previewUrl && window.open(previewUrl, "_blank", "noopener,noreferrer")} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <ExternalLink className="w-4 h-4" />Otworz w nowej karcie
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={quickEstimateOpen} onOpenChange={setQuickEstimateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-orange-600" />Szybka Wycena z Dokumentu</DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">Utwórz nowy projekt z {materials.length} pozycjami.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label className="text-sm font-medium">Nazwa projektu</Label><Input value={qeProjectName} onChange={(e) => setQeProjectName(e.target.value)} placeholder="Np. Mieszkanie ul. Kwiatowa" className="text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-sm font-medium">Wojewodztwo</Label>
                  <Select value={qeRegionId} onValueChange={setQeRegionId}><SelectTrigger className="text-sm"><SelectValue placeholder="Wybierz region" /></SelectTrigger><SelectContent>{qeRegions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} ({r.price_modifier}x)</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label className="text-sm font-medium">Typ obiektu</Label>
                  <Select value={qeObjectTypeId} onValueChange={(val) => { setQeObjectTypeId(val); const ot = qeObjectTypes.find((o) => o.id === val); if (ot) setQeVatRate(ot.default_vat_rate || 23); }}><SelectTrigger className="text-sm"><SelectValue placeholder="Wybierz typ" /></SelectTrigger><SelectContent>{qeObjectTypes.map((ot) => <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label className="text-sm font-medium">Stawka VAT</Label>
                <Select value={String(qeVatRate)} onValueChange={(v) => setQeVatRate(Number(v))}><SelectTrigger className="text-sm max-w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="8">8% (mieszkalny)</SelectItem><SelectItem value="23">23% (komercyjny)</SelectItem></SelectContent></Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setQuickEstimateOpen(false)} disabled={qeLoading}>Anuluj</Button>
              <Button onClick={handleCreateQuickEstimate} disabled={qeLoading || !qeProjectName.trim() || !qeRegionId || !qeObjectTypeId} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                {qeLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Tworzenie...</> : <><Zap className="w-4 h-4" />Utworz projekt</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
