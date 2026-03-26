"use client";

// ═══════════════════════════════════════════════════════════════════
// _parts/OfferNegotiation.tsx — Proposal submission panel + Accept/Reject
// ═══════════════════════════════════════════════════════════════════

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, XCircle, MessageSquare, Loader2,
  ArrowLeftRight, Send, Edit3,
} from "lucide-react";
import type { ProposedItemChange } from "../actions";

interface OfferNegotiationProps {
  isNegotiating: boolean;
  isResponded: boolean;
  status: string;
  editMode: boolean;
  hasEdits: boolean;
  proposedEdits: Record<string, ProposedItemChange>;
  proposalComment: string;
  setProposalComment: (v: string) => void;
  submittingProposal: boolean;
  proposalStatus: { type: "success" | "error"; text: string } | null;
  handleSubmitProposal: () => Promise<void>;
  comment: string;
  setComment: (v: string) => void;
  loading: boolean;
  handleRespond: (action: "accepted" | "rejected") => Promise<void>;
  onShowSignature: () => void;
  setEditMode: (v: boolean) => void;
  canEdit: boolean;
  signatureUrl?: string | null;
  clientComment?: string | null;
  contractorResponse?: {
    action: "accept" | "reject" | "counter";
    comment?: string | null;
  } | null;
  isDemo: boolean;
}

export function OfferNegotiation({
  isNegotiating,
  isResponded,
  status,
  editMode,
  hasEdits,
  proposedEdits,
  proposalComment,
  setProposalComment,
  submittingProposal,
  proposalStatus,
  handleSubmitProposal,
  comment,
  setComment,
  loading,
  handleRespond,
  onShowSignature,
  setEditMode,
  canEdit,
  signatureUrl,
  clientComment,
  contractorResponse,
  isDemo,
}: OfferNegotiationProps) {
  const editCount = Object.keys(proposedEdits).length;

  return (
    <>
      {/* Proposal submission card — visible when edits exist or edit mode active */}
      {(editMode || hasEdits) && (
        <Card
          className={`border-2 shadow-lg transition-all ${
            hasEdits && !editMode
              ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
              : hasEdits
              ? "border-green-400 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
              : "border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50"
          }`}
        >
          <CardContent className="p-5 space-y-3">
            <h3
              className={`text-sm font-semibold flex items-center gap-2 ${
                hasEdits ? "text-green-700 dark:text-green-300" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Send className="w-4 h-4" />
              {hasEdits
                ? `Wyślij propozycję (${editCount} zmian)`
                : "Zmień ceny lub ilości w tabeli powyżej"}
            </h3>
            {!hasEdits && editMode && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Kliknij w pola Rob. lub Ilość aby wprowadzić swoją propozycję cen, a potem naciśnij &quot;Zapisz zmiany&quot;.
              </p>
            )}
            <Textarea
              placeholder="Komentarz do propozycji (opcjonalnie)..."
              value={proposalComment}
              onChange={(e) => setProposalComment(e.target.value)}
              className="min-h-[60px] text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            {proposalStatus && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  proposalStatus.type === "success"
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                }`}
              >
                {proposalStatus.text}
              </div>
            )}
            <Button
              className={`w-full gap-2 h-12 text-sm font-semibold transition-all ${
                hasEdits && !editMode
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_0_16px_rgba(34,197,94,0.4)] ring-2 ring-green-400/50"
                  : hasEdits
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              }`}
              onClick={handleSubmitProposal}
              disabled={submittingProposal || !hasEdits || editMode}
            >
              {submittingProposal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {hasEdits && !editMode
                ? "✉ Wyślij propozycję do wykonawcy"
                : hasEdits
                ? "Najpierw zapisz zmiany ↑"
                : "Wprowadź zmiany aby wysłać"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action area: negotiating / pending / responded */}
      {isNegotiating ? (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/80">
          <CardContent className="p-5 text-center space-y-2">
            <ArrowLeftRight className="w-10 h-10 text-orange-500 mx-auto" />
            <h3 className="font-semibold text-orange-700 dark:text-orange-400">Propozycja wysłana</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Oczekiwanie na odpowiedź wykonawcy. Otrzymasz powiadomienie gdy wykonawca odpowie.
            </p>
          </CardContent>
        </Card>
      ) : !isResponded ? (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/80">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Twoja odpowiedź
            </h3>
            <Textarea
              placeholder="Dodaj komentarz lub pytanie (opcjonalnie)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 h-11"
                onClick={() => handleRespond("accepted")}
                disabled={loading || editMode || isDemo}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Akceptuj
              </Button>
              <Button
                className="flex-1 gap-2 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => handleRespond("rejected")}
                disabled={loading || editMode}
              >
                <XCircle className="w-4 h-4" />
                Odrzuć
              </Button>
            </div>
            {canEdit && !editMode && (
              <Button
                className="w-full gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={() => setEditMode(true)}
                disabled={loading}
              >
                <Edit3 className="w-4 h-4" />
                Zaproponuj zmiany
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/80">
          <CardContent className="p-5 text-center space-y-2">
            {status === "accepted" ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <h3 className="font-semibold text-green-700 dark:text-green-400">Oferta zaakceptowana</h3>
                {signatureUrl && (
                  <p className="text-xs text-slate-500">Podpis elektroniczny został zapisany</p>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                <h3 className="font-semibold text-red-700 dark:text-red-400">Oferta odrzucona</h3>
              </>
            )}
            {clientComment && (
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mt-3">
                &ldquo;{clientComment}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
