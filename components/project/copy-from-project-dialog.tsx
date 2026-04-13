"use client";

import { useState, useEffect } from "react";
import { useKnrMultiplier } from "@/hooks/useKnrMultiplier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy, Loader2, FolderOpen, ArrowLeft, CheckCircle2,
  Package, ArrowRight, CheckSquare,
} from "lucide-react";
import {
  getUserProjectsForCopy,
  getProjectItemsForCopy,
  copyItemsToProject,
} from "@/app/dashboard/projects/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useRouter } from "next/navigation";

interface CopyFromProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetProjectId: string;
  isPro?: boolean;
}

type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  item_count: number;
  created_at: string;
};

type ProjectItemForCopy = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  final_material_price: number;
  final_labor_price: number;
  catalog_item_id: string | null;
  section: string | null;
};

export function CopyFromProjectDialog({ open, onOpenChange, targetProjectId, isPro = true }: CopyFromProjectDialogProps) {
  const [step, setStep] = useState<"select-project" | "select-items">("select-project");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [items, setItems] = useState<ProjectItemForCopy[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Load projects when dialog opens
  useEffect(() => {
    if (open) {
      setStep("select-project");
      setSelectedProject(null);
      setItems([]);
      setSelectedItemIds(new Set());
      setLoading(true);
      getUserProjectsForCopy(targetProjectId)
        .then(setProjects)
        .catch(() => setProjects([]))
        .finally(() => setLoading(false));
    }
  }, [open, targetProjectId]);

  // Load items when project is selected
  const handleSelectProject = async (project: ProjectSummary) => {
    setSelectedProject(project);
    setLoading(true);
    try {
      const projectItems = await getProjectItemsForCopy(project.id);
      setItems(projectItems);
      setSelectedItemIds(new Set(projectItems.map(i => i.id))); // Select all by default
      setStep("select-items");
    } catch {
      toast({ title: "Błąd", description: "Nie udało się pobrać pozycji", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItemIds.size === items.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(items.map(i => i.id)));
    }
  };

  const handleCopy = async () => {
    const selectedItems = items.filter(i => selectedItemIds.has(i.id));
    if (selectedItems.length === 0) return;

    setCopying(true);
    try {
      const result = await copyItemsToProject(
        targetProjectId,
        selectedItems.map(({ id, ...rest }) => rest)
      );
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({
          title: "Skopiowano!",
          description: `${result.count} pozycji dodano do kosztorysu`,
        });
        notifyDataChanged("item-added");
        router.refresh();
        onOpenChange(false);
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się skopiować pozycji", variant: "destructive" });
    } finally {
      setCopying(false);
    }
  };

  const { multiplier: knrMultiplier } = useKnrMultiplier();

  const formatPrice = (material: number, labor: number, qty: number) => {
    if (!isPro) return '*** zł';
    const total = (material + labor * knrMultiplier) * qty;
    return total.toFixed(2) + " zł";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Copy className="w-4 h-4 text-white" />
            </div>
            {step === "select-project" ? "Kopiuj z innego projektu" : "Wybierz pozycje"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-project"
              ? "Wybierz projekt, z którego chcesz skopiować pozycje"
              : `${selectedProject?.name} — zaznacz pozycje do skopiowania`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : step === "select-project" ? (
            <div className="space-y-1.5">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Brak innych projektów</p>
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {project.item_count} pozycji · {new Date(project.created_at).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Select all header */}
              <div className="flex items-center justify-between p-2 border-b mb-2">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {selectedItemIds.size === items.length ? "Odznacz wszystko" : "Zaznacz wszystko"}
                </button>
                <Badge variant="secondary" className="text-[10px]">
                  {selectedItemIds.size} / {items.length}
                </Badge>
              </div>

              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedItemIds.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.quantity} {item.unit} · {formatPrice(item.final_material_price, item.final_labor_price, item.quantity)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          {step === "select-items" && (
            <Button
              variant="outline"
              onClick={() => setStep("select-project")}
              className="mr-auto"
              size="sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Wstecz
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          {step === "select-items" && (
            <Button
              onClick={handleCopy}
              disabled={copying || selectedItemIds.size === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Kopiowanie...</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" />Kopiuj {selectedItemIds.size} pozycji</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
