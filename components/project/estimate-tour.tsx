"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const STORAGE_KEY = "es_estimate_tour_v3";
export const ESTIMATE_TOUR_EVENT = "es-estimate-tour-start";

type Place = "top" | "bottom" | "left" | "right" | "center";

interface Step {
  id: string;
  title: string;
  description: string;
  targets?: string[];
  place: Place;
  scroll?: "start" | "center";
}

const STEPS: Step[] = [
  {
    id: "start",
    title: "To jest kosztorys",
    description: "Dwie drogi. Wczytujesz przedmiar klienta, wyceniasz i dajesz PDF. Albo składasz ofertę z katalogu i zestawów. Dalej pokażę przyciski, które zwykle umykają. Pomoc otwiera ten przewodnik jeszcze raz.",
    place: "center",
  },
  {
    id: "import",
    title: "Wczytaj ofertę",
    description: "Tu wchodzi tabela, Excel albo PDF od klienta. Pozycje lądują w kosztorysie. Jak w pliku nie ma cen, wiersze zostają puste. Program sam nie dopisuje złotówek.",
    targets: ['[data-tour="tour-import"]'],
    place: "bottom",
  },
  {
    id: "wycen",
    title: "Wyceń",
    description: "Liczy robociznę: godzina normy ES × Twoja stawka. Województwo dolicza tylko pracę i tylko na ekranie. Ceny materiału nie wymyśla. Za pierwszym razem przypomni, że rbh trzeba przejrzeć: u innego elektryka godzina może być inna. Bez zapisanej stawki w Finansach wyjdzie zero.",
    targets: ['[data-tour="tour-wycen"]'],
    place: "bottom",
  },
  {
    id: "assistant",
    title: "Asystent",
    description: "Pytanie o pracę albo o sposób liczenia. Sam nie dodaje wierszy do kosztorysu.",
    targets: ['[data-tour="tour-assistant"]'],
    place: "bottom",
  },
  {
    id: "catalog",
    title: "Katalog pozycji",
    description: "Stąd bierzesz pozycje do oferty. Ukryj chowa lewą kolumnę, niebieski pasek Katalog pozycji otwiera ją z powrotem. Na telefonie ten sam katalog jest pod przyciskiem Katalog.",
    targets: ['[data-tour="tour-catalog-panel"]', '[data-tour="tour-catalog"]', '[data-tour="tour-catalog-mobile"]'],
    place: "right",
  },
  {
    id: "sources",
    title: "Moje, Baza, Razem",
    description: "Te trzy włączają i chowają pozycje w lewej kolumnie. Moje to Twój cennik, cena materiału wchodzi do oferty. Baza to wspólne nazwy i godziny, bez ceny materiału. Razem pokazuje oba, Twoja cena jest pierwsza.",
    targets: ['[data-tour="tour-sources"]'],
    place: "right",
  },
  {
    id: "zestaw",
    title: "Zestaw",
    description: "Gotowy komplet, na przykład gniazdo z puszką i kablem. Wchodzi jako osobne wiersze, które da się poprawić. To Twoja lista, nie zgadywany skład.",
    targets: ['[data-tour="tour-zestaw"]'],
    place: "left",
  },
  {
    id: "quick",
    title: "Szybka pozycja",
    description: "Własny wiersz, którego nie ma w katalogu. Wpisujesz nazwę, ilość i ceny. Województwo takiego wiersza nie rusza.",
    targets: ['[data-tour="tour-quick"]'],
    place: "left",
  },
  {
    id: "rows",
    title: "Wiersze kosztorysu",
    description: "Tu poprawiasz ilość, cenę materiału i robociznę. Góra komórki to cena za jednostkę, dół to suma wiersza. Zielony to robocizna, pomarańczowy to materiał.",
    targets: ['[data-tour="tour-rows"]'],
    place: "top",
    scroll: "start",
  },
  {
    id: "view",
    title: "Sekcje, Zwiń i widok",
    description: "Sekcje składają wiersze w grupy, na przykład Salon albo Trasy. Grupy idą do PDF. Zwiń chowa grupy, Rozwiń je otwiera. Kompakt zwęża tabelę, na telefonie pokazuje karty. Normalny rozwija pełne wiersze. Szukaj znajduje pozycję po nazwie.",
    targets: ['[data-tour="tour-view"]'],
    place: "bottom",
  },
  {
    id: "doc",
    title: "VAT, brutto i kolory",
    description: "Jedna stawka VAT na cały dokument: 23% albo 8%. Nowy kosztorys startuje od 23% i cen brutto. Netto pokazuje kwoty bez VAT. Norma włącza kod w tabeli, rbh godziny, Kolory rozróżniają robociznę i materiał.",
    targets: ['[data-tour="tour-doc"]'],
    place: "bottom",
  },
  {
    id: "region",
    title: "Województwo",
    description: "Ta korekta dotyczy tylko robocizny. Materiał się nie zmienia. Wiersz wpisany ręcznie też zostaje bez dopłaty.",
    targets: ['[data-tour="tour-region"]'],
    place: "bottom",
  },
  {
    id: "summary",
    title: "Podsumowanie",
    description: "Tu jest kwota oferty, przełącznik materiałów i PDF. Ukryj chowa panel, pasek Podsumowanie otwiera go z powrotem. Na telefonie suma jest na dolnym pasku, a pod nią te same ustawienia.",
    targets: ['[data-tour="tour-summary-panel"]', '[data-tour="tour-summary"]', '[data-tour="tour-summary-mobile"]'],
    place: "left",
  },
  {
    id: "scope",
    title: "Robocizna i materiały",
    description: "Dwa tryby oferty. Robocizna i materiały liczy obie kolumny. Tylko robocizna wyrzuca materiał z sumy i z PDF, bo klient kupuje go sam. Ceny w wierszach zostają, przełącznik ich nie kasuje.",
    targets: ['[data-tour="tour-scope"]'],
    place: "left",
  },
  {
    id: "negotiate",
    title: "Negocjacje ceny",
    description: "Klientowi drogo: suwak w lewo o 5% albo 15% przelicza całą ofertę. W prawo to narzut. Zapisane ceny pozycji zostają. Na zero wraca poprzednia kwota. Rabat wchodzi do PDF.",
    targets: ['[data-tour="tour-negotiate"]'],
    place: "left",
  },
  {
    id: "export",
    title: "PDF i Excel",
    description: "PDF idzie do klienta. Na darmowym koncie jest czerwony znak DEMO, także na przykładowym projekcie. Excel kosztorysu jest w PRO. Jednorazowa opłata za czysty PDF nie otwiera Excela.",
    targets: ['[data-tour="tour-export"]'],
    place: "left",
  },
  {
    id: "clean-pdf",
    title: "Czysty PDF za 49 zł",
    description: "Darmowy PDF ma czerwony znak DEMO. 49 zł netto zdejmuje ten znak z jednego kosztorysu. To nie subskrypcja i nie otwiera Excela. Excel oraz czyste PDF bez limitu są w PRO, 159 zł netto miesięcznie.",
    targets: ['[data-tour="tour-clean-pdf"]'],
    place: "left",
  },
  {
    id: "done",
    title: "Można liczyć",
    description: "Przedmiar: Wczytaj, Wyceń, popraw ilości, PDF. Własna oferta: katalog albo zestaw, potem to samo. Jak coś zginie z oczu, Pomoc włącza ten przewodnik od nowa.",
    place: "center",
  },
];

const CARD_W = 340;

function isTourTarget(el: HTMLElement) {
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return false;
  let node: HTMLElement | null = el;
  while (node) {
    if (node.getAttribute("data-state") === "closed") return false;
    if (node.getAttribute("aria-hidden") === "true") return false;
    node = node.parentElement;
  }
  return true;
}

function findTarget(selectors: string[] | undefined): HTMLElement | null {
  if (!selectors) return null;
  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      if (node instanceof HTMLElement && isTourTarget(node)) return node;
    }
  }
  return null;
}

function placeCard(rect: DOMRect, prefer: Place, cardH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 14;
  const margin = 12;
  const bottomSafe = vw < 1024 ? 92 : margin;
  const clampLeft = (left: number) => Math.max(margin, Math.min(left, vw - CARD_W - margin));
  const spots: { place: Place; top: number; left: number }[] = [
    { place: "bottom", top: rect.bottom + gap, left: clampLeft(rect.left + rect.width / 2 - CARD_W / 2) },
    { place: "top", top: rect.top - gap - cardH, left: clampLeft(rect.left + rect.width / 2 - CARD_W / 2) },
    { place: "right", top: rect.top, left: rect.right + gap },
    { place: "left", top: rect.top, left: rect.left - gap - CARD_W },
  ];
  const ordered = [spots.find((spot) => spot.place === prefer)!, ...spots.filter((spot) => spot.place !== prefer)];
  for (const spot of ordered) {
    const left = clampLeft(spot.left);
    const top = Math.max(margin, Math.min(spot.top, vh - cardH - bottomSafe));
    const moved = Math.abs(top - spot.top) > 24 || Math.abs(left - spot.left) > 24;
    const card = { left, top, right: left + CARD_W, bottom: top + cardH };
    const overlaps = !(card.right < rect.left - 4 || card.left > rect.right + 4 || card.bottom < rect.top - 4 || card.top > rect.bottom + 4);
    if (!overlaps && !moved && left >= margin && left + CARD_W <= vw - margin) {
      return { top, left };
    }
  }
  const below = rect.bottom + gap;
  const above = rect.top - gap - cardH;
  const top = above >= margin ? above : Math.min(below, vh - cardH - bottomSafe);
  return { top: Math.max(margin, top), left: clampLeft(rect.left + rect.width / 2 - CARD_W / 2) };
}

export function EstimateTour() {
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardH, setCardH] = useState(240);
  const [mounted, setMounted] = useState(false);

  const open = useCallback(() => {
    setSteps(STEPS);
    setStep(0);
    setActive(true);
  }, []);

  const close = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    window.addEventListener(ESTIMATE_TOUR_EVENT, open);
    let timer: number | undefined;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        timer = window.setTimeout(open, 700);
      }
    } catch {
      // private mode
    }
    return () => {
      window.removeEventListener(ESTIMATE_TOUR_EVENT, open);
      if (timer) window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  useEffect(() => {
    if (!active) return;
    const current = steps[step];
    const el = findTarget(current?.targets);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: current?.scroll ?? "center", inline: "nearest" });
    const read = () => {
      const again = findTarget(current?.targets);
      setRect(again ? again.getBoundingClientRect() : null);
    };
    read();
    const frame = requestAnimationFrame(read);
    window.addEventListener("resize", read);
    window.addEventListener("scroll", read, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", read);
      window.removeEventListener("scroll", read, true);
    };
  }, [active, step, steps]);

  if (!active || !mounted) return null;

  const current = steps[Math.min(step, steps.length - 1)];
  if (!current) return null;
  const centered = !rect || current.place === "center";
  const spot = rect && !centered ? placeCard(rect, current.place, cardH) : null;
  const pad = 8;
  const hole = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      {hole ? (
        <>
          <div className="absolute left-0 right-0 top-0 bg-slate-950/65" style={{ height: hole.top }} onClick={close} />
          <div className="absolute left-0 bg-slate-950/65" style={{ top: hole.top, width: hole.left, height: hole.height }} onClick={close} />
          <div className="absolute right-0 bg-slate-950/65" style={{ top: hole.top, left: hole.left + hole.width, height: hole.height }} onClick={close} />
          <div className="absolute bottom-0 left-0 right-0 bg-slate-950/65" style={{ top: hole.top + hole.height }} onClick={close} />
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-blue-400"
            style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-950/65" onClick={close} />
      )}

      <div
        ref={(node) => {
          if (!node) return;
          const next = node.offsetHeight;
          if (next > 0 && Math.abs(next - cardH) > 4) setCardH(next);
        }}
        className="absolute w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        style={
          spot
            ? { top: spot.top, left: spot.left }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1.5 rounded-t-2xl bg-blue-600" />
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] font-medium text-slate-400">{step + 1} / {steps.length}</span>
          <button type="button" onClick={close} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Zamknij">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-4 pb-3 pt-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{current.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{current.description}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <button type="button" onClick={close} className="text-xs text-slate-400 hover:text-slate-600">Pomiń</button>
          <div className="flex items-center gap-1.5">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (step >= steps.length - 1) close();
                else setStep(step + 1);
              }}
              className="flex h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white"
            >
              {step === steps.length - 1 ? "Gotowe" : "Dalej"}
              {step < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
