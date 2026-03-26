"use client";

// ═══════════════════════════════════════════════════════════════════
// client-portal-view.tsx — Shell orchestrator (~120 lines)
// All logic lives in hooks/useOfferPortal.ts
// All UI lives in _parts/
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, ArrowLeftRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { Phone, Mail, Building2, Award, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useOfferPortal } from "@/hooks/useOfferPortal";
import { OfferHeader } from "./_parts/OfferHeader";
import { OfferItemsTable } from "./_parts/OfferItemsTable";
import { OfferNegotiation } from "./_parts/OfferNegotiation";
import { OfferSignature } from "./_parts/OfferSignature";
import { DocumentsSection } from "./_parts/DocumentsSection";
import { PortfolioSection } from "./_parts/PortfolioSection";
import type { OfferData } from "./actions";

type PortalTab = "kosztorys" | "dokumenty" | "portfolio" | "wykonawca";

interface ClientPortalViewProps {
  offer: OfferData;
  token: string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "accepted":    return <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 gap-1"><CheckCircle2 className="w-3 h-3" />Zaakceptowana</Badge>;
    case "rejected":    return <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 gap-1"><XCircle className="w-3 h-3" />Odrzucona</Badge>;
    case "negotiating": return <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 gap-1"><ArrowLeftRight className="w-3 h-3" />Negocjacja</Badge>;
    case "viewed":      return <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 gap-1"><Sparkles className="w-3 h-3" />Wyswietlona</Badge>;
    default:            return <Badge variant="outline" className="gap-1 dark:text-slate-300 dark:border-slate-600">Oczekuje</Badge>;
  }
}

export function ClientPortalView({ offer, token }: ClientPortalViewProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>("kosztorys");

  const portal = useOfferPortal(offer, token);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <OfferHeader
        offer={offer}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={portal.isDark}
        onToggleTheme={portal.toggleTheme}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-5">
        {/* Demo banner */}
        {offer.isDemo && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">WERSJA DEMO</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Ceny w tej ofercie sa ukryte. Wykonawca korzysta z wersji demonstracyjnej.
            </p>
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {offer.recipientName && (
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Dla: <strong>{offer.recipientName}</strong>
              </span>
            )}
          </div>
          <StatusBadge status={portal.status} />
        </div>

        {/* Global feedback message */}
        {portal.message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${portal.message.type === "success" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
            {portal.message.text}
          </div>
        )}

        {/* ── TAB: KOSZTORYS ─────────────────────────────────── */}
        {activeTab === "kosztorys" && (
          <>
            {offer.materialsOwnedByCustomer && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Materialy po stronie klienta</span>
                <span className="text-[10px] text-green-600/70 dark:text-green-500/70">— kosztorys obejmuje tylko robocizne</span>
              </div>
            )}

            {portal.isNegotiating && (
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2.5">
                <ArrowLeftRight className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Propozycja korekty wyslana</span>
                <span className="text-[10px] text-orange-600/70 dark:text-orange-500/70">— oczekiwanie na odpowiedz wykonawcy</span>
              </div>
            )}

            {offer.contractorResponse && !portal.isNegotiating && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 border ${
                offer.contractorResponse.action === "accept" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : offer.contractorResponse.action === "reject" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              }`}>
                {offer.contractorResponse.action === "accept" ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  : offer.contractorResponse.action === "reject" ? <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  : <ArrowLeftRight className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium ${
                    offer.contractorResponse.action === "accept" ? "text-green-700 dark:text-green-400"
                    : offer.contractorResponse.action === "reject" ? "text-red-700 dark:text-red-400"
                    : "text-blue-700 dark:text-blue-400"
                  }`}>
                    {offer.contractorResponse.action === "accept" ? "Wykonawca zaakceptowal Twoje zmiany"
                      : offer.contractorResponse.action === "reject" ? "Wykonawca odrzucil proponowane zmiany"
                      : "Wykonawca zaproponowal nowa wersje — mozesz ponownie negocjowac"}
                  </span>
                  {offer.contractorResponse.comment && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      &ldquo;{offer.contractorResponse.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}

            <OfferItemsTable
              offer={offer}
              editMode={portal.editMode}
              setEditMode={portal.setEditMode}
              proposedEdits={portal.proposedEdits}
              setProposedEdits={portal.setProposedEdits}
              hasEdits={portal.hasEdits}
              formatPrice={portal.formatPrice}
              handleEditChange={portal.handleEditChange}
              totalMaterials={portal.totalMaterials}
              totalLabor={portal.totalLabor}
              proposedTotalAmount={portal.proposedTotalAmount}
              totalBrutto={portal.totalBrutto}
              showMaterialColumn={portal.showMaterialColumn}
            />

            <OfferNegotiation
              isNegotiating={portal.isNegotiating}
              isResponded={portal.isResponded}
              status={portal.status}
              editMode={portal.editMode}
              hasEdits={portal.hasEdits}
              proposedEdits={portal.proposedEdits}
              proposalComment={portal.proposalComment}
              setProposalComment={portal.setProposalComment}
              submittingProposal={portal.submittingProposal}
              proposalStatus={portal.proposalStatus}
              handleSubmitProposal={portal.handleSubmitProposal}
              comment={portal.comment}
              setComment={portal.setComment}
              loading={portal.loading}
              handleRespond={portal.handleRespond}
              onShowSignature={() => portal.setShowSignature(true)}
              setEditMode={portal.setEditMode}
              canEdit={portal.canEdit}
              signatureUrl={offer.signatureUrl}
              clientComment={offer.clientComment}
              contractorResponse={offer.contractorResponse}
              isDemo={offer.isDemo}
            />
          </>
        )}

        {/* ── TAB: DOKUMENTY ─────────────────────────────────── */}
        {activeTab === "dokumenty" && offer.documents.length > 0 && (
          <DocumentsSection documents={offer.documents} token={token} />
        )}

        {/* ── TAB: PORTFOLIO ─────────────────────────────────── */}
        {activeTab === "portfolio" && offer.portfolioItems.length > 0 && (
          <PortfolioSection
            items={offer.portfolioItems}
            companyName={offer.ownerCompany || offer.ownerName || "Wykonawca"}
          />
        )}

        {/* ── TAB: WYKONAWCA ─────────────────────────────────── */}
        {activeTab === "wykonawca" && (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/80 overflow-hidden">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-6 sm:p-8">
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0">
                  {offer.ownerLogo ? (
                    <Image src={offer.ownerLogo} alt="" width={64} height={64} className="w-16 h-16 rounded-xl object-contain" unoptimized />
                  ) : (
                    <span className="text-3xl font-bold text-blue-700">
                      {(offer.ownerCompany || offer.ownerName || "E")?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{offer.ownerCompany || offer.ownerName || "Wykonawca"}</h2>
                  {offer.ownerCompany && offer.ownerName && (
                    <p className="text-blue-200 text-sm mt-0.5">{offer.ownerName}</p>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offer.ownerPhone && (
                  <a href={`tel:${offer.ownerPhone}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Telefon</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{offer.ownerPhone}</p>
                    </div>
                  </a>
                )}
                {offer.ownerEmail && (
                  <a href={`mailto:${offer.ownerEmail}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">E-mail</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{offer.ownerEmail}</p>
                    </div>
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
                  <Shield className="w-3.5 h-3.5" />Zweryfikowany wykonawca
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full px-3 py-1.5 text-xs font-medium">
                  <Award className="w-3.5 h-3.5" />Profesjonalne narzedzia
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1.5 text-xs font-medium">
                  <Star className="w-3.5 h-3.5" />ElektroSmart PRO
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* E-Signature modal */}
        {portal.showSignature && (
          <OfferSignature
            onSave={portal.handleSignature}
            onCancel={() => portal.setShowSignature(false)}
            loading={portal.loading}
          />
        )}

        {/* Footer */}
        <div className="text-center pb-8 pt-4">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Shield className="w-3 h-3" />
            Powered by ElektroSmart PRO
          </div>
        </div>
      </div>
    </div>
  );
}
