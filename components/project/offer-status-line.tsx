"use client";

import { useEffect, useState } from "react";
import { getOfferLinks } from "@/app/dashboard/projects/[id]/offer-link-actions";

const LABEL: Record<string, string> = {
  pending: "Link wysłany, klient jeszcze nie otworzył",
  viewed: "Klient otworzył ofertę",
  accepted: "Klient przyjął ofertę",
  rejected: "Klient odrzucił ofertę",
  negotiating: "Klient chce zmiany",
};

export function OfferStatusLine({ projectId }: { projectId: string }) {
  const [label, setLabel] = useState("Oferta linkiem jeszcze nie wysłana");

  useEffect(() => {
    let alive = true;
    getOfferLinks(projectId).then((links) => {
      if (!alive) return;
      const latest = links[0] as { status?: string } | undefined;
      if (!latest?.status) {
        setLabel("Oferta linkiem jeszcze nie wysłana");
        return;
      }
      setLabel(LABEL[latest.status] ?? "Link do oferty jest");
    }).catch(() => {
      if (alive) setLabel("Oferta linkiem jeszcze nie wysłana");
    });
    return () => {
      alive = false;
    };
  }, [projectId]);

  return <p className="text-xs text-slate-500">{label}</p>;
}
