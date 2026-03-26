"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Loader2, Building2, Hash, MapPin, Phone, Mail, Image, Upload, X, CreditCard, FileText, Clock, BookOpen } from "lucide-react";
import { updateProfile, uploadLogo } from "./actions";
import { resetOnboarding } from "@/app/dashboard/onboarding/actions";
import type { Profile } from "@/lib/types/database";

interface SettingsFormProps {
  initialProfile: Profile | null;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: initialProfile?.company_name || "",
    nip: initialProfile?.nip || "",
    regon: initialProfile?.regon || "",
    address: initialProfile?.address || "",
    street: initialProfile?.street || "",
    city: initialProfile?.city || "",
    postal_code: initialProfile?.postal_code || "",
    phone: initialProfile?.phone || "",
    email: initialProfile?.email || "",
    bank_account: initialProfile?.bank_account || "",
    logo_url: initialProfile?.logo_url || "",
    hourly_rate: initialProfile?.hourly_rate?.toString() || "0",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Nieprawidłowy plik",
        description: "Proszę wybrać plik obrazu (PNG, JPG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Plik za duży",
        description: "Maksymalny rozmiar pliku to 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadLogo(file);

      if (result.success && result.url) {
        setFormData({ ...formData, logo_url: result.url });
        toast({
          title: "Sukces!",
          description: "Logo zostało przesłane",
        });
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Błąd przesyłania logo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Błąd",
        description: "Nieoczekiwany błąd podczas przesyłania",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateProfile({
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) || undefined : undefined,
      });

      if (result.success) {
        toast({
          title: "Sukces!",
          description: "Ustawienia zapisane pomyślnie!",
        });
        router.refresh();
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Błąd zapisu ustawień",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Błąd",
        description: "Nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Company Information Card */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Informacje o Firmie
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Te dane będą widoczne na kosztorysach i dokumentach PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-sm">
              Nazwa Firmy
              <span className="text-muted-foreground ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:inline">(wyświetlana w nagłówku PDF)</span>
            </Label>
            <Input
              id="company_name"
              name="company_name"
              autoComplete="organization"
              placeholder="np. Elektro-Instal Sp. z o.o."
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* NIP & REGON (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NIP */}
            <div className="space-y-2">
              <Label htmlFor="nip" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                NIP
              </Label>
              <Input
                id="nip"
                name="nip"
                autoComplete="off"
                placeholder="np. 123-456-78-90"
                value={formData.nip}
                onChange={(e) => handleChange("nip", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* REGON */}
            <div className="space-y-2">
              <Label htmlFor="regon" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                REGON
                <span className="text-muted-foreground text-xs">(opcjonalnie)</span>
              </Label>
              <Input
                id="regon"
                name="regon"
                autoComplete="off"
                placeholder="np. 123456789"
                value={formData.regon}
                onChange={(e) => handleChange("regon", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Structured Address */}
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              Adres firmy
            </p>

            {/* Street + house number */}
            <div className="space-y-2">
              <Label htmlFor="street" className="flex items-center gap-2">
                Ulica + nr domu
              </Label>
              <Input
                id="street"
                name="street"
                autoComplete="street-address"
                placeholder="np. ul. Marszałkowska 15/2"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Postal code + City — one row */}
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Kod pocztowy</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  autoComplete="postal-code"
                  placeholder="00-000"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Miasto</Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="np. Warszawa"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Bank Account + Hourly Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bank_account" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Numer konta bankowego
                <span className="text-muted-foreground text-xs">(opcjonalnie)</span>
              </Label>
              <Input
                id="bank_account"
                name="bank_account"
                autoComplete="off"
                placeholder="np. 12 3456 7890 1234 5678 9012 3456"
                value={formData.bank_account}
                onChange={(e) => handleChange("bank_account", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hourly_rate" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Domyślna stawka rbh (zł/rbh)
                <span className="text-muted-foreground text-xs ml-2">(kopiowana do nowych projektów)</span>
              </Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                autoComplete="off"
                type="number"
                min="0"
                step="5"
                placeholder="np. 120"
                value={formData.hourly_rate}
                onChange={(e) => handleChange("hourly_rate", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Phone & Email (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="phone"
                name="phone"
                autoComplete="tel"
                placeholder="np. +48 123 456 789"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Firmowy
                <span className="text-muted-foreground text-xs">(opcjonalnie)</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="np. kontakt@firma.pl"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Card */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Image className="h-4 w-4 sm:h-5 sm:w-5" />
            Logo Firmy
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Prześlij logo, które będzie widoczne w lewym górnym rogu dokumentów PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* File Upload */}
          {!formData.logo_url ? (
            <div className="space-y-2">
              <Label htmlFor="logo_file">
                Prześlij Logo
                <span className="text-muted-foreground ml-2 text-sm">(opcjonalne)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading || isLoading}
                  onClick={() => document.getElementById("logo_file")?.click()}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Przesyłanie...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Wybierz plik
                    </>
                  )}
                </Button>
                <input
                  id="logo_file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading || isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formaty: PNG, JPG, WEBP. Maksymalny rozmiar: 2MB. Zalecany rozmiar: 200×80px.
              </p>
            </div>
          ) : (
            /* Logo Preview */
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Aktualne logo:</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isLoading}
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Usuń
                </Button>
              </div>
              <div className="bg-muted rounded p-4 flex items-center justify-center min-h-[100px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="max-h-[80px] max-w-[200px] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    toast({
                      title: "Błąd ładowania logo",
                      description: "Nie można załadować logo.",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="flex gap-2.5 sm:gap-3">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Jak to działa?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Nazwa firmy zastąpi &quot;ELEKTROSMART PRO&quot; w nagłówku PDF</li>
                <li>Logo wyświetli się w lewym górnym rogu</li>
                <li>NIP i dane kontaktowe pojawią się w stopce</li>
                <li>Możesz edytować te dane w dowolnym momencie</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Tour Reset */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2 pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <CardTitle className="text-sm font-semibold">Przewodnik po aplikacji</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Interaktywny tour po najważniejszych funkcjach ElektroSmart PRO.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const result = await resetOnboarding();
              if (!result.error) {
                sessionStorage.removeItem("onboarding_dismissed");
                window.location.reload();
              }
            }}
            className="gap-2 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Pokaż przewodnik ponownie
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            Tour uruchomi się automatycznie po przeładowaniu strony.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Anuluj
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            "Zapisz Ustawienia"
          )}
        </Button>
      </div>
    </form>
  );
}
