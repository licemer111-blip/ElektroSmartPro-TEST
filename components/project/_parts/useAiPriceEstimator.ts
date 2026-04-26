"use client";

import { useState, useTransition, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSingleAiQuota } from "@/hooks/use-ai-quota";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { useToast } from "@/hooks/use-toast";
import {
  estimatePricesWithAI,
  applyAiPrices,
} from "@/app/dashboard/projects/[id]/ai-actions";
import type { AiPriceEstimate } from "@/app/dashboard/projects/[id]/ai-actions";

export type PriceMode = "material" | "labor" | "all";
export type EstimatorStep = "choose" | "loading" | "preview" | "done";

interface UseAiPriceEstimatorProps {
  projectId: string;
  projectStatus?: string;
  selectedRowIds?: Set<string>;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function useAiPriceEstimator({
  projectId,
  projectStatus = "draft",
  selectedRowIds,
  externalOpen,
  onExternalOpenChange,
}: UseAiPriceEstimatorProps) {
  const [open, setOpen] = useState(false);
  const prevExternalOpen = { current: undefined as boolean | undefined };

  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== prevExternalOpen.current) {
      prevExternalOpen.current = externalOpen;
      setOpen(externalOpen);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpen]);

  const [step, setStep] = useState<EstimatorStep>("choose");
  const [mode, setMode] = useState<PriceMode>("all");
  const [estimates, setEstimates] = useState<AiPriceEstimate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEstimating, startEstimate] = useTransition();
  const [isApplying, startApply] = useTransition();
  const [appliedCount, setAppliedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<AiPriceEstimate | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [manualMatchItemId, setManualMatchItemId] = useState<string | null>(null);
  const [manualMatchSearch, setManualMatchSearch] = useState<string>("");
  const [allPhase, setAllPhase] = useState<"labor" | "material" | null>(null);
  const [pendingData, setPendingData] = useState<{ estimates: AiPriceEstimate[]; initialSelectedIds: Set<string> } | null>(null);
  const [fullCatalog, setFullCatalog] = useState<Array<{ name: string; mat: number; lab: number; score: number }> | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // v2.7.1 — atomic in-flight refs (prevent triple-Wyceń race observed in audit logs).
  // useTransition's isEstimating/isApplying flags are NOT synchronous — between
  // user click and React re-render the button can still register another click.
  // Refs flip immediately and survive across React's batching window.
  const estimateInFlightRef = useRef(false);
  const applyInFlightRef = useRef(false);
  // Hash of the last successfully applied payload — reject identical re-applies
  // within ESTIMATE_LOCKOUT_MS to prevent the audit-logged "Apply #3 zeroes again"
  // pattern (user re-clicks Wyceń+Zastosuj on a stale empty result set).
  const lastAppliedHashRef = useRef<string | null>(null);
  const lastAppliedAtRef = useRef<number>(0);

  const { toast } = useToast();
  const { info: quotaInfo, refresh: refreshQuota } = useSingleAiQuota(userId, AI_FUNCTION_NAMES.aiPricing);

  const isFinal = projectStatus === "final";
  const hasSelectedRows = (selectedRowIds?.size ?? 0) > 0;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const openManualMatch = useCallback(async (itemId: string) => {
    setManualMatchSearch("");
    setManualMatchItemId(prev => (prev === itemId ? null : itemId));
    if (!fullCatalog && !isLoadingCatalog) {
      setIsLoadingCatalog(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("catalog_items")
            .select("name, base_material_price, base_labor_price")
            .eq("user_id", user.id)
            .order("name");
          if (data) {
            setFullCatalog(data.map((r) => ({
              name: r.name,
              mat: r.base_material_price ?? 0,
              lab: r.base_labor_price ?? 0,
              score: 0,
            })));
          }
        }
      } finally {
        setIsLoadingCatalog(false);
      }
    }
  }, [fullCatalog, isLoadingCatalog]);

  const handleRepriced = useCallback((updated: AiPriceEstimate) => {
    setRefreshingIds((prev) => { const s = new Set(prev); s.delete(updated.itemId); return s; });
    setEstimates((prev) => prev.map((e) => e.itemId === updated.itemId ? updated : e));
    setSelectedIds((prev) => new Set([...prev, updated.itemId]));
  }, []);

  const handleEstimate = useCallback((selectedMode: PriceMode) => {
    if (isFinal) {
      toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby wyceniać pozycje", variant: "destructive" });
      return;
    }
    // v2.7.1 atomic guard — prevents concurrent estimate runs even when React's
    // useTransition hasn't yet flipped isEstimating to true.
    if (estimateInFlightRef.current) return;
    estimateInFlightRef.current = true;
    setMode(selectedMode);
    setStep("loading");
    setError(null);
    setAllPhase(null);

    const targetItemIds = hasSelectedRows && selectedRowIds
      ? Array.from(selectedRowIds)
      : undefined;

    startEstimate(async () => {
      // ── Single-pass: material-only or labor-only ───────────────────────────────
      if (selectedMode !== "all") {
        const singleStart = Date.now();
        const result = await estimatePricesWithAI(projectId, selectedMode, { targetItemIds });
        if (result.success && result.estimates) {
          // Ensure animation has time to step through all phases (6 steps × 1.8s = 10.8s)
          const MIN_SINGLE_MS = selectedMode === "material" ? 7500 : 10500;
          const elapsed = Date.now() - singleStart;
          if (elapsed < MIN_SINGLE_MS) {
            await new Promise<void>((r) => setTimeout(r, MIN_SINGLE_MS - elapsed));
          }
          const ids = new Set(
            result.estimates
              .filter((e) => !e.isAmbiguous && e.trace !== "unmatched")
              .map((e) => e.itemId)
          );
          setPendingData({ estimates: result.estimates, initialSelectedIds: ids });
        } else {
          setError(result.error || "Błąd wyceny");
          setStep("choose");
        }
        return;
      }

      // ── "Wyceń wszystko": Phase 1 (Labor KNR) → Phase 2 (Material fill) ────────
      setAllPhase("labor");
      const laborStart = Date.now();
      const laborResult = await estimatePricesWithAI(projectId, "labor", { targetItemIds });
      if (!laborResult.success || !laborResult.estimates) {
        setError(laborResult.error || "Błąd wyceny robocizny");
        setStep("choose");
        setAllPhase(null);
        return;
      }

      // Ensure labor animation completes all 6 steps (6 × 1800ms = 10.8s)
      const MIN_LABOR_MS = 10500;
      const laborElapsed = Date.now() - laborStart;
      if (laborElapsed < MIN_LABOR_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_LABOR_MS - laborElapsed));
      }

      // Phase 2: only items that came back with 0 material (not pure-labor, not unmatched)
      setAllPhase("material");
      const materialStart = Date.now();
      const zeroMatIds = laborResult.estimates
        .filter((e) => e.suggestedMaterial === 0 && e.trace !== "unmatched" && !e.isAmbiguous)
        .map((e) => e.itemId);

      let finalEstimates = laborResult.estimates;

      if (zeroMatIds.length > 0) {
        const matResult = await estimatePricesWithAI(projectId, "material", { targetItemIds: zeroMatIds });
        if (matResult.success && matResult.estimates) {
          const matMap = new Map(matResult.estimates.map((e) => [e.itemId, e]));
          finalEstimates = laborResult.estimates.map((e) => {
            const matE = matMap.get(e.itemId);
            if (!matE || matE.suggestedMaterial <= 0) return e;
            return {
              ...e,
              suggestedMaterial: matE.suggestedMaterial,
              matSource: matE.matSource,
              note: e.note
                .replace(" · ⚠️ brak ceny mat. w KNR — dodaj do własnego katalogu", "")
                + (matE.matSource === "ai-market" ? " | ~rynk." : ""),
            };
          });
        }
        // Material phase failure is non-critical — labor results still shown
      }

      // Ensure material animation completes all 4 steps (4 × 1800ms = 7.2s)
      const MIN_MATERIAL_MS = 7500;
      const materialElapsed = Date.now() - materialStart;
      if (materialElapsed < MIN_MATERIAL_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_MATERIAL_MS - materialElapsed));
      }

      const finalIds = new Set(
        finalEstimates
          .filter((e) => !e.isAmbiguous && e.trace !== "unmatched")
          .map((e) => e.itemId)
      );
      // NOTE: setAllPhase(null) is intentionally NOT called here.
      // onAnimationComplete handles it after the animation finishes.
      setPendingData({ estimates: finalEstimates, initialSelectedIds: finalIds });
    });
  }, [isFinal, hasSelectedRows, selectedRowIds, projectId, refreshQuota, toast]);

  // Release in-flight estimate guard when transition finishes (success OR error).
  // useTransition pending flag transitions true → false on completion.
  useEffect(() => {
    if (!isEstimating && estimateInFlightRef.current) {
      // small grace window so React state reconciliation finishes before next click
      const t = setTimeout(() => { estimateInFlightRef.current = false; }, 150);
      return () => clearTimeout(t);
    }
  }, [isEstimating]);

  const onAnimationComplete = useCallback(() => {
    if (!pendingData) return;
    setEstimates(pendingData.estimates);
    setSelectedIds(pendingData.initialSelectedIds);
    setPendingData(null);
    setAllPhase(null);
    setStep("preview");
    void refreshQuota();
  }, [pendingData, refreshQuota]);

  const handleApply = useCallback(() => {
    // v2.7.1 atomic guard — prevents the triple-Apply race observed in audit logs
    // where two rapid clicks both hit applyAiPrices() before the first one returned.
    if (applyInFlightRef.current) return;

    const toApply = estimates
      .filter((e) => selectedIds.has(e.itemId) && e.trace !== "unmatched")
      .map((e) => ({
        itemId: e.itemId,
        material_price: e.suggestedMaterial,
        labor_price: e.suggestedLabor,
        unit: undefined,
        knr_code: e.knrCode ?? undefined,
        knr_source: e.knrSource ?? undefined,
        labor_norm: e.laborNorm ?? undefined,
        labor_hours_total: e.laborHoursTotal ?? undefined,
        suggested_norm: e.suggestedNorm ?? undefined,
        note: e.note ?? undefined,
        expert_override:   e.expert_override,
        is_low_confidence: e.isLowConfidence,
        calculation_log:   e.calculationLog,
        confidence_level: e.trace === "unmatched"
          ? ("unmatched" as const)
          : e.confidence === "high" ? ("verified" as const)
          : e.confidence === "medium" ? ("analog" as const)
          : ("estimated" as const),
      }));

    if (toApply.length === 0) {
      toast({ title: "Brak zaznaczonych pozycji", variant: "destructive" });
      return;
    }

    // v2.7.1 zero-apply guard — if EVERY row would write material=0 AND labor=0
    // (stale/empty estimate result), refuse to overwrite existing DB values.
    // Root cause from audit logs: Wyceń pipeline returned empty estimates twice
    // (Apply #1 and Apply #3), zeroing out the correct values written by Apply #2.
    const allZero = toApply.every(
      (r) => (r.material_price ?? 0) === 0 && (r.labor_price ?? 0) === 0,
    );
    if (allZero) {
      toast({
        title: "⚠️ Wszystkie ceny = 0 zł",
        description: "Wycena nie zwróciła danych. Uruchom 'Wyceń' ponownie, aby uniknąć nadpisania poprawnych cen zerami.",
        variant: "destructive",
      });
      return;
    }

    // v2.7.1 same-payload re-apply guard — if user clicks Apply twice with
    // identical payload within 5 seconds, treat second click as no-op.
    const payloadHash = JSON.stringify(
      toApply
        .map((r) => `${r.itemId}:${r.material_price}:${r.labor_price}`)
        .sort(),
    );
    const ESTIMATE_LOCKOUT_MS = 5000;
    const sinceLast = Date.now() - lastAppliedAtRef.current;
    if (
      lastAppliedHashRef.current === payloadHash &&
      sinceLast < ESTIMATE_LOCKOUT_MS
    ) {
      toast({
        title: "Już zastosowano te ceny",
        description: "Aby ponownie wycenić, kliknij 'Wyceń ponownie'.",
        duration: 2500,
      });
      return;
    }

    applyInFlightRef.current = true;

    startApply(async () => {
      try {
        const result = await applyAiPrices(projectId, toApply as Parameters<typeof applyAiPrices>[1]);
        if (result.success) {
          lastAppliedHashRef.current = payloadHash;
          lastAppliedAtRef.current = Date.now();
          setAppliedCount(result.updatedCount);
          toast({ title: `✅ Zastosowano ceny dla ${result.updatedCount} pozycji`, duration: 3000 });
          // Stay on preview — remove applied items, keep unmatched/ambiguous for further work
          const appliedIds = new Set(toApply.map((e) => e.itemId));
          setEstimates((prev) => prev.filter((e) => !appliedIds.has(e.itemId)));
          setSelectedIds(new Set());
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("ai-prices-applied", {
              detail: { projectId, prices: toApply },
            }));
          }, 0);
        } else {
          toast({ title: "Błąd", description: result.error, variant: "destructive" });
        }
      } finally {
        // Release after a short grace so subsequent state updates settle.
        setTimeout(() => { applyInFlightRef.current = false; }, 200);
      }
    });
  }, [estimates, selectedIds, projectId, toast]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const nonAmbiguous = estimates.filter((e) => !e.isAmbiguous && e.trace !== "unmatched");
    const allSelected = nonAmbiguous.every((e) => selectedIds.has(e.itemId));
    setSelectedIds(allSelected ? new Set() : new Set(nonAmbiguous.map((e) => e.itemId)));
  }, [estimates, selectedIds]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onExternalOpenChange?.(false);
    setStep("choose");
    setEstimates([]);
    setSelectedIds(new Set());
    setError(null);
    setAppliedCount(0);
    setAllPhase(null);
    setPendingData(null);
  }, [onExternalOpenChange]);

  const applyCertainOnly = useCallback(() => {
    setSelectedIds(new Set(
      estimates
        .filter(e => !e.isAmbiguous && (e.confidence === "high" || e.confidence === "medium"))
        .map(e => e.itemId)
    ));
  }, [estimates]);

  const applyManualMatch = useCallback((itemId: string, cand: { name: string; mat: number; lab: number }) => {
    setEstimates(prev => prev.map(e =>
      e.itemId === itemId
        ? { ...e, suggestedMaterial: cand.mat, suggestedLabor: cand.lab, confidence: "high" as const, note: `P1 (ręczne): Twój katalog → ${cand.name}`, knrSource: "catalog-l1" as const, isAmbiguous: false }
        : e
    ));
    setSelectedIds(prev => new Set([...prev, itemId]));
    setManualMatchItemId(null);
  }, []);

  const handleEstimateAmbiguousAsPercent = useCallback((pct: number) => {
    const clearTotal = estimates.filter((e) => !e.isAmbiguous).reduce((s, e) => s + e.suggestedMaterial * e.quantity, 0);
    const perAmbiguous = clearTotal > 0 ? Math.round((clearTotal * pct / 100) * 100) / 100 : 0;
    setEstimates((prev) =>
      prev.map((e) =>
        e.isAmbiguous
          ? { ...e, suggestedMaterial: perAmbiguous, suggestedLabor: 0, isAmbiguous: false, note: `Szacunek ${pct}% sumy materiałów (${clearTotal.toFixed(0)} zł × ${pct}%)` }
          : e
      )
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      estimates.filter((e) => e.isAmbiguous).forEach((e) => next.add(e.itemId));
      return next;
    });
  }, [estimates]);

  const selectedSummary = useMemo(() => {
    const sel = estimates.filter(e => selectedIds.has(e.itemId));
    const totalMat = sel.reduce((s, e) => s + e.suggestedMaterial * e.quantity, 0);
    const totalLab = sel.reduce((s, e) => s + e.suggestedLabor * e.quantity, 0);
    return { totalMat, totalLab, total: totalMat + totalLab };
  }, [estimates, selectedIds]);

  const ambiguousCount = useMemo(() => estimates.filter((e) => e.isAmbiguous).length, [estimates]);
  const unmatchedCount = useMemo(() => estimates.filter((e) => e.trace === "unmatched").length, [estimates]);
  const pricedCount = useMemo(() => estimates.filter((e) => !e.isAmbiguous && e.trace !== "unmatched").length, [estimates]);

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    if (isFinal) {
      e.preventDefault();
      e.stopPropagation();
      toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby użyć ES-Engine wyceny", variant: "destructive" });
      return;
    }
    setOpen(true);
  }, [isFinal, toast]);

  return {
    open, setOpen,
    step, setStep,
    mode,
    estimates, setEstimates,
    selectedIds, setSelectedIds,
    isEstimating, isApplying,
    appliedCount,
    error,
    quotaInfo,
    detailModalItem, setDetailModalItem,
    refreshingIds, setRefreshingIds,
    manualMatchItemId, setManualMatchItemId,
    manualMatchSearch, setManualMatchSearch,
    fullCatalog,
    isLoadingCatalog,
    // computed
    isFinal, hasSelectedRows,
    ambiguousCount, unmatchedCount, pricedCount,
    selectedSummary,
    // handlers
    handleEstimate,
    handleApply,
    handleClose,
    toggleItem,
    toggleAll,
    applyCertainOnly,
    applyManualMatch,
    openManualMatch,
    handleRepriced,
    handleEstimateAmbiguousAsPercent,
    handleTriggerClick,
    allPhase,
    pendingData,
    onAnimationComplete,
  };
}
