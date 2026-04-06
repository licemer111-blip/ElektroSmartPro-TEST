"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import {
  updateProjectItem, deleteProjectItem, duplicateProjectItem,
  addChildToAssembly,
} from "@/app/dashboard/projects/[id]/actions";
import { learnKnrMapping } from "@/app/actions/es-engine-learn";
import { getAutoLearning } from "@/hooks/use-engine-calibration";
import { syncZestawChildren } from "@/app/dashboard/projects/[id]/zestaw-actions";
import type { ProjectItem, UnitType } from "@/lib/types/database";
import type { EditingState } from "@/components/project/estimate/EstimateRow";
import React from "react";

export interface AddChildState {
  parentId: string;
  name: string;
  unit: string;
  quantity: string;
  materialPrice: string;
  laborPrice: string;
}

export interface UseEstimateActionsParams {
  projectId: string;
  localItems: ProjectItem[];
  setLocalItems: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
  isFinal: boolean;
}

export function useEstimateActions({
  projectId,
  localItems,
  setLocalItems,
  isFinal,
}: UseEstimateActionsParams) {
  const { toast } = useToast();
  const router = useRouter();

  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<AddChildState | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<ProjectItem | null>(null);

  const pendingDeleteRef = useRef<{ timer: ReturnType<typeof setTimeout>; itemId: string } | null>(null);

  // ─── Stable refs for mutable values used inside callbacks ─────────────────
  const localItemsRef = useRef(localItems);
  const isFinalRef = useRef(isFinal);
  const setLocalItemsRef = useRef(setLocalItems);
  const editingStateRef = useRef(editingState);
  const addingChildToRef = useRef(addingChildTo);
  localItemsRef.current = localItems;
  isFinalRef.current = isFinal;
  setLocalItemsRef.current = setLocalItems;
  editingStateRef.current = editingState;
  addingChildToRef.current = addingChildTo;

  // ─── Edit handlers ────────────────────────────────────────────────────────
  const startEdit = useCallback((item: ProjectItem) => {
    if (isFinalRef.current) {
      toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby edytować pozycje", variant: "destructive" });
      return;
    }
    const li = localItemsRef.current;
    const rawMat = item.final_material_price ?? item.material_price ?? 0;
    const rawLab = item.final_labor_price ?? item.labor_price ?? 0;
    // Always show material and labor separately — round to 2dp to avoid float artifacts (e.g. 12.469999)
    const round2 = (v: number) => Math.round(v * 100) / 100;
    setEditingState({
      itemId: item.id,
      name: item.name,
      quantity: String(round2(item.quantity)),
      unit: item.unit,
      materialPrice: String(round2(rawMat)),
      laborPrice: String(round2(rawLab)),
      section: item.section || "",
      isAssemblyParent: li.some((i) => i.parent_assembly_id === item.id),
    });
  }, [toast]);

  const cancelEdit = useCallback(() => setEditingState(null), []);

  const saveEdits = useCallback(async () => {
    const editingState = editingStateRef.current;
    if (!editingState) return;
    const quantity = parseFloat(editingState.quantity);
    const materialPrice =
      editingState.materialPrice.trim() === "" ? 0 : parseFloat(editingState.materialPrice);
    const laborPrice =
      editingState.laborPrice.trim() === "" ? 0 : parseFloat(editingState.laborPrice);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Błąd", description: "Ilość musi być liczbą większą od 0", variant: "destructive" });
      return;
    }
    if (!editingState.isAssemblyParent) {
      if (isNaN(materialPrice) || materialPrice < 0) {
        toast({ title: "Błąd", description: "Cena materiału musi być liczbą nieujemną", variant: "destructive" });
        return;
      }
      if (isNaN(laborPrice) || laborPrice < 0) {
        toast({ title: "Błąd", description: "Cena robocizny musi być liczbą nieujemną", variant: "destructive" });
        return;
      }
    }
    if (!editingState.name.trim()) {
      toast({ title: "Błąd", description: "Nazwa nie może być pusta", variant: "destructive" });
      return;
    }
    if (!editingState.unit.trim()) {
      toast({ title: "Błąd", description: "Jednostka nie może być pusta", variant: "destructive" });
      return;
    }
    const sectionValue = editingState.section.trim() || null;
    const unitValue = editingState.unit.trim() as UnitType;
    // Detect manual price entry: if user changed price to non-zero value
    const hasNonZeroPrice = materialPrice > 0 || laborPrice > 0;
    const updates = editingState.isAssemblyParent
      ? { name: editingState.name.trim(), quantity, unit: unitValue, section: sectionValue }
      : {
          name: editingState.name.trim(),
          quantity,
          unit: unitValue,
          final_material_price: materialPrice,
          final_labor_price: laborPrice,
          section: sectionValue,
          ...(hasNonZeroPrice ? { confidence_level: "manual" as const, labor_norm: null } : {}),
        };
    const sli = setLocalItemsRef.current;
    const snapshot = [...localItemsRef.current];
    const editedId = editingState.itemId;
    sli((prev) =>
      prev.map((item) => (item.id === editedId ? ({ ...item, ...updates } as ProjectItem) : item))
    );
    setEditingState(null);
    const result = await updateProjectItem(projectId, editedId, updates);
    if (result?.error) {
      sli(snapshot);
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      notifyDataChanged("item-updated");

      // ── Linked editing: sync assembly children qty when parent qty changes ──────
      const originalItem = snapshot.find((i) => i.id === editedId);
      if (
        editingState!.isAssemblyParent &&
        originalItem &&
        originalItem.quantity !== quantity &&
        // Check metadata.recipe_key (post-migration) or legacy notes _r: prefix
        ((originalItem.metadata as { recipe_key?: string } | null)?.recipe_key ||
          (originalItem.notes?.includes("_r:") ?? false))
      ) {
        syncZestawChildren(projectId, editedId, quantity)
          .catch(() => { /* non-critical — children will be stale until manual fix */ });
      }

      // ── ES-Engine Auto-Learning ──────────────────────────────────────────────────────────────────────
      // If user renamed a row that already had a KNR code, teach the engine
      // the original (uncorrected) name → KNR mapping for future imports.
      const nameChanged = originalItem && originalItem.name !== editingState!.name.trim();
      if (nameChanged && originalItem?.knr_code && getAutoLearning()) {
        learnKnrMapping({
          originalName: originalItem.name,
          resolvedKnr: originalItem.knr_code,
          unit: originalItem.unit,
          laborNormRbh: originalItem.labor_norm ?? null,
        })
          .then((r) => {
            if (r.success) {
              toast({
                title: "🧠 ES-Engine zapamiętał tę pozycję",
                description: `"${originalItem.name}" → ${originalItem.knr_code}`,
                duration: 2500,
              });
            }
          })
          .catch(() => { /* silent — learning is non-critical */ });
      }
    }
  }, [projectId, toast]);

  // ─── Mobile save ──────────────────────────────────────────────────────────
  const handleMobileSaveEdit = useCallback((
    id: string,
    updates: Parameters<typeof updateProjectItem>[2]
  ) => {
    setLocalItemsRef.current((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...updates } as ProjectItem) : item))
    );
    updateProjectItem(projectId, id, updates);
  }, [projectId]);

  // ─── Child management ─────────────────────────────────────────────────────
  const startAddChild = useCallback((parentId: string) => {
    if (isFinalRef.current) {
      toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby dodawać pozycje", variant: "destructive" });
      return;
    }
    setAddingChildTo({ parentId, name: "", unit: "szt", quantity: "1", materialPrice: "0", laborPrice: "0" });
  }, [toast]);

  const cancelAddChild = useCallback(() => setAddingChildTo(null), []);

  const saveAddChild = useCallback(async () => {
    const addingChildTo = addingChildToRef.current;
    if (!addingChildTo) return;
    if (!addingChildTo.name.trim()) {
      toast({ title: "Błąd", description: "Nazwa nie może być pusta", variant: "destructive" });
      return;
    }
    const result = await addChildToAssembly(projectId, addingChildTo.parentId, {
      name: addingChildTo.name.trim(),
      unit: addingChildTo.unit.trim() || "szt",
      quantity: parseFloat(addingChildTo.quantity) || 1,
      materialPrice: parseFloat(addingChildTo.materialPrice) || 0,
      laborPrice: parseFloat(addingChildTo.laborPrice) || 0,
    });
    if (result?.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "✅ Dodano", description: "Pozycja została dodana do zestawu" });
      setAddingChildTo(null);
      notifyDataChanged("item-added");
      router.refresh();
    }
  }, [projectId, toast, router]);

  // ─── Delete with undo (5s) ────────────────────────────────────────────────
  const handleDelete = useCallback(async (item: ProjectItem) => {
    const sli = setLocalItemsRef.current;
    const li = localItemsRef.current;
    if (isFinalRef.current) {
      toast({ title: "Projekt zablokowany", description: "Odblokuj projekt, aby usunąć pozycje", variant: "destructive" });
      setDeleteDialogItem(null);
      return;
    }
    setDeleteDialogItem(null);
    const snapshot = [...li];
    const idsToRemove = new Set([
      item.id,
      ...li.filter((i) => i.parent_assembly_id === item.id).map((i) => i.id),
    ]);
    sli((prev) => prev.filter((i) => !idsToRemove.has(i.id)));
    if (pendingDeleteRef.current) clearTimeout(pendingDeleteRef.current.timer);
    const timer = setTimeout(async () => {
      pendingDeleteRef.current = null;
      const result = await deleteProjectItem(projectId, item.id);
      if (result?.error) {
        sli(snapshot);
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        notifyDataChanged("item-deleted");
        router.refresh();
      }
    }, 5000);
    pendingDeleteRef.current = { timer, itemId: item.id };
    toast({
      title: "🗑️ Usunięto pozycję",
      description: item.name,
      duration: 5000,
      action: (
        <button
          className="inline-flex items-center justify-center h-7 px-2 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50 bg-white"
          onClick={() => {
            if (pendingDeleteRef.current?.itemId === item.id) {
              clearTimeout(pendingDeleteRef.current.timer);
              pendingDeleteRef.current = null;
            }
            sli(snapshot);
          }}
        >
          Cofnij
        </button>
      ),
    });
  }, [projectId, toast, router]);

  const handleDuplicate = useCallback(async (item: ProjectItem) => {
    const result = await duplicateProjectItem(projectId, item.id);
    if (result?.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "✅ Skopiowano", description: "Pozycja została zduplikowana" });
      notifyDataChanged("item-duplicated");
      router.refresh();
    }
  }, [projectId, toast, router]);

  return {
    editingState, setEditingState,
    addingChildTo, setAddingChildTo,
    deleteDialogItem, setDeleteDialogItem,
    pendingDeleteRef,
    startEdit, cancelEdit, saveEdits,
    handleMobileSaveEdit,
    startAddChild, cancelAddChild, saveAddChild,
    handleDelete, handleDuplicate,
  };
}
