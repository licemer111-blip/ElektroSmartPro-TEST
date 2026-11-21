"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUserAssembly, updateUserAssembly } from "@/app/dashboard/assemblies/actions";
import type { UserAssemblyWithItems, UnitType, Team, DataVisibility } from "@/lib/types/database";
import { type AutocompleteOption } from "@/components/ui/autocomplete-input";
import { getCatalogItems } from "@/app/dashboard/catalog/actions";
import { AssemblyItemsList, type AssemblyItemInput } from "@/components/assemblies/AssemblyItemsList";
import { AssemblyEditForm } from "@/components/assemblies/_parts/AssemblyEditForm";
import { linesFromCatalogPick } from "@/lib/assemblies/line-quantity";
import type { KnrSelectedItem } from "@/components/catalog/autocomplete-item-input";

interface AssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "duplicate";
  assembly?: UserAssemblyWithItems;
  categories?: Array<{ id: string; name: string }>;
  userTeam?: Team | null;
  isPro?: boolean;
}


export function AssemblyModal({ isOpen, onClose, mode, assembly, categories = [], userTeam, isPro = false }: AssemblyModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [buildingType, setBuildingType] = useState<string>("Dom");
  const [items, setItems] = useState<AssemblyItemInput[]>([]);
  const [visibility, setVisibility] = useState<DataVisibility>("personal");
  
  // New item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState<UnitType>("szt");
  const [newItemType, setNewItemType] = useState<"material" | "labor">("material");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemHours, setNewItemHours] = useState("");
  const [newItemKnr, setNewItemKnr] = useState<string | null>(null);
  
  // Catalog items for autocomplete
  const [catalogOptions, setCatalogOptions] = useState<AutocompleteOption[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Load catalog items for autocomplete
  useEffect(() => {
    if (isOpen && catalogOptions.length === 0) {
      setIsLoadingCatalog(true);
      getCatalogItems({ pageSize: 1000 })
        .then((result) => {
          const options: AutocompleteOption[] = result.items.map((item) => ({
            value: item.id,
            label: item.name,
            metadata: {
              unit: item.unit,
              materialPrice: item.base_material_price,
              laborPrice: item.base_labor_price,
              category: item.category_name,
              laborNorm: item.labor_norm_rbh ?? null,
              knrCode: item.knr_code ?? item.knr_ref ?? null,
            },
          }));
          setCatalogOptions(options);
        })
        .catch((error) => {
          console.error("Error loading catalog:", error);
          toast({
            title: "Błąd",
            description: "Nie udało się załadować katalogu",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingCatalog(false);
        });
    }
  }, [isOpen, catalogOptions.length, toast]);

  // Initialize form with assembly data
  useEffect(() => {
    if (isOpen && assembly && (mode === "edit" || mode === "duplicate")) {
      setName(mode === "duplicate" ? `${assembly.name} (kopia)` : assembly.name);
      setDescription(assembly.description || "");
      setCategoryId(assembly.category_id || "");
      setBuildingType(assembly.building_type || "Dom");
      setVisibility(assembly.visibility || "personal");
      setItems(
        (assembly.user_assembly_items || []).map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          type: item.type,
          price: item.price,
          quantity: item.quantity,
          sort_order: item.sort_order,
          laborNorm: item.labor_norm_rbh ?? null,
          knrCode: item.knr_code ?? null,
        }))
      );
    } else if (isOpen && mode === "create") {
      // Reset form for create mode
      setName("");
      setDescription("");
      setCategoryId("");
      setBuildingType("Dom");
      setItems([]);
      setVisibility("personal");
    }
  }, [isOpen, assembly, mode]);

  const resetItemDraft = () => {
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQuantity("1");
    setNewItemHours("");
    setNewItemKnr(null);
    setNewItemType("material");
    setNewItemUnit("szt");
  };

  const fillDraft = (line: { name: string; unit: string; type: "material" | "labor"; price: number; laborNorm: number | null; knrCode: string | null }) => {
    setNewItemName(line.name);
    setNewItemUnit(line.unit as UnitType);
    setNewItemType(line.type);
    setNewItemPrice(line.price > 0 ? line.price.toFixed(2) : "");
    setNewItemHours(line.laborNorm != null && line.laborNorm > 0 ? String(line.laborNorm) : "");
    setNewItemKnr(line.knrCode);
  };

  const handleNormSelect = (picked: KnrSelectedItem) => {
    setNewItemName(picked.name);
    if (picked.unit) setNewItemUnit(picked.unit as UnitType);
    if (picked.laborNormRbh != null && picked.laborNormRbh > 0 && (newItemType === "labor" || !newItemPrice)) {
      setNewItemType("labor");
      setNewItemHours(String(picked.laborNormRbh));
      setNewItemKnr(picked.knrRef);
    }
  };

  const handleCatalogItemSelect = (option: AutocompleteOption) => {
    const metadata = option.metadata;
    if (!metadata) return;
    const lines = linesFromCatalogPick({
      name: option.label,
      unit: String(metadata.unit || "szt"),
      materialPrice: Number(metadata.materialPrice) || 0,
      laborPrice: Number(metadata.laborPrice) || 0,
      hours: metadata.laborNorm != null ? Number(metadata.laborNorm) : null,
      knrCode: metadata.knrCode != null ? String(metadata.knrCode) : null,
    });
    if (editingIndex === null && lines.length > 1) {
      setItems([
        ...items,
        ...lines.map((line, index) => ({
          name: line.name,
          unit: line.unit as UnitType,
          type: line.type,
          price: line.price,
          quantity: line.quantity,
          laborNorm: line.laborNorm,
          knrCode: line.knrCode,
          sort_order: items.length + index,
        })),
      ]);
      resetItemDraft();
      setShowItemForm(false);
      toast({ title: "Dodano", description: "Materiał i robocizna weszły jako dwie pozycje" });
      return;
    }
    const line = lines.find((entry) => entry.type === newItemType) ?? lines[0];
    fillDraft(line);
  };

  const handleStartEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setNewItemName(item.name);
    setNewItemUnit(item.unit);
    setNewItemType(item.type);
    setNewItemPrice(item.price.toString());
    setNewItemQuantity(item.quantity.toString());
    setNewItemHours(item.laborNorm != null && item.laborNorm > 0 ? String(item.laborNorm) : "");
    setNewItemKnr(item.knrCode ?? null);
    setShowItemForm(true);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa pozycji jest wymagana",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newItemPrice) || 0;
    const quantity = parseFloat(newItemQuantity) || 1;
    const hours = newItemType === "labor" && newItemHours.trim() !== "" ? parseFloat(newItemHours) : null;

    if (price < 0) {
      toast({
        title: "Błąd",
        description: "Cena nie może być ujemna",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Błąd",
        description: "Ilość musi być większa od zera",
        variant: "destructive",
      });
      return;
    }

    if (hours != null && (Number.isNaN(hours) || hours < 0)) {
      toast({ title: "Błąd", description: "Godziny nie mogą być ujemne", variant: "destructive" });
      return;
    }

    const itemData: AssemblyItemInput = {
      name: newItemName.trim(),
      unit: newItemUnit,
      type: newItemType,
      price,
      quantity,
      laborNorm: hours != null && hours > 0 ? hours : null,
      knrCode: hours != null && hours > 0 ? newItemKnr : null,
      sort_order: editingIndex !== null ? items[editingIndex].sort_order : items.length,
    };

    if (editingIndex !== null) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[editingIndex] = { ...items[editingIndex], ...itemData };
      setItems(updatedItems);
      toast({
        title: "Zaktualizowano",
        description: "Pozycja została zaktualizowana",
      });
    } else {
      // Add new item
      setItems([...items, itemData]);
      toast({
        title: "Dodano",
        description: "Pozycja została dodana do zestawu",
      });
    }
    
    // Reset form
    resetItemDraft();
    setShowItemForm(false);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    resetItemDraft();
    setShowItemForm(false);
    setEditingIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast({
      title: "Usunięto",
      description: "Pozycja została usunięta z zestawu",
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa zestawu jest wymagana",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Błąd",
        description: "Zestaw musi zawierać co najmniej jeden element",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let result;

      if (mode === "create" || mode === "duplicate") {
        result = await createUserAssembly({
          name: name.trim(),
          description: description.trim() || undefined,
          category_id: categoryId || null,
          building_type: buildingType || "Dom",
          visibility: visibility,
          team_id: visibility === "team" && userTeam?.id ? userTeam.id : undefined,
          items: items.map((item, index) => ({
            name: item.name,
            unit: item.unit,
            type: item.type,
            price: item.price,
            quantity: item.quantity,
            laborNorm: item.laborNorm ?? null,
            knrCode: item.knrCode ?? null,
            sort_order: index,
          })),
        });
      } else if (mode === "edit" && assembly) {
        result = await updateUserAssembly(assembly.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          category_id: categoryId || null,
          building_type: buildingType || "Dom",
          visibility: visibility,
          team_id: visibility === "team" && userTeam?.id ? userTeam.id : undefined,
          items: items.map((item, index) => ({
            name: item.name,
            unit: item.unit,
            type: item.type,
            price: item.price,
            quantity: item.quantity,
            laborNorm: item.laborNorm ?? null,
            knrCode: item.knrCode ?? null,
            sort_order: index,
          })),
        });
      }

      if (result?.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sukces",
          description: result?.message || "Zestaw został zapisany",
        });
        
        // Close the modal and return to the list
        onClose();
        
        // Refresh data without full page reload
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving assembly:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle =
    mode === "create"
      ? "Nowy zestaw"
      : mode === "edit"
      ? "Edytuj zestaw"
      : "Duplikuj zestaw";

  const modalDescription =
    mode === "create"
      ? "Utwórz nowy zestaw z materiałami i robocizną"
      : mode === "edit"
      ? "Edytuj istniejący zestaw"
      : "Utwórz kopię zestawu z wszystkimi pozycjami";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info — _parts/AssemblyEditForm */}
          <AssemblyEditForm
            name={name}
            description={description}
            categoryId={categoryId}
            buildingType={buildingType}
            visibility={visibility}
            categories={categories}
            userTeam={userTeam}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategoryId}
            onBuildingTypeChange={setBuildingType}
            onVisibilityChange={setVisibility}
          />

          {/* Single unified items list with inline edit form */}
          <AssemblyItemsList
            items={items}
            isPro={isPro}
            showItemForm={showItemForm}
            editingIndex={editingIndex}
            newItemName={newItemName} setNewItemName={setNewItemName}
            newItemType={newItemType} setNewItemType={setNewItemType}
            newItemUnit={newItemUnit} setNewItemUnit={setNewItemUnit}
            newItemPrice={newItemPrice} setNewItemPrice={setNewItemPrice}
            newItemQuantity={newItemQuantity} setNewItemQuantity={setNewItemQuantity}
            newItemHours={newItemHours} setNewItemHours={setNewItemHours}
            catalogOptions={catalogOptions}
            isLoadingCatalog={isLoadingCatalog}
            onShowAddForm={() => {
              setShowItemForm(true);
              setEditingIndex(null);
              resetItemDraft();
            }}
            onCatalogItemSelect={handleCatalogItemSelect}
            onNormSelect={handleNormSelect}
            onAddItem={handleAddItem}
            onCancelEdit={handleCancelEdit}
            onStartEdit={handleStartEdit}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>Zapisz zestaw</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
