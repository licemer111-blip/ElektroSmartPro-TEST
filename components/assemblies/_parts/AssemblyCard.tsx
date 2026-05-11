"use client";

import { Package, Wrench, MoreVertical, Edit, Copy, Trash2, FolderInput, Sparkles, Users, Share2, UserMinus } from "lucide-react";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssemblyModalManager } from "@/components/assemblies/assembly-modal-manager";
import type { UserAssemblyWithItems, Team } from "@/lib/types/database";

interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface AssemblyCardProps {
  assembly: UserAssemblyWithItems;
  isPro: boolean;
  currentCount: number;
  categoryOptions: { id: string; name: string }[];
  userTeam?: Team | null;
  onPreview: (assembly: UserAssemblyWithItems) => void;
  onMoveRequest: (assembly: UserAssemblyWithItems) => void;
  onDeleteRequest: (assembly: UserAssemblyWithItems) => void;
  onShareToggle: (assembly: UserAssemblyWithItems, visibility: "personal" | "team") => Promise<void>;
}

export function AssemblyCard({
  assembly,
  isPro,
  currentCount,
  categoryOptions,
  userTeam,
  onPreview,
  onMoveRequest,
  onDeleteRequest,
  onShareToggle,
}: AssemblyCardProps) {
  return (
    <Card
      className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-transparent dark:hover:border-transparent hover:-translate-y-1 bg-white dark:bg-slate-900 flex flex-col"
      onClick={() => onPreview(assembly)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-cyan-500/[0.02] to-indigo-500/[0.02] dark:from-blue-500/[0.04] dark:via-cyan-500/[0.04] dark:to-indigo-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-lg bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-indigo-500/40 blur-sm -z-10 group-hover:blur-md" />

      <CardHeader className="relative p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                {assembly.name}
              </CardTitle>
              {assembly.is_ai_generated && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex-shrink-0"
                  title="Zestaw wygenerowany przez AI"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">AI</span>
                </span>
              )}
              {assembly.visibility === "team" && assembly.team_id && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0"
                  title="Zestaw udostępniony zespołowi"
                >
                  <Users className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Zespół</span>
                </span>
              )}
            </div>
            {assembly.description && (
              <CardDescription className="text-xs line-clamp-2">{assembly.description}</CardDescription>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {assembly.user_assembly_items?.length || 0} poz.
              </Badge>
            </div>
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Otwórz menu zestawu"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-xl z-50"
              sideOffset={8}
              collisionPadding={8}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1.5 mb-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold pl-1">Akcje</span>
              </div>

              <AssemblyModalManager
                mode="edit"
                assembly={assembly}
                isPro={isPro}
                currentCount={currentCount}
                categories={categoryOptions}
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="rounded-lg focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 transition-colors cursor-pointer py-2"
                  >
                    <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mr-2.5">
                      <Edit className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <span className="font-medium">Edytuj</span>
                  </DropdownMenuItem>
                }
              />

              <AssemblyModalManager
                mode="duplicate"
                assembly={assembly}
                isPro={isPro}
                currentCount={currentCount}
                categories={categoryOptions}
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="rounded-lg focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-slate-100 transition-colors cursor-pointer py-2"
                  >
                    <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mr-2.5">
                      <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <span className="font-medium">Duplikuj</span>
                  </DropdownMenuItem>
                }
              />

              <DropdownMenuItem
                onClick={() => onMoveRequest(assembly)}
                className="rounded-lg focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-slate-100 transition-colors cursor-pointer py-2"
              >
                <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mr-2.5">
                  <FolderInput className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="font-medium">Przenieś</span>
              </DropdownMenuItem>

              {userTeam && (
                <>
                  <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
                  {assembly.visibility === "team" ? (
                    <DropdownMenuItem
                      onClick={() => onShareToggle(assembly, "personal")}
                      className="rounded-lg focus:bg-amber-50 focus:text-amber-700 dark:focus:bg-amber-900/20 dark:focus:text-amber-300 transition-colors cursor-pointer py-2"
                    >
                      <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mr-2.5">
                        <UserMinus className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <span className="font-medium">Usuń z zespołu</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onShareToggle(assembly, "team")}
                      className="rounded-lg focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 transition-colors cursor-pointer py-2"
                    >
                      <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mr-2.5">
                        <Share2 className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="font-medium text-blue-600 dark:text-blue-400">Udostępnij</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}

              <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem
                onClick={() => onDeleteRequest(assembly)}
                className="rounded-lg focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20 dark:focus:text-red-300 transition-colors cursor-pointer py-2 group/delete"
              >
                <div className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mr-2.5 group-hover/delete:border-red-200 dark:group-hover/delete:border-red-800">
                  <Trash2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 group-hover/delete:text-red-500 transition-colors" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300 group-hover/delete:text-red-600 dark:group-hover/delete:text-red-400">
                  Usuń
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 flex flex-col p-4 pt-0">
        <div className="space-y-1.5">
          {/* Price rows */}
          {(() => {
            const items = assembly.user_assembly_items ?? [];
            const totalMat = items.filter(i => i.type === "material").reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
            const totalLab = items.filter(i => i.type === "labor").reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
            const total = totalMat + totalLab;
            const hasNoPrices = total === 0;
            return (
              <>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>Materiały</span>
                    <span className="text-[10px] text-slate-400">({items.filter(i => i.type === "material").length})</span>
                  </div>
                  <span className={`font-semibold ${hasNoPrices ? "text-slate-400" : "text-amber-700 dark:text-amber-300"}`}>
                    {hasNoPrices ? "—" : <BlurredPrice value={totalMat} isPro={isPro} showBadge={!isPro} className="text-xs font-semibold" />}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Robocizna</span>
                    <span className="text-[10px] text-slate-400">({items.filter(i => i.type === "labor").length})</span>
                  </div>
                  <span className={`font-semibold ${hasNoPrices ? "text-slate-400" : "text-emerald-700 dark:text-emerald-300"}`}>
                    {hasNoPrices ? "—" : <BlurredPrice value={totalLab} isPro={isPro} showBadge={!isPro} className="text-xs font-semibold" />}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 mt-0.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Razem</span>
                  <span className={`font-bold text-sm ${hasNoPrices ? "text-slate-400" : "text-blue-600 dark:text-blue-400"}`}>
                    {hasNoPrices ? "Uzupełnij ceny" : <BlurredPrice value={total} isPro={isPro} showBadge={!isPro} className="text-sm font-bold" />}
                  </span>
                </div>
              </>
            );
          })()}

          {/* Item preview */}
          {assembly.user_assembly_items && assembly.user_assembly_items.length > 0 && (
            <div className="pt-1.5 space-y-0.5">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">Zawartość:</p>
              {assembly.user_assembly_items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {item.type === "material"
                    ? <Package className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    : <Wrench className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">×{item.quantity}</span>
                </div>
              ))}
              {assembly.user_assembly_items.length > 3 && (
                <p className="text-[10px] text-blue-500 dark:text-blue-400 pl-4">
                  + {assembly.user_assembly_items.length - 3} więcej...
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
