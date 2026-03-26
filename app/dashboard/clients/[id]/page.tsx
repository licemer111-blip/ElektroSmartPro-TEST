import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClientWithProjects } from "../actions";
import { ClientDetailsClient } from "./client-details-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ClientDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientWithProjects(id);
  const name = client?.name ?? "Klient";
  return {
    title: `${name} — Szczegóły Klienta`,
    description: `Historia projektów, faktury i notatki dla klienta ${name}. CRM dla elektryka w ElektroSmart PRO`,
  };
}

interface ClientDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { id } = await params;
  const client = await getClientWithProjects(id);

  if (!client) {
    notFound();
  }

  return <ClientDetailsClient client={client} />;
}
