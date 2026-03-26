"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOfferLinkById } from "@/app/dashboard/projects/[id]/offer-link-actions";
import { NegotiationReviewDialog } from "@/components/project/negotiation-review-dialog";

interface OfferLinkData {
  id: string;
  token: string;
  status: string;
  recipient_name: string | null;
  recipient_email: string | null;
  project_id: string;
  projects: { name: string } | null;
}

export function AutoNegotiationReview() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewOfferId = searchParams.get("review_offer");
  const [linkData, setLinkData] = useState<OfferLinkData | null>(null);

  useEffect(() => {
    if (!reviewOfferId) return;

    getOfferLinkById(reviewOfferId).then((data) => {
      if (data && data.status === "negotiating") {
        const projects = data.projects as unknown as { name: string } | null;
        setLinkData({ ...data, projects } as OfferLinkData);
      }
      // Clean up URL param
      const url = new URL(window.location.href);
      url.searchParams.delete("review_offer");
      router.replace(url.pathname, { scroll: false });
    });
  }, [reviewOfferId, router]);

  if (!linkData) return null;

  return (
    <NegotiationReviewDialog
      offerId={linkData.id}
      token={linkData.token}
      clientName={linkData.recipient_name || "Klient"}
      projectName={linkData.projects?.name || "Projekt"}
      autoOpen
      onClose={() => setLinkData(null)}
    />
  );
}
