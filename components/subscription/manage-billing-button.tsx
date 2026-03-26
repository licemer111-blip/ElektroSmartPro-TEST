"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";

export function ManageBillingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      // Get current session token to pass as Bearer for Route Handler auth
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Nie udało się otworzyć panelu płatności. Spróbuj ponownie."
        );
      }

      if (!data?.url) {
        throw new Error("Otrzymano nieprawidłową odpowiedź serwera.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe portal error:", error);
      toast({
        title: "Błąd otwarcia portalu płatności",
        description: error instanceof Error
          ? error.message
          : "Nie udało się otworzyć panelu płatności. Spróbuj ponownie.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManageBilling}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      Zarządzaj płatnościami
    </Button>
  );
}
