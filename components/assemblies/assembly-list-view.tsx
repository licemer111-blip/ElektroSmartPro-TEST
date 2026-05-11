"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, FolderInput, Users, Sparkles, Copy, Share2, UserMinus } from "lucide-react";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { AssemblyModal } from "./assembly-modal";
import { DeleteAssemblyButton } from "./delete-assembly-button";
import { moveAssemblyToCategory } from "@/app/dashboard/actions";
import { updateAssemblyVisibility } from "@/app/dashboard/assemblies/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { UserAssemblyWithItems, Team } from "@/lib/types/database";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface AssemblyListViewProps {
  assemblies: UserAssemblyWithItems[];
  categories: AssemblyCategory[];
  isPro: boolean;
  currentCount: number;
  userTeam?: Team | null;
}

export function AssemblyListView({
  assemblies,
  categories,
  isPro,
  currentCount,
  userTeam,
}: AssemblyListViewProps) {
  const [selectedAssembly, setSelectedAssembly] = useState<UserAssemblyWithItems | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [assemblyToMove, setAssemblyToMove] = useState<UserAssemblyWithItems | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (assembly: UserAssemblyWithItems) => {
    setSelectedAssembly(assembly);
    setIsEditModalOpen(true);
  };

  const handleMoveClick = (assembly: UserAssemblyWithItems) => {
    setAssemblyToMove(assembly);
    setTargetCategoryId(assembly.category_id || "uncategorized");
    setIsMoveDialogOpen(true);
  };

  const handleMoveAssembly = async () => {
    if (!assemblyToMove) return;

    const categoryId = targetCategoryId === "uncategorized" ? null : targetCategoryId;

    const result = await moveAssemblyToCategory(assemblyToMove.id, categoryId);

    if (result.error) {
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukces",
        description: "Zestaw został przeniesiony",
      });
      setIsMoveDialogOpen(false);
      setAssemblyToMove(null);
      router.refresh();
    }
  };

  const calculateTotalPrice = (assembly: UserAssemblyWithItems) => {
    if (!assembly.user_assembly_items) return 0;
    return assembly.user_assembly_items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  return (
    <>
      <div className="border rounded-lg overflow-auto bg-white dark:bg-slate-900 max-h-full">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900">
            <TableRow>
              <TableHead className="w-[40%] bg-slate-50 dark:bg-slate-800">Nazwa zestawu</TableHead>
              <TableHead className="w-[15%] text-center bg-slate-50 dark:bg-slate-800">Pozycje</TableHead>
              <TableHead className="w-[20%] text-right bg-slate-50 dark:bg-slate-800">Cena całkowita</TableHead>
              <TableHead className="w-[15%] bg-slate-50 dark:bg-slate-800">Kategoria</TableHead>
              <TableHead className="w-[10%] text-right bg-slate-50 dark:bg-slate-800">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assemblies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Brak zestawów do wyświetlenia
                </TableCell>
              </TableRow>
            ) : (
              assemblies.map((assembly) => {
                const itemCount = assembly.user_assembly_items?.length || 0;
                const totalPrice = calculateTotalPrice(assembly);
                const category = categories.find(c => c.id === assembly.category_id);

                return (
                  <TableRow key={assembly.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell className="font-medium">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {assembly.name}
                          </span>
                          {assembly.is_ai_generated && (
                            <span 
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex-shrink-0"
                              title="Zestaw wygenerowany przez AI"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {assembly.visibility === "team" && assembly.team_id && (
                            <span 
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0"
                              title="Zestaw udostępniony zespołowi"
                            >
                              <Users className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        {assembly.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">
                            {assembly.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {itemCount} {itemCount === 1 ? "pozycja" : "pozycji"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      <BlurredPrice value={totalPrice} isPro={isPro} showBadge={!isPro} className="font-mono font-semibold" />
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Bez kategorii</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handleEdit(assembly)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveClick(assembly)}>
                            <FolderInput className="w-4 h-4 mr-2" />
                            Przenieś do kategorii
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // Open modal with assembly data but empty ID (creates new)
                            setSelectedAssembly({
                              ...assembly,
                              id: "",
                              name: `${assembly.name} (kopia)`,
                            } as UserAssemblyWithItems);
                            setIsEditModalOpen(true);
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplikuj
                          </DropdownMenuItem>
                          
                          {/* Team sharing */}
                          {userTeam && (
                            <>
                              <DropdownMenuSeparator />
                              {assembly.visibility === "team" ? (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const result = await updateAssemblyVisibility(assembly.id, "personal");
                                    if (result.error) {
                                      toast({
                                        title: "Błąd",
                                        description: result.error,
                                        variant: "destructive",
                                      });
                                    } else {
                                      toast({
                                        title: "Sukces",
                                        description: "Zestaw jest teraz prywatny",
                                      });
                                      router.refresh();
                                    }
                                  }}
                                >
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Usuń z zespołu
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const result = await updateAssemblyVisibility(assembly.id, "team", userTeam.id);
                                    if (result.error) {
                                      toast({
                                        title: "Błąd",
                                        description: result.error,
                                        variant: "destructive",
                                      });
                                    } else {
                                      toast({
                                        title: "Sukces",
                                        description: "Zestaw udostępniony zespołowi",
                                      });
                                      router.refresh();
                                    }
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2 text-blue-600" />
                                  <span className="text-blue-600">Udostępnij zespołowi</span>
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DeleteAssemblyButton
                            assemblyId={assembly.id}
                            assemblyName={assembly.name}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <AssemblyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAssembly(null);
        }}
        mode="edit"
        assembly={selectedAssembly || undefined}
        categories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
      />

      {/* Move Dialog */}
      {isMoveDialogOpen && assemblyToMove && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Przenieś do kategorii</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Przenieś <strong>{assemblyToMove.name}</strong> do innej kategorii
            </p>
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Bez kategorii</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMoveDialogOpen(false);
                  setAssemblyToMove(null);
                }}
              >
                Anuluj
              </Button>
              <Button onClick={handleMoveAssembly}>
                Przenieś
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
