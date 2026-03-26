"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Building2, X, Plus } from "lucide-react";
import type { Client, ClientType, ClientSource } from "@/lib/types/database";
import { createClient, updateClient } from "@/app/dashboard/clients/actions";
import { toast } from "sonner";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

const AVAILABLE_TAGS = ["vip", "regular", "problematic", "new"];

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    type: "individual" as ClientType,
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    nip: "",
    regon: "",
    notes: "",
    source: "" as ClientSource | "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        company_name: client.company_name || "",
        type: client.type || "individual",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        postal_code: client.postal_code || "",
        nip: client.nip || "",
        regon: client.regon || "",
        notes: client.notes || "",
        source: client.source || "",
        tags: client.tags || [],
      });
    } else {
      setFormData({
        name: "",
        company_name: "",
        type: "individual",
        email: "",
        phone: "",
        address: "",
        city: "",
        postal_code: "",
        nip: "",
        regon: "",
        notes: "",
        source: "",
        tags: [],
      });
    }
  }, [client, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Podaj nazwę klienta");
      return;
    }

    setSaving(true);
    try {
      if (client) {
        const result = await updateClient(client.id, {
          ...formData,
          source: formData.source || undefined,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Klient zaktualizowany");
          onOpenChange(false);
        }
      } else {
        const result = await createClient({
          ...formData,
          source: formData.source || undefined,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Klient dodany");
          onOpenChange(false);
        }
      }
    } catch (error) {
      toast.error("Wystąpił błąd");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.type === "company" ? (
              <Building2 className="w-5 h-5 text-blue-600" />
            ) : (
              <User className="w-5 h-5 text-green-600" />
            )}
            {client ? "Edytuj klienta" : "Nowy klient"}
          </DialogTitle>
          <DialogDescription>
            {client ? "Zaktualizuj dane klienta" : "Dodaj nowego klienta do bazy"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.type === "individual" ? "default" : "outline"}
              onClick={() => setFormData({ ...formData, type: "individual" })}
              className={formData.type === "individual" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <User className="w-4 h-4 mr-2" />
              Osoba prywatna
            </Button>
            <Button
              type="button"
              variant={formData.type === "company" ? "default" : "outline"}
              onClick={() => setFormData({ ...formData, type: "company" })}
              className={formData.type === "company" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Firma
            </Button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię i nazwisko / Nazwa *</Label>
              <Input
                id="name"
                name="name"
                autoComplete="off"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jan Kowalski"
              />
            </div>
            {formData.type === "company" && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Nazwa firmy</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  autoComplete="organization"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="ABC Sp. z o.o."
                />
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jan@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+48 123 456 789"
              />
            </div>
          </div>

          {/* Business Info (for companies) */}
          {formData.type === "company" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  name="nip"
                  autoComplete="off"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regon">REGON</Label>
                <Input
                  id="regon"
                  name="regon"
                  autoComplete="off"
                  value={formData.regon}
                  onChange={(e) => setFormData({ ...formData, regon: e.target.value })}
                  placeholder="123456789"
                />
              </div>
            </div>
          )}

          {/* Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                name="address"
                autoComplete="street-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ul. Przykładowa 123"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Miasto</Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Warszawa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Kod pocztowy</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  autoComplete="postal-code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="00-001"
                />
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="client-source">Źródło pozyskania</Label>
            <Select
              value={formData.source}
              name="source"
              onValueChange={(v) => setFormData({ ...formData, source: v as ClientSource })}
            >
              <SelectTrigger id="client-source">
                <SelectValue placeholder="Wybierz źródło..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="referral">Polecenie</SelectItem>
                <SelectItem value="website">Strona internetowa</SelectItem>
                <SelectItem value="cold_call">Zimny kontakt</SelectItem>
                <SelectItem value="other">Inne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium leading-none">Tagi</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    formData.tags.includes(tag) 
                      ? tag === "vip" ? "bg-amber-500" 
                        : tag === "regular" ? "bg-blue-500"
                        : tag === "problematic" ? "bg-red-500"
                        : "bg-green-500"
                      : ""
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {formData.tags.includes(tag) ? (
                    <X className="w-3 h-3 mr-1" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dodatkowe informacje o kliencie..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              client ? "Zapisz zmiany" : "Dodaj klienta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
