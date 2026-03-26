"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type VATRate = 8 | 23;

interface VATSelectorProps {
  onVATChange: (rate: VATRate) => void;
  defaultRate?: VATRate;
  billingCycle?: 'month' | 'year' | 'monthly' | 'yearly';
}

export function VATSelector({ onVATChange, defaultRate = 23, billingCycle = 'month' }: VATSelectorProps) {
  const [selectedVAT, setSelectedVAT] = useState<VATRate>(defaultRate);

  // Calculate base price based on billing cycle
  const isYearly = billingCycle === 'year' || billingCycle === 'yearly';
  const basePrice = isYearly ? 1590 : 159;
  const priceLabel = isYearly ? 'rok' : 'miesiąc';

  const handleVATChange = (value: string) => {
    const rate = parseInt(value) as VATRate;
    setSelectedVAT(rate);
    onVATChange(rate);
  };

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800">
      <CardContent className="pt-6">
        <Tabs value={selectedVAT.toString()} onValueChange={handleVATChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1">
            {/* VAT 8% Option */}
            <TabsTrigger 
              value="8" 
              className="h-auto flex-col items-start p-2.5 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/20 data-[state=active]:border-2 data-[state=active]:border-green-600 dark:data-[state=active]:border-green-500"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="p-1 rounded-md bg-green-100 dark:bg-green-900/40">
                  <Home className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                </div>
                <Badge className="bg-green-600 hover:bg-green-600 text-white font-bold text-[10px] px-1.5">
                  8% VAT
                </Badge>
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Mieszkaniówka
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
                  Budownictwo
                </div>
              </div>
            </TabsTrigger>

            {/* VAT 23% Option */}
            <TabsTrigger 
              value="23" 
              className="h-auto flex-col items-start p-2.5 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/20 data-[state=active]:border-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/40">
                  <Building2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-bold text-[10px] px-1.5">
                  23% VAT
                </Badge>
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Firma / Inne
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
                  Dział. gosp.
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Dynamic Price Preview */}
        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">Cena subskrypcji (netto):</span>
            <span className="font-semibold">{basePrice.toFixed(2).replace('.', ',')} zł / {priceLabel}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">VAT ({selectedVAT}%):</span>
            <span className="font-semibold">
              {((basePrice * selectedVAT) / 100).toFixed(2).replace('.', ',')} zł
            </span>
          </div>
          <div className="pt-2 border-t border-slate-300 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base">Suma brutto:</span>
              <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                {(basePrice * (1 + selectedVAT / 100)).toFixed(2).replace('.', ',')} zł
              </span>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
          Faktura VAT zostanie automatycznie wygenerowana przez Stripe
        </div>
      </CardContent>
    </Card>
  );
}
