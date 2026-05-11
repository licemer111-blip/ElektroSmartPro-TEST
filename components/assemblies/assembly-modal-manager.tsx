"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Copy } from "lucide-react";
import { AssemblyModal } from "./assembly-modal";
import { useModalStore } from "@/hooks/use-modal-store";
import type { UserAssemblyWithItems } from "@/lib/types/database";

interface AssemblyModalManagerProps {
  mode: "create" | "edit" | "duplicate";
  assembly?: UserAssemblyWithItems;
  trigger?: React.ReactNode;
  isPro?: boolean;
  currentCount?: number;
  categories?: Array<{ id: string; name: string }>;
}

export function AssemblyModalManager({ mode, assembly, trigger, isPro = false, currentCount = 0, categories = [] }: AssemblyModalManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { onOpen } = useModalStore();

  const handleClick = () => {
    // Check Demo Mode limit for create/duplicate actions (1 assembly max for free users)
    if ((mode === "create" || mode === "duplicate") && !isPro && currentCount >= 1) {
      onOpen('proModal');
      return;
    }
    
    setIsOpen(true);
  };

  const defaultTrigger = mode === "create" ? (
    <Button size="sm" className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent">
      <Plus className="w-4 h-4 mr-1.5" />
      Nowy zestaw
    </Button>
  ) : mode === "edit" ? (
    <Button variant="outline" size="sm" className="flex-1">
      <Edit className="w-4 h-4 mr-1" />
      <span className="hidden sm:inline">Edytuj</span>
    </Button>
  ) : (
    <Button variant="outline" size="sm" className="flex-1">
      <Copy className="w-4 h-4 mr-1" />
      <span className="hidden sm:inline">Duplikuj</span>
    </Button>
  );

  return (
    <>
      <div onClick={handleClick}>
        {trigger || defaultTrigger}
      </div>
      
      <AssemblyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={mode}
        assembly={assembly}
        categories={categories}
        isPro={isPro}
      />
    </>
  );
}
