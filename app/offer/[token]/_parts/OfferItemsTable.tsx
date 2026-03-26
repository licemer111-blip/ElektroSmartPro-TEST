"use client";

// ═══════════════════════════════════════════════════════════════════
// _parts/OfferItemsTable.tsx — Items table with blur (demo) + inline edit
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import type { OfferData, ProposedItemChange } from "../actions";

interface NegotiationCellProps {
  original: number;
  proposed?: number;
  format: (v: number) => string;
  colorClass?: string;
}

function NegotiationCell({ original, proposed, format, colorClass = "" }: NegotiationCellProps) {
  if (proposed !== undefined && Math.abs(proposed - original) > 0.01) {
    return (
      <div>
        <span className="line-through text-slate-400 text-[10px] block">{format(original)}</span>
        <span className="text-orange-600 dark:text-orange-400 font-medium">{format(proposed)}</span>
      </div>
    );
  }
  return <span className={colorClass}>{format(original)}</span>;
}

interface OfferItemsTableProps {
  offer: OfferData;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  proposedEdits: Record<string, ProposedItemChange>;
  setProposedEdits: React.Dispatch<React.SetStateAction<Record<string, ProposedItemChange>>>;
  hasEdits: boolean;
  formatPrice: (v: number) => string;
  handleEditChange: (itemId: string, field: keyof ProposedItemChange, value: number) => void;
  totalMaterials: number;
  totalLabor: number;
  proposedTotalAmount: number;
  totalBrutto: number;
  showMaterialColumn: boolean;
}

export function OfferItemsTable({
  offer,
  editMode,
  setEditMode,
  proposedEdits,
  setProposedEdits,
  hasEdits,
  formatPrice,
  handleEditChange,
  totalMaterials,
  totalLabor,
  proposedTotalAmount,
  totalBrutto,
  showMaterialColumn,
}: OfferItemsTableProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-800/80">
      {/* Table header bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Pozycje kosztorysu
          <Badge className="ml-1 bg-white/20 text-white text-[10px] border-0">
            {offer.items.filter((i) => !i.isAssemblyChild).length} pozycji
          </Badge>
        </h2>

        {editMode && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className={`h-7 text-[11px] gap-1.5 ${hasEdits ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-white/20 text-white/60 cursor-not-allowed"}`}
              onClick={() => { if (hasEdits) setEditMode(false); }}
              disabled={!hasEdits}
            >
              <CheckCircle2 className="w-3 h-3" />
              Zapisz zmiany
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1.5 text-white/70 hover:text-white hover:bg-red-500/20"
              onClick={() => { setEditMode(false); setProposedEdits({}); }}
            >
              <XCircle className="w-3 h-3" />
              Anuluj
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto -mx-px">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700 border-b-2 border-blue-200 dark:border-blue-800">
                <th className="px-2 sm:px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300 w-7 sm:w-8 text-[11px] sm:text-xs">#</th>
                <th className="px-2 sm:px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs">Pozycja</th>
                <th className="px-1 sm:px-2 py-2 text-center font-bold text-slate-600 dark:text-slate-300 w-10 sm:w-12 text-[11px] sm:text-xs hidden sm:table-cell">Jedn.</th>
                <th className="px-1 sm:px-2 py-2 text-center font-bold text-slate-600 dark:text-slate-300 w-10 sm:w-14 text-[11px] sm:text-xs">Ilość</th>
                {showMaterialColumn && (
                  <th className="px-1 sm:px-2 py-2 text-right font-bold text-amber-700 dark:text-amber-400 w-16 sm:w-24 text-[11px] sm:text-xs">Mat.</th>
                )}
                <th className="px-1 sm:px-2 py-2 text-right font-bold text-blue-700 dark:text-blue-400 w-16 sm:w-24 text-[11px] sm:text-xs">Rob.</th>
                <th className="px-2 sm:px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-300 w-18 sm:w-24 text-[11px] sm:text-xs">Suma</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let rowNum = 0;
                const colSpan = showMaterialColumn ? 7 : 6;
                return offer.items.map((item, idx) => {
                  const prevSection = idx > 0 ? offer.items[idx - 1].section : "__first__";
                  const showSectionHeader =
                    !item.isAssemblyChild &&
                    item.section !== prevSection &&
                    (item.section || prevSection !== "__first__");
                  if (!item.isAssemblyChild) rowNum++;

                  const itemEdits = proposedEdits[item.id];
                  const hasItemEdits = !!itemEdits;
                  const isEditable = editMode && !item.isAssemblyChild;

                  const displayQty = itemEdits?.quantity ?? item.quantity;
                  const displayMat = itemEdits?.materialPrice ?? item.materialPrice;
                  const displayLab = itemEdits?.laborPrice ?? item.laborPrice;
                  const displayTotal = displayMat + displayLab;

                  return (
                    <React.Fragment key={item.id}>
                      {showSectionHeader && item.section && (
                        <tr className="bg-purple-50 dark:bg-purple-950/30">
                          <td
                            colSpan={colSpan}
                            className="px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider border-t-2 border-purple-200 dark:border-purple-800 border-b border-purple-100 dark:border-purple-900"
                          >
                            {item.section}
                          </td>
                        </tr>
                      )}
                      <tr
                        className={`border-b border-slate-100 dark:border-slate-700 transition-colors ${
                          hasItemEdits
                            ? "bg-orange-50/60 dark:bg-orange-950/15"
                            : item.isAssemblyChild
                            ? "bg-blue-50/20 dark:bg-blue-950/10"
                            : idx % 2 === 0
                            ? "bg-white dark:bg-slate-800"
                            : "bg-slate-50/50 dark:bg-slate-800/50"
                        }`}
                      >
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs font-medium">
                          {item.isAssemblyChild ? "" : rowNum}
                        </td>
                        <td
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[12px] sm:text-[13px] ${
                            item.isAssemblyChild
                              ? "pl-5 sm:pl-7 text-slate-500 dark:text-slate-400"
                              : "text-slate-800 dark:text-slate-100 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {item.isAssemblyChild && <span className="text-slate-300 dark:text-slate-600">└</span>}
                            <span>{item.name}</span>
                            {hasItemEdits && (
                              <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-[9px] px-1 py-0 leading-tight border-0">
                                Korekta
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-1 sm:px-2 py-1.5 sm:py-2 text-center text-[11px] sm:text-xs hidden sm:table-cell ${
                            item.isAssemblyChild ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {item.unit}
                        </td>

                        {/* Quantity */}
                        <td className="px-1 sm:px-2 py-1.5 sm:py-2 text-center text-[11px] sm:text-xs">
                          {isEditable ? (
                            <Input
                              id={`offer-qty-${item.id}`}
                              name={`offer-qty-${item.id}`}
                              type="number"
                              step="0.01"
                              min="0.01"
                              aria-label={`Ilość: ${item.name}`}
                              defaultValue={displayQty}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v) && v > 0) handleEditChange(item.id, "quantity", v);
                              }}
                              className="h-6 w-14 text-center text-[11px] px-1 dark:bg-slate-900 dark:border-slate-600"
                            />
                          ) : (
                            <NegotiationCell
                              original={item.quantity}
                              proposed={itemEdits?.quantity}
                              format={(v) => v.toString()}
                            />
                          )}
                        </td>

                        {/* Material price */}
                        {showMaterialColumn && (
                          <td className="px-1 sm:px-2 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs">
                            {/* Demo blur */}
                            {offer.isDemo ? (
                              <span className="blur-sm select-none text-amber-700">*** zł</span>
                            ) : isEditable ? (
                              <Input
                                id={`offer-mat-${item.id}`}
                                name={`offer-mat-${item.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                aria-label={`Cena materiału: ${item.name}`}
                                defaultValue={displayMat}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!isNaN(v) && v >= 0) handleEditChange(item.id, "materialPrice", v);
                                }}
                                className="h-6 w-20 text-right text-[11px] px-1 ml-auto dark:bg-slate-900 dark:border-slate-600"
                              />
                            ) : (
                              <NegotiationCell
                                original={item.materialPrice}
                                proposed={itemEdits?.materialPrice}
                                format={formatPrice}
                                colorClass="text-amber-700 dark:text-amber-400"
                              />
                            )}
                          </td>
                        )}

                        {/* Labor price */}
                        <td className="px-1 sm:px-2 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs">
                          {offer.isDemo ? (
                            <span className="blur-sm select-none text-blue-700">*** zł</span>
                          ) : isEditable ? (
                            <Input
                              id={`offer-lab-${item.id}`}
                              name={`offer-lab-${item.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              aria-label={`Cena robocizny: ${item.name}`}
                              defaultValue={displayLab}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v) && v >= 0) handleEditChange(item.id, "laborPrice", v);
                              }}
                              className="h-6 w-20 text-right text-[11px] px-1 ml-auto dark:bg-slate-900 dark:border-slate-600"
                            />
                          ) : (
                            <NegotiationCell
                              original={item.laborPrice}
                              proposed={itemEdits?.laborPrice}
                              format={formatPrice}
                              colorClass="text-blue-700 dark:text-blue-400"
                            />
                          )}
                        </td>

                        {/* Total */}
                        <td
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-sm ${
                            item.isAssemblyChild
                              ? "text-slate-400 dark:text-slate-500"
                              : "font-semibold text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {offer.isDemo ? (
                            <span className="blur-sm select-none">*** zł</span>
                          ) : hasItemEdits ? (
                            <div>
                              <span className="line-through text-slate-400 text-[10px] mr-1">{formatPrice(item.totalPrice)}</span>
                              <span className="text-orange-600 dark:text-orange-400">{formatPrice(displayTotal)}</span>
                            </div>
                          ) : (
                            formatPrice(item.totalPrice)
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Totals footer — ΣNet_labor*(1+VAT_L) + ΣNet_mat*(1+VAT_M) */}
        <div
          className={`border-t-2 ${hasEdits ? "border-orange-200 dark:border-orange-800" : "border-blue-200 dark:border-blue-800"} bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-blue-950/20 px-4 py-4 space-y-2`}
        >
          {showMaterialColumn && (
            <div className="flex justify-between text-sm">
              <span className="text-amber-600 dark:text-amber-400">Materiały</span>
              <span className="font-medium text-amber-700 dark:text-amber-300">{formatPrice(totalMaterials)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-blue-600 dark:text-blue-400">Robocizna</span>
            <span className="font-medium text-blue-700 dark:text-blue-300">{formatPrice(totalLabor)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1.5 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Suma netto</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {hasEdits && Math.abs(proposedTotalAmount - offer.totalAmount) > 0.01 ? (
                <span>
                  <span className="line-through text-slate-400 text-xs mr-1">{formatPrice(offer.totalAmount)}</span>
                  <span className="text-orange-600 dark:text-orange-400">{formatPrice(proposedTotalAmount)}</span>
                </span>
              ) : (
                formatPrice(proposedTotalAmount)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">VAT ({offer.vatRate}%)</span>
            <span className="text-slate-600 dark:text-slate-300">
              {formatPrice((proposedTotalAmount * offer.vatRate) / 100)}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t-2 border-blue-200 dark:border-blue-700">
            <span className="font-bold text-base text-slate-900 dark:text-white">Brutto</span>
            <span className={`font-bold text-xl ${hasEdits ? "text-orange-600 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"}`}>
              {formatPrice(totalBrutto)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
