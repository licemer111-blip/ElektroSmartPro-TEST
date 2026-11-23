"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "es_wycen_check_v1";

export function wycenCheckAccepted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberWycenCheck(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode: the notice shows again next time */
  }
}

export function WycenCheckDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sprawdź wynik</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            Wyceń tylko przyspiesza liczenie. Godzinę bierze z normy ES i mnoży przez Twoją stawkę.
            U innego elektryka ta sama praca może mieć inną godzinę, więc rbh, ilości i ceny i tak przejrzysz sam.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          To nie jest urzędowy KNR i nie jest cennik hurtowni. Materiał dopisuje się tylko z Twojego cennika.
          Następnym razem to okno się nie pojawi.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Wróć
          </Button>
          <Button type="button" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={onConfirm}>
            Rozumiem, licz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
