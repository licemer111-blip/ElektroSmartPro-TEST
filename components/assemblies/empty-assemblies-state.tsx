"use client";

import { Layers, Plus } from "lucide-react";
import { useState } from "react";
import { AssemblyModal } from "./assembly-modal";
import { AIAssemblyGeneratorDialog } from "./ai-assembly-generator-dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyAssembliesStateProps {
  isPro: boolean;
  currentCount: number;
  userTeam?: import("@/lib/types/database").Team | null;
}

export function EmptyAssembliesState({ isPro, currentCount, userTeam }: EmptyAssembliesStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { onOpen } = useModalStore();

  const handleCreateAssembly = () => {
    // Check Demo Mode limit (1 assembly for free users)
    if (!isPro && currentCount >= 1) {
      onOpen('proModal');
      return;
    }
    
    // Open the create assembly modal
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Empty State with Custom Actions */}
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          "p-12 rounded-xl border-2 border-dashed",
          "bg-slate-50/50 dark:bg-slate-900/20",
          "border-slate-300 dark:border-slate-800",
          "text-center"
        )}
      >
        {/* Icon */}
        <div className="mb-6 relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />
          
          {/* Icon container */}
          <div className="relative bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6">
            <Layers className="w-12 h-12 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Nie masz jeszcze żadnych Zestawów
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          Zestawy pozwalają liczyć całe punkty instalacyjne (np. 'Gniazdo wtyczkowe', 'Punkt oświetleniowy') jednym kliknięciem. Każdy zestaw składa się z wielu pozycji katalogowych.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            onClick={handleCreateAssembly}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pierwszy Zestaw
          </Button>
          <AIAssemblyGeneratorDialog
            isPro={isPro}
            userTeam={userTeam}
          />
        </div>
      </div>

      {/* Assembly Creation Modal */}
      <AssemblyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
      />
    </>
  );
}
