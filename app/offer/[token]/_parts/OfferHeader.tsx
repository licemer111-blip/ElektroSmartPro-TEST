"use client";

// ═══════════════════════════════════════════════════════════════════
// _parts/OfferHeader.tsx — Contractor branding, tab navigation
// ═══════════════════════════════════════════════════════════════════

import Image from "next/image";
import {
  Phone, Mail, FileText, FolderOpen, Camera, Building2,
  Zap, Sun, Moon,
} from "lucide-react";
import type { OfferData } from "../actions";

type PortalTab = "kosztorys" | "dokumenty" | "portfolio" | "wykonawca";

interface OfferHeaderProps {
  offer: OfferData;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function OfferHeader({ offer, activeTab, onTabChange, isDark, onToggleTheme }: OfferHeaderProps) {
  const hasDocuments = offer.documents.length > 0;
  const hasPortfolio = offer.portfolioItems.length > 0;

  const tabs: { id: PortalTab; label: string; icon: React.ReactNode; count?: number; show: boolean }[] = [
    { id: "kosztorys", label: "Kosztorys",  icon: <FileText className="w-3.5 h-3.5" />,  show: true },
    { id: "dokumenty", label: "Dokumenty",  icon: <FolderOpen className="w-3.5 h-3.5" />, count: offer.documents.length,     show: hasDocuments },
    { id: "portfolio", label: "Portfolio",  icon: <Camera className="w-3.5 h-3.5" />,    count: offer.portfolioItems.length,  show: hasPortfolio },
    { id: "wykonawca", label: "Wykonawca",  icon: <Building2 className="w-3.5 h-3.5" />, show: true },
  ];

  return (
    <>
      {/* Contractor hero banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                {offer.ownerLogo ? (
                  <Image
                    src={offer.ownerLogo}
                    alt=""
                    width={56}
                    height={56}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-blue-700">
                    {(offer.ownerCompany || offer.ownerName || "E")?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">
                  {offer.ownerCompany || offer.ownerName || "Wykonawca"}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-blue-100">
                  {offer.ownerPhone && (
                    <a href={`tel:${offer.ownerPhone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                      <Phone className="w-3 h-3" />
                      {offer.ownerPhone}
                    </a>
                  )}
                  {offer.ownerEmail && (
                    <a href={`mailto:${offer.ownerEmail}`} className="flex items-center gap-1 hover:text-white transition-colors">
                      <Mail className="w-3 h-3" />
                      {offer.ownerEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                aria-label={isDark ? "Tryb jasny" : "Tryb ciemny"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="hidden sm:flex items-center gap-1 opacity-70">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span className="text-[10px] font-semibold tracking-wide">ElektroSmart PRO</span>
              </div>
            </div>
          </div>

          {/* Offer title bar */}
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">Oferta kosztorysowa</h2>
              <p className="text-blue-200 text-xs">{offer.projectName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky tab nav */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 overflow-x-auto -mb-px">
            {tabs.filter((t) => t.show).map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-1.5 py-0 text-[10px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
