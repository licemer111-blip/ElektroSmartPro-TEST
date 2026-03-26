"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProjectName } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useRouter } from "next/navigation";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentName: string;
}

export function RenameProjectDialog({ open, onOpenChange, projectId, currentName }: RenameProjectDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleRename = () => {
    if (!newName.trim()) {
      toast({ title: "Błąd", description: "Nazwa projektu nie może być pusta", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await updateProjectName(projectId, newName);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Sukces!", description: "Nazwa projektu została zmieniona" });
        onOpenChange(false);
        notifyDataChanged("name-changed");
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zmień nazwę projektu</DialogTitle>
          <DialogDescription>Wprowadź nową nazwę dla projektu</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nazwa projektu</Label>
            <Input
              id="project-name"
              name="project-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Np. Dom w Krakowie"
              disabled={isPending}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") onOpenChange(false); }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button
            onClick={handleRename}
            disabled={isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
