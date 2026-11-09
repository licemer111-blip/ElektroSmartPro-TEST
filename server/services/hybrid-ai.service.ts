/**
 * Hybrid AI Service — 4-Tier RAG Pipeline
 *
 * PRIORITY ORDER (strictly enforced in system prompt):
 *   Tier 1 — USER_PRIVATE_DATA   : User's own KNR/price lists (highest priority)
 *   Tier 2 — OFFICIAL_KNR_DATA   : Global Gemini KB (official norms)
 *   Tier 3 — APP_MARKET_DATA     : ElektroSmart catalog (base prices)
 *   Tier 4 — GENERAL_AI          : ES-Intelligence v2.1 general knowledge (last resort, warns user)
 *
 * All tiers run in parallel with individual timeouts.
 * Degrades gracefully — any tier failure is silent.
 */

import { google } from "@ai-sdk/google";
import { AI_MODEL_TIER2 } from "@/lib/ai-models";
import { generateText } from "ai";
import { queryCatalogCache } from "./catalog-context.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ExpertResponse {
  reply: string;
  usedKnowledgeBase: boolean;
  modelUsed: string;
  tiersUsed: string[];
}

export interface ExpertResponseOptions {
  isPro?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KB_TIMEOUT_MS = 3000;
const CATALOG_TIMEOUT_MS = 2000;
const MAX_HISTORY_MESSAGES = 6; // Cost guard: never replay a long chat + KB dump

// ─── System Prompts ───────────────────────────────────────────────────────────

const BASE_IDENTITY = `Jesteś pomocnikiem ElektroSmart PRO. Odpowiadasz po polsku, krótko, jak elektrykowi przy komputerze.
Nie jesteś tomikiem KNR i nie podajesz cen hurtowych. Godziny to norma ES. Cena robocizny = godzina × stawka elektryka. Województwo dolicza ekran kosztorysu, nie Ty.

JAK LICZY PROGRAM
- Stawkę ustawia się w Ustawieniach. Bez stawki przycisk Wyceń nie policzy robocizny.
- Wyceń bierze znaną godzinę normy ES i mnoży przez stawkę. Materiał bierze z cennika użytkownika. Jak materiału nie ma, zostawia kwotę z wiersza albo zero.
- Znana pozycja nie zużywa zapytania AI. Zapytanie schodzi, gdy pozycji nie ma w bazie, albo przy zdjęciu, asystencie projektu i tym czacie.
- Województwo mnoży tylko robociznę na ekranie. Mazowieckie to ×1,20. Podkarpackie i podlaskie ×0,88. Nie wymyślaj innych współczynników.
- VAT 8% dla mieszkania, 23% dla firmy, biura i hali. Przełącznik jest na pasku kosztorysu.
- Robocizna i materiał są osobno.

JAK KLIKAĆ
- Nowy projekt: przycisk Nowy Projekt. Darmowe konto ma 1 własny projekt. PDF ma znak DEMO. Czysty PDF jest w PRO za 159 zł netto miesięcznie.
- Pozycje: lewy katalog. Moje to własny cennik, Baza to wspólna lista, Razem pokazuje oba. Przyciski Pozycja i Kategoria są na każdej z tych zakładek.
- Wczytaj: Excel i czysty tekst bez zapytania AI. Zdjęcie i PDF zużywają jedno zapytanie.
- Asystent na kosztorysie dopisuje pozycje z opisu albo szuka duplikatów. To jedno zapytanie. Cenę i tak liczy Wyceń.
- Zestaw dodaje się przyciskiem Dodaj Zestaw. Samo słowo „zestaw” w nazwie nie zmienia ceny.
- Norma, rbh i Kolory na pasku włączają kolumny. PDF i Excel są po prawej, w podsumowaniu.
- Niebieska kulka Pomoc w rogu to ten czat. Serduszko to opinia dla autora. Zamknięcie opinii bez wysłania nie kasuje jej na stałe.

CZEGO NIE MÓWISZ
- Nie nazywaj godzin oficjalnym KNR, ORGBUD ani SEKOCENBUD.
- Nie podawaj ceny materiału, której nie ma w pytaniu albo w kontekście katalogu użytkownika.
- Nie odsyłaj do menu „ES-Engine” ani do trzech starych trybów wyceny. Tego menu już nie ma.
- Maksymalnie 160 słów, chyba że użytkownik prosi o listę kroków.`;

const MAX_OUTPUT_TOKENS = 600;

const PRIORITY_RULES = `
ŹRÓDŁA, po kolei:
1. [USER_PRIVATE_DATA] — plik albo cennik tego elektryka. Jego cena materiału wygrywa.
2. [OFFICIAL_KNR_DATA] — nie używaj tej etykiety jako urzędowego tomiku. Godziny z bazy to norma ES.
3. [APP_MARKET_DATA] — nazwy z katalogu programu. Nie wymyślaj do nich ceny, jeśli w kontekście jej nie ma.
4. [GENERAL_AI] — gdy powyżej nie ma odpowiedzi. Powiedz wprost, że to podpowiedź, nie cena do oferty.`;

function buildContextPrompt(
  tier1: string | null,
  tier2: string | null,
  tier3: string | null
): string {
  const sections: string[] = [];

  if (tier1) {
    sections.push(
      `${"═".repeat(50)}\n[USER_PRIVATE_DATA] ★ PRIORYTET 1 — PRYWATNA BAZA WIEDZY UŻYTKOWNIKA\n(Te dane mają najwyższy priorytet — używaj ich w pierwszej kolejności)\n${"─".repeat(50)}\n${tier1}\n${"═".repeat(50)}`
    );
  }

  if (tier2) {
    sections.push(
      `${"═".repeat(50)}\n[OFFICIAL_KNR_DATA] ${tier1 ? "☆ PRIORYTET 2" : "★ PRIORYTET 1"} — GODZINY NORMY ES\n${"─".repeat(50)}\n${tier2}\n${"═".repeat(50)}`
    );
  }

  if (tier3) {
    sections.push(
      `${"═".repeat(50)}\n[APP_MARKET_DATA] ${tier1 || tier2 ? "☆ PRIORYTET " + (tier1 && tier2 ? "3" : "2") : "★ PRIORYTET 1"} — KATALOG ELEKTROSMART\n${"─".repeat(50)}\n${tier3}\n${"═".repeat(50)}`
    );
  }

  return `${BASE_IDENTITY}
${PRIORITY_RULES}

${"═".repeat(50)}
DOSTĘPNY KONTEKST:
${"═".repeat(50)}
${sections.join("\n\n")}

INSTRUKCJA: Odpowiedz na pytanie użytkownika korzystając WYŁĄCZNIE z powyższego kontekstu zgodnie z zasadami priorytetu. Cytuj źródło przy każdej wartości.`;
}

const FALLBACK_SYSTEM_PROMPT = `${BASE_IDENTITY}

[GENERAL_AI] UWAGA: Żadna baza wiedzy nie jest dostępna.
Odpowiadaj na podstawie ogólnej wiedzy branżowej.
OBOWIĄZKOWO zaznaczaj przy każdej cenie lub normie: "(szacunek — zweryfikuj z aktualnym cennikiem)".`;

// ─── Tier Retrieval Functions ─────────────────────────────────────────────────

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function retrieveTier1(_query: string, _userId: string): Promise<string | null> {
  // Tier 1 (user private KB) — unified via Supabase Storage bucket.
  // User-scoped files are stored in the same `ai-knowledge-base` bucket.
  // Full per-user isolation is handled at upload time via RLS.
  // For now, all KB files are shared (global admin KB).
  return null;
}

async function retrieveTier2(query: string): Promise<string | null> {
  // Chat must NOT inject the whole knowledge bucket — that is the main token leak.
  // Catalog cache (tier 3) is enough for in-product Q&A.
  void query;
  return null;
}

async function retrieveTier3(query: string): Promise<string | null> {
  try {
    const result = await withTimeout(
      queryCatalogCache(query),
      CATALOG_TIMEOUT_MS,
      null
    );
    return result && result.length >= 10 ? result : null;
  } catch {
    return null;
  }
}

// ─── Main Expert Response Generator ──────────────────────────────────────────

export async function generateExpertResponse(
  userMessage: string,
  chatHistory: ChatMessage[],
  userId?: string,
  options: ExpertResponseOptions = {}
): Promise<ExpertResponse> {
  const isPro = options.isPro ?? true; // default safe: assume pro if not specified
  // All tiers run in parallel — each has its own timeout
  const [tier1, tier2, tier3] = await Promise.all([
    userId ? retrieveTier1(userMessage, userId) : Promise.resolve(null),
    retrieveTier2(userMessage),
    retrieveTier3(userMessage),
  ]);

  const tiersUsed: string[] = [];
  if (tier1) tiersUsed.push("USER_PRIVATE_DATA");
  if (tier2) tiersUsed.push("OFFICIAL_KNR_DATA");
  if (tier3) tiersUsed.push("APP_MARKET_DATA");

  const hasContext = tiersUsed.length > 0;

  const basePrompt = hasContext
    ? buildContextPrompt(tier1, tier2, tier3)
    : FALLBACK_SYSTEM_PROMPT;

  // FIREWALL 1: AI zawsze zwraca pełne wartości liczbowe.
  // Blurowanie cen w UI = wyłączna odpowiedzialność komponentu React (isPro check).
  void isPro;
  const systemPrompt = basePrompt;

  // Sliding window history (cost guard)
  const recentHistory = chatHistory
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, 1500),
    }));

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...recentHistory,
    { role: "user" as const, content: userMessage.slice(0, 2000) },
  ];

  let text: string | undefined;
  let modelUsed = "ES-Intelligence v2.1";

  try {
    const result = await generateText({
      model: google(AI_MODEL_TIER2),
      messages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    });
    text = result.text;
  } catch {
    try {
      const result = await generateText({
        model: google(AI_MODEL_TIER2),
        messages: [{ role: "user", content: userMessage.slice(0, 1500) }],
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      });
      text = result.text;
      modelUsed = "ES-Intelligence v2.1 (stable)";
    } catch {
      return {
        reply: "Przepraszam, asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.",
        usedKnowledgeBase: false,
        modelUsed: "unavailable",
        tiersUsed: [],
      };
    }
  }

  return {
    reply: text || "Przepraszam, nie udało się wygenerować odpowiedzi.",
    usedKnowledgeBase: hasContext,
    modelUsed,
    tiersUsed,
  };
}
