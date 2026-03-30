"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useSingleAiQuota } from "@/hooks/use-ai-quota";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { analyzeExcelStructure } from "@/app/dashboard/projects/[id]/excel-analyze-action";
import { importItemsFromExcel } from "@/app/dashboard/projects/[id]/actions";
import {
  dialogReducer,
  INITIAL_STATE,
  type AIProjectItem,
  type ParsedRow,
  type ExcelRow,
} from "@/components/project/ai-import-dialog-reducer";
import {
  parseExcelFile,
  parseCSVFile,
  parseRawGrid,
  smartParseExcel,
  applyColumnMap,
  parsePrzedmiarText,
  parseTableOrText,
} from "@/lib/project-import-utils";

interface UseProjectImportOptions {
  projectId: string;
  onImport: (items: AIProjectItem[]) => Promise<{ success?: boolean; error?: string; count?: number }>;
}

export function useProjectImport({ projectId, onImport }: UseProjectImportOptions) {
  const [state, dispatch] = useReducer(dialogReducer, INITIAL_STATE);

  const [userId, setUserId] = useReducer(
    (_: string | null, id: string | null) => id,
    null
  );

  const { info: quotaInfo, refresh: refreshQuota } = useSingleAiQuota(userId, AI_FUNCTION_NAMES.aiImportProject);
  const { info: visionQuotaInfo, refresh: refreshVisionQuota } = useSingleAiQuota(userId, AI_FUNCTION_NAMES.aiVision);
  const { info: cleanQuotaInfo, refresh: refreshCleanQuota } = useSingleAiQuota(userId, AI_FUNCTION_NAMES.cleanPrzedmiar);

  const przedmiarFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const reset = useCallback(() => { dispatch({ type: "RESET" }); }, []);

  // ─── Plik Import (Excel/CSV → smart parse, zero prices) ───────────────────────────

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_FILE_NAME", payload: file.name });

    // .txt files: use text parser (parsePrzedmiarText), not XLSX binary reader
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt") {
      try {
        const text = await file.text();
        const items = parsePrzedmiarText(text);
        if (items.length === 0) {
          dispatch({ type: "SET_ERROR", payload: "Nie rozpoznano żadnych pozycji w pliku TXT" });
          return;
        }
        dispatch({ type: "SET_AI_ITEMS", payload: items });
        dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(items.map((_, i) => i)) });
        dispatch({ type: "SET_STEP", payload: "preview" });
        toast.success(`ES-Engine 2: rozpoznano ${items.length} pozycji z pliku TXT`);
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Błąd odczytu pliku TXT" });
      }
      e.target.value = "";
      return;
    }

    dispatch({ type: "SET_STEP", payload: "analyzing" });

    try {
      const json = await parseRawGrid(file);
      if (json.length < 2) {
        dispatch({ type: "SET_ERROR", payload: "Plik jest pusty lub zawiera tylko nagłówki" });
        dispatch({ type: "SET_STEP", payload: "upload" });
        return;
      }

      const hdrs = json[0].map(String);
      const rawData = json.slice(1).filter(row => row.some(cell => String(cell).trim() !== ""));

      dispatch({ type: "SET_EXCEL_ANALYZING", payload: true });
      let aiMap = null;
      try { aiMap = await analyzeExcelStructure(hdrs, rawData.slice(0, 10)); } catch { /* fallback */ }
      dispatch({ type: "SET_EXCEL_ANALYZING", payload: false });

      const data = (aiMap && !aiMap.hasHeaders)
        ? json.filter(row => row.some(cell => String(cell).trim() !== ""))
        : rawData;

      let parsed: ExcelRow[];
      if (aiMap && aiMap.nameIdx >= 0) {
        parsed = applyColumnMap(aiMap, data);
      } else {
        parsed = smartParseExcel(hdrs, data);
      }

      if (parsed.length === 0) {
        dispatch({ type: "SET_ERROR", payload: "Nie rozpoznano żadnych pozycji w pliku" });
        dispatch({ type: "SET_STEP", payload: "upload" });
        return;
      }

      // Zero prices — user prices manually or via ES Wycena
      const items: AIProjectItem[] = parsed.map(r => ({
        name: r.name,
        unit: r.unit,
        quantity: r.quantity,
        material_price: 0,
        labor_price: 0,
      }));

      dispatch({ type: "SET_AI_ITEMS", payload: items });
      dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(items.map((_, i) => i)) });
      dispatch({ type: "SET_STEP", payload: "preview" });
      toast.success(`ES-Engine 2: rozpoznano ${items.length} pozycji z pliku ${file.name}`);
    } catch (err: unknown) {
      dispatch({ type: "SET_EXCEL_ANALYZING", payload: false });
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "Błąd odczytu pliku" });
      dispatch({ type: "SET_STEP", payload: "upload" });
    }

    e.target.value = "";
  }, []);

  // ─── PDF / Vision ─────────────────────────────────────────────────────────

  const handlePdfAnalyze = useCallback(async () => {
    const { pdfFile, pdfPageNumber, pdfInstructions } = state;

    if (!pdfFile) {
      toast.error("Wybierz plik PDF lub zdjęcie");
      return;
    }
    if (visionQuotaInfo?.isExhausted) {
      dispatch({ type: "SET_ERROR", payload: `Limit AI Vision wyczerpany (${visionQuotaInfo.used}/${visionQuotaInfo.limit}). Zresetuje się w przyszłym miesiącu.` });
      return;
    }

    dispatch({ type: "SET_PDF_ANALYZING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    const isImage = /\.(jpg|jpeg|png)$/i.test(pdfFile.name);
    const allOcrItems: AIProjectItem[] = [];

    try {
      if (isImage) {
        // Single image — one API call
        const buffer = await pdfFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        bytes.forEach(b => { binary += String.fromCharCode(b); });
        const imageBase64 = btoa(binary);

        const res = await fetch("/api/ai/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, instructions: pdfInstructions?.trim() || undefined }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          dispatch({ type: "SET_ERROR", payload: errBody.error || `Błąd serwera: ${res.status}` });
          return;
        }
        const result = await res.json();
        if (result.success && result.materials?.length > 0) {
          allOcrItems.push(...result.materials.map((m: { name: string; unit: string; quantity: number; knr_code?: string | null }) => ({
            name: m.name, unit: m.unit || "szt", quantity: m.quantity || 1,
            material_price: 0, labor_price: 0,
            knr_code: m.knr_code || null,
          })));
        }
      } else {
        // PDF — scan every page from 1 to pdfPageNumber
        let convertFn: (file: File, page: number) => Promise<string>;
        try {
          const mod = await import("@/app/dashboard/ai-lab/pdfToImage");
          convertFn = mod.convertPdfPageToImage;
        } catch {
          dispatch({ type: "SET_ERROR", payload: "Nie udało się załadować konwertera PDF." });
          dispatch({ type: "SET_PDF_ANALYZING", payload: false });
          return;
        }

        for (let page = 1; page <= pdfPageNumber; page++) {
          dispatch({ type: "SET_PDF_PROGRESS", payload: { current: page, total: pdfPageNumber } });
          let imageBase64: string;
          try {
            imageBase64 = await convertFn(pdfFile, page);
          } catch (convErr) {
            dispatch({ type: "SET_ERROR", payload: convErr instanceof Error && convErr.message.includes("password")
              ? "PDF jest zaszyfrowany — usuń hasło i spróbuj ponownie."
              : `Nie udało się odczytać strony ${page}. Sprawdź czy plik nie jest uszkodzony.` });
            dispatch({ type: "SET_PDF_ANALYZING", payload: false });
            return;
          }

          try {
            const res = await fetch("/api/ai/vision", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64, instructions: pdfInstructions?.trim() || undefined }),
            });
            if (!res.ok) {
              if (page === 1) {
                const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                dispatch({ type: "SET_ERROR", payload: errBody.error || `Błąd serwera: ${res.status}` });
                dispatch({ type: "SET_PDF_ANALYZING", payload: false });
                return;
              }
              continue;
            }
            const result = await res.json();
            if (result.success && result.materials?.length > 0) {
              allOcrItems.push(...result.materials.map((m: { name: string; unit: string; quantity: number; knr_code?: string | null }) => ({
                name: m.name, unit: m.unit || "szt", quantity: m.quantity || 1,
                material_price: 0, labor_price: 0,
                knr_code: m.knr_code || null,
              })));
            }
          } catch {
            if (page === 1) {
              dispatch({ type: "SET_ERROR", payload: "Błąd połączenia z ES-Engine 2. Sprawdź internet i spróbuj ponownie." });
              dispatch({ type: "SET_PDF_ANALYZING", payload: false });
              return;
            }
          }
        }
      }

      if (allOcrItems.length > 0) {
        dispatch({ type: "SET_AI_ITEMS", payload: allOcrItems });
        dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(allOcrItems.map((_, i) => i)) });
        dispatch({ type: "SET_STEP", payload: "preview" });
        void refreshVisionQuota();
        toast.success(`ES-Engine 2: rozpoznano ${allOcrItems.length} pozycji${!isImage ? ` z ${pdfPageNumber} stron PDF` : ""}`);
      } else {
        dispatch({ type: "SET_ERROR", payload: "ES-Engine 2 nie rozpoznał żadnych pozycji w dokumencie" });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Błąd połączenia z ES-Engine 2. Sprawdź internet i spróbuj ponownie.${err instanceof Error ? ` (${err.message.slice(0, 60)})` : ""}` });
    } finally {
      dispatch({ type: "SET_PDF_ANALYZING", payload: false });
      dispatch({ type: "SET_PDF_PROGRESS", payload: null });
    }
  }, [state, visionQuotaInfo, refreshVisionQuota]);

  // ─── Przedmiar: AI cleanup ────────────────────────────────────────────────

  const handleCleanPrzedmiar = useCallback(async () => {
    const { przedmiarText } = state;
    if (!przedmiarText.trim()) {
      toast.error("Wklej tekst do uporządkowania");
      return;
    }
    if (cleanQuotaInfo?.isExhausted) {
      toast.error(`Limit AI Cleanup wyczerpany (${cleanQuotaInfo.used}/${cleanQuotaInfo.limit})`);
      return;
    }
    dispatch({ type: "SET_PRZEDMIAR_CLEANING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const { cleanPrzedmiarWithAi } = await import("@/app/dashboard/projects/[id]/clean-przedmiar-action");
      const result = await cleanPrzedmiarWithAi(przedmiarText);
      if (result.success && result.items && result.items.length > 0) {
        const hasKnr = result.items.some(i => i.knr_code);
        if (hasKnr) {
          const aiItems: AIProjectItem[] = result.items.map(i => ({
            name: i.name, unit: i.unit, quantity: i.quantity,
            material_price: 0, labor_price: 0, knr_code: i.knr_code || null,
          }));
          dispatch({ type: "SET_AI_ITEMS", payload: aiItems });
          dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(aiItems.map((_, idx) => idx)) });
          dispatch({ type: "SET_STEP", payload: "preview" });
        } else {
          const cleaned = result.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join("\n");
          dispatch({ type: "SET_PRZEDMIAR_TEXT", payload: cleaned });
          dispatch({ type: "SET_PRZEDMIAR_CLEANUP_DONE", payload: true });
        }
        void refreshCleanQuota();
        toast.success(`ES-Engine 2 uporządkował ${result.items.length} pozycji`);
      } else {
        toast.error(result.error || "ES-Engine 2 nie rozpoznało pozycji");
      }
    } catch {
      toast.error("Błąd podczas porządkowania struktury");
    } finally {
      dispatch({ type: "SET_PRZEDMIAR_CLEANING", payload: false });
    }
  }, [state, cleanQuotaInfo, refreshCleanQuota]);

  // ─── Przedmiar: parse text → preview ─────────────────────────────────────

  const handleParsePrzedmiar = useCallback(() => {
    const { przedmiarText } = state;
    if (!przedmiarText.trim()) {
      toast.error("Wklej listę pozycji");
      return;
    }
    const items = parseTableOrText(przedmiarText);
    if (items.length === 0) {
      toast.error("Nie rozpoznano żadnych pozycji");
      return;
    }
    dispatch({ type: "SET_AI_ITEMS", payload: items });
    dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(items.map((_, i) => i)) });
    dispatch({ type: "SET_STEP", payload: "preview" });
  }, [state]);

  // ─── Przedmiar: file upload ───────────────────────────────────────────────

  const handlePrzedmiarFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "xlsx" || ext === "xls" || ext === "csv" || ext === "tsv") {
        const json = await parseRawGrid(file);
        if (json.length < 1) { toast.error("Plik jest pusty"); return; }

        const hdrs = json[0].map(String);
        const rawData = json.slice(1).filter(row => row.some(cell => String(cell).trim() !== ""));

        dispatch({ type: "SET_EXCEL_ANALYZING", payload: true });
        let aiMap = null;
        try { aiMap = await analyzeExcelStructure(hdrs, rawData.slice(0, 10)); } catch { /* fallback */ }
        dispatch({ type: "SET_EXCEL_ANALYZING", payload: false });

        const data = (aiMap && !aiMap.hasHeaders)
          ? json.filter(row => row.some(cell => String(cell).trim() !== ""))
          : rawData;

        let excelRows: ExcelRow[];
        if (aiMap && aiMap.nameIdx >= 0) {
          excelRows = applyColumnMap(aiMap, data);
        } else {
          excelRows = smartParseExcel(hdrs, data);
        }

        if (excelRows.length === 0) { toast.error("Nie rozpoznano żadnych pozycji"); return; }

        const items: AIProjectItem[] = excelRows.map(r => ({
          name: r.name, unit: r.unit, quantity: r.quantity,
          material_price: r.materialPrice, labor_price: r.laborPrice,
          knr_code: r.knr_code || null,
        }));

        dispatch({ type: "SET_AI_ITEMS", payload: items });
        dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(items.map((_, i) => i)) });
        dispatch({ type: "SET_STEP", payload: "preview" });
        toast.success(`Rozpoznano ${items.length} pozycji z pliku`);
      } else {
        const text = await file.text();
        dispatch({ type: "SET_PRZEDMIAR_TEXT", payload: text });
        const items = parseTableOrText(text);
        if (items.length > 0) {
          dispatch({ type: "SET_AI_ITEMS", payload: items });
          dispatch({ type: "SET_SELECTED_ITEMS", payload: new Set(items.map((_, i) => i)) });
          dispatch({ type: "SET_STEP", payload: "preview" });
          toast.success(`Rozpoznano ${items.length} pozycji z pliku`);
        } else {
          toast.error("Nie rozpoznano żadnych pozycji");
        }
      }
    } catch {
      dispatch({ type: "SET_EXCEL_ANALYZING", payload: false });
      toast.error("Błąd odczytu pliku");
    }

    e.target.value = "";
  }, []);

  // ─── Excel smart-parse ────────────────────────────────────────────────────

  const handleExcelFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_FILE_NAME", payload: file.name });

    try {
      const json = await parseRawGrid(file);
      if (json.length < 2) { toast.error("Plik jest pusty lub zawiera tylko nagłówki"); return; }

      const hdrs = json[0].map(String);
      const rawData = json.slice(1).filter(row => row.some(cell => String(cell).trim() !== ""));
      dispatch({ type: "SET_EXCEL_HEADERS", payload: hdrs });

      dispatch({ type: "SET_EXCEL_ANALYZING", payload: true });
      let aiMap = null;
      try { aiMap = await analyzeExcelStructure(hdrs, rawData.slice(0, 10)); } catch { /* fallback */ }
      dispatch({ type: "SET_EXCEL_ANALYZING", payload: false });

      const data = (aiMap && !aiMap.hasHeaders)
        ? json.filter(row => row.some(cell => String(cell).trim() !== ""))
        : rawData;

      let parsed: ExcelRow[];
      if (aiMap && aiMap.nameIdx >= 0) {
        parsed = applyColumnMap(aiMap, data);
        const conf = aiMap.confidence === "high" ? "✓" : "~";
        toast.success(`ES-Engine 2: rozpoznano ${parsed.length} pozycji (pewność: ${aiMap.confidence})`);
      } else {
        parsed = smartParseExcel(hdrs, data);
        toast.success(`Rozpoznano ${parsed.length} pozycji (algorytm)`);
      }

      if (parsed.length === 0) { toast.error("Nie rozpoznano żadnych pozycji w pliku"); return; }
      dispatch({ type: "SET_EXCEL_PARSED_ROWS", payload: parsed });
      dispatch({ type: "SET_STEP", payload: "preview" });
    } catch {
      dispatch({ type: "SET_EXCEL_ANALYZING", payload: false });
      toast.error("Nie udało się odczytać pliku");
    }
    e.target.value = "";
  }, []);

  // ─── Excel import (direct to Supabase) ───────────────────────────────────

  const handleExcelImport = useCallback(async () => {
    const { excelParsedRows } = state;
    const validRows = excelParsedRows.filter(r => r.valid);
    if (validRows.length === 0) { toast.error("Brak poprawnych pozycji"); return; }
    dispatch({ type: "SET_EXCEL_IMPORTING", payload: true });
    try {
      const result = await importItemsFromExcel(projectId, validRows.map(r => ({
        name: r.name, unit: r.unit, quantity: r.quantity,
        materialPrice: r.materialPrice, laborPrice: r.laborPrice,
        section: r.section || undefined,
        knrCode: r.knr_code || undefined,
      })));
      if (result.error) { toast.error(result.error); dispatch({ type: "SET_EXCEL_IMPORTING", payload: false }); return; }
      dispatch({ type: "SET_IMPORT_COUNT", payload: result.addedCount || validRows.length });
      dispatch({ type: "SET_STEP", payload: "done" });
    } catch { toast.error("Wystąpił nieoczekiwany błąd"); }
    dispatch({ type: "SET_EXCEL_IMPORTING", payload: false });
  }, [state, projectId]);

  // ─── AI items import (via onImport callback) ──────────────────────────────

  const handleImport = useCallback(async () => {
    const { aiItems, selectedItems } = state;
    const items = aiItems.filter((_, i) => selectedItems.has(i));
    if (items.length === 0) { toast.error("Wybierz pozycje do zaimportowania"); return; }

    dispatch({ type: "SET_STEP", payload: "importing" });
    try {
      const result = await onImport(items);
      if (result.success) {
        dispatch({ type: "SET_IMPORT_COUNT", payload: result.count || items.length });
        dispatch({ type: "SET_STEP", payload: "done" });
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error || "Błąd importu" });
        dispatch({ type: "SET_STEP", payload: "preview" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Wystąpił nieoczekiwany błąd" });
      dispatch({ type: "SET_STEP", payload: "preview" });
    }
  }, [state, onImport]);

  const handleImportWithoutPrices = useCallback(async () => {
    const { aiItems, selectedItems } = state;
    const items = aiItems
      .filter((_, i) => selectedItems.has(i))
      .map(item => ({ ...item, material_price: 0, labor_price: 0 }));
    if (items.length === 0) { toast.error("Wybierz pozycje do zaimportowania"); return; }

    dispatch({ type: "SET_STEP", payload: "importing" });
    try {
      const result = await onImport(items);
      if (result.success) {
        dispatch({ type: "SET_IMPORT_COUNT", payload: result.count || items.length });
        dispatch({ type: "SET_STEP", payload: "done" });
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error || "Błąd importu" });
        dispatch({ type: "SET_STEP", payload: "preview" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Wystąpił nieoczekiwany błąd" });
      dispatch({ type: "SET_STEP", payload: "preview" });
    }
  }, [state, onImport]);

  // ─── Item manipulation ────────────────────────────────────────────────────

  const toggleItem = useCallback((index: number) => {
    dispatch({ type: "TOGGLE_ITEM", payload: index });
  }, []);

  const toggleAll = useCallback(() => {
    dispatch({ type: "TOGGLE_ALL" });
  }, []);

  const removeItem = useCallback((index: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: index });
  }, []);

  const updateItem = useCallback((index: number, field: keyof AIProjectItem, value: string | number) => {
    dispatch({ type: "UPDATE_ITEM", payload: { index, field, value } });
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────

  const selectedCount = state.aiItems.filter((_, i) => state.selectedItems.has(i)).length;
  const excelValidCount = state.excelParsedRows.filter(r => r.valid).length;
  const excelInvalidCount = state.excelParsedRows.filter(r => !r.valid).length;

  return {
    state,
    dispatch,
    // Quota
    quotaInfo,
    visionQuotaInfo,
    cleanQuotaInfo,
    // Refs
    przedmiarFileRef,
    pdfFileRef,
    // Handlers
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
    // Derived
    selectedCount,
    excelValidCount,
    excelInvalidCount,
  };
}
