import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({ page, totalPages, total, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Card className="border-slate-200 dark:border-slate-800/40 bg-white dark:bg-slate-900/50 backdrop-blur-sm mt-3 sm:mt-4 mb-4 sm:mb-6 mx-3 sm:mx-4 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
          Strona {page} z {totalPages}
          <span className="hidden sm:inline"> ({total} pozycji)</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="h-8 flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Poprzednia</span>
            <span className="sm:hidden">Poprz.</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="h-8 flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Następna</span>
            <span className="sm:hidden">Nast.</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
