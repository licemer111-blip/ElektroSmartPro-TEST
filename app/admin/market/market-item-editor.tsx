"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { updateMarketIntelligence, type AdminMarketItem } from "./actions";
import type { MarketSentiment, ConfidenceLevel, MarketCommentType } from "@/lib/types/database";

interface MarketItemEditorProps {
  item: AdminMarketItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketItemEditor({ item, open, onOpenChange }: MarketItemEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    base_labor_price: item.base_labor_price.toString(),
    base_material_price: item.base_material_price.toString(),
    price_min: item.price_min?.toString() || "",
    price_max: item.price_max?.toString() || "",
    price_trend: item.price_trend,
    confidence_level: item.confidence_level,
    confidence_reason: item.confidence_reason || "",
    market_comment: item.market_comment || "",
    market_comment_type: item.market_comment_type || "material_cost",
  });

  // Update form when item changes
  useEffect(() => {
    setFormData({
      base_labor_price: item.base_labor_price.toString(),
      base_material_price: item.base_material_price.toString(),
      price_min: item.price_min?.toString() || "",
      price_max: item.price_max?.toString() || "",
      price_trend: item.price_trend,
      confidence_level: item.confidence_level,
      confidence_reason: item.confidence_reason || "",
      market_comment: item.market_comment || "",
      market_comment_type: item.market_comment_type || "material_cost",
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for update
      const updateData = {
        base_labor_price: parseFloat(formData.base_labor_price),
        base_material_price: parseFloat(formData.base_material_price),
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        price_trend: formData.price_trend,
        confidence_level: formData.confidence_level,
        confidence_reason: formData.confidence_reason || null,
        market_comment: formData.market_comment || null,
        market_comment_type: formData.market_comment_type as "material_cost" | "seasonal_demand" | "regulatory_change" | "regional_factor",
      };

      const result = await updateMarketIntelligence(item.id, updateData);

      if (result.success) {
        toast({
          title: "Sukces!",
          description: `Dane dla "${item.name}" zostały zaktualizowane.`,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się zaktualizować danych",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edytuj Market Intelligence</SheetTitle>
          <SheetDescription>
            {item.name} ({item.category_name})
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Base Prices */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Ceny Bazowe
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_labor_price">Robocizna (zł)</Label>
                <Input
                  id="base_labor_price"
                  type="number"
                  step="0.01"
                  value={formData.base_labor_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_labor_price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_material_price">Materiał (zł)</Label>
                <Input
                  id="base_material_price"
                  type="number"
                  step="0.01"
                  value={formData.base_material_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_material_price: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Market Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Zakres Rynkowy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_min">Cena Minimalna (zł)</Label>
                <Input
                  id="price_min"
                  type="number"
                  step="0.01"
                  placeholder="Np. 2.20"
                  value={formData.price_min}
                  onChange={(e) =>
                    setFormData({ ...formData, price_min: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_max">Cena Maksymalna (zł)</Label>
                <Input
                  id="price_max"
                  type="number"
                  step="0.01"
                  placeholder="Np. 2.80"
                  value={formData.price_max}
                  onChange={(e) =>
                    setFormData({ ...formData, price_max: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Trend & Confidence */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Analiza Rynkowa
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_trend">Trend Cenowy</Label>
                <Select
                  name="price_trend"
                  value={formData.price_trend}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, price_trend: value as MarketSentiment })
                  }
                >
                  <SelectTrigger id="price_trend">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stabilny ➡️</SelectItem>
                    <SelectItem value="up">Rosnący ↗️</SelectItem>
                    <SelectItem value="down">Spadający ↘️</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidence_level">Poziom Pewności</Label>
                <Select
                  name="confidence_level"
                  value={formData.confidence_level}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, confidence_level: value as ConfidenceLevel })
                  }
                >
                  <SelectTrigger id="confidence_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niska</SelectItem>
                    <SelectItem value="medium">Średnia</SelectItem>
                    <SelectItem value="high">Wysoka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Confidence Reason */}
          <div className="space-y-2">
            <Label htmlFor="confidence_reason">Powód Pewności</Label>
            <Input
              id="confidence_reason"
              placeholder="Np. Dane z 5 hurtowni elektrycznych"
              value={formData.confidence_reason}
              onChange={(e) =>
                setFormData({ ...formData, confidence_reason: e.target.value })
              }
            />
            <p className="text-xs text-slate-500">
              Wyjaśnienie źródła danych lub metodologii
            </p>
          </div>

          {/* Comment Type */}
          <div className="space-y-2">
            <Label htmlFor="market_comment_type">Typ Komentarza</Label>
            <Select
              name="market_comment_type"
              value={formData.market_comment_type}
              onValueChange={(value: string) =>
                setFormData({ ...formData, market_comment_type: value as MarketCommentType })
              }
            >
              <SelectTrigger id="market_comment_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="material_cost">Koszt Materiałów</SelectItem>
                <SelectItem value="seasonal_demand">Popyt Sezonowy</SelectItem>
                <SelectItem value="regulatory_change">Zmiana Regulacyjna</SelectItem>
                <SelectItem value="regional_factor">Czynnik Regionalny</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Market Comment */}
          <div className="space-y-2">
            <Label htmlFor="market_comment">Komentarz Rynkowy</Label>
            <Textarea
              id="market_comment"
              placeholder="Np. Wzrost cen miedzi o 18% wpłynął na ceny kabli. Prognoza: stabilizacja w Q2 2026."
              value={formData.market_comment}
              onChange={(e) =>
                setFormData({ ...formData, market_comment: e.target.value })
              }
              rows={4}
            />
            <p className="text-xs text-slate-500">
              Komentarz widoczny dla użytkowników w tooltipach
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz Zmiany
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
