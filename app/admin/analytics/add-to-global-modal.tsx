"use client";

import { useState, useEffect } from "react";
import { CustomItemAnalytics, addCustomItemToGlobal } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface AddToGlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CustomItemAnalytics;
}

interface Category {
  id: string;
  name: string;
}

export function AddToGlobalModal({ isOpen, onClose, item }: AddToGlobalModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item.item_name,
    categoryId: "",
    unit: "szt.",
    materialPrice: item.avg_material_price || 0,
    laborPrice: item.avg_labor_price || 0,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("catalog_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        toast.error("Nie udało się pobrać kategorii");
      } else {
        setCategories(data || []);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast.error("Wybierz kategorię");
      return;
    }

    if (formData.materialPrice <= 0 && formData.laborPrice <= 0) {
      toast.error("Przynajmniej jedna cena musi być większa od 0");
      return;
    }

    setLoading(true);

    const result = await addCustomItemToGlobal(
      formData.name,
      formData.categoryId,
      formData.unit,
      formData.materialPrice,
      formData.laborPrice
    );

    setLoading(false);

    if (result.success) {
      toast.success("Pozycja dodana do Globalnej Bazy!");
      onClose();
      // Reload page to refresh data
      window.location.reload();
    } else {
      toast.error(`Błąd: ${result.error}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Dodaj do Globalnej Bazy Danych
          </DialogTitle>
          <DialogDescription>
            Wypełnij dane i zatwierdź dodanie pozycji do katalogu globalnego.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <Label htmlFor="name">Nazwa Pozycji</Label>
            <Input
              id="name"
              name="name"
              autoComplete="off"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="np. Przewód YDYp 3x1,5"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Możesz edytować nazwę, aby była bardziej formalna.
            </p>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Kategoria</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Wybierz kategorię..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit */}
          <div>
            <Label htmlFor="unit">Jednostka</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
              required
            >
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="szt.">szt.</SelectItem>
                <SelectItem value="mb">mb</SelectItem>
                <SelectItem value="m2">m²</SelectItem>
                <SelectItem value="kpl.">kpl.</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="op.">op.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prices (Side by Side) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="materialPrice">Cena Materiału (zł)</Label>
              <Input
                id="materialPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.materialPrice}
                onChange={(e) => setFormData({ ...formData, materialPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="laborPrice">Cena Robocizny (zł)</Label>
              <Input
                id="laborPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.laborPrice}
                onChange={(e) => setFormData({ ...formData, laborPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              <strong>Statystyki:</strong> Ta pozycja została użyta <strong>{item.usage_count}x</strong> przez <strong>{item.users_count}</strong> użytkowników.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Dodawanie...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj do Bazy
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
