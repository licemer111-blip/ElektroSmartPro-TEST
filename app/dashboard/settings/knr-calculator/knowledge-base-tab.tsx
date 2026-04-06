"use client";

import { KBFilesSection } from "./_parts/KBFilesSection";
import { SystemDictionaryBrowser } from "./_parts/SystemDictionaryBrowser";
import { GuideCard } from "./_parts/GuideCard";

export function KnowledgeBaseTab() {
  return (
    <div className="space-y-5">
      <KBFilesSection />
      <SystemDictionaryBrowser />
      <GuideCard />
    </div>
  );
}
