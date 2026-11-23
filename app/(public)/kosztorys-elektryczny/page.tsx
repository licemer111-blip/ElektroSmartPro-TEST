import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Kosztorys elektryczny online",
  description:
    "Kosztorys instalacji elektrycznej: robocizna i materiał w osobnych kolumnach, godzina normy ES razy Twoja stawka, województwo tylko na pracę, VAT 8% albo 23%, PDF dla klienta.",
  alternates: { canonical: "https://elektrosmart.pro/kosztorys-elektryczny" },
  openGraph: {
    title: "Kosztorys elektryczny online — ElektroSmart PRO",
    description: "Dwie kolumny: robocizna i materiał. PDF z logo, bez przepisywania Excela.",
    locale: "pl_PL",
    type: "website",
    url: "https://elektrosmart.pro/kosztorys-elektryczny",
  },
};

export default function KosztorysElektrycznyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Strona główna
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
        Kosztorys elektryczny online
      </h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        Kosztorys w ElektroSmart to dokument dla klienta, nie plik pod przetarg.
        Każda pozycja ma osobno robociznę i materiał. Na dole jest jedna suma, jeden VAT i PDF z Twoim logo.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Co jest w dokumencie</h2>
      <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-300">
        <li>Nazwa, jednostka i ilość.</li>
        <li>Robocizna: godzina normy ES × Twoja stawka. Województwo dolicza tylko pracę.</li>
        <li>Materiał: cena z Twojego cennika. Program jej nie wymyśla.</li>
        <li>VAT 8% albo 23% na cały kosztorys. Ceny możesz pokazać netto albo brutto.</li>
        <li>Uwagi, termin płatności i zaliczka na końcu PDF.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Dwie drogi do tego samego PDF</h2>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        Klient przysłał tabelę: wczytujesz ją, klikasz Wyceń i poprawiasz ilości.
        Albo składasz ofertę sam z katalogu i zestawów. Zestaw, na przykład punkt gniazda, wchodzi jako osobne wiersze.
      </p>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        Jak klientowi drogo, suwak Negocjacje zdejmuje 5% albo 15% z całej oferty. Zapisanych cen w wierszach nie ruszasz.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900 dark:text-white">Czego ten kosztorys nie jest</h2>
      <p className="mt-3 text-slate-700 dark:text-slate-300">
        To nie urzędowy KNR i nie przedmiar ATH do przetargu. Godziny są normą ES.
        Porównanie z Normą, Rodos i Zuzią jest na stronie{" "}
        <Link href="/porownanie" className="text-blue-600 hover:underline">porównania</Link>.
        Jak liczyć samą wycenę pracy, jest opis na stronie{" "}
        <Link href="/wycena-elektryczna" className="text-blue-600 hover:underline">wyceny elektrycznej</Link>.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/login?tab=signup" className="inline-flex h-11 items-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
          Załóż darmowe konto
        </Link>
        <Link href="/katalog" className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-800 dark:text-slate-100 dark:border-slate-600">
          Katalog godzin
        </Link>
      </div>
    </main>
  );
}
