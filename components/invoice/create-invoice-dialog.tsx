"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2, AlertCircle, CheckCircle, Settings, ExternalLink, Key, Info } from "lucide-react";
import { createProjectInvoice, getNextInvoiceNumber } from "@/app/dashboard/invoices/actions";
import Link from "next/link";

interface CreateInvoiceDialogProps {
  projectId: string;
  projectName: string;
  disabled?: boolean;
  userHasInFaktKey?: boolean;
}

export function CreateInvoiceDialog({ projectId, projectName, disabled = false, userHasInFaktKey = false }: CreateInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string | null>(null);
  const [loadingNumber, setLoadingNumber] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    clientNip: "",
    clientAddress: "",
    clientCity: "",
    clientPostalCode: "",
    clientEmail: "",
    paymentDays: "14",
    paymentMethod: "transfer",
    notes: "",
    vatRate: "23",
  });

  // Load next invoice number when dialog opens
  useEffect(() => {
    if (open && userHasInFaktKey) {
      setLoadingNumber(true);
      getNextInvoiceNumber()
        .then((result) => {
          if (result.success && result.number) {
            setNextInvoiceNumber(result.number);
          }
        })
        .catch((err) => {
          console.error("Error loading invoice number:", err);
        })
        .finally(() => {
          setLoadingNumber(false);
        });
    }
  }, [open, userHasInFaktKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createProjectInvoice({
        projectId,
        clientName: formData.clientName,
        clientNip: formData.clientNip || undefined,
        clientAddress: formData.clientAddress || undefined,
        clientCity: formData.clientCity || undefined,
        clientPostalCode: formData.clientPostalCode || undefined,
        clientEmail: formData.clientEmail || undefined,
        paymentDays: parseInt(formData.paymentDays),
        paymentMethod: formData.paymentMethod as "transfer" | "cash" | "card",
        notes: formData.notes || undefined,
        vatRate: parseInt(formData.vatRate),
        status: saveAsDraft ? "draft" : "sent",
      });

      if (result.success) {
        setSuccess(
          saveAsDraft
            ? `Szkic faktury ${result.invoiceNumber} został zapisany!`
            : `Faktura ${result.invoiceNumber} została utworzona i wysłana!`
        );
        setTimeout(() => {
          setOpen(false);
          router.refresh();
          router.push("/dashboard/invoices");
        }, 2000);
      } else {
        setError(result.error || "Nie udało się utworzyć faktury");
      }
    } catch (err) {
      setError("Wystąpił nieoczekiwany błąd");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 flex-shrink-0 rounded-md bg-blue-600 text-white hover:bg-blue-700 border-transparent disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={disabled}
          title={disabled ? "Zapisz projekt jako finalny, aby wystawić fakturę" : "Wystaw fakturę VAT"}
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Wystaw fakturę</span>
          <span className="sm:hidden">Faktura</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wystaw fakturę VAT</DialogTitle>
          <DialogDescription>
            Projekt: <span className="font-semibold">{projectName}</span>
          </DialogDescription>
        </DialogHeader>

        {!userHasInFaktKey ? (
          // Show information about connecting InFakt API
          <div className="space-y-4 py-4">
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-2">🔑 Wymagana konfiguracja InFakt</p>
                <p className="text-amber-700 dark:text-amber-300 mb-3">
                  Aby wystawiać faktury, musisz najpierw podłączyć swój klucz API InFakt.
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                <div className="space-y-2">
                  <p className="font-semibold">Jak to działa?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                    <li>Używasz <strong>swojego własnego</strong> konta InFakt</li>
                    <li>Faktury są wystawiane w <strong>Twoim</strong> imieniu</li>
                    <li>Twoje dane księgowe pozostają <strong>prywatne</strong></li>
                    <li>Aplikacja tylko łączy się z InFakt używając Twojego klucza</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Kroki do wykonania:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">1.</span>
                  <p>Przejdź do <strong>Ustawień → Faktury</strong></p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">2.</span>
                  <p>Wpisz swój klucz API InFakt</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">3.</span>
                  <p>Zapisz i wróć tutaj</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                className="flex-1 gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/settings?tab=invoicing");
                }}
              >
                <Settings className="h-4 w-4" />
                Przejdź do Ustawień
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open("https://www.infakt.pl", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Otwórz InFakt API
              </Button>
            </div>
          </div>
        ) : (
          // Show invoice form
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Dane nabywcy</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="clientName">
                  Nazwa firmy / Imię i nazwisko <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="np. Budowlanka Sp. z o.o."
                />
              </div>

              <div>
                <Label htmlFor="clientNip">NIP</Label>
                <Input
                  id="clientNip"
                  name="clientNip"
                  value={formData.clientNip}
                  onChange={(e) => setFormData({ ...formData, clientNip: e.target.value })}
                  placeholder="np. 1234567890"
                />
              </div>

              <div>
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="np. kontakt@firma.pl"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="clientAddress">Ulica i numer</Label>
                <Input
                  id="clientAddress"
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  placeholder="np. ul. Główna 15/2"
                />
              </div>

              <div>
                <Label htmlFor="clientCity">Miasto</Label>
                <Input
                  id="clientCity"
                  name="clientCity"
                  value={formData.clientCity}
                  onChange={(e) => setFormData({ ...formData, clientCity: e.target.value })}
                  placeholder="np. Warszawa"
                />
              </div>

              <div>
                <Label htmlFor="clientPostalCode">Kod pocztowy</Label>
                <Input
                  id="clientPostalCode"
                  name="clientPostalCode"
                  value={formData.clientPostalCode}
                  onChange={(e) => setFormData({ ...formData, clientPostalCode: e.target.value })}
                  placeholder="np. 00-001"
                />
              </div>
            </div>
          </div>

          {/* Invoice Number Preview */}
          {nextInvoiceNumber && (
            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">📄 Sugerowany numer faktury</p>
                <p className="text-blue-700 dark:text-blue-300 font-mono text-lg">
                  {nextInvoiceNumber}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Numer zostanie automatycznie przypisany przez InFakt
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Invoice Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Ustawienia faktury</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vatRate">Stawka VAT (%)</Label>
                <Select
                  value={formData.vatRate}
                  onValueChange={(value) => setFormData({ ...formData, vatRate: value })}
                >
                  <SelectTrigger id="vatRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="23">23% (standardowa)</SelectItem>
                    <SelectItem value="8">8% (obniżona)</SelectItem>
                    <SelectItem value="5">5% (obniżona)</SelectItem>
                    <SelectItem value="0">0% (zwolniona)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentDays">Termin płatności (dni)</Label>
                <Select
                  value={formData.paymentDays}
                  onValueChange={(value) => setFormData({ ...formData, paymentDays: value })}
                >
                  <SelectTrigger id="paymentDays">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dni</SelectItem>
                    <SelectItem value="14">14 dni</SelectItem>
                    <SelectItem value="21">21 dni</SelectItem>
                    <SelectItem value="30">30 dni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Sposób płatności</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Przelew</SelectItem>
                    <SelectItem value="cash">Gotówka</SelectItem>
                    <SelectItem value="card">Karta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Uwagi (opcjonalnie)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dodatkowe informacje na fakturze..."
                rows={3}
              />
            </div>

            {/* Draft Mode Checkbox */}
            <div className="flex items-start space-x-2 rounded-md border p-4">
              <Checkbox
                id="saveAsDraft"
                checked={saveAsDraft}
                onCheckedChange={(checked) => setSaveAsDraft(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="saveAsDraft"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Zapisz jako szkic
                </Label>
                <p className="text-xs text-muted-foreground">
                  Faktura zostanie zapisana jako szkic i nie będzie automatycznie wysłana do klienta. 
                  Możesz ją edytować i wysłać później z InFakt.
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {saveAsDraft ? "Zapisywanie szkicu..." : "Tworzenie..."}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {saveAsDraft ? "Zapisz jako szkic" : "Wystaw i wyślij"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
