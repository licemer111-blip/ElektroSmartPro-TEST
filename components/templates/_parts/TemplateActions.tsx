"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package, Plus, Loader2, Edit2, Eye,
  DollarSign, Wrench, ArrowRight,
} from "lucide-react";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import type { ProjectTemplate, TemplateItem } from "@/app/dashboard/templates/actions";

export interface TemplateRenameDialogProps {
  renamingTemplate: ProjectTemplate | null;
  newName: string;
  onNewNameChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function TemplateRenameDialog({
  renamingTemplate,
  newName,
  onNewNameChange,
  onClose,
  onConfirm,
}: TemplateRenameDialogProps) {
  return (
    <Dialog open={!!renamingTemplate} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-600" />
            Zmień nazwę szablonu
          </DialogTitle>
          <DialogDescription className="sr-only">Wprowadź nową nazwę dla szablonu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nowa nazwa</Label>
            <Input
              id="template-name"
              name="template-name"
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              placeholder="np. Mieszkanie 60m² - Standard"
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) onConfirm(); }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button
            onClick={onConfirm}
            disabled={!newName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Zmień nazwę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface TemplateCreateDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedTemplate: ProjectTemplate | null;
  projectName: string;
  onProjectNameChange: (v: string) => void;
  creating: boolean;
  onConfirm: () => void;
}

export function TemplateCreateDialog({
  open,
  onOpenChange,
  selectedTemplate,
  projectName,
  onProjectNameChange,
  creating,
  onConfirm,
}: TemplateCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            Nowy projekt z szablonu
          </DialogTitle>
          <DialogDescription>
            {selectedTemplate?.name} ({(selectedTemplate?.items || []).length} pozycji)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nazwa projektu</Label>
            <Input
              id="project-name"
              name="project-name"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="np. Mieszkanie ul. Kwiatowa 5"
              onKeyDown={(e) => { if (e.key === "Enter" && projectName.trim()) onConfirm(); }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
            disabled={creating || !projectName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Tworzenie...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" />Utwórz projekt</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface TemplatePreviewDialogProps {
  previewTemplate: ProjectTemplate | null;
  onClose: () => void;
  onUse: (template: ProjectTemplate) => void;
}

export function TemplatePreviewDialog({
  previewTemplate,
  onClose,
  onUse,
}: TemplatePreviewDialogProps) {
  const fmtPln = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

  if (!previewTemplate) return null;

  const { multiplier: knrMultiplier } = useKnrMultiplier();
  const items = previewTemplate.items || [];
  const totalMaterial = items.reduce((s, i: TemplateItem) => s + (i.final_material_price || 0) * (i.quantity || 1), 0);
  const totalLabor = items.reduce((s, i: TemplateItem) => s + (i.final_labor_price || 0) * (i.quantity || 1) * knrMultiplier, 0);
  const total = totalMaterial + totalLabor;

  return (
    <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            {previewTemplate.name}
          </DialogTitle>
          {previewTemplate.description && (
            <DialogDescription>{previewTemplate.description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 py-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
            <Package className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{items.length}</p>
            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/60">pozycji</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{fmtPln(totalMaterial)}</p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">materiały</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
            <Wrench className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmtPln(totalLabor)}</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60">robocizna</p>
          </div>
        </div>

        <div className="text-center py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
          <p className="text-xs text-muted-foreground">Łączna wartość</p>
          <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{fmtPln(total)}</p>
        </div>

        {/* Items list */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Pozycje ({items.length})</p>
          {items.map((item: TemplateItem, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-muted/50">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-muted-foreground w-5 text-right flex-shrink-0">{idx + 1}.</span>
                <span className="truncate font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                <span className="font-medium w-20 text-right">
                  {fmtPln(((item.final_material_price || 0) + (item.final_labor_price || 0) * knrMultiplier) * (item.quantity || 1))}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>VAT: {previewTemplate.vat_rate}%</span>
          <span>Utworzono: {new Date(previewTemplate.created_at).toLocaleDateString("pl-PL")}</span>
          {previewTemplate.use_count > 0 && <span>Użyto: {previewTemplate.use_count}x</span>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
          <Button
            onClick={() => { onClose(); onUse(previewTemplate); }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Użyj tego szablonu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
