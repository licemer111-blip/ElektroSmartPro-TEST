"use client";

// ═══════════════════════════════════════════════════════════════════
// hooks/useOfferPortal.ts — Business logic for the client offer portal
// Handles: theme, negotiation edits, proposal submission,
//          offer accept/reject, and e-signature save.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { respondToOffer, saveSignature, submitProposal } from "../app/offer/[token]/actions";
import type { OfferData, ProposedItemChange } from "../app/offer/[token]/actions";

export type OfferStatus = string;

export interface UseOfferPortalReturn {
  // Status
  status: OfferStatus;
  isResponded: boolean;
  isNegotiating: boolean;
  canEdit: boolean;

  // Global message feedback
  message: { type: "success" | "error"; text: string } | null;
  setMessage: (m: { type: "success" | "error"; text: string } | null) => void;

  // Loading
  loading: boolean;

  // Dark mode
  isDark: boolean;
  toggleTheme: () => void;

  // Negotiation / edit mode
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  proposedEdits: Record<string, ProposedItemChange>;
  setProposedEdits: React.Dispatch<React.SetStateAction<Record<string, ProposedItemChange>>>;
  hasEdits: boolean;
  proposalComment: string;
  setProposalComment: (v: string) => void;
  submittingProposal: boolean;
  proposalStatus: { type: "success" | "error"; text: string } | null;
  handleEditChange: (itemId: string, field: keyof ProposedItemChange, value: number) => void;
  handleSubmitProposal: () => Promise<void>;

  // Comment for accept/reject
  comment: string;
  setComment: (v: string) => void;
  handleRespond: (action: "accepted" | "rejected") => Promise<void>;

  // Signature modal
  showSignature: boolean;
  setShowSignature: (v: boolean) => void;
  handleSignature: (dataUrl: string) => Promise<void>;

  // Computed totals (respecting proposed edits)
  formatPrice: (v: number) => string;
  getItemValues: (item: OfferData["items"][0]) => { qty: number; mat: number; lab: number; total: number };
  totalMaterials: number;
  totalLabor: number;
  proposedTotalAmount: number;
  totalBrutto: number;
  showMaterialColumn: boolean;
}

export function useOfferPortal(offer: OfferData, token: string): UseOfferPortalReturn {
  const [status, setStatus] = useState<OfferStatus>(offer.status);
  const [comment, setComment] = useState(offer.clientComment || "");
  const [showSignature, setShowSignature] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDark, setIsDark] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [proposedEdits, setProposedEdits] = useState<Record<string, ProposedItemChange>>({});
  const [proposalComment, setProposalComment] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Theme ──────────────────────────────────────────────────────

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("portal-theme");
    const shouldDark = saved ? saved === "dark" : prefersDark;
    setIsDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("portal-theme", next ? "dark" : "light");
  };

  // ── Derived state ─────────────────────────────────────────────

  const isResponded = status === "accepted" || status === "rejected";
  const isNegotiating = status === "negotiating";
  const canEdit = !isResponded && !isNegotiating && !offer.isDemo;
  const hasEdits = Object.keys(proposedEdits).length > 0;
  const showMaterialColumn = !offer.materialsOwnedByCustomer;

  // ── Price formatter ───────────────────────────────────────────

  const formatPrice = (v: number) =>
    offer.isDemo
      ? "*** zł"
      : new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

  // ── Item value resolver (merges proposed edits) ──────────────

  const getItemValues = (item: OfferData["items"][0]) => {
    const edits = proposedEdits[item.id];
    const qty = edits?.quantity ?? item.quantity;
    const mat = edits?.materialPrice ?? item.materialPrice;
    const lab = edits?.laborPrice ?? item.laborPrice;
    return { qty, mat, lab, total: mat + lab };
  };

  // ── Computed totals ───────────────────────────────────────────

  const proposedTotalAmount =
    editMode || hasEdits
      ? offer.items
          .filter((i) => !i.isAssemblyChild)
          .reduce((sum, item) => sum + getItemValues(item).total, 0)
      : offer.totalAmount;

  const totalMaterials =
    editMode || hasEdits
      ? offer.items.filter((i) => !i.isAssemblyChild).reduce((sum, item) => sum + getItemValues(item).mat, 0)
      : offer.items.reduce((sum, i) => sum + i.materialPrice, 0);

  const totalLabor =
    editMode || hasEdits
      ? offer.items.filter((i) => !i.isAssemblyChild).reduce((sum, item) => sum + getItemValues(item).lab, 0)
      : offer.items.reduce((sum, i) => sum + i.laborPrice, 0);

  // Gross = Net_labor*(1+VAT_L) + Net_mat*(1+VAT_M)
  // Simplified: single vatRate applies to full netto
  const totalBrutto = (editMode || hasEdits ? proposedTotalAmount : offer.totalAmount) * (1 + offer.vatRate / 100);

  // ── Negotiation handlers ──────────────────────────────────────

  const handleEditChange = (itemId: string, field: keyof ProposedItemChange, value: number) => {
    setProposedEdits((prev) => {
      const existing = prev[itemId] || {};
      const original = offer.items.find((i) => i.id === itemId);
      if (!original) return prev;

      const originalValue =
        field === "quantity"
          ? original.quantity
          : field === "materialPrice"
          ? original.materialPrice
          : original.laborPrice;

      if (Math.abs(value - originalValue) < 0.01) {
        const { [field]: _removed, ...rest } = existing as Record<string, number>;
        if (Object.keys(rest).length === 0) {
          const { [itemId]: _removedItem, ...restItems } = prev;
          return restItems;
        }
        return { ...prev, [itemId]: rest as ProposedItemChange };
      }

      return { ...prev, [itemId]: { ...existing, [field]: value } };
    });
  };

  const handleSubmitProposal = async () => {
    if (!hasEdits) return;
    setSubmittingProposal(true);
    setProposalStatus(null);
    try {
      const result = await submitProposal(token, proposedEdits, proposalComment || undefined);
      if (result.success) {
        setStatus("negotiating");
        setEditMode(false);
        setProposedEdits({});
        setProposalStatus({ type: "success", text: "✅ Propozycja wysłana! Wykonawca otrzymał powiadomienie." });
        setMessage({ type: "success", text: "Propozycja korekty została wysłana do wykonawcy!" });
      } else {
        setProposalStatus({ type: "error", text: result.error || "Błąd wysyłania propozycji" });
      }
    } catch {
      setProposalStatus({ type: "error", text: "Błąd połączenia z serwerem. Spróbuj ponownie." });
    }
    setSubmittingProposal(false);
  };

  // ── Accept / Reject ───────────────────────────────────────────

  const handleRespond = async (action: "accepted" | "rejected") => {
    setLoading(true);
    setMessage(null);
    const result = await respondToOffer(token, action, comment);
    if (result.success) {
      setStatus(action);
      setMessage({
        type: "success",
        text: action === "accepted" ? "Oferta została zaakceptowana!" : "Oferta została odrzucona.",
      });
    } else {
      setMessage({ type: "error", text: result.error || "Wystąpił błąd" });
    }
    setLoading(false);
  };

  // ── E-Signature ───────────────────────────────────────────────

  const handleSignature = async (dataUrl: string) => {
    setLoading(true);
    const result = await saveSignature(token, dataUrl);
    if (result.success) {
      setStatus("accepted");
      setShowSignature(false);
      setMessage({ type: "success", text: "Podpis zapisany — oferta zaakceptowana!" });
    } else {
      setMessage({ type: "error", text: result.error || "Błąd zapisu podpisu" });
    }
    setLoading(false);
  };

  return {
    status,
    isResponded,
    isNegotiating,
    canEdit,
    message,
    setMessage,
    loading,
    isDark,
    toggleTheme,
    editMode,
    setEditMode,
    proposedEdits,
    setProposedEdits,
    hasEdits,
    proposalComment,
    setProposalComment,
    submittingProposal,
    proposalStatus,
    handleEditChange,
    handleSubmitProposal,
    comment,
    setComment,
    handleRespond,
    showSignature,
    setShowSignature,
    handleSignature,
    formatPrice,
    getItemValues,
    totalMaterials,
    totalLabor,
    proposedTotalAmount,
    totalBrutto,
    showMaterialColumn,
  };
}
