import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_META } from "./[category]/page";

export const metadata: Metadata = {
  title: "Katalog godzin normy ES — wycena instalacji elektrycznej",
  description:
    "Godziny normy ES dla gniazd, kabli, rozdzielnic i oświetlenia. To nie cennik: złotówki liczysz swoją stawką, materiał bierzesz ze swojego cennika.",
  alternates: { canonical: "https://elektrosmart.pro/katalog" },
  openGraph: {
    title: "Katalog godzin normy ES",
    description: "Godzina na jednostkę. Cenę robocizny liczysz swoją stawką.",
    locale: "pl_PL",
    type: "website",
    url: "https://elektrosmart.pro/katalog",
  },
};

export default function KatalogIndexPage() {
  const categories = Object.entries(CATEGORY_META).sort((a, b) => a[1].pl.localeCompare(b[1].pl, "pl"));

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
        Katalog godzin normy ES
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
        W tabeli jest godzina na jednostkę, nie cena z ulicy. Robociznę policzysz swoją stawką po zalogowaniu. Materiał wpisujesz sam.
      </p>
      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map(([slug, meta]) => (
          <li key={slug}>
            <Link
              href={`/katalog/${slug}`}
              className="block rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {meta.pl}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
