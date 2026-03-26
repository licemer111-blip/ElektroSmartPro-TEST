import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserProfile } from "../../actions";
import { CheckoutForm } from "@/components/subscription/checkout-form";

export const metadata: Metadata = {
  title: "Płatność",
  description: "Finalizacja płatności za subskrypcję ElektroSmart PRO",
};

// Force dynamic rendering to always get fresh is_pro status
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const profile = await getUserProfile();
  
  // If user is already PRO, redirect to subscription page
  if (profile?.is_pro) {
    redirect("/dashboard/subscription");
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Finalizuj subskrypcję PRO
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Wybierz stawkę VAT i przejdź do bezpiecznej płatności
          </p>
        </div>

        <CheckoutForm />
      </main>
    </div>
  );
}
