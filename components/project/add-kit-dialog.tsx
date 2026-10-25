"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { addKitToProject } from "@/app/dashboard/projects/[id]/kits-actions";
import { useTabSyncOptional } from "./tab-sync-context";
import type { KitWithItems } from "@/lib/types/database";

interface AddKitDialogProps {
  projectId: string;
  kitsByCategory: {
    categoryId: string | null;
    categoryName: string;
    kits: KitWithItems[];
  }[];
  isPro?: boolean;
}

export function AddKitDialog({ projectId, kitsByCategory, isPro = true }: AddKitDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<KitWithItems | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // UI Sync context for Following mode
  const tabSyncContext = useTabSyncOptional();

  // ─── Stable refs for tabSyncContext to avoid loops ─────────────────────
  const tabSyncSetUIStateRef = useRef(tabSyncContext?.setUIState);
  const tabSyncIsExternalSyncRef = useRef(tabSyncContext?.isExternalSync);
  tabSyncSetUIStateRef.current = tabSyncContext?.setUIState;
  tabSyncIsExternalSyncRef.current = tabSyncContext?.isExternalSync;

  // Sync dialog state with context (for Following mode)
  useEffect(() => {
    if (tabSyncContext?.isExternalSync) {
      const ui = tabSyncContext.uiState;

      // Dialog open/close
      const shouldBeOpen = ui?.openDialog === "addKit";
      if (shouldBeOpen !== open) {
        setOpen(shouldBeOpen);
      }
    }
  }, [
    tabSyncContext?.isExternalSync,
    tabSyncContext?.uiState?.openDialog,
  ]);

  // Broadcast dialog state changes to context
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) {
      tabSyncSetUIStateRef.current?.({
        openDialog: open ? "addKit" : null,
      });
    }
  }, [open]);

  const handleAddKit = async () => {
    if (!selectedKit) return;

    setIsAdding(true);

    try {
      const result = await addKitToProject(projectId, selectedKit.id, quantity);

      if (result.success) {
        toast({
          title: "Sukces!",
          description: `Dodano ${result.addedCount} pozycji z zestawu "${selectedKit.name}"`,
        });
        setOpen(false);
        setSelectedKit(null);
        setQuantity(1);
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

  // Calculate total for preview
  const calculateKitTotal = (kit: KitWithItems, qty: number) => {
    if (!kit.kit_items) return 0;
    return kit.kit_items.reduce((sum, item) => {
      const itemTotal = (item.labor_price + item.material_price) * item.quantity_multiplier;
      return sum + itemTotal * qty;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent">
          <Package className="w-4 h-4" />
          Dodaj Zestaw
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj Zestaw do Projektu</DialogTitle>
          <DialogDescription>
            Wybierz gotowy zestaw. Po dodaniu, rozbuduje się na pojedyncze pozycje.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Kits Grid by Category */}
          {kitsByCategory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Brak dostępnych zestawów</p>
            </div>
          ) : (
            <Tabs defaultValue={kitsByCategory[0]?.categoryName || "all"} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${kitsByCategory.length}, 1fr)` }}>
                {kitsByCategory.map((category) => (
                  <TabsTrigger key={category.categoryId || "uncategorized"} value={category.categoryName}>
                    {category.categoryName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {kitsByCategory.map((category) => (
                <TabsContent key={category.categoryId || "uncategorized"} value={category.categoryName} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.kits.map((kit) => (
                      <Card
                        key={kit.id}
                        className={`cursor-pointer transition-all ${selectedKit?.id === kit.id
                            ? "border-blue-500 border-2 shadow-md"
                            : "hover:shadow-lg hover:border-blue-200"
                          }`}
                        onClick={() => setSelectedKit(kit)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{kit.name}</CardTitle>
                            {selectedKit?.id === kit.id && (
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {kit.description || "Kompletny zestaw gotowy do dodania"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Zawiera:</span>
                              <Badge variant="secondary">
                                {kit.kit_items?.length || 0} pozycji
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {kit.kit_items?.map((item, idx) => (
                                <div key={item.id}>
                                  • {item.item_name} ({item.quantity_multiplier}x)
                                </div>
                              )).slice(0, 3)}
                              {(kit.kit_items?.length || 0) > 3 && (
                                <div className="text-blue-600">+ więcej...</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Selected Kit Details & Quantity */}
          {selectedKit && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Wybrany zestaw: {selectedKit.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quantity Input */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Ilość zestawów:
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24"
                  />
                </div>

                {/* Kit Items Preview */}
                <div>
                  <p className="text-sm font-medium mb-2">Zostanie dodane:</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {selectedKit.kit_items?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          • {item.item_name} ({item.quantity_multiplier * quantity} {item.item_unit})
                        </span>
                        <span className="font-medium">
                          {isPro ? `${((item.labor_price + item.material_price) * item.quantity_multiplier * quantity).toFixed(2)} zł` : '*** zł'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-semibold">Wartość zestawu:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {isPro ? `${calculateKitTotal(selectedKit, quantity).toFixed(2)} zł` : '*** zł'}
                  </span>
                </div>

                {/* Add Button */}
                <Button
                  onClick={handleAddKit}
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
                      Dodaj {quantity}x "{selectedKit.name}"
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
