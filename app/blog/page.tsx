import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/header";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { ArrowRight, Clock, Tag, BookOpen } from "lucide-react";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Blog — Porady dla Elektryków | ElektroSmart PRO",
  description:
    "Praktyczne porady dla elektryków: kosztorysowanie, normy KNR, VAT na usługi elektryczne, fakturowanie, zarządzanie firmą elektryczną. Artykuły eksperckie od ElektroSmart PRO.",
  keywords: [
    "blog dla elektryków",
    "porady kosztorysowanie elektryczne",
    "normy KNR elektryka",
    "VAT usługi elektryczne",
    "zarządzanie firmą elektryczną",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Porady dla Elektryków | ElektroSmart PRO",
    description: "Praktyczne artykuły o kosztorysowaniu, normach KNR, VAT i zarządzaniu firmą elektryczną.",
    url: "/blog",
    type: "website",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Kosztorysowanie":      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Podatki i finanse":    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Zarządzanie firmą":    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Technologia AI":       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Finanse i fakturowanie":"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Poradniki techniczne": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Dokumentacja":         "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
};

export default function BlogPage() {
  const sorted = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold text-orange-500 uppercase tracking-wide">Blog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Porady dla elektryków
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Praktyczne artykuły o kosztorysowaniu, normach KNR, VAT, fakturowaniu
            i zarządzaniu firmą elektryczną. Pisane przez praktyków dla praktyków.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((post) => {
            const categoryColor =
              CATEGORY_COLORS[post.category] ??
              "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300";
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200"
              >
                {/* Color strip by category */}
                <div
                  className={`h-1 w-full ${
                    post.category === "Technologia AI"
                      ? "bg-violet-500"
                      : post.category === "Podatki i finanse"
                      ? "bg-emerald-500"
                      : post.category === "Zarządzanie firmą"
                      ? "bg-blue-500"
                      : post.category === "Finanse i fakturowanie"
                      ? "bg-cyan-500"
                      : post.category === "Poradniki techniczne"
                      ? "bg-amber-500"
                      : post.category === "Dokumentacja"
                      ? "bg-slate-400"
                      : "bg-orange-500"
                  }`}
                />
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${categoryColor}`}>
                      <Tag className="w-2.5 h-2.5" />
                      {post.category}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-3">
                    {post.title}
                  </h2>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1 line-clamp-3">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      <span>{new Date(post.date).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Wypróbuj ElektroSmart PRO za darmo
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            Stwórz profesjonalny kosztorys elektryczny w kilka minut.
            Demo bezpłatne — bez karty kredytowej.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/20"
          >
            Zacznij za darmo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
