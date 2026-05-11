"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Boxes } from "lucide-react";
import { deleteUserAssembly, updateAssemblyVisibility } from "@/app/dashboard/assemblies/actions";
import { useToast } from "@/hooks/use-toast";
import type { UserAssemblyWithItems, Team } from "@/lib/types/database";
import { AssemblyCard } from "@/components/assemblies/_parts/AssemblyCard";
import { AssemblyMoveDialog } from "@/components/assemblies/_parts/AssemblyMoveDialog";
import { AssemblyPreviewDialog } from "@/components/assemblies/_parts/AssemblyPreviewDialog";
import { AssemblyDeleteDialog } from "@/components/assemblies/_parts/AssemblyDeleteDialog";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface AssembliesWithTabsProps {
  assemblies: UserAssemblyWithItems[];
  isPro: boolean;
  currentCount: number;
  categories?: AssemblyCategory[];
  userTeam?: Team | null;
}

export function AssembliesWithTabs({ assemblies, isPro, currentCount, categories = [], userTeam }: AssembliesWithTabsProps) {
  return (
    <AssemblyGrid
      assemblies={assemblies}
      isPro={isPro}
      currentCount={currentCount}
      categories={categories}
      userTeam={userTeam}
    />
  );
}

function AssemblyGrid({
  assemblies,
  emptyMessage = "Brak zestawów w tej kategorii",
  isPro = false,
  currentCount = 0,
  categories = [],
  userTeam,
}: {
  assemblies: UserAssemblyWithItems[];
  emptyMessage?: string;
  isPro?: boolean;
  currentCount?: number;
  categories?: AssemblyCategory[];
  userTeam?: Team | null;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const categoryOptions = categories.map((cat) => ({ id: cat.id, name: cat.name }));

  const [assemblyToMove, setAssemblyToMove] = useState<UserAssemblyWithItems | null>(null);
  const [assemblyToDelete, setAssemblyToDelete] = useState<UserAssemblyWithItems | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewAssembly, setPreviewAssembly] = useState<UserAssemblyWithItems | null>(null);

  const handleMove = async (categoryId: string | null) => {
    if (!assemblyToMove) return;
    const { moveAssemblyToCategory } = await import("@/app/dashboard/actions");
    const result = await moveAssemblyToCategory(assemblyToMove.id, categoryId);
    if (!result.error) {
      setAssemblyToMove(null);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!assemblyToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteUserAssembly(assemblyToDelete.id);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Usunięto", description: result.message || "Zestaw został usunięty" });
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Wystąpił nieoczekiwany błąd", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setAssemblyToDelete(null);
    }
  };

  const handleShareToggle = async (assembly: UserAssemblyWithItems, visibility: "personal" | "team") => {
    const result = await updateAssemblyVisibility(
      assembly.id,
      visibility,
      visibility === "team" ? userTeam?.id : undefined
    );
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: "Sukces",
        description: visibility === "team" ? "Zestaw udostępniony zespołowi" : "Zestaw jest teraz prywatny",
      });
      router.refresh();
    }
  };

  if (assemblies.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 mb-4">
            <Boxes className="w-10 h-10 text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-center">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {assemblies.map((assembly) => (
          <AssemblyCard
            key={assembly.id}
            assembly={assembly}
            isPro={isPro}
            currentCount={currentCount}
            categoryOptions={categoryOptions}
            userTeam={userTeam}
            onPreview={setPreviewAssembly}
            onMoveRequest={setAssemblyToMove}
            onDeleteRequest={(a) => setAssemblyToDelete(a)}
            onShareToggle={handleShareToggle}
          />
        ))}
      </div>

      {assemblyToMove && (
        <AssemblyMoveDialog
          assembly={assemblyToMove}
          categories={categories}
          onMove={handleMove}
          onClose={() => setAssemblyToMove(null)}
        />
      )}

      <AssemblyPreviewDialog
        assembly={previewAssembly}
        isPro={isPro}
        onClose={() => setPreviewAssembly(null)}
      />

      <AssemblyDeleteDialog
        assembly={assemblyToDelete}
        isDeleting={isDeleting}
        open={!!assemblyToDelete}
        onOpenChange={(open) => { if (!open) setAssemblyToDelete(null); }}
        onConfirm={handleDelete}
      />
    </>
  );
}
