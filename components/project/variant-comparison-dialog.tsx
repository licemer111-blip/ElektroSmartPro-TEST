"use client";

import { useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GitCompareArrows, TrendingUp, Wallet, Wrench, Download,
  Star, Award, Crown,
} from "lucide-react";

interface VariantComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  isPro?: boolean;
  projectItems: {
    name: string;
    unit: string;
    quantity: number;
    final_material_price: number;
    final_labor_price: number;
  }[];
  vatRate: number;
  clientName?: string | null;
}

interface VariantConfig {
  key: string;
  label: string;
  description: string;
  materialMult: number;
  laborMult: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const VARIANTS: VariantConfig[] = [
  {
    key: "ekonomiczny",
    label: "Ekonomiczny",
    description: "Podstawowe, sprawdzone materiały",
    materialMult: 0.85,
    laborMult: 0.90,
    icon: <Wallet className="w-4 h-4" />,
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    key: "standard",
    label: "Standard",
    description: "Markowe materiały, solidna jakość",
    materialMult: 1.0,
    laborMult: 1.0,
    icon: <Star className="w-4 h-4" />,
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "premium",
    label: "Premium",
    description: "Topowe materiały, smart home",
    materialMult: 1.35,
    laborMult: 1.25,
    icon: <Crown className="w-4 h-4" />,
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function VariantComparisonDialog({
  open,
  onOpenChange,
  projectName,
  isPro = false,
  projectItems,
  vatRate,
  clientName,
}: VariantComparisonDialogProps) {
  const blurPrice = (v: number) => isPro ? formatCurrency(v) : "*** zł";
  const printRef = useRef<HTMLDivElement>(null);

  const variantTotals = useMemo(() => {
    return VARIANTS.map((variant) => {
      let materialTotal = 0;
      let laborTotal = 0;

      for (const item of projectItems) {
        materialTotal += (item.final_material_price || 0) * (item.quantity || 1) * variant.materialMult;
        laborTotal += (item.final_labor_price || 0) * (item.quantity || 1) * variant.laborMult;
      }

      const net = materialTotal + laborTotal;
      const vatAmount = net * (vatRate / 100);
      const gross = net + vatAmount;

      return {
        ...variant,
        materialTotal,
        laborTotal,
        net,
        vatAmount,
        gross,
      };
    });
  }, [projectItems, vatRate]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Porównanie wariantów - ${projectName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1e293b; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #64748b; margin-bottom: 24px; }
          .client { font-size: 12px; color: #475569; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .total-row td { font-weight: 700; font-size: 14px; border-top: 2px solid #1e293b; background: #f8fafc; }
          .right { text-align: right; }
          .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; }
          .savings { font-size: 10px; color: #059669; }
          .premium-note { font-size: 10px; color: #d97706; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <h1>Porównanie wariantów wyceny</h1>
        <p class="subtitle">${projectName}</p>
        ${clientName ? `<p class="client">Klient: ${clientName}</p>` : ""}
        <table>
          <thead>
            <tr>
              <th></th>
              ${variantTotals.map(v => `<th class="right">${v.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Materiały</td>
              ${variantTotals.map(v => `<td class="right">${formatCurrency(v.materialTotal)}</td>`).join("")}
            </tr>
            <tr>
              <td>Robocizna</td>
              ${variantTotals.map(v => `<td class="right">${formatCurrency(v.laborTotal)}</td>`).join("")}
            </tr>
            <tr>
              <td>Netto</td>
              ${variantTotals.map(v => `<td class="right">${formatCurrency(v.net)}</td>`).join("")}
            </tr>
            <tr>
              <td>VAT ${vatRate}%</td>
              ${variantTotals.map(v => `<td class="right">${formatCurrency(v.vatAmount)}</td>`).join("")}
            </tr>
            <tr class="total-row">
              <td>BRUTTO</td>
              ${variantTotals.map(v => `<td class="right">${formatCurrency(v.gross)}</td>`).join("")}
            </tr>
          </tbody>
        </table>
        <p class="footer">
          Wygenerowano w ElektroSmart PRO · ${new Date().toLocaleDateString("pl-PL")} · ${projectItems.length} pozycji
        </p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (projectItems.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Warianty wyceny</DialogTitle>
            <DialogDescription>
              Dodaj pozycje do kosztorysu, aby wygenerować porównanie wariantów.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <GitCompareArrows className="w-4 h-4 text-white" />
            </div>
            Warianty wyceny
          </DialogTitle>
          <DialogDescription>
            Porównanie 3 wariantów cenowych dla &quot;{projectName}&quot;
            {clientName && ` · Klient: ${clientName}`}
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="space-y-4 py-2">
          {/* Variant cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {variantTotals.map((variant) => (
              <div
                key={variant.key}
                className={`rounded-xl border-2 ${variant.borderColor} ${variant.bgColor} p-3 text-center relative overflow-hidden`}
              >
                {variant.key === "standard" && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded-bl-lg">
                    AKTUALNY
                  </div>
                )}
                <div className={`flex items-center justify-center gap-1.5 mb-1 ${variant.color}`}>
                  {variant.icon}
                  <span className="text-sm font-bold">{variant.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{variant.description}</p>
                <p className={`text-lg font-bold ${variant.color} ${!isPro ? "blur-sm select-none" : ""}`}>
                  {blurPrice(variant.gross)}
                </p>
                <p className="text-[10px] text-muted-foreground">brutto (z VAT {vatRate}%)</p>
              </div>
            ))}
          </div>

          {/* Detailed comparison table */}
          <div className="border rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-3 py-2 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider"></th>
                  {variantTotals.map((v) => (
                    <th key={v.key} className={`text-right px-3 py-2 text-[10px] uppercase font-semibold tracking-wider ${v.color}`}>
                      {v.icon}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-xs font-medium">Materiały</td>
                  {variantTotals.map((v) => (
                    <td key={v.key} className={`px-3 py-2 text-xs text-right font-medium ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(v.materialTotal)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-xs font-medium">Robocizna</td>
                  {variantTotals.map((v) => (
                    <td key={v.key} className={`px-3 py-2 text-xs text-right font-medium ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(v.laborTotal)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-xs font-medium">Netto</td>
                  {variantTotals.map((v) => (
                    <td key={v.key} className={`px-3 py-2 text-xs text-right font-semibold ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(v.net)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-xs font-medium">VAT {vatRate}%</td>
                  {variantTotals.map((v) => (
                    <td key={v.key} className={`px-3 py-2 text-xs text-right text-muted-foreground ${!isPro ? "blur-sm select-none" : ""}`}>{blurPrice(v.vatAmount)}</td>
                  ))}
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                  <td className="px-3 py-2.5 text-xs font-bold">BRUTTO</td>
                  {variantTotals.map((v) => (
                    <td key={v.key} className={`px-3 py-2.5 text-sm text-right font-bold ${v.color} ${!isPro ? "blur-sm select-none" : ""}`}>
                      {blurPrice(v.gross)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Savings / difference info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-0.5">Oszczędność (Ekonomiczny vs Standard)</p>
              <p className={`text-sm font-bold text-emerald-700 dark:text-emerald-300 ${!isPro ? "blur-sm select-none" : ""}`}>
                {blurPrice(variantTotals[1].gross - variantTotals[0].gross)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ({((1 - variantTotals[0].gross / variantTotals[1].gross) * 100).toFixed(1)}% taniej)
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-0.5">Dopłata (Premium vs Standard)</p>
              <p className={`text-sm font-bold text-amber-700 dark:text-amber-300 ${!isPro ? "blur-sm select-none" : ""}`}>
                {isPro ? "+" : ""}{blurPrice(variantTotals[2].gross - variantTotals[1].gross)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                (+{((variantTotals[2].gross / variantTotals[1].gross - 1) * 100).toFixed(1)}% drożej)
              </p>
            </div>
          </div>

          {/* Item count */}
          <div className="text-center">
            <Badge variant="outline" className="text-[10px]">
              Kalkulacja na podstawie {projectItems.length} pozycji kosztorysu
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            Mnożniki: Ekon. (mat. ×0.85, rob. ×0.90) · Premium (mat. ×1.35, rob. ×1.25)
          </p>
          <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Drukuj / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
