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
import { createProjectCategory, updateProjectCategory } from "@/app/dashboard/actions";
import { Loader2 } from "lucide-react";

interface ProjectCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface ProjectCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ProjectCategory | null;
}

export function ProjectCategoryDialog({
  open,
  onOpenChange,
  category,
}: ProjectCategoryDialogProps) {
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
        result = await updateProjectCategory(category.id, name);
      } else {
        result = await createProjectCategory(name);
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edytuj kategorię" : "Nowa kategoria"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Zmień nazwę kategorii projektów"
                : "Utwórz nową kategorię do organizacji projektów"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa kategorii</Label>
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
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Zapisz" : "Utwórz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
