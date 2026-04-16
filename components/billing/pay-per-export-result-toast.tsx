"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * v2.0 Pay-per-Export — post-checkout toast handler.
 *
 * Reads `?ppe=success` / `?ppe=canceled` query param written by Stripe redirect,
 * shows a toast, then scrubs the param from the URL so refreshing doesn't
 * re-trigger the toast.
 *
 * Mount once per project page. Webhook writes `paid_export_unlocked_at`
 * server-side and the page is server-rendered with the fresh project row —
 * so by the time this component reads `ppe=success`, the UnlockPdfButton
 * above it already shows the unlocked state.
 */
export function PayPerExportResultToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const ppe = searchParams.get("ppe");
    if (!ppe) return;
    shown.current = true;

    if (ppe === "success") {
      toast({
        title: "✅ Płatność przyjęta",
        description:
          "Odblokowano jednorazowy eksport czystego PDF. Kliknij „PDF”, aby go pobrać.",
      });
    } else if (ppe === "canceled") {
      toast({
        title: "Płatność anulowana",
        description: "Nie pobraliśmy żadnej opłaty. Możesz spróbować ponownie w każdej chwili.",
      });
    }

    // Scrub ?ppe from URL without adding to history.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("ppe");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, toast, router, pathname]);

  return null;
}
