"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createAssemblyCategory, updateAssemblyCategory } from "@/app/dashboard/actions";
import { Loader2 } from "lucide-react";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface AssemblyCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AssemblyCategory | null;
}

export function AssemblyCategoryDialog({
  open,
  onOpenChange,
  category,
}: AssemblyCategoryDialogProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isEditing = !!category;

  useEffect(() => {
    if (open) {
      setName(category?.name || "");
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa kategorii nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      
      if (isEditing) {
        result = await updateAssemblyCategory(category.id, name);
      } else {
        result = await createAssemblyCategory(name);
      }

      if (result.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sukces",
          description: isEditing
            ? "Kategoria została zaktualizowana"
            : "Kategoria została utworzona",
        });
        onOpenChange(false);
        router.refresh();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edytuj Kategorię" : "Dodaj Nową Kategorię"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Wprowadź zmiany w kategorii"
                : "Uzupełnij dane nowej kategorii zestawów"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa kategorii *</Label>
              <Input
                id="name"
                name="name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Instalacje domowe, Oświetlenie..."
                autoFocus
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kategorie pomagają organizować zestawy
              </p>
            </div>
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
              disabled={isSubmitting || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Zapisz Zmiany" : "Dodaj Kategorię"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
