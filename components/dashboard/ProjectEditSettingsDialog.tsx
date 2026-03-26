"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProjectSettings, getRegions, getObjectTypes } from "@/app/dashboard/actions";
import type { ProjectWithRelations, Region, ObjectType } from "@/lib/types/database";

interface ProjectEditSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations;
}

export function ProjectEditSettingsDialog({ open, onOpenChange, project }: ProjectEditSettingsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [editName, setEditName] = useState(project.name);
  const [editVatRate, setEditVatRate] = useState(project.vat_rate.toString());
  const [editRegionId, setEditRegionId] = useState(project.region_id || "");
  const [editObjectTypeId, setEditObjectTypeId] = useState(project.object_type_id || "");
  const [regions, setRegions] = useState<Region[]>([]);
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && regions.length === 0) {
      setIsLoadingOptions(true);
      Promise.all([getRegions(), getObjectTypes()])
        .then(([regionsData, objectTypesData]) => {
          setRegions(regionsData || []);
          setObjectTypes(objectTypesData || []);
        })
        .catch((error) => {
          console.error("Error loading options:", error);
        })
        .finally(() => setIsLoadingOptions(false));
    }
  }, [open, regions.length]);

  useEffect(() => {
    if (open) {
      setEditName(project.name);
      setEditVatRate(project.vat_rate.toString());
      setEditRegionId(project.region_id || "");
      setEditObjectTypeId(project.object_type_id || "");
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!editName.trim()) {
      toast({ title: "Błąd", description: "Nazwa projektu jest wymagana", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateProjectSettings(project.id, {
        name: editName.trim(),
        vat_rate: parseInt(editVatRate),
        region_id: editRegionId || null,
        object_type_id: editObjectTypeId || null,
      });
      if (result?.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Zapisano", description: "Ustawienia projektu zostały zaktualizowane" });
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Błąd", description: "Nie udało się zapisać ustawień", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ustawienia projektu
          </DialogTitle>
          <DialogDescription>Zmień nazwę, VAT, region lub typ obiektu</DialogDescription>
        </DialogHeader>

        {isLoadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nazwa projektu</Label>
              <Input
                id="editName"
                name="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nazwa projektu"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editVat">Stawka VAT</Label>
              <Select value={editVatRate} onValueChange={setEditVatRate}>
                <SelectTrigger id="editVat"><SelectValue placeholder="Wybierz stawkę VAT" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8% (Mieszkanie)</SelectItem>
                  <SelectItem value="23">23% (Biuro / Komercja)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRegion">Region (województwo)</Label>
              <Select value={editRegionId} onValueChange={setEditRegionId}>
                <SelectTrigger id="editRegion"><SelectValue placeholder="Wybierz region" /></SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({(() => { const p = Math.round((region.price_modifier - 1) * 100); return p === 0 ? "baza" : p > 0 ? `+${p}%` : `${p}%`; })()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editObjectType">Typ obiektu</Label>
              <Select value={editObjectTypeId} onValueChange={setEditObjectTypeId}>
                <SelectTrigger id="editObjectType"><SelectValue placeholder="Wybierz typ obiektu" /></SelectTrigger>
                <SelectContent>
                  {objectTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Anuluj</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoadingOptions} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Zapisywanie...</>
            ) : "Zapisz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
