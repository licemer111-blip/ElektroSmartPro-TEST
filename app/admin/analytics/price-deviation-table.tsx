"use client";

import { PriceDeviationItem } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceDeviationTableProps {
  items: PriceDeviationItem[];
}

export function PriceDeviationTable({ items }: PriceDeviationTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Świetnie! Wszystkie ceny są zgodne z bazą globalną (odchylenie &lt;10%).
        </p>
      </div>
    );
  }

  const getDeviationIcon = (deviation: number) => {
    if (deviation > 10) {
      return <TrendingUp className="w-4 h-4 text-red-600" />;
    } else if (deviation < -10) {
      return <TrendingDown className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  };

  const getDeviationColor = (deviation: number) => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation > 20) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (absDeviation > 15) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-xs sm:text-sm">Nazwa Pozycji</TableHead>
            <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Kategoria</TableHead>
            <TableHead className="text-right font-semibold text-xs sm:text-sm hidden lg:table-cell">
              Cena Globalna (Mat.)
            </TableHead>
            <TableHead className="text-right font-semibold text-xs sm:text-sm hidden lg:table-cell">
              Śr. Cena Użytk. (Mat.)
            </TableHead>
            <TableHead className="text-center font-semibold text-xs sm:text-sm">
              Odchyl. (%)
            </TableHead>
            <TableHead className="text-right font-semibold text-xs sm:text-sm hidden xl:table-cell">
              Cena Glob. (Rob.)
            </TableHead>
            <TableHead className="text-right font-semibold text-xs sm:text-sm hidden xl:table-cell">
              Śr. Cena Uż. (Rob.)
            </TableHead>
            <TableHead className="text-center font-semibold text-xs sm:text-sm hidden sm:table-cell">
              Odchyl. (%)
            </TableHead>
            <TableHead className="text-center font-semibold text-xs sm:text-sm hidden md:table-cell">
              Użycia
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.catalog_id}>
              <TableCell className="font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]">
                {item.item_name}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline" className="text-xs">
                  {item.category_name}
                </Badge>
              </TableCell>
              
              {/* Material Price Section */}
              <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                {item.global_material_price.toFixed(2)} zł
              </TableCell>
              <TableCell className="text-right font-medium text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                {item.user_avg_material_price.toFixed(2)} zł
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="hidden sm:inline">{getDeviationIcon(item.material_deviation_percent)}</span>
                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${getDeviationColor(item.material_deviation_percent)}`}>
                    {item.material_deviation_percent > 0 ? "+" : ""}
                    {item.material_deviation_percent.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              
              {/* Labor Price Section */}
              <TableCell className="text-right text-xs sm:text-sm hidden xl:table-cell whitespace-nowrap">
                {item.global_labor_price.toFixed(2)} zł
              </TableCell>
              <TableCell className="text-right font-medium text-xs sm:text-sm hidden xl:table-cell whitespace-nowrap">
                {item.user_avg_labor_price.toFixed(2)} zł
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <span className="hidden md:inline">{getDeviationIcon(item.labor_deviation_percent)}</span>
                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${getDeviationColor(item.labor_deviation_percent)}`}>
                    {item.labor_deviation_percent > 0 ? "+" : ""}
                    {item.labor_deviation_percent.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              
              {/* Usage Count */}
              <TableCell className="text-center hidden md:table-cell">
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {item.usage_count}x
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
