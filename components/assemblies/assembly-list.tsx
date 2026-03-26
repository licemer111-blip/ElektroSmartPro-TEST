"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Package, Trash2, Loader2, CheckCircle2, Users, User, Globe, Search, MoreVertical, Edit, Copy } from "lucide-react";
import { getUserAssemblies, deleteUserAssembly, duplicateUserAssembly } from "@/app/dashboard/assemblies/actions";
import type { UserAssemblyWithItems } from "@/lib/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssemblyListProps {
  onSelect: (assembly: UserAssemblyWithItems) => void;
  selectedAssemblyId?: string | null;
  refreshTrigger?: number; // Increment to force refresh
  onEdit?: (assembly: UserAssemblyWithItems) => void;
  onDuplicate?: (assembly: UserAssemblyWithItems) => void;
  isPro?: boolean;
}

export function AssemblyList({ onSelect, selectedAssemblyId, refreshTrigger = 0, onEdit, onDuplicate, isPro = true }: AssemblyListProps) {
  const [assemblies, setAssemblies] = useState<UserAssemblyWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assemblyToDelete, setAssemblyToDelete] = useState<UserAssemblyWithItems | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | "personal" | "team">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Check if any assemblies are team-shared
  const hasTeamAssemblies = assemblies.some(a => a.visibility === "team" && a.team_id);

  // Filter assemblies by source and search
  const filteredAssemblies = assemblies.filter(assembly => {
    // Filter by source
    if (sourceFilter === "personal" && assembly.visibility === "team") {
      return false;
    }
    if (sourceFilter === "team" && assembly.visibility !== "team") {
      return false;
    }
    
    // Filter by search
    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      return assembly.name.toLowerCase().includes(normalizedSearch) ||
             (assembly.description?.toLowerCase().includes(normalizedSearch) || false);
    }
    
    return true;
  });

  useEffect(() => {
    loadAssemblies();
  }, [refreshTrigger]);

  const loadAssemblies = async () => {
    setIsLoading(true);
    try {
      const data = await getUserAssemblies();
      setAssemblies(data);
    } catch (error) {
      console.error("Error loading assemblies:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować zestawów",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, assembly: UserAssemblyWithItems) => {
    e.stopPropagation();
    setAssemblyToDelete(assembly);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assemblyToDelete) return;

    setDeletingId(assemblyToDelete.id);
    try {
      const result = await deleteUserAssembly(assemblyToDelete.id);

      if (result.success) {
        toast({
          title: "Sukces!",
          description: result.message || "Zestaw został usunięty",
        });
        // Refresh list
        await loadAssemblies();
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się usunąć zestawu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting assembly:", error);
      toast({
        title: "Błąd",
        description: "Nieoczekiwany błąd podczas usuwania",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setAssemblyToDelete(null);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, assembly: UserAssemblyWithItems) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(assembly);
      return;
    }
    setDuplicatingId(assembly.id);
    try {
      const result = await duplicateUserAssembly(assembly.id);
      if (result.success) {
        toast({
          title: "Sukces!",
          description: `Zduplikowano zestaw "${assembly.name}"`,
        });
        await loadAssemblies();
      } else {
        toast({
          title: "Błąd",
          description: ("error" in result ? result.error : undefined) || "Nie udało się zduplikować zestawu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error duplicating assembly:", error);
      toast({
        title: "Błąd",
        description: "Nieoczekiwany błąd podczas duplikowania",
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, assembly: UserAssemblyWithItems) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(assembly);
    }
  };

  const calculateAssemblyTotal = (assembly: UserAssemblyWithItems) => {
    if (!assembly.user_assembly_items) return 0;
    return assembly.user_assembly_items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assemblies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Brak własnych zestawów</p>
        <p className="text-sm">Kliknij "Stwórz nowy" aby utworzyć swój pierwszy zestaw</p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="assembly-list-search"
            name="assembly-list-search"
            aria-label="Szukaj zestawów"
            placeholder="Szukaj zestawów..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Filter Tabs - only show if there are team assemblies */}
        {hasTeamAssemblies && (
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setSourceFilter("all")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                sourceFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Globe className="w-3 h-3" />
              Wszystko
            </button>
            <button
              onClick={() => setSourceFilter("personal")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                sourceFilter === "personal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <User className="w-3 h-3" />
              Moje
            </button>
            <button
              onClick={() => setSourceFilter("team")}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                sourceFilter === "team"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Users className="w-3 h-3" />
              Zespół
            </button>
          </div>
        )}
      </div>

      {filteredAssemblies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Brak zestawów pasujących do filtrów</p>
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 gap-3">
        {filteredAssemblies.map((assembly) => {
          const isSelected = selectedAssemblyId === assembly.id;
          const isDeleting = deletingId === assembly.id;
          const itemCount = assembly.user_assembly_items?.length || 0;
          const total = calculateAssemblyTotal(assembly);

          const isBusy = isDeleting || duplicatingId === assembly.id;

          return (
            <Card
              key={assembly.id}
              className={`cursor-pointer transition-all bg-card dark:bg-slate-800/60 ${
                isSelected
                  ? "border-blue-500 border-2 shadow-md ring-1 ring-blue-500/20"
                  : "border-border hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600"
              } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => !isBusy && onSelect(assembly)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <span className="truncate">{assembly.name}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />}
                      {assembly.visibility === "team" && assembly.team_id && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                          <Users className="w-2.5 h-2.5 mr-0.5" />
                          Zespół
                        </Badge>
                      )}
                    </CardTitle>
                    {assembly.description && (
                      <CardDescription className="text-sm mt-1 line-clamp-2">
                        {assembly.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Opcje zestawu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {onEdit && (
                        <DropdownMenuItem onClick={(e) => handleEdit(e as unknown as React.MouseEvent, assembly)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edytuj
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => handleDuplicate(e as unknown as React.MouseEvent, assembly)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplikuj
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                        onClick={(e) => handleDeleteClick(e as unknown as React.MouseEvent, assembly)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Zawiera:</span>
                    <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-200">{itemCount} pozycji</Badge>
                  </div>

                  {/* Item preview */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {assembly.user_assembly_items?.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-1 min-w-0">
                        <span className="truncate flex-1 min-w-0">
                          • {item.name} ({item.quantity} {item.unit})
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 shrink-0 whitespace-nowrap">
                          {isPro ? `${item.price.toFixed(2)} zł` : '*** zł'}
                        </span>
                      </div>
                    ))}
                    {itemCount > 3 && (
                      <div className="text-blue-500 dark:text-blue-400">+ {itemCount - 3} więcej...</div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                    <span className="font-medium">Wartość:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {isPro ? `${total.toFixed(2)} zł` : '*** zł'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten zestaw?</AlertDialogTitle>
            <AlertDialogDescription>
              Zestaw <strong>"{assemblyToDelete?.name}"</strong> zostanie trwale usunięty.
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
