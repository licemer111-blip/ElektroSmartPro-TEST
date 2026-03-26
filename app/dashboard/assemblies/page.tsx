import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Boxes, Package, Wrench, Lightbulb, Zap } from "lucide-react";
import { getUserAssemblies } from "./actions";
import { getUserProfile } from "@/app/dashboard/actions";
import { getUserTeam } from "@/app/dashboard/team/actions";
import { AssemblyModalManager } from "@/components/assemblies/assembly-modal-manager";
import { AssembliesWithTabs } from "@/components/assemblies/assemblies-with-tabs";
import { EmptyAssembliesState } from "@/components/assemblies/empty-assemblies-state";
import { AssembliesManagerView } from "@/components/assemblies/assemblies-manager-view";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Zestawy 360° — Inteligentne Komplety Elektryczne",
  description: "Zestawy 360°: wybierz 'Punkt Gniazdo' — system automatycznie doliczy gniazdo, puszkę, kabel (w metrach) i bruzdę (kucie). Tworzysz własne zestawy i aplikujesz je w kosztorysach jednym kliknięciem",
};

export default async function AssembliesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch assemblies, categories, and team in parallel
  const [assemblies, profile, categoriesData, userTeam] = await Promise.all([
    getUserAssemblies(),
    getUserProfile(),
    supabase
      .from("assembly_categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name"),
    getUserTeam(),
  ]);

  const categories = categoriesData.data || [];

  return (
    <div className="min-h-screen py-6 md:py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Boxes className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Katalog Zestawów
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Własne szablony • Udostępnianie zespołowi • ES Generator zestawów
              </p>
            </div>
          </div>
        </div>


        {/* Educational Banner - What are Assemblies? */}
        <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold text-base">
            Czym są Zestawy?
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-300 mt-2">
            <div className="space-y-3">
              <p className="text-xs leading-relaxed">
                <strong>Zestawy</strong> to Twoje własne szablony grupujące często używane pozycje (materiały + robocizna) 
                w jeden element. Dzięki nim możesz <strong>przyspieszyć tworzenie kosztorysów nawet 10x</strong> i zapewnić 
                spójność cen w różnych projektach.
              </p>
              
              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">Przykład 1</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-snug">
                    <strong>"Punkt gniazda podwójnego"</strong><br/>
                    = Puszka + Gniazdo + Kabel 3x2,5mm + Montaż
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">Przykład 2</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-snug">
                    <strong>"Punkt oświetleniowy LED"</strong><br/>
                    = Oprawa LED + Przewód + Łącznik + Instalacja
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">Przykład 3</span>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-snug">
                    <strong>"Instalacja w pokoju"</strong><br/>
                    = 4x Gniazdo + 2x Oświetlenie + Rozdzielnia
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1.5">
                  💡 Jak to działa?
                </p>
                <ol className="text-[11px] space-y-0.5 text-blue-800 dark:text-blue-300 list-decimal list-inside leading-relaxed">
                  <li>Tworzysz zestaw raz (np. "Punkt gniazda") z wszystkimi potrzebnymi pozycjami</li>
                  <li>W projekcie klikasz "Dodaj Zestaw" i wybierasz swój szablon</li>
                  <li>System automatycznie dodaje wszystkie pozycje z zestawu do kosztorysu</li>
                  <li>Oszczędzasz czas i unikasz błędów - ceny zawsze takie same!</li>
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Content - Manager View with Sidebar */}
        {assemblies.length === 0 ? (
          /* Empty State */
          <EmptyAssembliesState 
            isPro={profile?.is_pro || false}
            currentCount={assemblies.length}
          />
        ) : (
          /* Assemblies Manager with Sidebar and View Toggle */
          <AssembliesManagerView 
            assemblies={assemblies}
            categories={categories}
            isPro={profile?.is_pro || false}
            currentCount={assemblies.length}
            selectedCategoryId={params.category || null}
            userTeam={userTeam}
          />
        )}

        {/* Stats Cards - moved below assemblies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium">Wszystkie zestawy</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{assemblies.length}</div>
              <p className="text-[10px] text-muted-foreground">
                {assemblies.length === 0
                  ? "Brak zestawów"
                  : assemblies.length === 1
                  ? "1 zestaw"
                  : `${assemblies.length} zestawów`}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium">Materiały</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">
                {assemblies.reduce(
                  (sum, assembly) =>
                    sum +
                    (assembly.user_assembly_items?.filter((item) => item.type === "material")
                      .length || 0),
                  0
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Pozycji materiałowych</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium">Robocizna</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">
                {assemblies.reduce(
                  (sum, assembly) =>
                    sum +
                    (assembly.user_assembly_items?.filter((item) => item.type === "labor")
                      .length || 0),
                  0
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Pozycji robocizny</p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Info Section - Tips & Best Practices */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Wskazówki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 p-4 pt-0">
              <div>
                <strong className="text-slate-900 dark:text-slate-100 text-xs">Organizuj zestawy w kategorie</strong>
                <p className="text-[10px] mt-0.5 leading-relaxed">Twórz kategorie jak "Instalacje", "Oświetlenie", "Smart Home" dla łatwiejszego zarządzania</p>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-slate-100 text-xs">Aktualizuj ceny regularnie</strong>
                <p className="text-[10px] mt-0.5 leading-relaxed">Edytuj zestawy gdy zmieniają się ceny materiałów lub robocizny</p>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-slate-100 text-xs">Duplikuj i modyfikuj</strong>
                <p className="text-[10px] mt-0.5 leading-relaxed">Skopiuj istniejący zestaw i dostosuj go do nowych potrzeb</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Korzyści z Zestawów
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 p-4 pt-0">
              <div>
                <strong className="text-slate-900 dark:text-slate-100 text-xs">⚡ Szybkość</strong>
                <p className="text-[10px] mt-0.5 leading-relaxed">Dodawaj kilka pozycji jednym kliknięciem zamiast ręcznego wpisywania</p>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-slate-100 text-xs">✅ Spójność</strong>
                <p className="text-[10px] mt-0.5 leading-relaxed">Te same ceny w każdym projekcie - brak rozbieżności</p>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-slate-100 text-xs">🎯 Profesjonalizm</strong>
                <p className="text-[10px] mt-0.5 leading-relaxed">Standardowe zestawy budują zaufanie klientów</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extra spacing at bottom */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
