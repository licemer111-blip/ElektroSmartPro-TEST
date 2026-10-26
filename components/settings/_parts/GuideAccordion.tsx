"use client";

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Zap, Banknote, Shield, FileText, Rocket, Copy, Wrench } from "lucide-react";

export function GuideAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="start" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Jak zacząć</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <ol className="ml-4 space-y-2 list-decimal">
            <li>W <strong>Finansach</strong> ustaw stawkę rbh i województwo. Województwo mnoży tylko robociznę.</li>
            <li>W <strong>Profilu firmy</strong> wpisz NIP i logo — trafią na PDF.</li>
            <li><strong>Szybka wycena</strong> liczy listę z metrażu. Suma na ekranie jest tą samą sumą w projekcie.</li>
            <li>W projekcie dopisujesz pozycje z katalogu albo zestaw (gniazdo, puszka, kabel, bruzda).</li>
            <li>PDF: w DEMO jest znak wodny. Czysty wydruk jest w PRO.</li>
          </ol>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Jak liczy się cena</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm space-y-2">
          <p>Robocizna = godziny normy ES × Twoja stawka × województwo.</p>
          <p>Materiał zostaje w cenie z katalogu. Województwo go nie rusza.</p>
          <p>VAT jest jeden na cały kosztorys: <strong>8%</strong> dla mieszkania, <strong>23%</strong> dla obiektu komercyjnego. Możesz go zmienić ręcznie.</p>
          <p>To szacunek ElektroSmart, nie urzędowa tabela GUS ani ORGBUD.</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="catalog" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Katalog: własne, baza ES, oba</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <ul className="ml-4 space-y-1 list-disc">
            <li><strong>Własne</strong> — tylko Twoje pozycje i Twoje ceny.</li>
            <li><strong>Baza ES</strong> — wspólne pozycje. Robocizna z godzin normy i Twojej stawki.</li>
            <li><strong>Oba</strong> — Twoje pozycje i baza ES na jednej liście.</li>
          </ul>
          <p className="mt-3">Przełącznik jest w panelu kategorii katalogu. Ukrytą pozycję przywracasz w Katalog i dane.</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="kits" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Zestawy</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <p>Punkt gniazda 230 V rozkłada się na gniazdo, puszkę, YDYp 3×2,5 i bruzdę w cegle. Godziny są z normy ES, złotówki ze stawki.</p>
          <p className="mt-2">Własny zestaw składasz w zakładce Zestawy i wstawiasz do kosztorysu jednym kliknięciem.</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="quick" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Rocket className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Szybka wycena</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <p>Typ obiektu, metraż, liczba pomieszczeń, standard. Lista powstaje z tych danych.</p>
          <p className="mt-2">Suma na ostatnim kroku już zawiera województwo. Po utworzeniu projektu ta sama robocizna nie jest liczona drugi raz.</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="tools" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Wrench className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Kalkulatory</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <p>Przekrój kabla i bilans tablicy umieją wstawić jedną pozycję do wybranego projektu. Reszta kalkulatorów zostaje obok kosztorysu: zwarcie, spadek napięcia, silnik, PV, cos φ, uziemienie.</p>
          <p className="mt-2">To szacunek do rozmowy z klientem, nie zastępuje projektu instalacji.</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="templates" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Copy className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Szablony</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <p>Z gotowego projektu robisz szablon. Nowy kosztorys powstaje jako kopia pozycji. Szablony są w menu Szablony.</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="pdf" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">PDF</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4 text-sm">
          <p>Na wydruku jest podział materiał / robocizna i jeden VAT, 8% albo 23%.</p>
          <p className="mt-2">DEMO: ceny widać, na PDF jest znak wodny, własny projekt jest jeden. PRO zdejmuje znak i limit projektu. Cena PRO to 159 zł netto miesięcznie.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
