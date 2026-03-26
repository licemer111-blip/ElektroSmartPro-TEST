"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncInvoiceStatuses } from "@/app/dashboard/invoices/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function InvoicesSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncInvoiceStatuses();
      
      if (result.success) {
        toast({
          title: "✅ Zsynchronizowano",
          description: result.updated 
            ? `Zaktualizowano ${result.updated} faktur` 
            : "Wszystkie faktury są aktualne",
        });
        router.refresh();
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się zsynchronizować",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas synchronizacji",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Synchronizuję..." : "Synchronizuj z InFakt"}
    </Button>
  );
}
