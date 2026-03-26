"use client";

import { useState } from "react";
import { CustomItemAnalytics } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { AddToGlobalModal } from "./add-to-global-modal";

interface CustomItemsTableProps {
  items: CustomItemAnalytics[];
}

export function CustomItemsTable({ items }: CustomItemsTableProps) {
  const [selectedItem, setSelectedItem] = useState<CustomItemAnalytics | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddToGlobal = (item: CustomItemAnalytics) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Brak danych. Użytkownicy nie dodali jeszcze własnych pozycji.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-xs sm:text-sm">Nazwa Pozycji</TableHead>
              <TableHead className="text-center font-semibold text-xs sm:text-sm">
                Ilość Wystąpień
              </TableHead>
              <TableHead className="text-center font-semibold text-xs sm:text-sm hidden md:table-cell">
                <Users className="w-4 h-4 inline mr-1" />
                Użytkowników
              </TableHead>
              <TableHead className="text-right font-semibold text-xs sm:text-sm hidden lg:table-cell">
                Śr. Cena Materiału
              </TableHead>
              <TableHead className="text-right font-semibold text-xs sm:text-sm hidden lg:table-cell">
                Śr. Cena Robocizny
              </TableHead>
              <TableHead className="text-center font-semibold text-xs sm:text-sm">Akcja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[300px]">
                  {item.item_name}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {item.usage_count}x
                  </span>
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {item.users_count}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                  {item.avg_material_price > 0 
                    ? `${item.avg_material_price.toFixed(2)} zł`
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                  {item.avg_labor_price > 0 
                    ? `${item.avg_labor_price.toFixed(2)} zł`
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAddToGlobal(item)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Dodaj do Bazy</span>
                    <span className="sm:hidden">Dodaj</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal for adding item to global catalog */}
      {selectedItem && (
        <AddToGlobalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}
    </>
  );
}
