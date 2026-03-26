import { Metadata } from "next";
import { MessageSquare, Bug, Lightbulb, Clock, CheckCircle, Zap, Mail } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "Feedback — Twój Głos Ma Znaczenie",
  description: "Zgłoś błąd, zaproponuj nową funkcję lub podziel się opinią — Twoje pomysły kształtują przyszłość ElektroSmart PRO",
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Kontakt i Feedback
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Twoja opinia kształtuje przyszłość ElektroSmart PRO. Zgłoś błąd, zaproponuj funkcję lub po prostu napisz.
          </p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center mx-auto mb-2">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-red-800 dark:text-red-300">Błędy</p>
            <p className="text-[10px] text-red-600 dark:text-red-400">Odpowiedź &lt;24h</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center mx-auto mb-2">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">Pomysły</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-400">Rozpatrujemy wszystkie</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mx-auto mb-2">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Kontakt</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400">Pytania ogólne</p>
          </div>
        </div>

        {/* Feedback Form */}
        <FeedbackForm />

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-900 dark:text-green-100">Czas odpowiedzi</span>
            </div>
            <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
              <li>🔴 Błędy krytyczne — do 4 godzin</li>
              <li>🟡 Błędy normalne — do 24 godzin</li>
              <li>🟢 Propozycje — do 3 dni roboczych</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Wskazówki dla zgłoszeń</span>
            </div>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Opisz kroki prowadzące do błędu</li>
              <li>• Podaj przeglądarkę (Chrome/Firefox)</li>
              <li>• Skopiuj komunikat błędu jeśli jest</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-center justify-center">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          <p className="text-xs text-slate-400">Każda wiadomość trafia bezpośrednio do zespołu ElektroSmart PRO</p>
        </div>
      </div>
    </div>
  );
}
