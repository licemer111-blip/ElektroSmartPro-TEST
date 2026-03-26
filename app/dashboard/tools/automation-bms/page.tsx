"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Cpu,
  Activity,
  CircleDot,
  ShieldAlert,
  Zap,
  Calculator,
  FileText,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CalculatorWrapper } from "@/components/tools/calculator-wrapper";
import { useToolsAccess } from "@/components/tools/tools-provider";
import { CalculatorActionBar } from "@/components/tools/calculator-action-bar";

// ── Catalog prices (matching DIN_MODULES defaultPrice/defaultLaborPrice) ──────
const CATALOG: Record<string, { namePl: string; unitMat: number; unitLab: number; unit: string; knrCode: string; icon: string }> = {
  "terminal-zug-1p":      { namePl: "Zestaw złączek ZUG 1-faz (L+N+PE)",        unitMat: 13.5,  unitLab: 6.0,  unit: "szt.", knrCode: "KNR 5-08 0401-01", icon: "cpu" },
  "terminal-zug-3p":      { namePl: "Zestaw złączek ZUG 3-faz (L1+L2+L3+N+PE)", unitMat: 22.5,  unitLab: 10.0, unit: "szt.", knrCode: "KNR 5-08 0401-02", icon: "cpu" },
  "terminal-end-bracket": { namePl: "Trzymacz końcowy złączek (stoper)",          unitMat: 4.5,   unitLab: 2.0,  unit: "szt.", knrCode: "KNR 5-08 0401-05", icon: "circle" },
  "signal-terminal":      { namePl: "Złączki sygnałowe/piętrowe (opak. 10szt)",  unitMat: 35.0,  unitLab: 15.0, unit: "opak.", knrCode: "KNR 5-08 0902-01", icon: "activity" },
  "bus-cable-wiring":     { namePl: "Okablowanie magistralowe BMS/KNX (kpl)",     unitMat: 0,     unitLab: 85.0, unit: "kpl",  knrCode: "KNR 5-08 0102-01", icon: "activity" },
  "dali-controller":      { namePl: "Montaż sterownika DALI/BMS (kpl)",           unitMat: 0,     unitLab: 65.0, unit: "kpl",  knrCode: "KNR 5-08 0801-05", icon: "cpu" },
};

interface ResultItem {
  moduleId: string;
  namePl: string;
  qty: number;
  unit: string;
  unitMat: number;
  unitLab: number;
  totalMat: number;
  totalLab: number;
  knrCode: string;
  icon: string;
  isAutomation?: boolean;
}

function calcItems(
  circuits1p: number,
  circuits3p: number,
  bmsPoints: number,
  bmsSensors: number,
  wymaganeZugi: boolean,
  hasAutomation: boolean,
  encModules: number,
): ResultItem[] {
  const items: ResultItem[] = [];
  const isExpertPanel = encModules > 24;

  if (wymaganeZugi && isExpertPanel) {
    const ZUG_MULT = hasAutomation ? 3 : 1;
    const zug1p = circuits1p * ZUG_MULT;
    const zug3p = circuits3p * ZUG_MULT;
    const endBrackets = (zug1p + zug3p) > 0 ? 2 : 0;

    if (zug1p > 0) items.push({ moduleId: "terminal-zug-1p", ...CATALOG["terminal-zug-1p"], qty: zug1p, totalMat: zug1p * CATALOG["terminal-zug-1p"].unitMat, totalLab: zug1p * CATALOG["terminal-zug-1p"].unitLab, isAutomation: hasAutomation });
    if (zug3p > 0) items.push({ moduleId: "terminal-zug-3p", ...CATALOG["terminal-zug-3p"], qty: zug3p, totalMat: zug3p * CATALOG["terminal-zug-3p"].unitMat, totalLab: zug3p * CATALOG["terminal-zug-3p"].unitLab, isAutomation: hasAutomation });
    if (endBrackets > 0) items.push({ moduleId: "terminal-end-bracket", ...CATALOG["terminal-end-bracket"], qty: endBrackets, totalMat: endBrackets * CATALOG["terminal-end-bracket"].unitMat, totalLab: endBrackets * CATALOG["terminal-end-bracket"].unitLab });
  }

  if (bmsPoints > 0) {
    const packs = Math.max(1, Math.ceil(bmsPoints / 10));
    items.push({ moduleId: "signal-terminal", ...CATALOG["signal-terminal"], qty: packs, totalMat: packs * CATALOG["signal-terminal"].unitMat, totalLab: packs * CATALOG["signal-terminal"].unitLab, isAutomation: true });
    items.push({ moduleId: "bus-cable-wiring", ...CATALOG["bus-cable-wiring"], qty: 1, totalMat: 0, totalLab: CATALOG["bus-cable-wiring"].unitLab, isAutomation: true });
  }

  if (bmsSensors > 0) {
    const ctrlPacks = Math.max(1, Math.ceil(bmsSensors / 8)); // 1 controller per 8 sensors
    items.push({ moduleId: "dali-controller", ...CATALOG["dali-controller"], qty: ctrlPacks, totalMat: 0, totalLab: ctrlPacks * CATALOG["dali-controller"].unitLab, isAutomation: true });
  }

  return items;
}

function ItemIcon({ icon }: { icon: string }) {
  if (icon === "cpu") return <Cpu className="w-3.5 h-3.5 text-violet-500" />;
  if (icon === "activity") return <Activity className="w-3.5 h-3.5 text-emerald-500" />;
  return <CircleDot className="w-3.5 h-3.5 text-slate-400" />;
}

export default function AutomationBmsCalculatorPage() {
  const { isPro } = useToolsAccess();

  // ── Inputs ──
  const [circuits1p, setCircuits1p] = useState("8");
  const [circuits3p, setCircuits3p] = useState("2");
  const [bmsPoints, setBmsPoints] = useState("0");
  const [bmsSensors, setBmsSensors] = useState("0");
  const [encModules, setEncModules] = useState("48");
  const [hasPpoz, setHasPpoz] = useState(false);
  const [wymaganeZugi, setWymaganeZugi] = useState(true);
  const [automationSystem, setAutomationSystem] = useState<"none" | "knx" | "dali" | "bms">("none");

  const hasAutomation = automationSystem !== "none";

  const c1p = Math.max(0, parseInt(circuits1p) || 0);
  const c3p = Math.max(0, parseInt(circuits3p) || 0);
  const bms = Math.max(0, parseInt(bmsPoints) || 0);
  const sensors = Math.max(0, parseInt(bmsSensors) || 0);
  const enc = Math.max(12, parseInt(encModules) || 48);

  const items = useMemo(
    () => calcItems(c1p, c3p, bms, sensors, wymaganeZugi, hasAutomation, enc),
    [c1p, c3p, bms, sensors, wymaganeZugi, hasAutomation, enc]
  );

  const totalMat = items.reduce((s, i) => s + i.totalMat, 0);
  const totalLab = items.reduce((s, i) => s + i.totalLab, 0);
  const grandTotal = totalMat + totalLab;

  const isExpertPanel = enc > 24;

  return (
    <CalculatorWrapper isPro={isPro}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tools">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Kalkulatory
            </Button>
          </Link>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Cpu className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kalkulator Automatyki BMS</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
              Złączki ZUG, sygnałowe i okablowanie magistralowe wg KNR 5-08 0401–0801
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                ES-KNR 2026 (Automation Module)
              </span>
              <span className="text-[10px] text-slate-400">KNR 5-08 0401 / 0801 / 0102</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Inputs Panel ── */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Obwody elektryczne
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div>
                  <Label htmlFor="bms-circuits1p" className="text-xs text-slate-600 dark:text-slate-400">Obwody 1-fazowe (szt.)</Label>
                  <Input
                    id="bms-circuits1p"
                    name="bms-circuits1p"
                    type="number"
                    min={0}
                    value={circuits1p}
                    onChange={(e) => setCircuits1p(e.target.value)}
                    className="mt-1 h-8 text-sm"
                    placeholder="np. 8"
                  />
                </div>
                <div>
                  <Label htmlFor="bms-circuits3p" className="text-xs text-slate-600 dark:text-slate-400">Obwody 3-fazowe (szt.)</Label>
                  <Input
                    id="bms-circuits3p"
                    name="bms-circuits3p"
                    type="number"
                    min={0}
                    value={circuits3p}
                    onChange={(e) => setCircuits3p(e.target.value)}
                    className="mt-1 h-8 text-sm"
                    placeholder="np. 2"
                  />
                </div>
                <div>
                  <Label htmlFor="bms-enc-modules" className="text-xs text-slate-600 dark:text-slate-400">Wielkość obudowy (moduły)</Label>
                  <Select value={encModules} onValueChange={setEncModules}>
                    <SelectTrigger id="bms-enc-modules" className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["12", "18", "24", "36", "48", "72", "96", "144"].map(v => (
                        <SelectItem key={v} value={v}>{v} mod.{parseInt(v) > 24 ? " ✓ Expert" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isExpertPanel && (
                    <p className="text-[10px] text-amber-600 mt-1">ZUG wymagają obudowy &gt;24 modułów</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-500" />
                  Punkty sterowania BMS / KNX
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div>
                  <Label htmlFor="bms-points" className="text-xs text-slate-600 dark:text-slate-400">Liczba punktów sterowania (DALI/KNX)</Label>
                  <Input
                    id="bms-points"
                    name="bms-points"
                    type="number"
                    min={0}
                    value={bmsPoints}
                    onChange={(e) => setBmsPoints(e.target.value)}
                    className="mt-1 h-8 text-sm"
                    placeholder="np. 24"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">1 opak. złączek sygnałowych / 10 pkt</p>
                </div>
                <div>
                  <Label htmlFor="bms-sensors" className="text-xs text-slate-600 dark:text-slate-400">Liczba czujników BMS</Label>
                  <Input
                    id="bms-sensors"
                    name="bms-sensors"
                    type="number"
                    min={0}
                    value={bmsSensors}
                    onChange={(e) => setBmsSensors(e.target.value)}
                    className="mt-1 h-8 text-sm"
                    placeholder="np. 16"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">1 sterownik / 8 czujników</p>
                </div>
                <div>
                  <Label htmlFor="bms-automation-system" className="text-xs text-slate-600 dark:text-slate-400">System automatyki</Label>
                  <Select value={automationSystem} onValueChange={(v) => setAutomationSystem(v as typeof automationSystem)}>
                    <SelectTrigger id="bms-automation-system" className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Brak (standardowy panel)</SelectItem>
                      <SelectItem value="knx">KNX — magistrala TP</SelectItem>
                      <SelectItem value="dali">DALI — sterowanie oświetleniem</SelectItem>
                      <SelectItem value="bms">BMS — zarządzanie budynkiem</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasAutomation && (
                    <p className="text-[10px] text-violet-600 mt-1 font-medium">
                      Tryb Automatyki: ×3 liczba złączek ZUG
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Wymagane Zugi</Label>
                    <p className="text-[10px] text-slate-400">Złączki szynowe na każdy obwód</p>
                  </div>
                  <Switch checked={wymaganeZugi} onCheckedChange={setWymaganeZugi} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      System PPOŻ
                    </Label>
                    <p className="text-[10px] text-slate-400">RCD 300mA selektywny wymagany</p>
                  </div>
                  <Switch checked={hasPpoz} onCheckedChange={setHasPpoz} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Results Panel ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* PPOŻ warning */}
            {hasPpoz && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                  <strong>PPOŻ aktywne:</strong> RCD 300mA typ S (selektywny) musi być umieszczony bezpośrednio po
                  rozłączniku głównym w pozycji szeregowej. Obsługiwane przez fixSelectivity() — weryfikowane automatycznie.
                  Norma: PN-HD 60364-4-41.
                </AlertDescription>
              </Alert>
            )}

            {/* Not expert panel notice */}
            {!isExpertPanel && wymaganeZugi && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
                  ZUG są generowane tylko dla obudów &gt;24 modułów (tryb Expert). Wybierz 36+ mod.
                </AlertDescription>
              </Alert>
            )}

            {/* Summary totals */}
            {items.length > 0 && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/60 to-slate-50 dark:from-emerald-950/20">
                <CardContent className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      Podsumowanie
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                      ES-KNR 2026 (Automation Module)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-500 mb-0.5">Materiał</p>
                      <p className={`text-base font-bold text-slate-800 dark:text-slate-200 ${!isPro ? "blur-sm select-none" : ""}`}>
                        {isPro ? `${totalMat.toFixed(2)} zł` : "●●● zł"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-500 mb-0.5">Robocizna</p>
                      <p className={`text-base font-bold text-slate-800 dark:text-slate-200 ${!isPro ? "blur-sm select-none" : ""}`}>
                        {isPro ? `${totalLab.toFixed(2)} zł` : "●●● zł"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-600 p-2.5">
                      <p className="text-[10px] text-emerald-100 mb-0.5">Razem</p>
                      <p className={`text-base font-bold text-white ${!isPro ? "blur-sm select-none" : ""}`}>
                        {isPro ? `${grandTotal.toFixed(2)} zł` : "●●● zł"}
                      </p>
                    </div>
                  </div>
                  {!isPro && (
                    <p className="text-[10px] text-amber-600 text-center mt-2">
                      Zupgraduj do PRO, aby zobaczyć ceny
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Items table */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Specyfikacja materiałowa
                  <Badge variant="secondary" className="text-xs h-4 px-1.5 ml-1">{items.length} poz.</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Uzupełnij dane wejściowe, aby wygenerować specyfikację.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <div key={item.moduleId} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-[10px] text-slate-400 w-4 shrink-0 mt-0.5">{idx + 1}.</span>
                          <ItemIcon icon={item.icon} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                              {item.namePl}
                              {item.isAutomation && (
                                <span className="ml-1.5 text-[9px] px-1 py-px rounded bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300 font-mono">
                                  AUTO
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400">{item.qty} {item.unit}</span>
                              <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-mono">{item.knrCode}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-semibold text-slate-700 dark:text-slate-200 ${!isPro ? "blur-sm select-none" : ""}`}>
                            {isPro ? `${item.totalMat.toFixed(0)} / ${item.totalLab.toFixed(0)} zł` : "●●● zł"}
                          </p>
                          <p className="text-[10px] text-slate-400">mat. / rob.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info box */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Info className="w-4 h-4 text-blue-500" />
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p><strong>Tryb Automatyki (×3 ZUG)</strong> — aktywny gdy wybrany jest KNX/DALI/BMS. Dodatkowe złączki na magistrale sterownicze i kable sygnałowe.</p>
                <p><strong>Źródło cen:</strong> ES-KNR 2026 — Katalog Nakładów Rzeczowych 5-08 (Instalacje elektryczne). Ceny katalogowe NETTO PLN 2026.</p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <CalculatorActionBar
          calculatorId="automation-bms"
          title="Kalkulator Automatyki BMS"
          hasResult={items.length > 0}
          isPro={isPro}
          pdfInputs={[
            { label: "Obwody 1-fazowe", value: `${c1p} szt.` },
            { label: "Obwody 3-fazowe", value: `${c3p} szt.` },
            { label: "Punkty BMS/DALI/KNX", value: `${bms} pkt.` },
            { label: "Czujniki BMS", value: `${sensors} szt.` },
            { label: "Obudowa", value: `${enc} mod.` },
            { label: "System automatyki", value: automationSystem },
            { label: "Wymagane Zugi", value: wymaganeZugi ? "Tak" : "Nie" },
            { label: "PPOZ", value: hasPpoz ? "Tak" : "Nie" },
          ]}
          pdfResults={[
            { label: "Materiał netto", value: `${totalMat.toFixed(2)} zł`, highlight: false },
            { label: "Robocizna netto", value: `${totalLab.toFixed(2)} zł`, highlight: false },
            { label: "Razem netto", value: `${grandTotal.toFixed(2)} zł`, highlight: true },
          ]}
          standard="KNR 5-08 0401 / 0801 / 0102"
          notes="Źródło: ES-KNR 2026 (Automation Module). Ceny NETTO PLN 2026."
          currentInputs={{ circuits1p, circuits3p, bmsPoints, bmsSensors, encModules, automationSystem, wymaganeZugi, hasPpoz }}
          currentLabel={`${c1p + c3p} obw. | ${bms} pkt. | ${automationSystem}`}
          onLoadInputs={(inputs) => {
            setCircuits1p(inputs.circuits1p ?? circuits1p);
            setCircuits3p(inputs.circuits3p ?? circuits3p);
            setBmsPoints(inputs.bmsPoints ?? bmsPoints);
            setBmsSensors(inputs.bmsSensors ?? bmsSensors);
            setEncModules(inputs.encModules ?? encModules);
            setAutomationSystem(inputs.automationSystem ?? automationSystem);
            setWymaganeZugi(inputs.wymaganeZugi ?? wymaganeZugi);
            setHasPpoz(inputs.hasPpoz ?? hasPpoz);
          }}
          onReset={() => {
            setCircuits1p("8"); setCircuits3p("2"); setBmsPoints("0");
            setBmsSensors("0"); setEncModules("48"); setAutomationSystem("none");
            setWymaganeZugi(true); setHasPpoz(false);
          }}
        />
      )}
    </CalculatorWrapper>
  );
}
