"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PDFDemoModal } from "@/components/landing/pdf-demo-modal";

export function PDFDemoButton() {
  const [showPDFDemo, setShowPDFDemo] = useState(false);

  return (
    <>
      <Button 
        size="lg" 
        variant="outline"
        className="h-14 px-8 text-lg border-2 border-slate-300 text-foreground hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
        onClick={() => setShowPDFDemo(true)}
      >
        Zobacz Przykładowy PDF
      </Button>
      
      <PDFDemoModal open={showPDFDemo} onOpenChange={setShowPDFDemo} />
    </>
  );
}
