"use client";

import { Button } from "@/components/ui/button";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Package, Wrench, Edit, Trash2 } from "lucide-react";
import { AutocompleteInput, type AutocompleteOption } from "@/components/ui/autocomplete-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitType } from "@/lib/types/database";

interface AssemblyItemInput {
  id?: string;
  name: string;
  unit: UnitType;
  type: "material" | "labor";
  price: number;
  quantity: number;
  sort_order?: number;
}

interface ItemEditFormProps {
  newItemName: string; setNewItemName: (v: string) => void;
  newItemType: "material" | "labor"; setNewItemType: (v: "material" | "labor") => void;
  newItemUnit: UnitType; setNewItemUnit: (v: UnitType) => void;
  newItemPrice: string; setNewItemPrice: (v: string) => void;
  newItemQuantity: string; setNewItemQuantity: (v: string) => void;
  catalogOptions: AutocompleteOption[]; isLoadingCatalog: boolean;
  handleCatalogItemSelect: (option: AutocompleteOption) => void;
  handleAddItem: () => void; handleCancelEdit: () => void;
  isEditing: boolean;
}

function ItemEditForm({
  newItemName, setNewItemName,
  newItemType, setNewItemType,
  newItemUnit, setNewItemUnit,
  newItemPrice, setNewItemPrice,
  newItemQuantity, setNewItemQuantity,
  catalogOptions, isLoadingCatalog,
  handleCatalogItemSelect, handleAddItem, handleCancelEdit,
  isEditing,
}: ItemEditFormProps) {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="newItemName">Nazwa pozycji</Label>
            <AutocompleteInput
              id="newItemName"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              options={catalogOptions}
              onSelect={handleCatalogItemSelect}
              placeholder="np. Puszka podtynkowa"
              emptyText="Nie znaleziono w katalogu"
              minChars={2}
              maxResults={10}
              className="mt-1"
              disabled={isLoadingCatalog}
            />
          </div>
          <div>
            <Label htmlFor="newItemType">Typ</Label>
            <Select value={newItemType} onValueChange={(value: "material" | "labor") => setNewItemType(value)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="material"><div className="flex items-center gap-2"><Package className="w-4 h-4" />Materiał</div></SelectItem>
                <SelectItem value="labor"><div className="flex items-center gap-2"><Wrench className="w-4 h-4" />Robocizna</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="newItemUnit">Jednostka</Label>
            <Select value={newItemUnit} onValueChange={(value: UnitType) => setNewItemUnit(value)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="szt">szt (sztuka)</SelectItem>
                <SelectItem value="mb">mb (metr bieżący)</SelectItem>
                <SelectItem value="m2">m² (metr kwadratowy)</SelectItem>
                <SelectItem value="kpl">kpl (komplet)</SelectItem>
                <SelectItem value="godz">godz (godzina)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="newItemPrice">Cena (PLN)</Label>
            <Input
              id="newItemPrice"
              name="newItemPrice"
              type="text"
              inputMode="decimal"
              value={newItemPrice}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) setNewItemPrice(value);
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num) && num >= 0) setNewItemPrice(num.toFixed(2));
                else if (e.target.value !== "") setNewItemPrice("0.00");
              }}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="newItemQuantity">Ilość</Label>
            <Input
              id="newItemQuantity"
              name="newItemQuantity"
              type="text"
              inputMode="decimal"
              value={newItemQuantity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) setNewItemQuantity(value);
              }}
              onBlur={(e) => {
                if (e.target.value === "" || parseFloat(e.target.value) <= 0) setNewItemQuantity("1");
              }}
              placeholder="1"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleAddItem} size="sm" className="flex-1 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent">
            {isEditing ? "Zapisz" : <><Plus className="w-4 h-4 mr-1" />Dodaj</>}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>Anuluj</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AssemblyItemsListProps {
  items: AssemblyItemInput[];
  isPro: boolean;
  showItemForm: boolean;
  editingIndex: number | null;
  newItemName: string; setNewItemName: (v: string) => void;
  newItemType: "material" | "labor"; setNewItemType: (v: "material" | "labor") => void;
  newItemUnit: UnitType; setNewItemUnit: (v: UnitType) => void;
  newItemPrice: string; setNewItemPrice: (v: string) => void;
  newItemQuantity: string; setNewItemQuantity: (v: string) => void;
  catalogOptions: AutocompleteOption[];
  isLoadingCatalog: boolean;
  onShowAddForm: () => void;
  onCatalogItemSelect: (option: AutocompleteOption) => void;
  onAddItem: () => void;
  onCancelEdit: () => void;
  onStartEdit: (index: number) => void;
  onRemoveItem: (index: number) => void;
}

export function AssemblyItemsList({
  items, isPro, showItemForm, editingIndex,
  newItemName, setNewItemName, newItemType, setNewItemType,
  newItemUnit, setNewItemUnit, newItemPrice, setNewItemPrice,
  newItemQuantity, setNewItemQuantity,
  catalogOptions, isLoadingCatalog,
  onShowAddForm, onCatalogItemSelect, onAddItem, onCancelEdit,
  onStartEdit, onRemoveItem,
}: AssemblyItemsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Pozycje w zestawie ({items.length})</Label>
        {!showItemForm && (
          <Button
            type="button"
            size="sm"
            onClick={onShowAddForm}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
          >
            <Plus className="w-4 h-4 mr-1" />
            Dodaj pozycję
          </Button>
        )}
      </div>

      {showItemForm && editingIndex === null && (
        <ItemEditForm
          newItemName={newItemName} setNewItemName={setNewItemName}
          newItemType={newItemType} setNewItemType={setNewItemType}
          newItemUnit={newItemUnit} setNewItemUnit={setNewItemUnit}
          newItemPrice={newItemPrice} setNewItemPrice={setNewItemPrice}
          newItemQuantity={newItemQuantity} setNewItemQuantity={setNewItemQuantity}
          catalogOptions={catalogOptions} isLoadingCatalog={isLoadingCatalog}
          handleCatalogItemSelect={onCatalogItemSelect}
          handleAddItem={onAddItem} handleCancelEdit={onCancelEdit}
          isEditing={false}
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Brak pozycji w zestawie</p>
          <p className="text-xs">Dodaj materiały lub robociznę</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="space-y-2">
              <Card className={editingIndex === index ? "ring-2 ring-blue-400" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {item.type === "material" ? (
                          <Package className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Wrench className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="font-medium">{item.name}</span>
                        <Badge variant={item.type === "material" ? "default" : "secondary"}>
                          {item.type === "material" ? "Materiał" : "Robocizna"}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {item.quantity} {item.unit} × <BlurredPrice value={item.price} isPro={isPro} showBadge={!isPro} className="inline" /> ={" "}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          <BlurredPrice value={item.quantity * item.price} isPro={isPro} showBadge={!isPro} className="font-medium" />
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onStartEdit(index)}
                        title="Edytuj pozycję"
                        disabled={showItemForm}
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        title="Usuń pozycję"
                        disabled={showItemForm}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {showItemForm && editingIndex === index && (
                <ItemEditForm
                  newItemName={newItemName} setNewItemName={setNewItemName}
                  newItemType={newItemType} setNewItemType={setNewItemType}
                  newItemUnit={newItemUnit} setNewItemUnit={setNewItemUnit}
                  newItemPrice={newItemPrice} setNewItemPrice={setNewItemPrice}
                  newItemQuantity={newItemQuantity} setNewItemQuantity={setNewItemQuantity}
                  catalogOptions={catalogOptions} isLoadingCatalog={isLoadingCatalog}
                  handleCatalogItemSelect={onCatalogItemSelect}
                  handleAddItem={onAddItem} handleCancelEdit={onCancelEdit}
                  isEditing={true}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { AssemblyItemInput };
