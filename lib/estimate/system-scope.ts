/** A line that names a whole system must not inherit the hour of one part inside it. */

export interface SystemDevice {
  id: string;
  label: string;
  hours: number;
  unit: string;
  code: string | null;
}

export interface WholeSystem {
  id: string;
  title: string;
  hint: string;
  devices: SystemDevice[];
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const PIECE = [
  /\bcentral/,
  /\bsilownik/,
  /\bprzycisk/,
  /\bklap/,
  /\bpanel\s+(?:fotowolt|pv|slonec)/,
  /\b(?:inwerter|falownik)/,
  /\bkamera/,
  /\b(?:rejestrator|nvr|dvr)\b/,
  /\bunifon/,
  /\b(?:czujnik|czujka)/,
  /\b(?:modul|aktor|zasilacz)\s+knx/,
  /\bknx\s+(?:modul|aktor|zasilacz|czujnik)/,
  /\bopraw/,
  /\bgniazd/,
  /\b(?:lacznik|wylacznik)/,
  /\bpanel\b/,
  /\b(?:przewod|kabel|yky|ydyp|yaky|yaky)/,
  /\b\d\s*x\s*\d/,
  /\bbruzd/,
  /\b(?:rcd|mcb|spd)\b/,
  /\b(?:zwod|uziom|iglica|bednarka)/,
  /\bobudow/,
  /\b(?:petl|izolacj|rezystanc)/,
];

const SYSTEM_PHRASE = /\b(?:komplet|system|uklad|cala instalacj|caly uklad|calej instalacji|calego)\b/;

function hasPiece(name: string): boolean {
  return PIECE.some((pattern) => pattern.test(name));
}

interface Family {
  id: string;
  title: string;
  hint: string;
  test: RegExp;
  /** When the name has no piece and no "komplet", still a whole system (the bare word). */
  bare: RegExp;
  devices: SystemDevice[];
}

const FAMILIES: Family[] = [
  {
    id: "smoke",
    title: "Oddymianie",
    hint: "Norma ES ma centralę (2,5 rbh), siłownik (1,5 rbh) albo przycisk (1 rbh). Całego układu nie ma.",
    test: /\boddymian/,
    bare: /\boddymian/,
    devices: [
      { id: "central", label: "Centrala oddymiania", hours: 2.5, unit: "szt", code: null },
      { id: "actuator", label: "Siłownik klapy dymowej", hours: 1.5, unit: "szt", code: null },
      { id: "button", label: "Przycisk oddymiania", hours: 1, unit: "kpl", code: null },
    ],
  },
  {
    id: "pv",
    title: "Fotowoltaika",
    hint: "Norma ES ma montaż panelu albo inwertera. Całej instalacji na dachu nie ma.",
    test: /\bfotowolt|\binstalacj\w*\s+pv\b|\bpv\b/,
    bare: /\bfotowolt|\bpv\b/,
    devices: [
      { id: "panel", label: "Panel fotowoltaiczny", hours: 0.8, unit: "szt", code: "ES-PV-001" },
      { id: "inverter", label: "Inwerter PV", hours: 4, unit: "szt", code: "ES-PV-010" },
    ],
  },
  {
    id: "cctv",
    title: "Monitoring",
    hint: "Norma ES ma jedną kamerę albo rejestrator. Całego monitoringu obiektu nie ma.",
    test: /\bmonitoring|\bcctv\b|\bwideomonitoring/,
    bare: /\bmonitoring|\bcctv\b/,
    devices: [
      { id: "camera", label: "Kamera IP", hours: 1.2, unit: "szt", code: "ES-CCTV-001" },
      { id: "nvr", label: "Rejestrator NVR", hours: 1.5, unit: "szt", code: "ES-CCTV-010" },
    ],
  },
  {
    id: "door",
    title: "Domofon",
    hint: "Norma ES ma panel, unifon albo centralę. Całej instalacji domofonowej nie ma.",
    test: /\bdomofon/,
    bare: /\bdomofon/,
    devices: [
      { id: "panel", label: "Panel domofonu", hours: 1.2, unit: "szt", code: "KNR 5-09 0801" },
      { id: "handset", label: "Unifon", hours: 0.8, unit: "szt", code: "KNR 5-09 0802" },
      { id: "central", label: "Centrala domofonowa", hours: 2, unit: "szt", code: "KNR 5-09 0504" },
    ],
  },
  {
    id: "emergency",
    title: "Oświetlenie awaryjne",
    hint: "Norma ES ma jedną oprawę awaryjną. Całego oświetlenia ewakuacyjnego nie ma.",
    test: /\boswietlenie awaryjn|\boswietlenie ewakuacyjn|\binstalacj\w*\s+awaryjn/,
    bare: /\boswietlenie awaryjn|\boswietlenie ewakuacyjn/,
    devices: [
      { id: "fitting", label: "Oprawa awaryjna", hours: 0.6, unit: "szt", code: "KNR 5-08 1409" },
    ],
  },
  {
    id: "board",
    title: "Rozdzielnica",
    hint: "Jedna norma nie obejmuje obudowy, aparatów i podłączeń. Rozbij na pozycje albo wpisz kwotę umowną.",
    test: /\brozdzielnic|\btablic(?:a|e|y)\b/,
    bare: /^(?:montaz\s+|wykonanie\s+)?rozdzielnic\w*$/,
    devices: [],
  },
  {
    id: "lightning",
    title: "Odgromowa",
    hint: "Norma na jeden metr zwodu to nie cała instalacja odgromowa.",
    test: /\bodgrom|\bpiorunochron/,
    bare: /\bodgrom|\bpiorunochron/,
    devices: [],
  },
  {
    id: "wlz",
    title: "WLZ",
    hint: "Godzina za metr kabla to nie cała linia zasilająca ze złączem.",
    test: /\bwlz\b/,
    bare: /\bwlz\b/,
    devices: [],
  },
  {
    id: "ev",
    title: "Wallbox",
    hint: "Norma ES to sam montaż ładowarki. Kabel i ziemia są osobno.",
    test: /\bwallbox|\bstacj\w*\s+ladowania|\bpunkt\w*\s+ladowania/,
    bare: /\bwallbox|\bladowania/,
    devices: [
      { id: "charger", label: "Wallbox — montaż urządzenia", hours: 2.5, unit: "szt", code: "ES-EV-001" },
    ],
  },
  {
    id: "knx",
    title: "KNX / BMS",
    hint: "Norma ES ma moduł, czujnik albo zasilacz. Całego systemu nie ma.",
    test: /\bknx\b|\bbms\b/,
    bare: /\bknx\b|\bbms\b/,
    devices: [
      { id: "module", label: "Moduł KNX", hours: 0.85, unit: "szt", code: "ES-SMART-001" },
      { id: "sensor", label: "Czujnik KNX", hours: 0.55, unit: "szt", code: "ES-SMART-002" },
      { id: "psu", label: "Zasilacz KNX", hours: 0.75, unit: "szt", code: "ES-SMART-003" },
    ],
  },
  {
    id: "tests",
    title: "Pomiary",
    hint: "Pomiary całego obiektu to nie jeden obwód. Wpisz kwotę umowną.",
    test: /\bpomiar/,
    bare: /^(?:wykonanie\s+)?pomiary?(?:\s+elektryczn\w*|\s+odbiorcz\w*|\s+instalacj\w*)?$/,
    devices: [],
  },
  {
    id: "demo",
    title: "Demontaż",
    hint: "Demontaż całej instalacji to nie demontaż jednego punktu.",
    test: /\bdemontaz|\brozbiork/,
    bare: /\bdemontaz|\brozbiork/,
    devices: [],
  },
];

export function wholeSystem(name: string): WholeSystem | null {
  const text = fold(name).replace(/\s+/g, " ").trim();
  if (text.length < 3) return null;
  const family = FAMILIES.find((item) => item.test.test(text));
  if (!family) return null;
  const phrase = SYSTEM_PHRASE.test(text);
  const piece = hasPiece(text);
  if (piece && !phrase) return null;
  if (!phrase && !family.bare.test(text)) return null;
  if (family.id === "wlz" && /\d\s*x\s*\d|\bmm2\b|\byky\b|\bydyp\b/.test(text)) return null;
  if (family.id === "tests" && piece) return null;
  if (family.id === "demo" && piece) return null;
  if (family.id === "board" && !phrase && !family.bare.test(text)) return null;
  return {
    id: family.id,
    title: family.title,
    hint: family.hint,
    devices: family.devices,
  };
}

/** A whole system stays unpriced until the electrician saves a contract sum. */
export function awaitsContractSum(name: string, confidence: string | null | undefined): boolean {
  return confidence !== "manual" && wholeSystem(name) != null;
}
