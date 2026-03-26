"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createCatalogItem, updateCatalogItem } from "./actions";
import type { CatalogItem } from "./actions";
import { AutocompleteItemInput } from "@/components/catalog/autocomplete-item-input";
import type { KnrSelectedItem } from "@/components/catalog/autocomplete-item-input";
import type { Team } from "@/lib/types/database";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItem | null;
  categories: { id: string; name: string }[];
  userTeam?: Team | null;
  isPro?: boolean;
}

export function ItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  userTeam,
  isPro = false,
}: ItemDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roundPrice = (v: number | null | undefined): string | number =>
    v == null ? "" : Math.round(v * 100) / 100;

  const [formData, setFormData] = useState<{
    name: string;
    unit: string;
    base_labor_price: string | number;
    base_material_price: string | number;
    category_id: string;
    visibility: "personal" | "team";
  }>({
    name: item?.name || "",
    unit: item?.unit || "szt",
    base_labor_price: roundPrice(item?.base_labor_price),
    base_material_price: roundPrice(item?.base_material_price),
    category_id: item?.category_id || "",
    visibility: (item?.visibility as "personal" | "team") || "personal",
  });

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        unit: item.unit,
        base_labor_price: roundPrice(item.base_labor_price),
        base_material_price: roundPrice(item.base_material_price),
        category_id: item.category_id || "",
        visibility: (item.visibility as "personal" | "team") || "personal",
      });
    } else {
      setFormData({
        name: "",
        unit: "szt",
        base_labor_price: "",
        base_material_price: "",
        category_id: "",
        visibility: "personal",
      });
    }
  }, [item]); // Re-run when item changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        toast({
          title: "Błąd",
          description: "Nazwa pozycji jest wymagana",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare data for submission (convert strings to numbers)
      const submitData: {
        name: string;
        unit: string;
        base_labor_price: number;
        base_material_price: number;
        category_id: string;
        visibility?: "personal" | "team";
        team_id?: string;
      } = {
        name: formData.name,
        unit: formData.unit,
        base_labor_price: typeof formData.base_labor_price === "string" 
          ? parseFloat(formData.base_labor_price) || 0 
          : formData.base_labor_price,
        base_material_price: typeof formData.base_material_price === "string" 
          ? parseFloat(formData.base_material_price) || 0 
          : formData.base_material_price,
        category_id: formData.category_id,
        visibility: formData.visibility,
      };

      // Add team_id if team visibility
      if (formData.visibility === "team" && userTeam?.id) {
        submitData.team_id = userTeam.id;
      }

      if (item) {
        // Update existing item
        await updateCatalogItem(item.id, submitData);
        toast({
          title: "Sukces",
          description: "Pozycja została zaktualizowana",
        });
      } else {
        // Create new item
        await createCatalogItem(submitData);
        toast({
          title: "Sukces",
          description: formData.visibility === "team" 
            ? "Pozycja została dodana i udostępniona zespołowi"
            : "Pozycja została dodana",
        });
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać pozycji",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {item ? "Edytuj Pozycję" : "Dodaj Nową Pozycję"}
            </DialogTitle>
            <DialogDescription>
              {item
                ? "Wprowadź zmiany w pozycji katalogowej"
                : "Uzupełnij dane nowej pozycji katalogowej"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name with Autocomplete */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa pozycji *</Label>
              <AutocompleteItemInput
                id="name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                onItemSelect={(selectedItem: KnrSelectedItem) => {
                  setFormData({
                    ...formData,
                    name: selectedItem.name,
                    unit: selectedItem.unit,
                  });
                }}
                placeholder="np. Gniazdo wtyczkowe 230V"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zacznij pisać, aby zobaczyć podpowiedzi z Bazy KNR
              </p>
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Kategoria</Label>
              <Select
                name="category"
                value={formData.category_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez kategorii</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="grid gap-2">
              <Label htmlFor="unit">Jednostka *</Label>
              <Select
                name="unit"
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="szt">szt (sztuka)</SelectItem>
                  <SelectItem value="mb">mb (metr bieżący)</SelectItem>
                  <SelectItem value="m2">m² (metr kwadratowy)</SelectItem>
                  <SelectItem value="kpl">kpl (komplet)</SelectItem>
                  <SelectItem value="godz">godz (godzina)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Labor Price */}
            <div className="grid gap-2">
              <Label htmlFor="labor_price">Cena Robocizna (PLN)</Label>
              <Input
                id="labor_price"
                name="labor_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_labor_price}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    base_labor_price: value === "" ? "" : value,
                  });
                }}
                onFocus={(e) => e.target.select()}
              />
            </div>

            {/* Material Price */}
            <div className="grid gap-2">
              <Label htmlFor="material_price">Cena Materiał (PLN)</Label>
              <Input
                id="material_price"
                name="material_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_material_price}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    base_material_price: value === "" ? "" : value,
                  });
                }}
                onFocus={(e) => e.target.select()}
              />
            </div>

            {/* Team Visibility Toggle - only show if user is in a team */}
            {userTeam && (
              <div className="grid gap-2 pt-2 border-t">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Udostępnij zespołowi
                </Label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    {formData.visibility === "team" ? (
                      <>
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">
                          Widoczne dla: <strong>{userTeam.name}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Tylko dla mnie
                        </span>
                      </>
                    )}
                  </div>
                  <Switch
                    id="item-visibility-toggle"
                    name="item-visibility-toggle"
                    aria-label="Udostępnij zespółowi"
                    checked={formData.visibility === "team"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        visibility: checked ? "team" : "personal",
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {item ? "Zapisz Zmiany" : "Dodaj Pozycję"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
