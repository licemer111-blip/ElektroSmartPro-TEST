import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Wycena instalacji elektrycznej",
  description:
    "Wycena prac elektrycznych z przedmiaru klienta. Robocizna to godzina normy ES razy Twoja stawka. Materiał dopisujesz sam. Potem PDF.",
  alternates: { canonical: "https://elektrosmart.pro/wycena-elektryczna" },
  openGraph: {
    title: "Wycena instalacji elektrycznej — ElektroSmart PRO",
    description: "Wczytaj tabelę klienta, wyceń robociznę swoją stawką i wyślij PDF.",
    locale: "pl_PL",
    type: "website",
    url: "https://elektrosmart.pro/wycena-elektryczna",
  },
};

export default function WycenaElektrycznaPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Strona główna
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
        Wycena instalacji elektrycznej
      </h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        Wycena zaczyna się od listy, którą przysłał klient: Excel, PDF albo wiadomość.
        ElektroSmart nie układa tej listy z metrażu i nie dopisuje cen materiałów, których nie masz w cenniku.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Jak liczy się robocizna</h2>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        Wyceń bierze godzinę normy ES na jednostkę i mnoży ją przez Twoją stawkę.
        Województwo dolicza tylko pracę, na ekranie. Wiersz wpisany ręcznie tej korekty nie dostaje.
        Bez zapisanej stawki w finansach robocizna wyjdzie zero.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Materiał</h2>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        Cenę kabla, osprzętu i oprawy wpisujesz sam albo bierzesz ze swojego cennika.
        Jak klient kupuje materiał, włączasz samą robociznę: złote materiałów nie wchodzą do sumy ani do PDF.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Od listy do oferty</h2>
      <ol className="mt-3 list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
        <li>Wczytaj przedmiar.</li>
        <li>Kliknij Wyceń i popraw ilości.</li>
        <li>Jak drogo, suwak Negocjacje zdejmuje 5% albo 15% z całości.</li>
        <li>Zapisz PDF. Na darmowym koncie jest znak DEMO. Czysty PDF jednej wyceny to 49 zł netto.</li>
      </ol>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        Gotowy dokument opisuje strona{" "}
        <Link href="/kosztorys-elektryczny" className="text-blue-600 hover:underline">kosztorysu elektrycznego</Link>.
        Godziny typowych prac są w{" "}
        <Link href="/katalog" className="text-blue-600 hover:underline">katalogu</Link>.
        Krok po kroku jest też we{" "}
        <Link href="/blog/jak-wycenic-instalacje-2026" className="text-blue-600 hover:underline">wpisie na blogu</Link>.
      </p>

      <div className="mt-10">
        <Link href="/login?tab=signup" className="inline-flex h-11 items-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
          Wyceń pierwszy przedmiar
        </Link>
      </div>
    </main>
  );
}
