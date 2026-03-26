import type { Metadata } from "next";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock, Zap, ArrowRight, BookOpen, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Mazowieckie average rate for public price preview ─────────────────────────
const MAZOWIECKIE_RATE_PLN = 62; // PLN/rbh — Mazowieckie 2026 average
const FREE_ROWS = 10;

// ── Category metadata map ────────────────────────────────────────────────────
interface CategoryMeta {
  pl: string;
  description: string;
  keywords: string[];
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  aparatura:               { pl: "Aparatura elektryczna",            description: "Montaż aparatury elektrycznej: wyłączniki, rozłączniki, zabezpieczenia nadprądowe. Normy KNR i ceny robocizny 2026.", keywords: ["aparatura elektryczna KNR", "montaż wyłączników", "zabezpieczenia elektryczne cena"] },
  bezpieczenstwo:          { pl: "Systemy bezpieczeństwa",           description: "Instalacje alarmowe, CCTV, kontrola dostępu. Normy KNR i ceny montażu systemów bezpieczeństwa 2026.", keywords: ["instalacja alarmowa KNR", "system CCTV montaż cena", "kontrola dostępu KNR"] },
  dali_awaryjne:           { pl: "Oświetlenie awaryjne DALI",        description: "Montaż oświetlenia awaryjnego DALI/DSI. Normy KNR i ceny robocizny dla oświetlenia awaryjnego 2026.", keywords: ["oświetlenie awaryjne DALI KNR", "montaż opraw awaryjnych cena"] },
  dali_bms:                { pl: "Automatyka BMS/DALI",              description: "Systemy automatyki budynkowej BMS i DALI. Normy KNR i ceny montażu automatyki 2026.", keywords: ["BMS automatyka budynkowa KNR", "DALI sterowanie oświetleniem cena"] },
  demontaz:                { pl: "Demontaż instalacji",              description: "Prace demontażowe instalacji elektrycznych. Normy KNR i ceny robocizny dla demontaży 2026.", keywords: ["demontaż instalacji elektrycznej KNR", "demontaż rozdzielnicy cena"] },
  demontaze:               { pl: "Demontaż instalacji",              description: "Prace demontażowe instalacji elektrycznych. Normy KNR i ceny robocizny dla demontaży 2026.", keywords: ["demontaż elektryczny KNR", "demontaż wycena 2026"] },
  ev_ladowanie:            { pl: "Ładowanie pojazdów elektrycznych", description: "Instalacja stacji ładowania EV (7,4 kW–22 kW). Normy KNR i ceny montażu wallbox 2026.", keywords: ["wallbox montaż KNR", "stacja ładowania EV cena", "instalacja ładowarki samochodu elektrycznego"] },
  fotowoltaika:            { pl: "Fotowoltaika (PV)",                description: "Montaż instalacji fotowoltaicznych, falowników, okablowania DC/AC. Normy KNR i ceny PV 2026.", keywords: ["fotowoltaika montaż KNR", "instalacja PV cena 2026", "montaż paneli solar"] },
  gniazda_przemyslowe:     { pl: "Gniazda przemysłowe",             description: "Montaż gniazd przemysłowych CEE, gniazdek 3-fazowych, listew zasilających. Normy KNR 2026.", keywords: ["gniazda przemysłowe CEE montaż KNR", "gniazdo 3-fazowe cena"] },
  gniazda_wylaczniki:      { pl: "Gniazda i wyłączniki",            description: "Montaż gniazd wtykowych i wyłączników instalacyjnych. Normy KNR i ceny robocizny 2026.", keywords: ["montaż gniazdka cena KNR", "wyłącznik podtynkowy montaż", "koszt montażu gniazda 2026"] },
  heat_tracing:            { pl: "Ogrzewanie elektryczne (heat tracing)", description: "Montaż systemów ogrzewania elektrycznego, przewodów grzejnych, sterowników. Normy KNR 2026.", keywords: ["heat tracing montaż KNR", "ogrzewanie elektryczne przewody grzejne cena"] },
  hvac:                    { pl: "Instalacje HVAC — część elektryczna", description: "Elektryczna część instalacji wentylacyjnych i klimatyzacyjnych. Normy KNR i ceny 2026.", keywords: ["HVAC elektryka KNR", "klimatyzacja instalacja elektryczna cena"] },
  infrastruktura:          { pl: "Infrastruktura elektryczna",       description: "Prace infrastrukturalne: przepusty, wsporniki, koryta kablowe. Normy KNR i ceny 2026.", keywords: ["infrastruktura elektryczna KNR", "korytka kablowe montaż cena"] },
  infrastruktura_specjalna:{ pl: "Infrastruktura specjalna",         description: "Specjalne systemy infrastruktury elektrycznej. Normy KNR i ceny robocizny 2026.", keywords: ["infrastruktura specjalna elektryczna KNR", "instalacja specjalna cena"] },
  instalacje_podstawowe:   { pl: "Instalacje elektryczne podstawowe", description: "Podstawowe prace instalacji elektrycznej w budynkach. Normy KNR i ceny robocizny 2026.", keywords: ["instalacja elektryczna cena KNR", "montaż instalacji elektrycznej 2026", "koszt elektryki w mieszkaniu"] },
  interkomy:               { pl: "Domofony i wideofony",             description: "Montaż domofonów, wideofonów, systemów interkomowych. Normy KNR i ceny 2026.", keywords: ["domofon montaż KNR", "wideodomofon cena montaż", "interkom instalacja"] },
  it_siec:                 { pl: "Sieci LAN i infrastruktura IT",    description: "Montaż sieci komputerowych LAN, szaf rack, access pointów WiFi. Normy KNR i ceny IT 2026.", keywords: ["sieć LAN montaż KNR", "okablowanie strukturalne cena", "szafa rack instalacja wycena"] },
  kable_silnopradowe:      { pl: "Kable i przewody silnoprądowe",   description: "Układanie kabli silnoprądowych YKY, NYY, NHXMH. Normy KNR i ceny robocizny 2026.", keywords: ["układanie kabli KNR", "kabel YKY montaż cena", "przewód NYY koszt ułożenia 2026"] },
  kable_slabopradowe:      { pl: "Kable słaboprądowe i sygnałowe",  description: "Montaż kabli teletechnicznych, UTP, HDMI, sygnałowych. Normy KNR i ceny 2026.", keywords: ["kabel UTP montaż KNR", "okablowanie teletechniczne cena", "kable sygnałowe instalacja"] },
  kablowanie:              { pl: "Kablowanie i prowadzenie przewodów", description: "Prowadzenie i układanie kabli w budynkach. Normy KNR i ceny robocizny 2026.", keywords: ["kablowanie montaż KNR", "prowadzenie przewodów cena", "układanie kabli wycena"] },
  lan_rack:                { pl: "Szafy rack i infrastruktura LAN",  description: "Montaż szaf rack, patch paneli, switch'y, infrastruktury LAN. Normy KNR i ceny 2026.", keywords: ["szafa rack montaż KNR", "patch panel instalacja cena", "infrastruktura LAN wycena"] },
  led_dekoracyjny:         { pl: "Oświetlenie LED dekoracyjne",      description: "Montaż dekoracyjnych opraw LED, taśm LED, profili aluminiowych. Normy KNR i ceny 2026.", keywords: ["taśma LED montaż KNR", "oświetlenie dekoracyjne LED cena", "profil aluminiowy LED instalacja"] },
  maszyny_napedy:          { pl: "Maszyny i napędy elektryczne",     description: "Montaż falowników, softstarterów, silników elektrycznych. Normy KNR i ceny 2026.", keywords: ["falownik montaż KNR", "softstarter instalacja cena", "silnik elektryczny podłączenie wycena"] },
  ogrod_basen:             { pl: "Instalacje ogrodowe i basenowe",   description: "Elektryka ogrodu, basenu, strefy zewnętrznej. Normy KNR i ceny robocizny 2026.", keywords: ["instalacja elektryczna ogrodu KNR", "elektryka basenu cena", "oświetlenie ogrodowe montaż"] },
  ogrzewanie:              { pl: "Ogrzewanie elektryczne",           description: "Elektryczne systemy ogrzewania podłogowego i grzejniki elektryczne. Normy KNR i ceny 2026.", keywords: ["ogrzewanie podłogowe elektryczne KNR", "mata grzewcza montaż cena", "grzejnik elektryczny instalacja"] },
  osprzet:                 { pl: "Osprzęt elektroinstalacyjny",      description: "Montaż osprzętu elektrycznego: puszki, tablice, korytkowania. Normy KNR i ceny 2026.", keywords: ["osprzęt elektryczny montaż KNR", "puszka instalacyjna cena", "tablica rozdzielcza montaż"] },
  oswietlenie:             { pl: "Oświetlenie",                      description: "Montaż opraw oświetleniowych, opraw LED, oświetlenia wewnętrznego i zewnętrznego. Normy KNR i ceny robocizny 2026.", keywords: ["montaż oświetlenia KNR", "oprawa LED cena montaż", "koszt montażu lampy 2026"] },
  oswietlenie_awaryjne:    { pl: "Oświetlenie awaryjne",             description: "Montaż opraw awaryjnych i ewakuacyjnych. Normy KNR i ceny robocizny 2026.", keywords: ["oświetlenie awaryjne montaż KNR", "oprawa ewakuacyjna cena", "wyjście ewakuacyjne LED"] },
  oswietlenie_drogowe:     { pl: "Oświetlenie drogowe i uliczne",    description: "Montaż latarni, słupów oświetleniowych, opraw drogowych. Normy KNR i ceny 2026.", keywords: ["oświetlenie drogowe montaż KNR", "latarnia uliczna cena montaż", "słup oświetleniowy wycena"] },
  oswietlenie_montaz:      { pl: "Montaż opraw oświetleniowych",     description: "Kompleksowy montaż opraw oświetleniowych wszystkich typów. Normy KNR i ceny 2026.", keywords: ["montaż oprawy oświetleniowej KNR", "lampa montaż cena 2026", "oprawa oświetleniowa wycena"] },
  oswietlenie_podstawowe:  { pl: "Oświetlenie podstawowe",           description: "Podstawowe instalacje oświetleniowe w budynkach mieszkalnych i komercyjnych. Normy KNR 2026.", keywords: ["oświetlenie podstawowe KNR", "instalacja oświetlenia cena", "montaż lampy sufitowej wycena"] },
  oswietlenie_przemyslowe: { pl: "Oświetlenie przemysłowe",          description: "Montaż opraw przemysłowych High Bay, naświetlaczy LED, oświetlenia hal. Normy KNR 2026.", keywords: ["oświetlenie przemysłowe KNR", "High Bay LED montaż cena", "naświetlacz LED hala wycena"] },
  oze_ev_ogrzewanie:       { pl: "OZE, EV i ogrzewanie elektryczne", description: "Kompleksowe instalacje OZE: fotowoltaika, ładowarki EV, pompy ciepła. Normy KNR i ceny 2026.", keywords: ["OZE instalacja KNR", "pompa ciepła elektryka cena", "fotowoltaika EV ogrzewanie wycena"] },
  pomiary_dokumentacja:    { pl: "Pomiary elektryczne i dokumentacja", description: "Pomiary ochronne instalacji elektrycznej, dokumentacja powykonawcza. Normy KNR i ceny 2026.", keywords: ["pomiary elektryczne KNR", "protokół pomiarowy cena", "dokumentacja elektryczna wycena 2026"] },
  ppoz:                    { pl: "Ochrona przeciwpożarowa (elektryka)", description: "Elektryczne instalacje ochrony ppoż.: kable HDGs, przyciski ROP, centrale. Normy KNR 2026.", keywords: ["instalacja ppoż elektryczna KNR", "kabel pożarowy HDGs montaż cena", "ochrona przeciwpożarowa elektryka"] },
  ppoz_ssp:                { pl: "System sygnalizacji pożaru (SSP)",  description: "Montaż central SSP, czujek dymu, sygnalizatorów. Normy KNR i ceny 2026.", keywords: ["SSP montaż KNR", "czujka dymu instalacja cena", "system sygnalizacji pożaru wycena"] },
  prace_dodatkowe:         { pl: "Prace dodatkowe i uzupełniające",  description: "Dodatkowe prace elektryczne, regulacje, uruchomienia. Normy KNR i ceny robocizny 2026.", keywords: ["prace elektryczne dodatkowe KNR", "regulacja instalacji elektrycznej cena"] },
  prace_ziemne:            { pl: "Roboty ziemne (elektryka)",        description: "Wykopy pod kable, układanie rur ochronnych w ziemi. Normy KNR i ceny 2026.", keywords: ["roboty ziemne elektryka KNR", "wykop pod kabel cena", "rura ochronna w ziemi wycena"] },
  prad_budowlany:          { pl: "Prąd budowlany (przyłącze tymczasowe)", description: "Montaż tymczasowych przyłączy energetycznych na budowie. Normy KNR i ceny 2026.", keywords: ["prąd budowlany KNR", "przyłącze tymczasowe cena", "tablica budowlana montaż"] },
  prowadzenie:             { pl: "Prowadzenie tras kablowych",       description: "Montaż koryt kablowych, drabinek, rur stalowych, mocowań. Normy KNR i ceny 2026.", keywords: ["koryto kablowe montaż KNR", "drabinka kablowa cena", "trasa kablowa wycena 2026"] },
  przygotowanie:           { pl: "Przygotowanie prac elektrycznych", description: "Prace przygotowawcze i organizacyjne przed montażem instalacji. Normy KNR 2026.", keywords: ["przygotowanie prac elektrycznych KNR", "organizacja robót elektrycznych cena"] },
  przylacza_wlz:           { pl: "Przyłącza i wewnętrzne linie zasilające (WLZ)", description: "Montaż przyłączy kablowych i wewnętrznych linii zasilających WLZ. Normy KNR i ceny 2026.", keywords: ["WLZ montaż KNR", "wewnętrzna linia zasilająca cena", "przyłącze kablowe wycena"] },
  pv_ev:                   { pl: "Fotowoltaika i ładowarki EV",      description: "Kompleksowe instalacje PV i stacje ładowania pojazdów elektrycznych. Normy KNR i ceny 2026.", keywords: ["fotowoltaika montaż KNR 2026", "ładowarka EV instalacja cena", "wallbox montaż wycena"] },
  remonty_pomiary:         { pl: "Remonty i pomiary elektryczne",    description: "Remonty instalacji elektrycznych i pomiary ochronne. Normy KNR i ceny 2026.", keywords: ["remont instalacji elektrycznej KNR", "pomiary elektryczne cena 2026", "przegląd instalacji wycena"] },
  retail_sklepy:           { pl: "Instalacje dla sklepów i retail",  description: "Elektryka dla sklepów: oświetlenie ekspozycyjne, zasilanie kas, gniazda. Normy KNR 2026.", keywords: ["instalacja elektryczna sklep KNR", "elektryka retail cena", "oświetlenie ekspozycyjne montaż"] },
  roboty_ziemne:           { pl: "Roboty ziemne elektryczne",        description: "Prace ziemne przy kablach energetycznych i telekomunikacyjnych. Normy KNR 2026.", keywords: ["roboty ziemne kabel KNR", "układanie kabla w ziemi cena", "wykop kablowy wycena"] },
  rozdzielnice:            { pl: "Rozdzielnice elektryczne",         description: "Montaż rozdzielnic głównych i mieszkaniowych, tablic elektrycznych. Normy KNR i ceny 2026.", keywords: ["rozdzielnica montaż KNR", "tablica elektryczna cena montaż", "rozdzielnica mieszkaniowa wycena 2026"] },
  rury_trasy:              { pl: "Rury i trasy kablowe",             description: "Układanie rur instalacyjnych, koryt kablowych, drabinek. Normy KNR i ceny 2026.", keywords: ["rura instalacyjna montaż KNR", "koryto kablowe cena", "drabinka kablowa wycena"] },
  serwis_awarie:           { pl: "Serwis i usuwanie awarii",         description: "Usługi serwisowe i usuwanie awarii instalacji elektrycznych. Normy KNR i ceny 2026.", keywords: ["serwis elektryczny KNR", "awaria elektryczna usuwanie cena", "elektryk na awarie wycena"] },
  smart_home:              { pl: "Inteligentny dom (Smart Home)",     description: "Montaż systemów Smart Home, KNX, sterowania oświetleniem i roletami. Normy KNR i ceny 2026.", keywords: ["smart home montaż KNR", "KNX instalacja cena", "inteligentny dom wycena 2026"] },
  ssp:                     { pl: "System sygnalizacji pożaru (SSP)",  description: "Montaż systemów sygnalizacji pożaru: centrale, czujki, ROP. Normy KNR i ceny 2026.", keywords: ["SSP instalacja KNR", "czujka pożarowa montaż cena", "centrala pożarowa wycena"] },
  swiatlowody:             { pl: "Instalacje światłowodowe",         description: "Spawanie i układanie kabli światłowodowych, patch panele FO. Normy KNR i ceny 2026.", keywords: ["światłowód montaż KNR", "spawanie włókien optycznych cena", "kabel FO układanie wycena"] },
  szafy_sterowania:        { pl: "Szafy i układy sterowania",        description: "Montaż szaf sterowniczych, układów automatyki przemysłowej. Normy KNR i ceny 2026.", keywords: ["szafa sterownicza montaż KNR", "automatyka przemysłowa instalacja cena", "układ sterowania wycena"] },
  szynoprzewod_zasilajacy: { pl: "Szynoprzewody zasilające",         description: "Montaż szynoprzewodów zasilających w budynkach przemysłowych. Normy KNR i ceny 2026.", keywords: ["szynoprzewód montaż KNR", "busbar system instalacja cena", "szynoprzewód zasilający wycena"] },
  trafostacje:             { pl: "Stacje transformatorowe",           description: "Budowa i montaż stacji transformatorowych, transformatorów. Normy KNR i ceny 2026.", keywords: ["stacja transformatorowa budowa KNR", "transformator montaż cena", "trafostacja wycena 2026"] },
  trasy_przemyslowe:       { pl: "Trasy kablowe przemysłowe",        description: "Montaż przemysłowych tras kablowych, drabinek, koryt stalowych. Normy KNR i ceny 2026.", keywords: ["trasa kablowa przemysłowa KNR", "drabinka kablowa stalowa cena", "korytko stalowe montaż wycena"] },
  uziem_odgrom:            { pl: "Uziemienie i instalacja odgromowa", description: "Montaż instalacji odgromowej, uziomów, wyrównań potencjałów. Normy KNR i ceny 2026.", keywords: ["instalacja odgromowa KNR", "uziemienie budynku cena", "zwód odgromowy montaż wycena 2026"] },
  uziemienie:              { pl: "Instalacje uziemiające",           description: "Montaż uziomów, szyn wyrównawczych, połączeń ochronnych. Normy KNR i ceny 2026.", keywords: ["uziemienie montaż KNR", "uziem wyrównawczy cena", "szyna wyrównawcza montaż"] },
  uziemienie_odgromowa:    { pl: "Uziemienie i instalacja odgromowa", description: "Kompleksowe instalacje uziemiające i odgromowe. Normy KNR i ceny 2026.", keywords: ["instalacja odgromowa KNR", "uziomowanie budynku cena", "LPS instalacja wycena"] },
  wentylacja_hvac_el:      { pl: "Wentylacja i HVAC — elektryka",    description: "Elektryczna część systemów wentylacyjnych i klimatyzacyjnych. Normy KNR i ceny 2026.", keywords: ["wentylacja elektryka KNR", "klimatyzacja podłączenie elektryczne cena", "central wentylacyjna elektryka wycena"] },
  zasilanie_awaryjne:      { pl: "Zasilanie awaryjne (UPS / agregat)", description: "Montaż systemów UPS, agregatów prądotwórczych, ATS. Normy KNR i ceny 2026.", keywords: ["UPS montaż KNR", "agregat prądotwórczy instalacja cena", "zasilanie awaryjne wycena 2026"] },
  zasilanie_gwar:          { pl: "Zasilanie gwarantowane",           description: "Systemy zasilania gwarantowanego, SZR, układy rezerwowe. Normy KNR i ceny 2026.", keywords: ["zasilanie gwarantowane KNR", "SZR montaż cena", "zasilanie rezerwowe wycena"] },
  zestawy:                 { pl: "Zestawy instalacyjne (punkty)",    description: "Kompleksowe zestawy instalacyjne: punkt gniazdkowy, oświetleniowy, punkt danych. Normy KNR 2026.", keywords: ["zestaw instalacyjny KNR", "punkt elektryczny cena 2026", "punkt gniazdkowy koszt montaż"] },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface DictRow {
  knr_ref: string;
  label: string;
  unit: string;
  labor_norm_rbh: number;
}

// ── Data fetcher (deduped by knr_ref + label) ─────────────────────────────────
async function getCategoryItems(category: string): Promise<DictRow[]> {
  const { data, error } = await supabaseAdmin
    .from("es_dictionary")
    .select("knr_ref, label, unit, labor_norm_rbh")
    .eq("category", category)
    .not("knr_ref", "is", null)
    .is("user_id", null)
    .order("confidence_weight", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  // Deduplicate client-side by knr_ref + label
  const seen = new Set<string>();
  const unique: DictRow[] = [];
  for (const row of data) {
    const key = `${row.knr_ref}__${row.label}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        knr_ref: row.knr_ref as string,
        label: row.label as string,
        unit: (row.unit as string) ?? "szt",
        labor_norm_rbh: Number(row.labor_norm_rbh ?? 0),
      });
    }
  }
  return unique.slice(0, 60);
}

// ── generateStaticParams ──────────────────────────────────────────────────────
export async function generateStaticParams(): Promise<{ category: string }[]> {
  const { data } = await supabaseAdmin
    .from("es_dictionary")
    .select("category")
    .not("category", "is", null)
    .is("user_id", null);

  if (!data) return [];
  const unique = Array.from(new Set(data.map((r: { category: string }) => r.category).filter(Boolean)));
  return unique.map((category) => ({ category: category as string }));
}

// ── generateMetadata ──────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  const items = await getCategoryItems(category);

  if (!meta || items.length < 5) {
    return { robots: { index: false, follow: false } };
  }

  const title = `KNR 2026: Cennik i normy montażu — ${meta.pl} | ElektroSmart`;
  return {
    title,
    description: `Baza ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR 2026 — ${meta.pl}. ${meta.description} Wykonaj kosztorys w 15 minut. Pierwsze 3 projekty free.`,
    metadataBase: new URL("https://elektrosmart.pro"),
    keywords: [...meta.keywords, "KNR 2026", "normy pracy elektryka", "kosztorys elektryczny online", "ElektroSmart"],
    openGraph: {
      title,
      description: meta.description,
      type: "website",
      locale: "pl_PL",
      siteName: "ElektroSmart PRO",
    },
    alternates: {
      canonical: `https://elektrosmart.pro/katalog/${category}`,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(rbh: number): string {
  if (!rbh || rbh <= 0) return "—";
  const price = rbh * MAZOWIECKIE_RATE_PLN;
  return `${price.toFixed(0)} zł`;
}

function formatRbh(rbh: number): string {
  if (!rbh || rbh <= 0) return "—";
  return `${rbh.toFixed(2)} rbh`;
}

// ── JSON-LD structured data ───────────────────────────────────────────────────
function buildJsonLd(category: string, meta: CategoryMeta, items: DictRow[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `KNR 2026 — ${meta.pl}`,
    "description": meta.description,
    "url": `https://elektrosmart.pro/katalog/${category}`,
    "inLanguage": "pl",
    "publisher": {
      "@type": "Organization",
      "name": "ElektroSmart PRO",
      "url": "https://elektrosmart.pro",
    },
    "mainEntity": {
      "@type": "Table",
      "name": `Normy KNR — ${meta.pl}`,
      "about": meta.pl,
      "size": items.length,
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function KatalogCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const meta = CATEGORY_META[category];

  if (!meta) notFound();

  const items = await getCategoryItems(category);

  if (items.length < 5) notFound();

  const visibleItems = items.slice(0, FREE_ROWS);
  const hiddenItems = items.slice(FREE_ROWS);
  const hiddenCount = hiddenItems.length;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(category, meta, items)) }}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* ── Hero / Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Strona główna</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/katalog" className="hover:text-white transition-colors">Katalog KNR</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-200">{meta.pl}</span>
            </nav>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/30 shrink-0">
                <BookOpen className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                {/* H1 — SEO-optimized title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  KNR 2026: Cennik i normy montażu<br />
                  <span className="text-blue-300">{meta.pl}</span>
                </h1>
                <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">
                  {meta.description}
                </p>
                {/* Stats row */}
                <div className="flex flex-wrap gap-3 mt-5">
                  <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30">
                    {items.length}+ pozycji KNR
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30">
                    Aktualne ceny 2026
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30">
                    Mazowieckie — {MAZOWIECKIE_RATE_PLN} zł/rbh
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Info bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Normy i ceny robocizny — <span className="text-blue-600 dark:text-blue-400">{meta.pl}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Ceny orientacyjne dla woj. Mazowieckiego · Stawka: {MAZOWIECKIE_RATE_PLN} zł/rbh
              </p>
            </div>
            <Link href="/login?tab=signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
                <Calculator className="w-4 h-4" />
                Oblicz dla swojego regionu
              </Button>
            </Link>
          </div>

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 dark:bg-slate-800 text-white">
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide w-40">Kod KNR</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Opis pracy</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide w-16">Jm.</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide w-24">Robocizna</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide w-28">
                      Cena śr. (MAZ)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Visible rows — first FREE_ROWS */}
                  {visibleItems.map((row, idx) => (
                    <tr
                      key={`${row.knr_ref}-${idx}`}
                      className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                          {row.knr_ref}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.label}</td>
                      <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-medium">{row.unit}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {formatRbh(row.labor_norm_rbh)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatPrice(row.labor_norm_rbh)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Blurred / locked section ──────────────────────────────── */}
            {hiddenCount > 0 && (
              <div className="relative border-t border-slate-200 dark:border-slate-700">
                {/* Blurred preview rows */}
                <div className="overflow-x-auto blur-sm select-none pointer-events-none" aria-hidden="true">
                  <table className="w-full text-sm">
                    <tbody>
                      {hiddenItems.slice(0, 8).map((row, idx) => (
                        <tr
                          key={`hidden-${idx}`}
                          className="border-t border-slate-100 dark:border-slate-700/50"
                        >
                          <td className="px-4 py-3 w-40">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                              {row.knr_ref}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.label}</td>
                          <td className="px-4 py-3 text-center text-slate-500 w-16">{row.unit}</td>
                          <td className="px-4 py-3 text-right text-slate-600 w-24 font-mono text-xs">
                            {formatRbh(row.labor_norm_rbh)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600 w-28">
                            {formatPrice(row.labor_norm_rbh)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/20 via-white/80 to-white dark:from-slate-900/20 dark:via-slate-900/80 dark:to-slate-900 px-4">
                  <div className="text-center max-w-md">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 mx-auto mb-3">
                      <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      Zarejestruj się, aby odblokować pełną bazę i pobrać PDF
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                      {hiddenCount} pozycji + kosztorys dla Twojego województwa · <strong>3 projekty free</strong>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/login?tab=signup">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto">
                          <Zap className="w-4 h-4" />
                          Sprawdź Demo — 3 projekty free
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="outline" className="gap-2 w-full sm:w-auto">
                          Zaloguj się
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Value proposition strip ───────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🗺️", title: "16 województw", desc: "Ceny dopasowane do Twojego regionu — Mazowieckie, Małopolskie, Śląskie i inne." },
              { icon: "📋", title: "7 799+ pozycji KNR", desc: "Pełna baza robót elektrycznych: silnoprądowe, teletechniczne, OZE, EV." },
              { icon: "📄", title: "Eksport PDF / Excel", desc: "Profesjonalny kosztorys z logo firmy gotowy do wysłania klientowi." },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{card.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Bottom CTA ────────────────────────────────────────────────── */}
          <div className="mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center">
            <h2 className="text-xl font-bold mb-2">
              Wygeneruj profesjonalną ofertę PDF
            </h2>
            <p className="text-blue-100 text-sm mb-5 max-w-xl mx-auto">
              ElektroSmart PRO — jedyna platforma kosztorysowa zaprojektowana przez elektryków dla elektryków. Normy KNR 2026, 16 województw, eksport PDF. Pierwsze 3 projekty 100% za darmo.
            </p>
            <Link href="/login?tab=signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold gap-2">
                <Zap className="w-5 h-5" />
                Zacznij darmową wycenę
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
