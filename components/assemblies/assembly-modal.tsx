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

  const handleCatalogItemSelect = (option: AutocompleteOption) => {
    const metadata = option.metadata;
    if (!metadata) return;
    setNewItemName(option.label);
    setNewItemUnit(metadata.unit as UnitType);
    
    // Set price based on type
    const price = Number(newItemType === "material" ? metadata.materialPrice : metadata.laborPrice) || 0;
    setNewItemPrice(price.toFixed(2));
  };

  const handleStartEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setNewItemName(item.name);
    setNewItemUnit(item.unit);
    setNewItemType(item.type);
    setNewItemPrice(item.price.toString());
    setNewItemQuantity(item.quantity.toString());
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

    const itemData: AssemblyItemInput = {
      name: newItemName.trim(),
      unit: newItemUnit,
      type: newItemType,
      price,
      quantity,
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
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQuantity("1");
    setShowItemForm(false);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQuantity("1");
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
            catalogOptions={catalogOptions}
            isLoadingCatalog={isLoadingCatalog}
            onShowAddForm={() => {
              setShowItemForm(true);
              setEditingIndex(null);
              setNewItemName("");
              setNewItemPrice("");
              setNewItemQuantity("1");
              setNewItemType("material");
              setNewItemUnit("szt");
            }}
            onCatalogItemSelect={handleCatalogItemSelect}
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
