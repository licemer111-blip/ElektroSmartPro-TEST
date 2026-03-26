"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database, Layers, Loader2, Package, RefreshCw,
  User, ExternalLink, ArrowRight, Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TeamDataManagementProps {
  teamId: string;
  isAdmin: boolean;
  initialCatalogItems: CatalogItem[];
  initialAssemblies: Assembly[];
}

interface CatalogItem {
  id: string;
  name: string;
  category_id: string | null;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
  visibility: string;
  user_id: string;
  created_at: string;
  creator: { full_name: string | null; email: string } | null;
}

interface Assembly {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  user_id: string;
  created_at: string;
  creator: { full_name: string | null; email: string } | null;
  item_count: number;
}

export function TeamDataManagement({
  teamId,
  isAdmin,
  initialCatalogItems,
  initialAssemblies,
}: TeamDataManagementProps) {
  const [activeTab, setActiveTab] = useState("catalog");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const getCreatorName = (creator: { full_name: string | null; email: string } | null) => {
    if (!creator) return "Nieznany";
    return creator.full_name || creator.email;
  };

  const getCreatorInitials = (creator: { full_name: string | null; email: string } | null) => {
    const name = getCreatorName(creator);
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(price);
  };

  const hasData = initialCatalogItems.length > 0 || initialAssemblies.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Database className="w-4 h-4" />
          Wspólne zasoby
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="h-7 text-xs"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {!hasData ? (
        /* Empty state - beautiful and helpful */
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/15 p-6 sm:p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
              <Database className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold mb-1">Brak wspólnych zasobów</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Udostępnij pozycje z katalogu lub zestawy, aby cały zespół mógł z nich korzystać.
            </p>

            {/* How to share - compact steps */}
            <div className="rounded-lg bg-muted/50 p-3 mb-4 text-left">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Jak udostępnić?
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Przejdź do <strong>Katalogu</strong> lub <strong>Zestawów</strong></li>
                <li>Edytuj pozycję i zmień widoczność na <strong>&quot;Zespół&quot;</strong></li>
                <li>Pozycja pojawi się tutaj dla wszystkich</li>
              </ol>
            </div>

            <div className="flex gap-2 justify-center">
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/dashboard/catalog">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  Katalog
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/dashboard/assemblies">
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Zestawy
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Data tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="catalog" className="text-xs gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Katalog
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {initialCatalogItems.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="assemblies" className="text-xs gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Zestawy
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {initialAssemblies.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Catalog Items */}
          <TabsContent value="catalog" className="mt-3 space-y-2">
            {initialCatalogItems.length === 0 ? (
              <EmptyTab
                icon={<Package className="w-10 h-10" />}
                text="Brak wspólnych pozycji"
                linkHref="/dashboard/catalog"
                linkText="Przejdź do Katalogu"
              />
            ) : (
              <>
                <div className="space-y-1.5">
                  {initialCatalogItems.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{formatPrice(item.base_material_price + item.base_labor_price)}</span>
                          <span className="text-muted-foreground/40">|</span>
                          <span>{item.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                          {getCreatorInitials(item.creator)}
                        </div>
                        <span className="hidden sm:inline truncate max-w-[80px]">
                          {getCreatorName(item.creator)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {initialCatalogItems.length > 8 && (
                  <p className="text-xs text-center text-muted-foreground">
                    ...i {initialCatalogItems.length - 8} więcej pozycji
                  </p>
                )}
                <div className="flex justify-center pt-1">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href="/dashboard/catalog">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Zarządzaj w Katalogu
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Assemblies */}
          <TabsContent value="assemblies" className="mt-3 space-y-2">
            {initialAssemblies.length === 0 ? (
              <EmptyTab
                icon={<Layers className="w-10 h-10" />}
                text="Brak wspólnych zestawów"
                linkHref="/dashboard/assemblies"
                linkText="Przejdź do Zestawów"
              />
            ) : (
              <>
                <div className="space-y-1.5">
                  {initialAssemblies.slice(0, 8).map((assembly) => (
                    <div
                      key={assembly.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{assembly.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{assembly.item_count} pozycji</span>
                          {assembly.description && (
                            <>
                              <span className="text-muted-foreground/40">|</span>
                              <span className="truncate">{assembly.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                          {getCreatorInitials(assembly.creator)}
                        </div>
                        <span className="hidden sm:inline truncate max-w-[80px]">
                          {getCreatorName(assembly.creator)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {initialAssemblies.length > 8 && (
                  <p className="text-xs text-center text-muted-foreground">
                    ...i {initialAssemblies.length - 8} więcej zestawów
                  </p>
                )}
                <div className="flex justify-center pt-1">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href="/dashboard/assemblies">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Zarządzaj w Zestawach
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Small helper component for empty tab states
function EmptyTab({ icon, text, linkHref, linkText }: {
  icon: React.ReactNode;
  text: string;
  linkHref: string;
  linkText: string;
}) {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <div className="mx-auto mb-2 opacity-30">{icon}</div>
      <p className="text-sm mb-3">{text}</p>
      <Button asChild variant="outline" size="sm" className="text-xs">
        <Link href={linkHref}>
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          {linkText}
        </Link>
      </Button>
    </div>
  );
}
