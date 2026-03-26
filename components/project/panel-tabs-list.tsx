"use client";
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Copy, Wrench, Cable, ArrowDown } from "lucide-react";

export function PanelTabsList() {
  const triggerCls = "text-[11px] font-semibold gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg";
  return (
    <TabsList className="flex-shrink-0 grid w-full grid-cols-5 h-10 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
      <TabsTrigger value="build" className={triggerCls}>
        <LayoutGrid className="w-3.5 h-3.5" />
        Konstruktor
      </TabsTrigger>
      <TabsTrigger value="templates" className={triggerCls}>
        <Copy className="w-3.5 h-3.5" />
        Szablony
      </TabsTrigger>
      <TabsTrigger value="calculators" className={triggerCls}>
        <Wrench className="w-3.5 h-3.5" />
        Kalkulatory
      </TabsTrigger>
      <TabsTrigger value="schemat" className={triggerCls}>
        <Cable className="w-3.5 h-3.5" />
        Schemat
      </TabsTrigger>
      <TabsTrigger value="summary" className={triggerCls}>
        <ArrowDown className="w-3.5 h-3.5" />
        Podsumowanie
      </TabsTrigger>
    </TabsList>
  );
}
