"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateClientData } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useRouter } from "next/navigation";

interface ClientDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialName?: string | null;
  initialAddress?: string | null;
  initialNip?: string | null;
}

export function ClientDataDialog({
  open,
  onOpenChange,
  projectId,
  initialName,
  initialAddress,
  initialNip,
}: ClientDataDialogProps) {
  const [clientName, setClientName] = useState(initialName || "");
  const [clientAddress, setClientAddress] = useState(initialAddress || "");
  const [clientNip, setClientNip] = useState(initialNip || "");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    setIsPending(true);
    try {
      const result = await updateClientData(projectId, {
        client_name: clientName || null,
        client_address: clientAddress || null,
        client_nip: clientNip || null,
      });
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Sukces!", description: "Dane klienta zostały zaktualizowane" });
        onOpenChange(false);
        notifyDataChanged("client-changed");
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dane Inwestora / Klienta</DialogTitle>
          <DialogDescription>Dane będą widoczne w wygenerowanym PDF kosztorysu</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Imię i Nazwisko / Nazwa Firmy</Label>
            <Input
              id="client-name"
              name="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="np. Jan Kowalski lub Firma XYZ Sp. z o.o."
              disabled={isPending}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">Adres Klienta</Label>
            <Input
              id="client-address"
              name="client-address"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="np. ul. Kwiatowa 15, 00-001 Warszawa"
              disabled={isPending}
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-nip">NIP Klienta</Label>
            <Input
              id="client-nip"
              name="client-nip"
              value={clientNip}
              onChange={(e) => setClientNip(e.target.value)}
              placeholder="np. 123-456-78-90"
              disabled={isPending}
              maxLength={20}
            />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Te dane pojawią się w nagłówku PDF kosztorysu. Możesz je wypełnić teraz lub później.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
