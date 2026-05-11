"use client";

import { Package, Wrench, Boxes } from "lucide-react";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserAssemblyWithItems } from "@/lib/types/database";

interface AssemblyPreviewDialogProps {
  assembly: UserAssemblyWithItems | null;
  isPro: boolean;
  onClose: () => void;
}

export function AssemblyPreviewDialog({ assembly, isPro, onClose }: AssemblyPreviewDialogProps) {
  return (
    <Dialog open={!!assembly} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-xl max-h-[85vh] overflow-y-auto">
        {assembly && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-6">
                <Boxes className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="truncate">{assembly.name}</span>
              </DialogTitle>
              {assembly.description && (
                <DialogDescription className="line-clamp-2">{assembly.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-1.5 mt-2">
              {assembly.user_assembly_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {item.type === "material" ? (
                      <Package className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <Wrench className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{item.name}</span>
                        <Badge
                          className={`text-[8px] px-1 py-0 flex-shrink-0 leading-4 ${
                            item.type === "material"
                              ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                              : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {item.type === "material" ? "Mat." : "Rob."}
                        </Badge>
                      </div>
                      {item.type === "labor" && item.knr_code && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate block">
                          {item.knr_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <BlurredPrice value={item.quantity * item.price} isPro={isPro} showBadge={!isPro} className="text-xs font-semibold" />
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
              ))}

              {assembly.user_assembly_items && assembly.user_assembly_items.length > 0 && (
                <div className="border-t pt-3 mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Materiały:
                    </span>
                    <span className="font-semibold">
                      {isPro
                        ? `${assembly.user_assembly_items
                            .filter((i) => i.type === "material")
                            .reduce((s, i) => s + i.price * i.quantity, 0)
                            .toFixed(2)} zł`
                        : <BlurredPrice value={assembly.user_assembly_items.filter((i) => i.type === "material").reduce((s, i) => s + i.price * i.quantity, 0)} isPro={false} showBadge={true} className="text-xs font-medium" />}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Robocizna:
                    </span>
                    <span className="font-semibold">
                      {isPro
                        ? `${assembly.user_assembly_items
                            .filter((i) => i.type === "labor")
                            .reduce((s, i) => s + i.price * i.quantity, 0)
                            .toFixed(2)} zł`
                        : <BlurredPrice value={assembly.user_assembly_items.filter((i) => i.type === "labor").reduce((s, i) => s + i.price * i.quantity, 0)} isPro={false} showBadge={true} className="text-xs font-medium" />}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Razem:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {isPro
                        ? `${assembly.user_assembly_items
                            .reduce((s, i) => s + i.price * i.quantity, 0)
                            .toFixed(2)} zł`
                        : <BlurredPrice value={assembly.user_assembly_items.reduce((s, i) => s + i.price * i.quantity, 0)} isPro={false} showBadge={true} className="text-sm font-bold" />}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
