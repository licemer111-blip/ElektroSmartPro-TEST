import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, TrendingUp, RefreshCcw, Users } from "lucide-react";

function EcosystemSectionInner() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 badge-blue rounded-full text-sm font-medium mb-6">
            <RefreshCcw className="w-4 h-4" />
            <span>Żywe środowisko pracy</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            System, który{" "}
            <span className="gradient-text-pro">pracuje razem z Tobą</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            ElektroSmart PRO to nie jednorazowy zakup — to platforma, która stale się rozwija i daje Ci przewagę nad konkurencją.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Update Cycle */}
          <Card className="pro-card rounded-2xl hover-lift">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white mb-3">Regularne Aktualizacje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Co{" "}
                <strong className="text-blue-600 dark:text-blue-400">2–6 miesięcy</strong> — nowe funkcje, świeże cenniki, poprawki zgłoszone przez elektryków.
                Płacisz raz, korzystasz wiecznie.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
                  Następna aktualizacja: Kwiecień 2026
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Loop */}
          <Card className="pro-card rounded-2xl hover-lift">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-slate-500/20">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white mb-3">Twój Głos Ma Znaczenie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Każda zgłoszona funkcja jest analizowana.{" "}
                <strong className="text-blue-600 dark:text-blue-400">Dziesiątki elektryków</strong> już ukształtowały system swoimi sugestiami.
                Twoja kolej.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Users className="w-4 h-4" />
                  Budujemy razem z elektrykami
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Freshness */}
          <Card className="pro-card rounded-2xl hover-lift">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white mb-3">Ceny Zgodne z Rynkiem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-blue-600 dark:text-blue-400">Aktualne ceny miedzi, kabli i materiałów</strong> wg trendów rynku 2026.
                Nie wyceniasz z pamięci — wyceniasz z danych.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  <RefreshCcw className="w-4 h-4" />
                  Aktualizacja co tydzień
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export const EcosystemSection = React.memo(EcosystemSectionInner);
