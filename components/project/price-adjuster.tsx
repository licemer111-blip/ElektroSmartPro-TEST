"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Target, Loader2, Lock, Crown } from "lucide-react";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/hints/hint-content";
import { BlurredPrice } from "@/components/ui/blurred-price";
import { updateAdjustmentPercentage } from "@/app/dashboard/projects/[id]/actions";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedCallback } from "use-debounce";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useModalStore } from "@/hooks/use-modal-store";

interface PriceAdjusterProps {
  projectId: string;
  basePrice: number;
  initialAdjustment: number;
  isPro?: boolean;
  disabled?: boolean;
  instanceId?: string;
}

export function PriceAdjuster({ projectId, basePrice, initialAdjustment, isPro = true, disabled = false, instanceId = "default" }: PriceAdjusterProps) {
  // Ensure basePrice is a valid number
  const safeBasePrice = basePrice || 0;
  
  const [adjustment, setAdjustment] = useState(initialAdjustment);
  const [targetPrice, setTargetPrice] = useState(safeBasePrice * (1 + initialAdjustment / 100));
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { onOpen } = useModalStore();

  // ⚡ SYNC: Update local state when prop changes (from data sync)
  useEffect(() => {
    setAdjustment(initialAdjustment);
    setTargetPrice(safeBasePrice * (1 + initialAdjustment / 100));
  }, [initialAdjustment, safeBasePrice]);

  // Calculate final price based on adjustment percentage
  const calculateFinalPrice = (adjustmentPercent: number) => {
    return safeBasePrice * (1 + adjustmentPercent / 100);
  };

  // Calculate adjustment percentage based on target price
  const calculateAdjustment = (price: number) => {
    if (safeBasePrice === 0) return 0;
    return ((price - safeBasePrice) / safeBasePrice) * 100;
  };

  // Debounced save to database
  const debouncedSave = useDebouncedCallback(async (adjustmentValue: number) => {
    setIsSaving(true);
    const result = await updateAdjustmentPercentage(projectId, adjustmentValue);
    setIsSaving(false);

    if (result.error) {
      toast({
        title: "Błąd",
        description: result.error,
        variant: "destructive",
      });
    } else {
      // ⚡ SYNC: Notify other users about price adjustment change
      notifyDataChanged("price-adjustment");
    }
  }, 500);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    if (disabled) {
      toast({
        title: "Projekt zablokowany",
        description: "Odblokuj projekt, aby edytować ceny",
        variant: "destructive",
      });
      return;
    }
    const newAdjustment = value[0];
    setAdjustment(newAdjustment);
    setTargetPrice(calculateFinalPrice(newAdjustment));
    debouncedSave(newAdjustment);
  };

  // Handle target price input change
  const handleTargetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      toast({
        title: "Projekt zablokowany",
        description: "Odblokuj projekt, aby edytować ceny",
        variant: "destructive",
      });
      return;
    }
    const value = parseFloat(e.target.value) || 0;
    setTargetPrice(value);
    
    const newAdjustment = calculateAdjustment(value);
    // Clamp adjustment to -20% to +20%
    const clampedAdjustment = Math.max(-20, Math.min(20, newAdjustment));
    setAdjustment(clampedAdjustment);
    debouncedSave(clampedAdjustment);
  };

  // Update when basePrice changes
  useEffect(() => {
    setTargetPrice(calculateFinalPrice(adjustment));
  }, [safeBasePrice, adjustment]);

  const isDiscount = adjustment < 0;
  const isMarkup = adjustment > 0;
  const isNeutral = adjustment === 0;

  return (
    <div className="space-y-3 border-t border-border mt-4 pt-4">
      {/* Header with saving indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
          <Label htmlFor={`target-price-${instanceId}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Negocjacje Ceny
          </Label>
          <HintTooltip content={HINTS.negotiationSlider} side="top" iconOnly iconClassName="opacity-50 hover:opacity-80" />
          <Loader2 className={`w-3 h-3 flex-shrink-0 text-slate-400 transition-opacity duration-150 ${isSaving && isPro ? 'opacity-100 animate-spin' : 'opacity-0'}`} />
        </div>
        {!isNeutral && (
          <Badge 
            variant="outline"
            className={`text-xs ${isDiscount ? 'text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20' : 'text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20'}`}
          >
            {isDiscount ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : (
              <TrendingUp className="w-3 h-3 mr-1" />
            )}
            {adjustment > 0 ? "+" : ""}{adjustment.toFixed(1)}%
          </Badge>
        )}
      </div>

      {/* Base Price - Subtle and grey */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500 dark:text-slate-500">Cena bazowa:</span>
        <span className={`text-sm ${!isNeutral ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
          <BlurredPrice value={safeBasePrice} isPro={isPro} />
        </span>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="relative">
          {disabled && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast({
                  title: "🔒 Projekt zablokowany",
                  description: "Odblokuj projekt, aby edytować ceny",
                  variant: "destructive",
                });
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          )}
          <Slider
            aria-label="Negocjacje ceny"
            name={`negotiation-slider-${instanceId}`}
            value={[adjustment]}
            onValueChange={handleSliderChange}
            min={-20}
            max={20}
            step={0.1}
            className={`w-full ${
              adjustment < 0
                ? '[&>span:first-child]:bg-red-200 [&>span>span]:bg-red-600 [&>span:nth-child(2)]:border-red-600 [&>span:nth-child(2)]:bg-red-600'
                : adjustment > 0
                ? '[&>span:first-child]:bg-green-200 [&>span>span]:bg-green-600 [&>span:nth-child(2)]:border-green-600 [&>span:nth-child(2)]:bg-green-600'
                : '[&>span:first-child]:bg-blue-200 [&>span>span]:bg-blue-500 [&>span:nth-child(2)]:border-blue-500 [&>span:nth-child(2)]:bg-blue-500'
            } [&>span:nth-child(2)]:rounded-full ${disabled ? 'opacity-50' : ''}`}
            disabled={disabled}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-600">
          <span>-20%</span>
          <span>0%</span>
          <span>+20%</span>
        </div>
      </div>

      {/* Target Price Input - HERO price field */}
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between">
          <Label htmlFor={`target-price-${instanceId}`} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            KWOTA KOŃCOWA
          </Label>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">brutto</span>
        </div>
        <div className="relative">
          {disabled && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed rounded-xl"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast({
                  title: "🔒 Projekt zablokowany",
                  description: "Odblokuj projekt, aby edytować ceny",
                  variant: "destructive",
                });
              }}
            />
          )}
          {isPro ? (
            <div className="relative">
              <input
                id={`target-price-${instanceId}`}
                name={`target-price-${instanceId}`}
                type="number"
                value={targetPrice.toFixed(2)}
                onChange={handleTargetPriceChange}
                style={{ fontSize: '1.575rem', fontWeight: 900, lineHeight: 1 }}
                className={`w-full pr-12 pl-3 h-14 text-right rounded-xl border border-border bg-card shadow-sm outline-none transition-all duration-300 ${
                  isDiscount
                    ? 'text-red-500 dark:text-red-400 focus:ring-2 focus:ring-red-400'
                    : isMarkup
                    ? 'text-emerald-500 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-400'
                    : 'text-blue-500 dark:text-blue-400 focus:ring-2 focus:ring-blue-400'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                step="0.01"
                min="0"
                readOnly={disabled}
                disabled={disabled}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none transition-colors duration-300 ${
                isDiscount ? 'text-red-400 dark:text-red-500' : isMarkup ? 'text-emerald-400 dark:text-emerald-500' : 'text-blue-400 dark:text-blue-500'
              }`}>
                zł
              </span>
            </div>
          ) : (
            <div className={`flex items-center justify-end h-14 px-4 rounded-xl border border-border bg-card shadow-sm gap-1.5 transition-all duration-300 ${
              isDiscount
                ? 'text-red-500 dark:text-red-400'
                : isMarkup
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-blue-500 dark:text-blue-400'
            } ${disabled ? 'opacity-50' : ''}`}
              style={{ fontSize: '1.575rem', fontWeight: 900, lineHeight: 1 }}
            >
              <BlurredPrice value={targetPrice} isPro={isPro} />
              <span className={`text-sm font-semibold transition-colors duration-300 ${
                isDiscount ? 'text-red-400' : isMarkup ? 'text-emerald-400' : 'text-blue-400'
              }`}>zł</span>
            </div>
          )}
        </div>
      </div>

      {/* Adjustment Amount - fixed height to prevent slider jumping */}
      <div className={`flex items-center justify-end gap-2 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
        isNeutral
          ? 'opacity-0 pointer-events-none'
          : isDiscount
          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      }`}>
        <span>{isDiscount ? "Rabat:" : "Marża:"}</span>
        <span className="font-bold">
          {isDiscount ? "-" : "+"}{Math.abs(targetPrice - safeBasePrice).toFixed(2)} zł
        </span>
      </div>
    </div>
  );
}
