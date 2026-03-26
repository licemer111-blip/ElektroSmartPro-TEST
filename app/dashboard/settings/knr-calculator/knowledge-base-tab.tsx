"use client";

import { KBFilesSection } from "./_parts/KBFilesSection";
import { SystemDictionaryBrowser } from "./_parts/SystemDictionaryBrowser";
import { GuideCard } from "./_parts/GuideCard";
import { InvestmentContextPopup } from "@/components/knr/InvestmentContextPopup";

export function KnowledgeBaseTab() {
  return (
    <div className="space-y-5">
      <KBFilesSection />
      <SystemDictionaryBrowser />
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <GuideCard />
        </div>
        <div className="flex-shrink-0">
          <InvestmentContextPopup />
        </div>
      </div>
    </div>
  );
}
