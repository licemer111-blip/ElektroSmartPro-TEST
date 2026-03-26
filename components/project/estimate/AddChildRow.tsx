"use client";

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";

interface AddChildRowProps {
  isFinal: boolean;
  isReadOnly: boolean;
  isDndEnabled: boolean;
  showMaterialsColumn: boolean;
  showLaborColumn: boolean;
  showRgCol: boolean;
  singleCellBorder: string;
  name: string;
  unit: string;
  quantity: string;
  materialPrice: string;
  laborPrice: string;
  onNameChange: (v: string) => void;
  onUnitChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onMaterialPriceChange: (v: string) => void;
  onLaborPriceChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function AddChildRow({
  isFinal, isReadOnly, isDndEnabled,
  showMaterialsColumn, showLaborColumn, showRgCol,
  singleCellBorder, name, unit, quantity, materialPrice, laborPrice,
  onNameChange, onUnitChange, onQuantityChange, onMaterialPriceChange, onLaborPriceChange,
  onSave, onCancel,
}: AddChildRowProps) {
  return (
    <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/10">
      {!isFinal && !isReadOnly && <TableCell className={singleCellBorder} />}
      {isDndEnabled && !isFinal && <TableCell className={singleCellBorder} />}
      <TableCell className={`text-center ${singleCellBorder}`}>
        <Plus className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
      </TableCell>
      <TableCell className={singleCellBorder}>
        <div className="pl-8">
          <Input type="text" id="child-name" name="child-name" autoComplete="off" value={name} onChange={(e) => onNameChange(e.target.value)}
            className="h-7 text-xs dark:bg-slate-950 dark:border-slate-700"
            placeholder="Nazwa nowej pozycji..." autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} />
        </div>
      </TableCell>
      <TableCell className={`text-center ${singleCellBorder}`}>
        <Input type="text" id="child-unit" name="child-unit" autoComplete="off" value={unit} onChange={(e) => onUnitChange(e.target.value)}
          className="h-7 w-14 text-xs text-center dark:bg-slate-950 dark:border-slate-700" />
      </TableCell>
      <TableCell className={`text-center ${singleCellBorder}`}>
        <Input type="number" id="child-qty" name="child-qty" step="0.01" min="0.01" value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="h-7 w-16 text-xs text-center dark:bg-slate-950 dark:border-slate-700" />
      </TableCell>
      {showMaterialsColumn && (
        <TableCell className={`text-right ${singleCellBorder}`}>
          <Input type="number" id="child-mat" name="child-mat" step="0.01" min="0" value={materialPrice}
            onChange={(e) => onMaterialPriceChange(e.target.value)}
            className="h-7 w-20 text-xs text-right dark:bg-slate-950 dark:border-slate-700 ml-auto" />
        </TableCell>
      )}
      {showLaborColumn && (
        <TableCell className={`text-right ${singleCellBorder}`}>
          <Input type="number" id="child-lab" name="child-lab" step="0.01" min="0" value={laborPrice}
            onChange={(e) => onLaborPriceChange(e.target.value)}
            className="h-7 w-20 text-xs text-right dark:bg-slate-950 dark:border-slate-700 ml-auto" />
        </TableCell>
      )}
      {showRgCol && <TableCell className={singleCellBorder} />}
      <TableCell className={singleCellBorder} />
      {!isReadOnly && (
        <TableCell className={`text-center ${singleCellBorder}`}>
          <div className="flex items-center justify-center gap-1">
            <Button size="sm" onClick={onSave}
              className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="w-3 h-3 mr-1" />Dodaj
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}
              className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
