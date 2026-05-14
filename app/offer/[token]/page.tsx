import type { Metadata } from "next";
import { getOfferByToken } from "./actions";
import { ClientPortalView } from "./client-portal-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { offer, error } = await getOfferByToken(token);

  if (error || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {error || "Nie znaleziono oferty"}
          </h1>
          <p className="text-sm text-slate-500">
            Sprawdź poprawność linku lub skontaktuj się z wykonawcą.
          </p>
        </div>
      </div>
    );
  }

  return <ClientPortalView offer={offer} token={token} />;
}
