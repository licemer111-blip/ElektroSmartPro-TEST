"use client";

import { useState, useCallback } from "react";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, Zap, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createProjectFromTemplate,
  deleteTemplate,
  duplicateTemplate,
  updateTemplate,
  type ProjectTemplate,
  type TemplateItem,
} from "@/app/dashboard/templates/actions";
import { TemplateCard } from "@/components/templates/_parts/TemplateCard";
import { TemplateFilters } from "@/components/templates/_parts/TemplateFilters";
import {
  TemplateRenameDialog,
  TemplateCreateDialog,
  TemplatePreviewDialog,
} from "@/components/templates/_parts/TemplateActions";

interface TemplatesPageClientProps {
  templates: ProjectTemplate[];
}

const SUGGESTED_TEMPLATES = [
  {
    name: "Mieszkanie 50m\u00b2 - Standard",
    description: "2 pokoje, kuchnia, \u0142azienka. Gniazda, o\u015bwietlenie LED, rozdzielnica 1x12, przewody YDYp.",
    icon: "apartment",
    itemCount: 25,
  },
  {
    name: "Dom jednorodzinny 120m\u00b2",
    description: "4 pokoje, kuchnia, 2 \u0142azienki, gara\u017c. Rozdzielnica 2x12, osobne obwody, czujniki ruchu.",
    icon: "house",
    itemCount: 45,
  },
  {
    name: "Biuro 80m\u00b2",
    description: "Open space + 2 gabinety. Gniazda DATA RJ45, o\u015bwietlenie panelowe 60x60, UTP kat.6.",
    icon: "office",
    itemCount: 30,
  },
  {
    name: "Rozbudowa tablicy rozdzielczej",
    description: "Wymiana obudowy, wy\u0142\u0105czniki B16/B20, RCD 30mA, ogranicznik przepi\u0119\u0107 B+C, szyna N/PE.",
    icon: "panel",
    itemCount: 15,
  },
  {
    name: "\u0141azienka - Remont",
    description: "2 gniazda IP44, oprawa LED IP65, wentylator z timerem, lustro pod\u015bwietlane, pod\u0142oga grzewcza.",
    icon: "bathroom",
    itemCount: 12,
  },
  {
    name: "Kuchnia - Modernizacja",
    description: "4 gniazda blat roboczy, gniazda AGD (piekarnik, zmywarka, lod\u00f3wka), o\u015bwietlenie podszafkowe LED.",
    icon: "kitchen",
    itemCount: 18,
  },
];

const formatPrice = (items: TemplateItem[], knrMult: number = 1.0) => {
  if (!items || items.length === 0) return "0,00 zł";
  const total = items.reduce(
    (sum: number, item: TemplateItem) =>
      sum + ((item.final_material_price || 0) + (item.final_labor_price || 0) * knrMult) * (item.quantity || 1),
    0
  );
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(total);
};

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const { multiplier: knrMultiplier } = useKnrMultiplier();
  const formatPriceBound = useCallback((items: TemplateItem[]) => formatPrice(items, knrMultiplier), [knrMultiplier]);
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [renamingTemplate, setRenamingTemplate] = useState<ProjectTemplate | null>(null);
  const [newName, setNewName] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  const router = useRouter();

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const userTemplates = filteredTemplates.filter((t) => !t.is_public);
  const publicTemplates = filteredTemplates.filter((t) => t.is_public);

  const handleUseTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectName(template.name + " - " + new Date().toLocaleDateString("pl-PL"));
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !projectName.trim()) return;
    setCreating(true);
    try {
      const result = await createProjectFromTemplate(selectedTemplate.id, projectName.trim());
      if (result.error) {
        toast.error(result.error);
      } else if (result.projectId) {
        toast.success("Projekt utworzony z szablonu!");
        setCreateOpen(false);
        router.push(`/dashboard/projects/${result.projectId}`);
      }
    } catch {
      toast.error("Wyst\u0105pi\u0142 b\u0142\u0105d");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (templateId: string) => {
    setPendingDeleteId(templateId);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    const templateId = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(templateId);
    try {
      const result = await deleteTemplate(templateId);
      if (result.error) toast.error(result.error);
      else { toast.success("Szablon usuni\u0119ty"); router.refresh(); }
    } catch {
      toast.error("Wyst\u0105pi\u0142 b\u0142\u0105d");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (templateId: string) => {
    setDuplicatingId(templateId);
    try {
      const result = await duplicateTemplate(templateId);
      if (result.error) toast.error(result.error);
      else { toast.success("Szablon zduplikowany"); router.refresh(); }
    } catch {
      toast.error("Wyst\u0105pi\u0142 b\u0142\u0105d");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleRename = async () => {
    if (!renamingTemplate || !newName.trim()) return;
    try {
      const result = await updateTemplate(renamingTemplate.id, { name: newName.trim() });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Nazwa zmieniona");
        setRenamingTemplate(null);
        setNewName("");
        router.refresh();
      }
    } catch {
      toast.error("Wyst\u0105pi\u0142 b\u0142\u0105d");
    }
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-indigo-950/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Copy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Szablony projektów — twórz szybciej!</h3>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/70 mt-0.5">
              <strong>Jak to działa:</strong> (1) Utwórz projekt i dodaj pozycje. (2) Na karcie projektu kliknij menu (&hellip;) &rarr; &quot;Utwórz szablon&quot;.
              (3) Szablon zachowa wszystkie pozycje z cenami. (4) Następnym razem &mdash; kliknij szablon i gotowy nowy projekt w sekundy!
            </p>
          </div>
        </div>
      </div>

      {/* Header + Search (_parts/TemplateFilters) */}
      <TemplateFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* User templates */}
      {userTemplates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Twoje szablony ({userTemplates.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onPreview={() => setPreviewTemplate(template)}
                onDelete={() => handleDelete(template.id)}
                onDuplicate={() => handleDuplicate(template.id)}
                onRename={() => { setRenamingTemplate(template); setNewName(template.name); }}
                deleting={deletingId === template.id}
                duplicating={duplicatingId === template.id}
                formatPrice={formatPriceBound}
                isOwner={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Public templates */}
      {publicTemplates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Szablony publiczne ({publicTemplates.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onPreview={() => setPreviewTemplate(template)}
                formatPrice={formatPriceBound}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/15 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <Copy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold mb-2">Brak szablonów</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Nie masz jeszcze szablonów. Utwórz pierwszy projekt (ręcznie, przez Szybką Wycenę lub ES Import),
              a następnie na karcie projektu wybierz menu (&hellip;) &rarr; &quot;Utwórz szablon&quot;. Poniżej kilka pomysłów na szablony:
            </p>
            <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700 text-white">
              <FolderOpen className="w-4 h-4 mr-2" />
              Przejdź do projektów
            </Button>
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Pomysły na szablony
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTED_TEMPLATES.map((suggestion, i) => (
                <div key={i} className="rounded-xl border bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/30 p-4 opacity-75">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{suggestion.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">~{suggestion.itemCount} pozycji</Badge>
                        <span className="text-[10px] text-muted-foreground italic">przykład</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Utwórz projekt z powyższych pozycji (ręcznie lub przez Szybką Wycenę), a następnie zapisz jako szablon.
            </p>
          </div>
        </div>
      )}

      {/* Modals (_parts/TemplateActions) */}
      <TemplateRenameDialog
        renamingTemplate={renamingTemplate}
        newName={newName}
        onNewNameChange={setNewName}
        onClose={() => setRenamingTemplate(null)}
        onConfirm={handleRename}
      />
      <TemplateCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        selectedTemplate={selectedTemplate}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        creating={creating}
        onConfirm={handleCreate}
      />
      <TemplatePreviewDialog
        previewTemplate={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
      />
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń szablon</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć ten szablon?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
