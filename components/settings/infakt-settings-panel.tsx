"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, ExternalLink, CheckCircle, AlertCircle, Key } from "lucide-react";
import { updateInFaktAPIKey } from "@/app/dashboard/settings/actions";
import { useToast } from "@/hooks/use-toast";

interface InFaktSettingsPanelProps {
  initialApiKey?: string | null;
}

export function InFaktSettingsPanel({ initialApiKey }: InFaktSettingsPanelProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const hasKey = !!initialApiKey;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Błąd",
        description: "Klucz API nie może być pusty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateInFaktAPIKey(apiKey);
      
      if (result.error) {
        toast({
          title: "Błąd",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sukces!",
          description: "Klucz API InFakt zapisany pomyślnie",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas zapisywania",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasKey ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
              {hasKey ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <CardTitle>Status integracji InFakt</CardTitle>
              <CardDescription>
                {hasKey ? "✅ Klucz API skonfigurowany" : "⚠️ Klucz API nieskonfigurowany"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          <div className="space-y-2">
            <p className="font-semibold">Jak to działa?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Każdy użytkownik podłącza <strong>swój własny</strong> klucz API InFakt</li>
              <li>Faktury są wystawiane w <strong>Twoim</strong> koncie InFakt</li>
              <li>Twoje dane księgowe pozostają <strong>prywatne</strong></li>
              <li>Aplikacja tylko łączy się z InFakt używając Twojego klucza</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* API Key Configuration Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Klucz API InFakt</CardTitle>
              <CardDescription>
                Wprowadź swój klucz API z konta InFakt
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="infakt-api-key">Klucz API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="infakt-api-key"
                  name="infakt-api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Wklej swój klucz API InFakt..."
                  className="pr-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-xs"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? "Ukryj" : "Pokaż"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Klucz API znajdziesz w InFakt: Ustawienia → API → Klucz API
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isLoading || !apiKey.trim()}
            className="w-full"
          >
            {isLoading ? "Zapisywanie..." : "Zapisz klucz API"}
          </Button>
        </CardContent>
      </Card>

      {/* How to get API Key */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Jak uzyskać klucz API InFakt?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">1.</span>
              <p>Zaloguj się do swojego konta <strong>InFakt</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">2.</span>
              <p>Przejdź do <strong>Ustawienia → API</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">3.</span>
              <p>Skopiuj <strong>Klucz API</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">4.</span>
              <p>Wklej go powyżej i zapisz</p>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
            onClick={() => window.open("https://www.infakt.pl", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Otwórz InFakt.pl
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Po zalogowaniu przejdź do: <strong>Ustawienia → API → Klucz API</strong>
          </p>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
          <p className="font-semibold mb-1">🔒 Bezpieczeństwo</p>
          <p className="text-amber-700 dark:text-amber-300">
            Twój klucz API jest przechowywany bezpiecznie w bazie danych i używany tylko do komunikacji z InFakt.
            Nigdy nie udostępniamy Twojego klucza osobom trzecim.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
