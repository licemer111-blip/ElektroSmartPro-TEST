"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getOfferByToken, reviewProposal } from "@/app/offer/[token]/actions";
import type { ProposedChanges, OfferData } from "@/app/offer/[token]/actions";

interface NegotiationReviewDialogProps {
  offerId: string;
  token: string;
  clientName: string;
  projectName: string;
  autoOpen?: boolean;
  onClose?: () => void;
}

export function NegotiationReviewDialog({
  offerId,
  token,
  clientName,
  projectName,
  autoOpen = false,
  onClose,
}: NegotiationReviewDialogProps) {
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open && !offerData) {
      setFetching(true);
      getOfferByToken(token).then(({ offer }) => {
        if (offer) setOfferData(offer);
        setFetching(false);
      });
    }
  }, [open, token, offerData]);

  const proposedChanges = offerData?.proposedChanges;
  const items = offerData?.items || [];
  const changedItemIds = proposedChanges ? Object.keys(proposedChanges.items) : [];
  const changedItems = items.filter(i => changedItemIds.includes(i.id));

  const formatPrice = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

  const handleAction = async (action: "accept" | "reject" | "counter") => {
    setLoading(true);
    const result = await reviewProposal(offerId, action, undefined, comment || undefined);
    if (result.success) {
      toast({
        title: action === "accept" ? "Zmiany zaakceptowane" : action === "reject" ? "Zmiany odrzucone" : "Kontr-oferta wysłana",
        description: action === "accept"
          ? "Ceny zostały zaktualizowane w kosztorysie"
          : action === "reject"
          ? "Klient zostanie poinformowany o odrzuceniu"
          : "Klient zobaczy Twoją nową propozycję",
      });
      setOpen(false);
      router.refresh();
    } else {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  // Calculate totals
  const originalTotal = items.reduce((sum, i) => sum + i.materialPrice + i.laborPrice, 0);
  const proposedTotal = proposedChanges
    ? items.reduce((sum, i) => {
        const edits = proposedChanges.items[i.id];
        const mat = edits?.materialPrice ?? i.materialPrice;
        const lab = edits?.laborPrice ?? i.laborPrice;
        return sum + mat + lab;
      }, 0)
    : originalTotal;
  const diff = proposedTotal - originalTotal;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && onClose) onClose(); }}>
      {!autoOpen && (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ArrowLeftRight className="w-3 h-3" />
            Propozycja klienta
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight className="w-5 h-5 text-orange-600" />
            Propozycja korekty
          </DialogTitle>
          <DialogDescription className="sr-only">
            Przegląd propozycji zmian złożonych przez klienta.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : !proposedChanges ? (
          <p className="text-sm text-slate-500 text-center py-4">Brak danych propozycji</p>
        ) : (
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-xs text-orange-700 dark:text-orange-300">
              <strong>{clientName}</strong> zaproponował(a) zmiany w ofercie dla projektu <strong>{projectName}</strong>
            </p>
            {proposedChanges.comment && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                &ldquo;{proposedChanges.comment}&rdquo;
              </p>
            )}
            <p className="text-[10px] text-orange-500 mt-1">
              {new Date(proposedChanges.submittedAt).toLocaleString("pl-PL")}
            </p>
          </div>

          {/* Diff table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Pozycja</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-500">Oryginał</th>
                  <th className="px-1 py-2 text-center w-6"></th>
                  <th className="px-2 py-2 text-right font-semibold text-orange-600">Propozycja</th>
                </tr>
              </thead>
              <tbody>
                {changedItems.map(item => {
                  const edits = proposedChanges.items[item.id];
                  if (!edits) return null;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 space-x-2">
                          {edits.quantity !== undefined && (
                            <span>Ilość: {item.quantity} → <strong className="text-orange-600">{edits.quantity}</strong></span>
                          )}
                          {edits.materialPrice !== undefined && (
                            <span>Mat: {formatPrice(item.materialPrice)} → <strong className="text-orange-600">{formatPrice(edits.materialPrice)}</strong></span>
                          )}
                          {edits.laborPrice !== undefined && (
                            <span>Rob: {formatPrice(item.laborPrice)} → <strong className="text-orange-600">{formatPrice(edits.laborPrice)}</strong></span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right text-slate-500 whitespace-nowrap">
                        {formatPrice(item.materialPrice + item.laborPrice)}
                      </td>
                      <td className="px-1 py-2 text-center">
                        <ArrowRight className="w-3 h-3 text-slate-400 mx-auto" />
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-orange-600 whitespace-nowrap">
                        {formatPrice((edits.materialPrice ?? item.materialPrice) + (edits.laborPrice ?? item.laborPrice))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals diff */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">Zmiana łączna:</div>
              <div className={`text-sm font-bold ${diff < 0 ? "text-red-600" : diff > 0 ? "text-green-600" : "text-slate-600"}`}>
                {diff > 0 ? "+" : ""}{formatPrice(diff)}
                <span className="text-[10px] text-slate-400 ml-1">
                  ({formatPrice(originalTotal)} → {formatPrice(proposedTotal)})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Comment */}
          <div>
            <label htmlFor="negotiation-comment" className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
              Komentarz (opcjonalnie)
            </label>
            <Textarea
              id="negotiation-comment"
              name="negotiation-comment"
              aria-label="Komentarz do propozycji"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Twoja odpowiedź do klienta..."
              className="min-h-[60px] text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => handleAction("accept")}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Akceptuj zmiany
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => handleAction("reject")}
              disabled={loading}
            >
              <XCircle className="w-4 h-4" />
              Odrzuć zmiany
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
