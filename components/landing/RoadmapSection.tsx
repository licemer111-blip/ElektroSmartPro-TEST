import React from "react";
import { Calendar } from "lucide-react";

function RoadmapSectionInner() {
  return (
    <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Następna aktualizacja</div>
            <div className="text-2xl font-bold gradient-text">Kwiecień 2026</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            ✅ Dostępne już teraz — ElektroSmart PRO v4.0 (Marzec 2026):
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[
              { title: "🤝 Współpraca Real-time", sub: "Edycja z zespołem + Following mode" },
              { title: "🧠 ES-Słownik v16", sub: "600+ norm KNR, Sacred Words, Unit Guardrails" },
              { title: "👥 CRM Klientów", sub: "Pełna baza z historią i tagami" },
              { title: "📊 Analityka Biznesowa", sub: "Wykresy marż i przychodów" },
            ].map(({ title, sub }) => (
              <div
                key={title}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-3 border border-green-200 dark:border-green-700"
              >
                <div className="text-sm font-medium text-green-900 dark:text-green-100">{title}</div>
                <div className="text-xs text-green-700 dark:text-green-400">{sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
            🚀 W przygotowaniu — Q2 2026:
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[
              { title: "📱 Aplikacja mobilna PWA", sub: "Kosztorys offline na telefonie" },
              { title: "🔄 Live sync z hurtowniami", sub: "Ceny materiałów w czasie rzeczywistym" },
            ].map(({ title, sub }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
              >
                <div className="text-sm font-medium text-slate-900 dark:text-white">{title}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-300 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            💡{" "}
            <span className="font-semibold text-slate-900 dark:text-white">Masz pomysł na nową funkcję?</span>{" "}
            Napisz — dziesiątki elektryków już ukształtowało system swoimi sugestiami
          </div>
        </div>
      </div>
    </section>
  );
}

export const RoadmapSection = React.memo(RoadmapSectionInner);
