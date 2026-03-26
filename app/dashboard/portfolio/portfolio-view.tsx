"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, EyeOff, Loader2, Briefcase, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioItem, PortfolioCategory } from "@/lib/types/database";
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  togglePortfolioVisibility,
} from "./actions";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioDetailDialog } from "./PortfolioDetailDialog";
import { PortfolioFormDialog } from "./PortfolioFormDialog";
import type { PortfolioFormData } from "./PortfolioFormDialog";
import { LightboxCarousel } from "./LightboxCarousel";

const CATEGORIES: { value: PortfolioCategory; label: string }[] = [
  { value: "Mieszkanie", label: "Mieszkanie" },
  { value: "Dom", label: "Dom" },
  { value: "Biuro", label: "Biuro" },
  { value: "Przemysł", label: "Przemysł" },
  { value: "Zewnętrzne", label: "Zewnętrzne" },
  { value: "Inne", label: "Inne" },
];

interface PortfolioViewProps {
  items: PortfolioItem[];
  isPro: boolean;
  portfolioVisible: boolean;
  portfolioLimit: number;
  error?: string;
}

const EMPTY_FORM: PortfolioFormData = {
  title: "",
  description: "",
  location: "",
  completion_date: "",
  category: "Mieszkanie",
  is_public: true,
  images: [],
};

export function PortfolioView({ items, isPro, portfolioVisible, portfolioLimit, error }: PortfolioViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PortfolioFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const maxItems = isPro ? 50 : 5;
  const canAdd = items.length < maxItems;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      location: item.location || "",
      completion_date: item.completion_date || "",
      category: item.category,
      is_public: item.is_public,
      images: item.images || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Błąd", description: "Nazwa realizacji jest wymagana", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const result = await updatePortfolioItem({
          id: editingId,
          title: form.title,
          description: form.description || null,
          location: form.location || null,
          completion_date: form.completion_date || null,
          category: form.category,
          is_public: form.is_public,
          images: form.images,
        });
        if (result.error) {
          toast({ title: "Błąd", description: result.error, variant: "destructive" });
        } else {
          toast({ title: "Zapisano", description: "Realizacja została zaktualizowana" });
          setDialogOpen(false);
          router.refresh();
        }
      } else {
        const result = await createPortfolioItem({
          title: form.title,
          description: form.description || undefined,
          location: form.location || undefined,
          completion_date: form.completion_date || undefined,
          category: form.category,
          is_public: form.is_public,
          images: form.images,
        });
        if (result.error) {
          toast({ title: "Błąd", description: result.error, variant: "destructive" });
        } else {
          toast({ title: "Dodano", description: "Nowa realizacja została dodana" });
          setDialogOpen(false);
          router.refresh();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const result = await deletePortfolioItem(deleteId);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Usunięto", description: "Realizacja została usunięta" });
      router.refresh();
    }
    setIsDeleting(false);
    setDeleteId(null);
  };

  const toggleVisibility = async (item: PortfolioItem) => {
    const result = await updatePortfolioItem({ id: item.id, is_public: !item.is_public });
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      router.refresh();
    }
  };

  const filtered = filterCategory === "all"
    ? items
    : items.filter(i => i.category === filterCategory);

  const categoryCount = (cat: string) => items.filter(i => i.category === cat).length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Portfolio
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Prezentuj realizacje klientom w ofertach PDF i portalu klienta
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-semibold">
            {items.length}/{maxItems} realizacji
          </Badge>
          {!isPro && items.length >= 5 && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
              Demo — maks. 5
            </Badge>
          )}
          <Button onClick={openCreate} disabled={!canAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Dodaj realizację
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <Card className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-sm">
          {portfolioVisible ? (
            <>
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">Portfolio widoczne w ofertach</span>
              <span className="text-muted-foreground">• Pokazuje do {portfolioLimit} realizacji</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span className="text-muted-foreground">Portfolio ukryte w ofertach</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="portfolio-toggle" className="text-xs text-muted-foreground cursor-pointer">
            {portfolioVisible ? "Widoczne dla klientów" : "Ukryte dla klientów"}
          </Label>
          <Switch
            id="portfolio-toggle"
            name="portfolio-toggle"
            checked={portfolioVisible}
            onCheckedChange={async (checked) => {
              const result = await togglePortfolioVisibility(checked);
              if (result.error) {
                toast({ title: "Błąd", description: result.error, variant: "destructive" });
              } else {
                toast({ title: checked ? "Portfolio włączone" : "Portfolio wyłączone", description: checked ? "Realizacje widoczne w portalu klienta" : "Realizacje ukryte w portalu klienta" });
                router.refresh();
              }
            }}
          />
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-300 text-red-700 dark:text-red-400 text-sm">
          {error}
        </Card>
      )}

      {/* Filter */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
            className={filterCategory === "all" ? "text-xs bg-blue-600 hover:bg-blue-700 text-white" : "text-xs"}
          >
            Wszystkie ({items.length})
          </Button>
          {CATEGORIES.map(cat => {
            const count = categoryCount(cat.value);
            if (count === 0) return null;
            return (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(cat.value)}
                className={filterCategory === cat.value ? "text-xs bg-blue-600 hover:bg-blue-700 text-white" : "text-xs"}
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Camera className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {items.length === 0 ? "Brak realizacji" : "Brak w tej kategorii"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {items.length === 0
              ? "Dodaj swoje pierwsze realizacje, aby pokazać je klientom w ofertach"
              : "Zmień filtr, aby zobaczyć inne realizacje"}
          </p>
          {items.length === 0 && (
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Dodaj pierwszą realizację
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => (
            <PortfolioCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onDetail={setDetailItem}
              onLightbox={(images, index) => setLightbox({ images, index })}
              onToggleVisibility={toggleVisibility}
            />
          ))}
        </div>
      )}

      <PortfolioFormDialog
        open={dialogOpen}
        isEditing={!!editingId}
        isSaving={isSaving}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć realizację?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Realizacja i jej zdjęcia zostaną trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PortfolioDetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={openEdit}
        onDelete={setDeleteId}
        onLightbox={(images, index) => setLightbox({ images, index })}
      />

      {lightbox && (
        <LightboxCarousel
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onChange={(idx: number) => setLightbox(prev => prev ? { ...prev, index: idx } : null)}
        />
      )}
    </div>
  );
}
