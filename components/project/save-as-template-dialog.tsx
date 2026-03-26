"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProjectAsTemplate } from "@/app/dashboard/templates/actions";
import { Loader2, FileBox } from "lucide-react";
import { toast } from "sonner";

interface SaveAsTemplateDialogProps {
  projectId: string;
  projectName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SaveAsTemplateDialog({ 
  projectId, 
  projectName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SaveAsTemplateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(`Szablon: ${projectName}`);
  const [description, setDescription] = useState("");
  
  // Support both controlled and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Podaj nazwę szablonu");
      return;
    }

    setLoading(true);
    try {
      const result = await saveProjectAsTemplate(projectId, name, description);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Szablon został zapisany!");
        setOpen(false);
        setName("");
        setDescription("");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas zapisywania szablonu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBox className="w-5 h-5 text-indigo-600" />
            Zapisz jako szablon
          </DialogTitle>
          <DialogDescription>
            Zapisz konfigurację tego projektu jako szablon do ponownego użycia.
            Szablon będzie zawierał wszystkie pozycje kosztorysu.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">Nazwa szablonu</Label>
            <Input
              id="template-name"
              name="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Mieszkanie 50m² - Standard"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="template-description">Opis (opcjonalnie)</Label>
            <Textarea
              id="template-description"
              name="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Standardowa instalacja elektryczna dla mieszkania 50m²"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz szablon"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
