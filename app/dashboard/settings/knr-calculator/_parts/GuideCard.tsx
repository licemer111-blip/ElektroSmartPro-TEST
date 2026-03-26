"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ChevronDown } from "lucide-react";

export function GuideCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-700">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
      >
        <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">Jak to działa?</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline mr-2">Instrukcja · Formaty · Wskazówki</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <CardContent className="space-y-5 text-sm text-slate-700 dark:text-slate-300 pt-0 pb-5">
          <div className="border-t border-slate-100 dark:border-slate-800 mb-4" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Jak to działa krok po kroku:</p>
            <ol className="space-y-1.5 list-none">
              {([
                [1, <>Wgrywasz swój plik (PDF lub TXT) — cennik, normy, własne stawki</>],
                [2, <>Klikasz <strong>&quot;Zbuduj cache ES-Engine&quot;</strong> — system przetwarza dokument</>],
                [3, <>ES Engine korzysta z Twoich danych przy wycenie na żądanie (przycisk <strong>Wyceń</strong>)</>],
                [4, <>Twoje stawki i normy mają priorytet P1 — nadpisują globalne normy ES-KNR</>],
              ] as [number, React.ReactNode][]).map(([num, text]) => (
                <li key={num} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{num}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Obsługiwane formaty:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { fmt: "PDF", color: "text-red-500", desc: "Musi zawierać tekst (nie skan). Normy KNR, oferty hurtowni." },
                { fmt: "TXT", color: "text-blue-500", desc: "Najlepszy format. Prosta tabela tekstowa — ES-Engine czyta ją najdokładniej." },
                { fmt: "XLSX / XLS", color: "text-emerald-500", desc: "Arkusz Excel. System bierze pierwszy arkusz i konwertuje na tekst." },
                { fmt: "CSV", color: "text-emerald-500", desc: "Eksport z hurtowni lub programu kosztorysowego." },
              ] as { fmt: string; color: string; desc: string }[]).map((item) => (
                <div key={item.fmt} className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 flex gap-2">
                  <span className={`text-xs font-bold font-mono mt-0.5 flex-shrink-0 ${item.color}`}>{item.fmt}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800" />
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-xs mb-1.5">💡 Wskazówki dla najlepszych wyników:</p>
            <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400 list-disc list-inside">
              <li>Używaj polskich nazw pozycji — ES-Engine lepiej dopasuje do pytań</li>
              <li>Podawaj jednostki miary: <strong>szt, mb, kpl, m², godz</strong></li>
              <li>Po każdej zmianie pliku kliknij <strong>&bdquo;Zbuduj cache ES-Engine&rdquo;</strong></li>
              <li>Cache wygasa po 24h — system sam go odświeża przy następnym zapytaniu</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
