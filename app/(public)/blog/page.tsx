import Link from "next/link";
import { ArrowLeft, Calendar, Clock, ArrowRight, TrendingUp, FileText, Award, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

import { SYSTEM_STATS_FALLBACK } from "@/constants/system";

export const metadata: Metadata = {
  title: "Blog — Porady dla Elektryków 2026 | ElektroSmart PRO",
  description: `Porady branżowe, trendy rynkowe i AI w kosztorysowaniu dla elektryków. Baza ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR 2026, normy PN-HD 60364, ceny materiałów 2026 i najlepsze praktyki wyceny z AI-Grounding.`,
};

// Blog posts - sorted by date (newest first)
const blogPosts = [
  {
    id: 1,
    title: "⚡ Nowość: Import KNR z Excel do ES Lab",
    slug: "import-knr-excel-ai-lab",
    excerpt: "ES Lab teraz rozpoznaje kody KNR (Katalog Nakładów Rzeczowych) w plikach Excel! Wgraj gotowy przedmiar z KNR 5-08/5-09, a ES-Engine automatycznie zamieni kody na czytelne pozycje kosztorysu.",
    category: "ES-Engine & Automatyzacja",
    categoryColor: "purple",
    date: "5 lutego 2026",
    readTime: "4 min",
    icon: Award,
    gradient: "from-purple-600 to-violet-800",
  },
  {
    id: 2,
    title: "📄 Automatyczne faktury VAT z InFakt",
    slug: "automatyczne-faktury-infakt",
    excerpt: "Nowa integracja: po każdej płatności za subskrypcję system automatycznie generuje fakturę w InFakt. B2B z NIP lub B2C dla osób prywatnych - wszystko dzieje się bez Twojego udziału!",
    category: "Integracje",
    categoryColor: "green",
    date: "3 lutego 2026",
    readTime: "5 min",
    icon: FileText,
    gradient: "from-green-600 to-emerald-800",
  },
  {
    id: 3,
    title: "🎙️ Co-pilot Audio: Steruj projektem głosem",
    slug: "co-pilot-audio-sterowanie-glosem",
    excerpt: "Wolne ręce podczas pracy w terenie! Dyktuj pozycje, ilości i ceny - ES-Engine rozumie polskie nazwy elektryczne. 'Dodaj 24 gniazda podtynkowe' i gotowe.",
    category: "ES-Engine & Automatyzacja",
    categoryColor: "purple",
    date: "28 stycznia 2026",
    readTime: "3 min",
    icon: Award,
    gradient: "from-indigo-600 to-purple-800",
  },
  {
    id: 4,
    title: "👥 Współpraca zespołowa w czasie rzeczywistym",
    slug: "wspolpraca-zespolowa-real-time",
    excerpt: "Pracuj z kolegami w tym samym projekcie jednocześnie! Following Mode, wspólne katalogi, czat zespołowy i zarządzanie rolami. Jak Google Docs, ale dla elektryków.",
    category: "Funkcje PRO",
    categoryColor: "blue",
    date: "20 stycznia 2026",
    readTime: "6 min",
    icon: TrendingUp,
    gradient: "from-blue-600 to-cyan-800",
  },
  {
    id: 5,
    title: "VAT 8% czy 23%? Kompletny przewodnik dla instalatora",
    slug: "vat-8-czy-23-przewodnik",
    excerpt: "Rozwiązujemy największą zagadkę polskich elektryków: kiedy stosować VAT 8%, a kiedy 23%. Praktyczne przykłady dla budownictwa mieszkaniowego i komercyjnego.",
    category: "Prawo i Podatki",
    categoryColor: "blue",
    date: "10 stycznia 2026",
    readTime: "5 min",
    icon: FileText,
    gradient: "from-blue-600 to-blue-800",
  },
  {
    id: 6,
    title: "Jak wycenić instalację w 2026 roku? Trendy rynkowe",
    slug: "jak-wycenic-instalacje-2026",
    excerpt: "Ceny miedzi rosną, płace też. Analizujemy aktualne trendy rynkowe i pokazujemy, jak dostosować swoje stawki, by pozostać konkurencyjnym i rentownym.",
    category: "Trendy & Rynek",
    categoryColor: "green",
    date: "8 stycznia 2026",
    readTime: "7 min",
    icon: TrendingUp,
    gradient: "from-green-600 to-green-800",
  },
  {
    id: 7,
    title: "📄 Profesjonalny kosztorys PDF — dlaczego to ważne?",
    slug: "profesjonalny-kosztorys-pdf",
    excerpt: "Klient dostaje ofertę w SMS-ie albo na kartce papieru — i idzie do konkurencji. Jak profesjonalny PDF zwiększa konwersję o 86% i buduje zaufanie klientów?",
    category: "Marketing & Sprzedaż",
    categoryColor: "blue",
    date: "5 stycznia 2026",
    readTime: "6 min",
    icon: FileText,
    gradient: "from-slate-600 to-slate-800",
  },
];

const getCategoryBadgeClass = (color: string) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700",
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Clean & Professional */}
      <section className="relative border-b border-slate-200 dark:border-slate-800/50">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót do strony głównej
          </Link>
          
          <div className="max-w-3xl">
            {/* Title */}
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Blog ElektroSmart PRO
            </h1>
            
            {/* Thin divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 mb-6"></div>
            
            {/* Subtitle */}
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Porady, trendy i najlepsze praktyki dla elektryków. 
              Wiedza, która pomaga zarabiać więcej i być o krok przed konkurencją.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {blogPosts.map((post) => {
            const IconComponent = post.icon;
            return (
              <Card 
                key={post.id}
                className="bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${post.gradient}`}></div>
                
                <CardHeader>
                  {/* Category Badge */}
                  <Badge 
                    variant="outline" 
                    className={`w-fit mb-3 ${getCategoryBadgeClass(post.categoryColor)}`}
                  >
                    {post.category}
                  </Badge>

                  {/* Title */}
                  <CardTitle className="text-xl leading-tight mb-3 text-slate-900 dark:text-white">
                    {post.title}
                  </CardTitle>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Excerpt */}
                  <CardDescription className="text-sm leading-relaxed mb-6 flex-1 text-slate-600 dark:text-slate-300">
                    {post.excerpt}
                  </CardDescription>

                  {/* CTA Button */}
                  <Button 
                    variant="outline" 
                    className="w-full group hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-500 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                    asChild
                  >
                    <Link href={`/blog/${post.slug}`}>
                      Czytaj więcej
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Więcej Artykułów Wkrótce!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
              Pracujemy nad kolejnymi materiałami, które pomogą Ci lepiej zarządzać swoją firmą elektryczną. 
              Chcesz być na bieżąco? Zapisz się do naszego newslettera!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                <Link href="/login">
                  Zacznij Korzystać Za Darmo
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Link href="/kontakt">
                  Zaproponuj Temat
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Kategorie
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-3">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Prawo i Podatki
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  VAT, umowy, regulacje prawne
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-green-500 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Trendy & Rynek
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ceny, stawki, analiza rynku
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-3">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Marketing & Sprzedaż
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Jak zdobywać klientów i wygrywać przetargi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
