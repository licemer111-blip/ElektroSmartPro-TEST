import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "ElektroSmart a Norma, Rodos i Zuzia",
  description: "Dla elektryka na budowie, nie dla biura kosztorysowego. 159 zł netto miesięcznie. Twoja stawka, Twój cennik, PDF dla klienta. Bez abonamentu Sekocenbud i bez urzędowego KNR.",
};

const rows = [
  ["Dla kogo", "Elektryk, który sam liczy robotę", "Kosztorysant i przetarg"],
  ["Cena", "159 zł netto / miesiąc", "Licencja na stanowisko to zwykle kilka tysięcy zł, plus roczny cennik"],
  ["Robocizna", "Godzina normy ES × Twoja stawka", "Stawka z cennika albo z narzutów Kp i Z"],
  ["Materiał", "Twój cennik. Osobna lista do hurtowni", "Sekocenbud, Intercenbud i inne bazy cen"],
  ["Normy", "Norma ES. Nie sprzedajemy jej jako urzędowy KNR", "Katalogi KNR, KNNR i KNP"],
  ["Dokument dla klienta", "PDF z warunkami i podpisem, Excel ze zestawieniem materiałów", "Kosztorys, przedmiar, ATH i XML pod przetarg"],
  ["Czego nie ma", "Przetarg publiczny i format ATH", "Szybkiej oferty z telefonu jedną stawką"],
];

export default function PorownaniePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Strona główna
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
        Nie zastępujemy Normy. Liczymy ofertę elektryka.
      </h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        Norma, Rodos i Zuzia są dla biura, które składa kosztorys do przetargu i musi mieć urzędowy katalog.
        ElektroSmart jest dla elektryka, który wie swoją stawkę i chce wysłać klientowi czytelną ofertę tego samego dnia.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="text-left p-3 font-semibold"> </th>
              <th className="text-left p-3 font-semibold">ElektroSmart PRO</th>
              <th className="text-left p-3 font-semibold">Norma, Rodos, Zuzia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, ours, theirs]) => (
              <tr key={label} className="border-t border-slate-200 dark:border-slate-700">
                <th className="text-left p-3 font-medium text-slate-900 dark:text-slate-100 align-top">{label}</th>
                <td className="p-3 text-slate-700 dark:text-slate-300 align-top">{ours}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400 align-top">{theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Ceny licencji konkurencji zmieniają się co roku i zależą od pakietu katalogów. Tu jest rząd wielkości, nie oferta tamtych firm.
        Nie podłączamy Sekocenbudu i nie nazywamy naszej normy urzędowym KNR.
      </p>

      <Link
        href="/login?tab=signup"
        className="inline-flex mt-8 h-12 items-center rounded-xl bg-blue-600 px-6 text-white font-semibold hover:bg-blue-700"
      >
        Wypróbuj bez karty
      </Link>
    </main>
  );
}
