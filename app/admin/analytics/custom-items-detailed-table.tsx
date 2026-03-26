"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Trash2,
  Plus,
  User,
  FolderKanban,
  Loader2,
  ArrowUpDown,
  Package,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import type { DetailedCustomItem } from "./actions";
import { deleteCustomItem } from "./actions";
import { AddToGlobalDetailedModal } from "./add-to-global-detailed-modal";

interface CustomItemsDetailedTableProps {
  items: DetailedCustomItem[];
}

export function CustomItemsDetailedTable({ items: initialItems }: CustomItemsDetailedTableProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"created_at" | "item_name" | "user_email" | "material_price" | "labor_price">("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addItem, setAddItem] = useState<DetailedCustomItem | null>(null);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = useMemo(() => {
    let result = [...items];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.user_email.toLowerCase().includes(q) ||
          i.user_full_name.toLowerCase().includes(q) ||
          i.project_name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortKey) {
        case "item_name": aVal = a.item_name; bVal = b.item_name; break;
        case "user_email": aVal = a.user_email; bVal = b.user_email; break;
        case "material_price": aVal = a.material_price; bVal = b.material_price; break;
        case "labor_price": aVal = a.labor_price; bVal = b.labor_price; break;
        case "created_at": aVal = a.created_at; bVal = b.created_at; break;
      }
      if (typeof aVal === "string") return sortAsc ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortAsc ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

    return result;
  }, [items, search, sortKey, sortAsc]);

  const handleDelete = async (item: DetailedCustomItem) => {
    if (!confirm(`Usunąć pozycję "${item.item_name}" z projektu "${item.project_name}"?`)) return;
    setDeletingId(item.item_id);
    const result = await deleteCustomItem(item.item_id);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.item_id !== item.item_id));
      toast.success("Pozycja usunięta");
    } else {
      toast.error(result.error || "Błąd usuwania");
    }
    setDeletingId(null);
  };

  const formatPrice = (v: number) =>
    v > 0
      ? new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + " zł"
      : "—";

  const formatRelative = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: pl }); }
    catch { return "—"; }
  };

  // Unique users count
  const uniqueUsers = new Set(items.map((i) => i.user_id)).size;

  const SortBtn = ({ field, children }: { field: typeof sortKey; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className="w-3 h-3 ml-1" />
    </Button>
  );

  if (items.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">Brak własnych pozycji użytkowników.</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{items.length}</div>
              <div className="text-xs text-slate-500">Pozycji</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{uniqueUsers}</div>
              <div className="text-xs text-slate-500">Autorów</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <FolderKanban className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{new Set(items.map((i) => i.project_id)).size}</div>
              <div className="text-xs text-slate-500">Projektów</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          id="admin-custom-items-search"
          name="admin-custom-items-search"
          aria-label="Szukaj po nazwie, email, projekcie"
          placeholder="Szukaj po nazwie, email, projekcie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <SortBtn field="item_name">Nazwa Pozycji</SortBtn>
                </TableHead>
                <TableHead className="text-center w-[60px]">Jedn.</TableHead>
                <TableHead className="text-right w-[100px]">
                  <SortBtn field="material_price">Materiał</SortBtn>
                </TableHead>
                <TableHead className="text-right w-[100px]">
                  <SortBtn field="labor_price">Robocizna</SortBtn>
                </TableHead>
                <TableHead className="w-[180px]">
                  <SortBtn field="user_email">Autor</SortBtn>
                </TableHead>
                <TableHead className="w-[140px] hidden lg:table-cell">Projekt</TableHead>
                <TableHead className="w-[100px]">
                  <SortBtn field="created_at">Kiedy</SortBtn>
                </TableHead>
                <TableHead className="text-center w-[140px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search ? "Brak wyników" : "Brak pozycji"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.item_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[200px] text-slate-900 dark:text-slate-100">
                        {item.item_name}
                      </div>
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-400">x{item.quantity}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{item.unit || "szt."}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">
                      {formatPrice(item.material_price)}
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">
                      {formatPrice(item.labor_price)}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate text-slate-700 dark:text-slate-200">
                          {item.user_full_name || item.user_email.split("@")[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-xs text-slate-500 truncate max-w-[140px]" title={item.project_name}>
                        {item.project_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-500">{formatRelative(item.created_at)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2"
                          onClick={() => setAddItem(item)}
                          title="Dodaj do Globalnej Bazy"
                        >
                          <Plus className="w-3.5 h-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Do bazy</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 w-7 p-0"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.item_id}
                          title="Usuń pozycję"
                        >
                          {deletingId === item.item_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add to Global Modal */}
      {addItem && (
        <AddToGlobalDetailedModal
          isOpen={!!addItem}
          onClose={() => setAddItem(null)}
          item={addItem}
        />
      )}
    </>
  );
}
