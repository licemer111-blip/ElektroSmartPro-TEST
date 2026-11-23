"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "es_estimate_tour_v1";
export const ESTIMATE_TOUR_EVENT = "es-estimate-tour-start";

interface Step {
  id: string;
  title: string;
  description: string;
  target?: string;
  place: "bottom" | "right" | "left" | "center";
}

const STEPS: Step[] = [
  {
    id: "start",
    title: "To jest kosztorys",
    description: "Za chwilę pokażę przyciski, których nowy użytkownik zwykle nie zauważa. Można pominąć i wrócić później przyciskiem Pomoc.",
    place: "center",
  },
  {
    id: "catalog",
    title: "Lewa kolumna — katalog",
    description: "Ta niebieska ikona chowa katalog, żeby tabela z pozycjami była szersza. Żeby otworzyć z powrotem, kliknij niebieski pasek „Katalog pozycji” na lewym brzegu.",
    target: '[data-tour="tour-catalog"]',
    place: "right",
  },
  {
    id: "summary",
    title: "Prawa kolumna — suma",
    description: "Ta ikona chowa podsumowanie: kwotę, PDF i warunki oferty. Otworzysz je niebieskim paskiem „Podsumowanie” po prawej.",
    target: '[data-tour="tour-summary"]',
    place: "left",
  },
  {
    id: "wycen",
    title: "Wyceń",
    description: "Liczy robociznę: godzina normy ES × Twoja stawka. Województwo dolicza tylko pracę. Materiału nie wymyśla.",
    target: '[data-tour="tour-wycen"]',
    place: "bottom",
  },
  {
    id: "import",
    title: "Wczytaj ofertę",
    description: "Wklejasz listę, Excel albo PDF. Pozycje wchodzą do kosztorysu. Ceny dopiszesz sam albo przyciskiem Wyceń.",
    target: '[data-tour="tour-import"]',
    place: "bottom",
  },
  {
    id: "assistant",
    title: "Asystent",
    description: "Pytanie o pracę albo sposób liczenia. Sam nie dopisuje pozycji do kosztorysu.",
    target: '[data-tour="tour-assistant"]',
    place: "bottom",
  },
  {
    id: "zestaw",
    title: "Dodaj zestaw",
    description: "Wstawia Twój komplet naraz: na przykład puszka, kabel i montaż. To nie jest zgadywany skład.",
    target: '[data-tour="tour-zestaw"]',
    place: "bottom",
  },
  {
    id: "export",
    title: "PDF i Excel",
    description: "Na dole prawej kolumny. PDF idzie do klienta. W Demo na PDF jest znak wodny. Excel kosztorysu jest w PRO.",
    target: '[data-tour="tour-export"]',
    place: "left",
  },
];

export function EstimateTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const locate = useCallback((index: number) => {
    const current = STEPS[index];
    if (!current?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    setRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    const open = () => {
      setStep(0);
      setActive(true);
    };
    window.addEventListener(ESTIMATE_TOUR_EVENT, open);
    let timer: number | undefined;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        timer = window.setTimeout(open, 900);
      }
    } catch {
      // private mode
    }
    return () => {
      window.removeEventListener(ESTIMATE_TOUR_EVENT, open);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    locate(step);
    const onMove = () => locate(step);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [active, step, locate]);

  const close = () => {
    setActive(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  };

  const go = (next: number) => {
    const dir = next > step ? 1 : -1;
    let i = next;
    while (i >= 0 && i < STEPS.length) {
      const target = STEPS[i].target;
      if (!target || document.querySelector(target)) {
        setStep(i);
        return;
      }
      i += dir;
    }
    if (dir > 0) close();
  };

  if (!active) return null;

  const current = STEPS[step];
  const centered = !rect || current.place === "center";
  const width = 320;
  const viewW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewH = typeof window !== "undefined" ? window.innerHeight : 800;
  let style: React.CSSProperties | undefined;
  if (rect && !centered) {
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, viewW - width - 12));
    if (current.place === "bottom") style = { top: Math.min(rect.bottom + 12, viewH - 260), left };
    else if (current.place === "right") style = { top: Math.max(12, rect.top), left: Math.min(rect.right + 12, viewW - width - 12) };
    else style = { top: Math.max(12, rect.top), left: Math.max(12, rect.left - width - 12) };
  }

  return (
    <>
      <div className="fixed inset-0 z-[9998]">
        <div className="absolute inset-0 bg-black/55" onClick={close} />
        {rect && (
          <div
            className="fixed rounded-xl ring-2 ring-blue-400 pointer-events-none"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              zIndex: 9999,
            }}
          />
        )}
      </div>
      <div
        className={cn(
          "fixed z-[10000] w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900",
          centered && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
        style={centered ? undefined : style}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1.5 rounded-t-2xl bg-blue-600" />
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] font-medium text-slate-400">{step + 1} / {STEPS.length}</span>
          <button type="button" onClick={close} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Zamknij">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-4 pb-3 pt-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{current.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{current.description}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <button type="button" onClick={close} className="text-xs text-slate-400 hover:text-slate-600">Pomiń</button>
          <div className="flex items-center gap-1.5">
            {step > 0 && (
              <button type="button" onClick={() => go(step - 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => go(step + 1)}
              className="flex h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white"
            >
              {step === STEPS.length - 1 ? "Gotowe" : "Dalej"}
              {step < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
