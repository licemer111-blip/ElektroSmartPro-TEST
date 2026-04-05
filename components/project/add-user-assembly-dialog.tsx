"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Loader2, Plus, Sparkles, Cable } from "lucide-react";
import { addUserAssemblyToProject } from "@/app/dashboard/projects/[id]/actions";
import { AssemblyList } from "@/components/assemblies/assembly-list";
import { AssemblyModal } from "@/components/assemblies/assembly-modal";

import type { UserAssemblyWithItems } from "@/lib/types/database";
import { useModalStore } from "@/hooks/use-modal-store";
import { cn } from "@/lib/utils";
import { useTabSyncOptional } from "./tab-sync-context";
import { notifyDataChanged } from "@/hooks/use-synced-action";

interface AddUserAssemblyDialogProps {
  projectId: string;
  isPro?: boolean;
  currentAssemblyCount?: number;
  className?: string;
  projectStatus?: string;
  showOnboardingPulse?: boolean;
}

type ViewMode = "list" | "create";

export function AddUserAssemblyDialog({ projectId, isPro = false, currentAssemblyCount = 0, className, projectStatus = "draft", showOnboardingPulse = false }: AddUserAssemblyDialogProps) {
  const isFinal = projectStatus === "final";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  // UI Sync context for Following mode
  const tabSyncContext = useTabSyncOptional();

  // ─── Stable refs for tabSyncContext to avoid loops ─────────────────────
  const tabSyncSetUIStateRef = useRef(tabSyncContext?.setUIState);
  const tabSyncIsExternalSyncRef = useRef(tabSyncContext?.isExternalSync);
  tabSyncSetUIStateRef.current = tabSyncContext?.setUIState;
  tabSyncIsExternalSyncRef.current = tabSyncContext?.isExternalSync;

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showAssemblyModal, setShowAssemblyModal] = useState(false);
  const [assemblyModalMode, setAssemblyModalMode] = useState<"create" | "edit" | "duplicate">("create");
  const [editingAssembly, setEditingAssembly] = useState<UserAssemblyWithItems | undefined>(undefined);
  const [selectedAssembly, setSelectedAssembly] = useState<UserAssemblyWithItems | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cableLength, setCableLength] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [listRefreshTrigger, setListRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { onOpen } = useModalStore();

  // Sync ALL assembly dialog states with context (for Following mode)
  useEffect(() => {
    if (tabSyncContext?.isExternalSync) {
      const ui = tabSyncContext.uiState;
      
      // Dialog open/close
      const shouldBeOpen = ui?.openDialog === "addAssembly";
      if (shouldBeOpen !== open) {
        setOpen(shouldBeOpen);
      }
      
      // View mode (list/detail)
      if (ui?.assemblyViewMode && ui.assemblyViewMode !== viewMode) {
        setViewMode(ui.assemblyViewMode);
      }
      
      // Assembly detail modal
      if (ui?.assemblyDetailOpen !== undefined && ui.assemblyDetailOpen !== showAssemblyModal) {
        setShowAssemblyModal(ui.assemblyDetailOpen);
      }
      
      // Quantity
      if (ui?.assemblyQuantity !== undefined && ui.assemblyQuantity !== quantity) {
        setQuantity(ui.assemblyQuantity);
      }
    }
  }, [
    tabSyncContext?.isExternalSync,
    tabSyncContext?.uiState?.openDialog,
    tabSyncContext?.uiState?.assemblyViewMode,
    tabSyncContext?.uiState?.assemblyDetailOpen,
    tabSyncContext?.uiState?.assemblyQuantity,
  ]);

  // Broadcast ALL assembly dialog state changes to context
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) {
      tabSyncSetUIStateRef.current?.({
        openDialog: open ? "addAssembly" : null,
        assemblyViewMode: viewMode,
        assemblyDetailOpen: showAssemblyModal,
        assemblyQuantity: quantity,
        assemblySelectedId: selectedAssembly?.id || null,
      });
    }
  }, [open, viewMode, showAssemblyModal, quantity, selectedAssembly?.id]);

  const handleAddAssembly = async () => {
    if (!selectedAssembly) return;
    if (isFinal) {
      toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby dodawać zestawy", variant: "destructive" });
      return;
    }

    setIsAdding(true);

    try {
      const result = await addUserAssemblyToProject(
        projectId,
        selectedAssembly.id,
        quantity,
        cableLength && cableLength > 0 ? cableLength : undefined
      );

      if (result.success) {
        toast({
          title: "Sukces!",
          description: `Dodano ${result.addedCount} pozycji z zestawu "${selectedAssembly.name}"`,
        });
        setOpen(false);
        setSelectedAssembly(null);
        setQuantity(1);
        setCableLength(null);
        setViewMode("list");
        // ⚡ SYNC: Notify other users about the change
        notifyDataChanged("assembly-added");
        // ⚡ AUTO-REFRESH: Update UI immediately
        router.refresh();
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się dodać zestawu",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Błąd",
        description: "Nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAssemblyModalClose = () => {
    setShowAssemblyModal(false);
    setAssemblyModalMode("create");
    setEditingAssembly(undefined);
    setViewMode("list");
    // Trigger refresh of the assemblies list
    setListRefreshTrigger(prev => prev + 1);
  };

  const handleEditAssembly = (assembly: UserAssemblyWithItems) => {
    setEditingAssembly(assembly);
    setAssemblyModalMode("edit");
    setShowAssemblyModal(true);
  };

  const handleDuplicateAssembly = (assembly: UserAssemblyWithItems) => {
    setEditingAssembly(assembly);
    setAssemblyModalMode("duplicate");
    setShowAssemblyModal(true);
  };

  const calculateAssemblyTotal = (assembly: UserAssemblyWithItems, qty: number, cable?: number | null) => {
    if (!assembly.user_assembly_items) return 0;
    return assembly.user_assembly_items.reduce((sum, item) => {
      const isCable = item.unit === "mb" || item.unit === "m";
      const baseQty = (isCable && cable && cable > 0) ? cable * item.quantity : item.quantity;
      return sum + item.price * baseQty * qty;
    }, 0);
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (newOpen && isFinal) {
      toast({
        title: "🔒 Projekt zablokowany",
        description: "Odblokuj projekt, aby dodawać zestawy do kosztorysu",
        variant: "destructive",
      });
      return;
    }
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setViewMode("list");
      setSelectedAssembly(null);
      setQuantity(1);
      setCableLength(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
        <div
          className={cn("relative inline-flex", showOnboardingPulse && "after:absolute after:inset-0 after:rounded-md after:ring-2 after:ring-blue-400 after:animate-ping after:opacity-60")}
          title={showOnboardingPulse ? "Zacznij tutaj: dodaj gotowy zestaw (gniazdko, kabel, montaż) jednym kliknięciem!" : "Gotowe pakiety montażowe (np. puszka + kabel + gniazdo). Przyspieszają dodawanie pozycji do kosztorysu."}
          onClick={() => { if (!isFinal) setOpen(true); }}
        >
          <Button className={cn("gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent h-8 text-xs", isFinal && "opacity-50 cursor-not-allowed", className)}>
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Dodaj Zestaw</span>
            <span className="sm:hidden">Zestaw</span>
          </Button>
        </div>
        <DialogContent className="!w-full !max-w-full !bottom-0 !top-auto !left-0 !right-0 !translate-x-0 !translate-y-0 !rounded-t-2xl !rounded-b-none sm:!w-[95vw] sm:!max-w-5xl sm:!bottom-auto sm:!top-[50%] sm:!left-[50%] sm:!right-auto sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!rounded-lg max-h-[92vh] overflow-y-auto bg-background p-4 sm:p-6">
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center mb-2 -mt-1">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>
        <DialogHeader>
          <DialogTitle>
            {viewMode === "create" ? "Utwórz Nowy Zestaw" : "Dodaj Własny Zestaw"}
          </DialogTitle>
          <DialogDescription>
            {viewMode === "create"
              ? "Stwórz własny zestaw, który będziesz mógł wielokrotnie wykorzystać w projektach"
              : "Wybierz zestaw z Twojej biblioteki lub utwórz nowy"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {viewMode === "list" ? (
            <>
              {/* Header with Create & AI Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Twoje własne zestawy instalacyjne
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // Demo Mode: Limit to 1 assembly for free users
                      if (!isPro && currentAssemblyCount >= 1) {
                        onOpen('proModal');
                        setOpen(false); // Close current dialog
                        return;
                      }
                      setAssemblyModalMode("create");
                      setEditingAssembly(undefined);
                      setShowAssemblyModal(true);
                    }}
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Stwórz nowy
                  </Button>
                </div>
              </div>

              {/* Assembly List */}
              <AssemblyList
                onSelect={setSelectedAssembly}
                selectedAssemblyId={selectedAssembly?.id}
                refreshTrigger={listRefreshTrigger}
                onEdit={handleEditAssembly}
                onDuplicate={handleDuplicateAssembly}
              />

              {/* Selected Assembly Details & Quantity */}
              {selectedAssembly && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        Wybrany zestaw: {selectedAssembly.name}
                      </h3>
                      {selectedAssembly.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAssembly.description}
                        </p>
                      )}
                    </div>

                    {/* Quantity Input */}
                    <div className="flex items-center gap-4">
                      <Label htmlFor="assembly-quantity" className="text-sm font-medium">
                        Ilość zestawów:
                      </Label>
                      <Input
                        id="assembly-quantity"
                        name="assembly-quantity"
                        type="number"
                        min="1"
                        max="999"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-24"
                      />
                    </div>

                    {/* Cable Length Input — shown when assembly has cable items */}
                    {selectedAssembly.user_assembly_items?.some(
                      (item) => item.unit === "mb" || item.unit === "m"
                    ) && (
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <Cable className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                          <Label htmlFor="assembly-cable-length" className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            Długość trasy kablowej (mb)
                          </Label>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Ilość metrów przewodu zostanie przeliczona automatycznie
                          </p>
                        </div>
                        <Input
                          id="assembly-cable-length"
                          name="assembly-cable-length"
                          type="number"
                          min="0"
                          step="0.5"
                          max="9999"
                          value={cableLength ?? ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setCableLength(isNaN(val) ? null : Math.max(0, val));
                          }}
                          placeholder="np. 25"
                          className="w-28"
                        />
                      </div>
                    )}

                    {/* Items Preview */}
                    <div>
                      <p className="text-sm font-medium mb-2">Zostanie dodane:</p>
                      <div className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                        {selectedAssembly.user_assembly_items?.map((item) => {
                          const isCable = item.unit === "mb" || item.unit === "m";
                          const baseQty = (isCable && cableLength && cableLength > 0)
                            ? cableLength * item.quantity
                            : item.quantity;
                          const finalQty = quantity * baseQty;
                          return (
                            <div key={item.id} className="flex justify-between">
                              <span>
                                • {item.name} ({finalQty} {item.unit})
                                {isCable && cableLength && cableLength > 0 && (
                                  <Badge variant="outline" className="ml-1 text-[10px] border-amber-300 text-amber-700">
                                    {cableLength}m
                                  </Badge>
                                )}
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {item.type === "material" ? "Materiał" : "Robocizna"}
                                </Badge>
                              </span>
                              <span className="font-medium">
                                {isPro ? `${(item.price * finalQty).toFixed(2)} zł` : '*** zł'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Wartość zestawu:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {isPro ? `${calculateAssemblyTotal(selectedAssembly, quantity, cableLength).toFixed(2)} zł` : '*** zł'}
                      </span>
                    </div>

                    {/* Add Button */}
                    <Button
                      onClick={handleAddAssembly}
                      disabled={isAdding}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
                      size="lg"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Dodawanie...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj {quantity}x "{selectedAssembly.name}"
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>

      {/* Assembly Modal for Creating/Editing/Duplicating Assembly */}
      <AssemblyModal
        isOpen={showAssemblyModal}
        onClose={handleAssemblyModalClose}
        mode={assemblyModalMode}
        assembly={editingAssembly}
      />
    </Dialog>
  );
}
