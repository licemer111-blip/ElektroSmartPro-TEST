"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PolishDatePicker } from "@/components/ui/polish-date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadPortfolioImage, deletePortfolioImage } from "./actions";
import type { PortfolioCategory } from "@/lib/types/database";

const CATEGORIES: { value: PortfolioCategory; label: string }[] = [
  { value: "Mieszkanie", label: "Mieszkanie" },
  { value: "Dom", label: "Dom" },
  { value: "Biuro", label: "Biuro" },
  { value: "Przemysł", label: "Przemysł" },
  { value: "Zewnętrzne", label: "Zewnętrzne" },
  { value: "Inne", label: "Inne" },
];

const MAX_IMAGES = 15;

export interface PortfolioFormData {
  title: string;
  description: string;
  location: string;
  completion_date: string;
  category: PortfolioCategory;
  is_public: boolean;
  images: string[];
}

interface PortfolioFormDialogProps {
  open: boolean;
  isEditing: boolean;
  isSaving: boolean;
  form: PortfolioFormData;
  onFormChange: (data: PortfolioFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

export function PortfolioFormDialog({
  open, isEditing, isSaving, form, onFormChange, onSave, onClose,
}: PortfolioFormDialogProps) {
  const { toast } = useToast();

  const handleUploadImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      toast({ title: "Limit zdjęć", description: `Maksymalnie ${MAX_IMAGES} zdjęć na realizację`, variant: "destructive" });
      return;
    }

    onFormChange({ ...form, images: [...form.images] }); // trigger isUploading via local state if needed

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const fd = new FormData();
      fd.append("file", files[i]);
      const result = await uploadPortfolioImage(fd);
      if (result.url) {
        newImages.push(result.url);
      } else if (result.error) {
        toast({ title: "Błąd uploadu", description: result.error, variant: "destructive" });
      }
    }

    onFormChange({ ...form, images: [...form.images, ...newImages] });
    e.target.value = "";
  }, [form, onFormChange, toast]);

  const handleRemoveImage = async (url: string) => {
    await deletePortfolioImage(url);
    onFormChange({ ...form, images: form.images.filter(u => u !== url) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edytuj realizację" : "Nowa realizacja"}</DialogTitle>
          <DialogDescription className="sr-only">Formularz dodawania lub edycji realizacji w portfolio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Nazwa realizacji *</Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={e => onFormChange({ ...form, title: e.target.value })}
              placeholder="np. Instalacja elektryczna mieszkania 60m²"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={e => onFormChange({ ...form, description: e.target.value })}
              placeholder="Krótki opis zakresu prac..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="portfolio-category">Kategoria</Label>
              <Select
                name="portfolio-category"
                value={form.category}
                onValueChange={v => onFormChange({ ...form, category: v as PortfolioCategory })}
              >
                <SelectTrigger id="portfolio-category" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Lokalizacja</Label>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={e => onFormChange({ ...form, location: e.target.value })}
                placeholder="np. Warszawa"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Data realizacji</Label>
              <div className="mt-1">
                <PolishDatePicker
                  value={form.completion_date}
                  onChange={(iso) => onFormChange({ ...form, completion_date: iso })}
                />
              </div>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="portfolio-is-public"
                  name="portfolio-is-public"
                  aria-label="Widoczność projektu"
                  checked={form.is_public}
                  onCheckedChange={v => onFormChange({ ...form, is_public: v })}
                />
                <Label htmlFor="portfolio-is-public" className="text-sm cursor-pointer">
                  {form.is_public ? "Publiczne" : "Ukryte"}
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Zdjęcia ({form.images.length}/{MAX_IMAGES})</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden h-20 bg-slate-100 dark:bg-slate-800">
                  <img src={url} alt={`Zdjęcie ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_IMAGES && (
                <label className="h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                  <>
                    <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="text-[9px] text-slate-400">Dodaj</span>
                  </>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleUploadImage}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              JPEG, PNG lub WebP. Maks. 5MB na zdjęcie, do {MAX_IMAGES} zdjęć.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Anuluj</Button>
            <Button
              onClick={onSave}
              disabled={isSaving || !form.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {isEditing ? "Zapisz zmiany" : "Dodaj realizację"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
