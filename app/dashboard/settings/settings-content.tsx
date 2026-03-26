"use client";

import { SYSTEM_STATS_FALLBACK } from "@/constants/system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { StarterContentPanelSimple } from "@/components/settings/starter-content-panel-simple";
import { CategoryManagerSimple } from "@/components/settings/category-manager-simple";
import { DangerZone } from "@/components/settings/danger-zone";
import { Settings, Database, Building2, Wrench } from "lucide-react";
import type { Profile } from "@/lib/types/database";

interface SettingsContentProps {
  initialProfile: Profile | null;
}

export function SettingsContent({ initialProfile }: SettingsContentProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Ustawienia</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Zarządzaj profilem firmy i narzędziami bazy danych
          </p>
        </div>

        {/* Tabbed Layout */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Profil Firmy
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Baza Danych
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Company Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Dane Firmy</CardTitle>
                    <CardDescription className="mt-1">
                      Informacje wyświetlane na dokumentach PDF i ofertach
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <SettingsForm initialProfile={initialProfile} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Database & Tools */}
          <TabsContent value="database" className="space-y-6">
            {/* Grid Layout: Main Content (Left) + Sidebar (Right) */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column (Wide): Main Database Tools */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Start Section */}
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2">
                        <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Narzędzia Bazy Danych</CardTitle>
                        <CardDescription className="mt-1">
                          Uzupełnij bazę gotowymi materiałami: Globalny katalog ({SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR) już dostępny
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <StarterContentPanelSimple />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column (Sidebar): Management & Admin Tools */}
              <div className="space-y-6">
                {/* Category Management */}
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 dark:bg-purple-900/50 rounded-lg p-2">
                        <Wrench className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Kategorie</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          Twórz własne kategorie
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <CategoryManagerSimple />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Danger Zone - Full Width at Bottom */}
            <div className="mt-8">
              <DangerZone />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
